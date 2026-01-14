# Connectivity Test: eol-data-sync → CloudSQL dogfy-eol-pg

## Test Ejecutado
```
Source: dogfy-platform-vpc (10.252.0.1 - VPC Connector cr-atlas-ew1)
Destination: 10.50.0.3:5432 (CloudSQL dogfy-eol-pg)
Protocol: TCP
```

---

## ❌ Resultado: UNREACHABLE

### Causa Raíz Identificada:
**PRIVATE_TRAFFIC_TO_INTERNET** - El paquete está siendo enviado al Internet Gateway en lugar de usar el VPC peering.

---

## Análisis Detallado del Problema

### 1. CloudSQL está en rango de Private Service Connect
```bash
CloudSQL IP: 10.50.0.3
Rango: 10.50.0.0/24 (google-managed-services-range)
Peering: servicenetworking-googleapis-com
```

### 2. Rutas en dogfy-platform-vpc
Las rutas de peering `data-platform-to-eol` incluyen:
- 10.128.0.0/20 ✅
- 10.132.0.0/20 ✅
- 10.8.0.0/28 ✅
- ... (todas las subnets de default VPC)

**PERO NO incluye 10.50.0.0/24** ❌

### 3. ¿Por qué falta el rango 10.50.0.0/24?

El rango 10.50.0.0/24 pertenece al peering `servicenetworking-googleapis-com` en dogfy-end-of-line:

```bash
Peering: servicenetworking-googleapis-com
exportCustomRoutes: False
importCustomRoutes: False
```

**Las rutas de Private Service Connect NO se exportan a través del VPC peering regular.**

### 4. Flujo del paquete (según connectivity test):

```
1. START_FROM_PRIVATE_NETWORK (dogfy-platform-vpc, 10.252.0.1)
   ↓
2. APPLY_EGRESS_FIREWALL_RULE (allow)
   ↓
3. APPLY_ROUTE → Encuentra ruta 0.0.0.0/0 (Internet Gateway, prioridad 1000)
   ↓ (No encuentra ruta específica para 10.50.0.0/24)
4. DROP: PRIVATE_TRAFFIC_TO_INTERNET
```

---

## El Problema Fundamental

**VPC Peering NO puede rutear tráfico a rangos de Private Service Connect de otras VPCs.**

Este es un comportamiento por diseño de GCP:
- Private Service Connect crea un peering especial con Google (servicenetworking-googleapis-com)
- Este peering NO exporta rutas a otros VPC peerings
- Por lo tanto, VPCs en otros proyectos no pueden alcanzar esos rangos directamente

---

## ✅ Solución: Usar Cloud SQL Auth Proxy

Cloud SQL Auth Proxy **no depende de routing VPC**. Establece un túnel seguro a través de las APIs de Google.

### Opción 1: Cloud SQL Python Connector (RECOMENDADO)

**Código Python actualizado:**

```python
from google.cloud.sql.connector import Connector
import pg8000

connector = Connector()

def getconn():
    # NO especificar ip_type - deja que el conector use el método automático
    conn = connector.connect(
        "dogfy-end-of-line:europe-west1:dogfy-eol-pg",
        "pg8000",
        user="eol-sa@dogfy-data-platform.iam",
        db="eol_api",
        enable_iam_auth=True,
        # NO especificar ip_type="PRIVATE" porque no hay routing directo
    )
    return conn

# Uso
conn = getconn()
cursor = conn.cursor()
cursor.execute("SELECT * FROM stages")
results = cursor.fetchall()
```

**Configuración Cloud Run Job:**
```bash
# NO necesita VPC Connector para Auth Proxy
gcloud run jobs update eol-data-sync \
  --clear-vpc-connector \
  --service-account=eol-sa@dogfy-data-platform.iam.gserviceaccount.com \
  --region=europe-west1 \
  --project=dogfy-data-platform
```

### Opción 2: Cloud SQL Proxy Sidecar

Si prefieres usar el proxy como sidecar en Cloud Run:

**Configuración Cloud Run:**
```yaml
spec:
  template:
    spec:
      serviceAccountName: eol-sa@dogfy-data-platform.iam.gserviceaccount.com
      containers:
      - name: eol-sync-app
        image: europe-west1-docker.pkg.dev/dogfy-data-platform/eol-pipeline/eol-sync:latest
        env:
        - name: DB_HOST
          value: "localhost"
        - name: DB_PORT
          value: "5432"
        - name: DB_USER
          value: "eol-sa@dogfy-data-platform.iam"
        - name: DB_NAME
          value: "eol_api"

      - name: cloud-sql-proxy
        image: gcr.io/cloud-sql-connectors/cloud-sql-proxy:latest
        args:
        - "--structured-logs"
        - "--port=5432"
        - "dogfy-end-of-line:europe-west1:dogfy-eol-pg"
        securityContext:
          runAsNonRoot: true
```

**Código Python simplificado:**
```python
import psycopg2
import subprocess

# Generar token IAM
token = subprocess.check_output([
    "gcloud", "sql", "generate-login-token",
    "--instance=dogfy-eol-pg",
    "--project=dogfy-end-of-line"
]).decode().strip()

conn = psycopg2.connect(
    host="localhost",
    port=5432,
    user="eol-sa@dogfy-data-platform.iam",
    password=token,
    database="eol_api"
)
```

---

## Opción 3: Habilitar IP Pública en CloudSQL (NO RECOMENDADO)

Si realmente necesitas conexión directa:

1. Habilitar IP pública en CloudSQL dogfy-eol-pg
2. Configurar authorized networks
3. Usar ip_type="PUBLIC" en el conector

**Contras:**
- Menos seguro (expone CloudSQL a Internet)
- Requiere gestionar authorized networks
- Costo adicional de tráfico egress

---

## Resumen

| Aspecto | Estado | Nota |
|---------|--------|------|
| VPC Peering | ✅ ACTIVE | data-platform-to-eol funcionando |
| Rutas VPC | ✅ Propagadas | Todas las subnets excepto PSC |
| Firewall | ✅ Configurado | allow-data-platform-to-cloudsql |
| Problema | ❌ **Private Service Connect no ruteable vía VPC peering** | |
| Solución | ✅ **Usar Cloud SQL Auth Proxy** | No depende de routing VPC |

---

## Próximos Pasos para Gonzalo

1. **Actualizar código Python** para NO especificar `ip_type="PRIVATE"`
2. **Remover VPC Connector** del Cloud Run Job (o dejarlo pero no es necesario)
3. **Dejar que Cloud SQL Connector use su método automático** (Auth Proxy interno)

El connector automáticamente:
- Detecta que no hay ruta directa
- Usa el Auth Proxy a través de las APIs de Google
- Establece conexión segura sin depender de VPC routing

---

## Comando para limpiar el connectivity test

```bash
gcloud network-management connectivity-tests delete eol-data-sync-to-cloudsql --project=dogfy-data-platform
```

---

## Documentación de referencia

- [Cloud SQL Auth Proxy Overview](https://cloud.google.com/sql/docs/postgres/sql-proxy)
- [Private Service Connect Limitations](https://cloud.google.com/vpc/docs/configure-private-service-connect-services#limitations)
- [VPC Peering with Cloud SQL](https://cloud.google.com/sql/docs/postgres/configure-private-ip#network-peering)
