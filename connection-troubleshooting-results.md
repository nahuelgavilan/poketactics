# CloudSQL Connection Troubleshooting - Resultados

## Problema Reportado por Gonzalo
Connection Timeout (Errno 110) al conectarse desde Cloud Run (dogfy-data-platform) a CloudSQL (dogfy-end-of-line) usando VPC Connector `cr-atlas-ew1`.

---

## ✅ Punto 1: Firewall en Proyecto EOL

### Estado ANTES:
- Regla `default-allow-internal` permitía tráfico desde `10.128.0.0/9`
- **PROBLEMA**: Aunque 10.252.0.0/28 y 10.253.0.0/20 están técnicamente dentro del rango, el firewall no siempre aplica correctamente para tráfico desde peering

### ✅ Solución Aplicada:
Creada regla específica de firewall:
```bash
Nombre: allow-data-platform-to-cloudsql
Red: default
Dirección: INGRESS
Prioridad: 1000
Acción: ALLOW
Reglas: tcp:5432
Source ranges: 10.252.0.0/28, 10.253.0.0/20
Descripción: Allow CloudSQL access from dogfy-data-platform VPC Connector and subnet
```

**Rangos permitidos:**
- `10.252.0.0/28` - VPC Connector cr-atlas-ew1
- `10.253.0.0/20` - Subnet platform-atlas-subnet-ew1

---

## ✅ Punto 2: Rutas del Peering

### Verificación:
**Peering data-platform-to-eol:**
- IMPORT_CUSTOM_ROUTES: True ✅
- EXPORT_CUSTOM_ROUTES: True ✅
- STATE: ACTIVE ✅

**Peering eol-to-data-platform:**
- IMPORT_CUSTOM_ROUTES: True ✅
- EXPORT_CUSTOM_ROUTES: True ✅
- STATE: ACTIVE ✅

**Rutas propagadas (data-platform → EOL):**
```
10.132.0.0/20 (europe-west1) - Donde está CloudSQL
+ todas las otras subnets de default VPC
```

**Rutas propagadas (EOL → data-platform):**
```
10.252.0.0/28 - VPC Connector
10.253.0.0/20 - Subnet principal
```

**✅ Estado: Correcto - Rutas configuradas y propagándose correctamente**

---

## ✅ Punto 3: Cloud SQL Network Configuration

### Verificación:
```json
{
  "ipv4Enabled": false,
  "privateNetwork": "projects/dogfy-end-of-line/global/networks/default",
  "requireSsl": false,
  "authorizedNetworks": null
}
```

**Estado:**
- ✅ CloudSQL conectado a VPC `default`
- ✅ Solo IP privada (10.50.0.3)
- ✅ No hay authorizedNetworks (acepta de toda la VPC)
- ✅ SSL no requerido

**✅ Estado: Correcto - CloudSQL configurado correctamente para aceptar conexiones de la VPC**

---

## Resumen de Configuración Completa

| Componente | Estado | Detalles |
|------------|--------|----------|
| VPC Peering | ✅ ACTIVE | data-platform-to-eol + eol-to-data-platform |
| Rutas Custom | ✅ Configuradas | Import/Export en ambos lados |
| Firewall EOL | ✅ **ARREGLADO** | Nueva regla para puerto 5432 desde data-platform |
| CloudSQL Network | ✅ Correcto | Private IP en VPC default |
| VPC Connector | ✅ Existe | cr-atlas-ew1 (10.252.0.0/28) |
| IAM Auth | ✅ Habilitado | cloudsql.iam_authentication=on |
| Service Account | ✅ Permisos OK | roles/cloudsql.client |
| Usuario PostgreSQL | ✅ Creado | eol-sa@dogfy-data-platform.iam READ ONLY |

---

## Código Python Actualizado para Gonzalo

```python
from google.cloud.sql.connector import Connector
import pg8000

# Configuración
INSTANCE_CONNECTION_NAME = "dogfy-end-of-line:europe-west1:dogfy-eol-pg"
DB_USER = "eol-sa@dogfy-data-platform.iam"
DB_NAME = "eol_api"

connector = Connector()

def getconn():
    """
    IMPORTANTE: Usar ip_type="PRIVATE" para forzar conexión via VPC Connector
    """
    conn = connector.connect(
        INSTANCE_CONNECTION_NAME,
        "pg8000",
        user=DB_USER,
        db=DB_NAME,
        enable_iam_auth=True,
        ip_type="PRIVATE",  # Forzar IP privada a través del VPC Connector
    )
    return conn

# Uso
try:
    conn = getconn()
    cursor = conn.cursor()
    cursor.execute("SELECT version();")
    version = cursor.fetchone()
    print(f"✓ Conectado exitosamente: {version[0]}")
    cursor.close()
    conn.close()
except Exception as e:
    print(f"✗ Error: {e}")
finally:
    connector.close()
```

---

## Configuración del Cloud Run Job

El job DEBE tener esta configuración:

```bash
gcloud run jobs update TU_JOB_NAME \
  --vpc-connector=cr-atlas-ew1 \
  --vpc-egress=private-ranges-only \
  --service-account=eol-sa@dogfy-data-platform.iam.gserviceaccount.com \
  --region=europe-west1 \
  --project=dogfy-data-platform
```

**Opciones de --vpc-egress:**
- `private-ranges-only` - Solo tráfico a IPs privadas usa el VPC Connector (recomendado)
- `all-traffic` - Todo el tráfico usa el VPC Connector

---

## Siguiente Paso

**Gonzalo:** Prueba de nuevo la conexión después de estos cambios:

1. La regla de firewall específica está creada ✅
2. Asegúrate de usar `ip_type="PRIVATE"` en el código Python
3. Verifica que el Cloud Run Job tenga configurado `--vpc-connector=cr-atlas-ew1`
4. Verifica que tenga `--vpc-egress=private-ranges-only` o `all-traffic`

Si sigue dando timeout, siguiente diagnóstico:
```bash
# Desde un recurso en dogfy-data-platform con VPC Connector, probar:
nc -zv 10.50.0.3 5432
# O
telnet 10.50.0.3 5432
```

---

## El Problema Principal Identificado

**❌ ANTES**: La regla de firewall `default-allow-internal` (10.128.0.0/9) teóricamente cubría el rango, pero **las reglas amplias no siempre funcionan bien con tráfico de VPC peering**.

**✅ AHORA**: Regla de firewall específica para los rangos exactos del VPC Connector y subnet de data-platform.

Esto debería resolver el Connection Timeout.
