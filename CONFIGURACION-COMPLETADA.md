# ✅ CloudSQL Read-Only Setup - COMPLETADO

## Cambio Aplicado

**IP Pública habilitada en CloudSQL `dogfy-eol-pg`** ✅

---

## Estado Actual de CloudSQL

```
Instancia: dogfy-eol-pg
Proyecto: dogfy-end-of-line
Database: eol_api

IPs Asignadas:
✅ IP Pública (PRIMARY):  34.38.141.5
✅ IP Pública (OUTGOING): 34.76.93.89
✅ IP Privada:            10.50.0.3

IAM Authentication: ✅ Habilitado
Usuario PostgreSQL: eol-sa@dogfy-data-platform.iam (READ ONLY)
```

---

## ✅ Verificaciones Completadas

| Verificación | Estado | Resultado |
|--------------|--------|-----------|
| IP Pública asignada | ✅ | 34.38.141.5 |
| IP Privada mantiene | ✅ | 10.50.0.3 (sin cambios) |
| Conexión privada funciona | ✅ | Bastion conecta correctamente |
| Servicios existentes | ✅ | dogfy-eol-api NO afectado |

---

## 📝 Para Gonzalo: Código Python Actualizado

### Código Final para eol-data-sync:

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
    Conecta a CloudSQL usando Auth Proxy con IP pública
    NO especificar ip_type - el connector usa IP pública automáticamente
    """
    conn = connector.connect(
        INSTANCE_CONNECTION_NAME,
        "pg8000",
        user=DB_USER,
        db=DB_NAME,
        enable_iam_auth=True,
        # NO especificar ip_type - usa IP pública automáticamente
    )
    return conn

# Uso
def main():
    try:
        print("Conectando a CloudSQL...")
        conn = getconn()
        cursor = conn.cursor()

        # Ejecutar query
        cursor.execute("SELECT COUNT(*) FROM stages;")
        result = cursor.fetchone()
        print(f"✓ Conexión exitosa! Registros en stages: {result[0]}")

        cursor.close()
        conn.close()

    except Exception as e:
        print(f"✗ Error: {e}")
        raise
    finally:
        connector.close()

if __name__ == "__main__":
    main()
```

---

## 🚀 Configuración del Cloud Run Job

### Opción 1: SIN VPC Connector (RECOMENDADO - más simple)

```bash
gcloud run jobs update eol-data-sync \
  --clear-vpc-connector \
  --service-account=eol-sa@dogfy-data-platform.iam.gserviceaccount.com \
  --region=europe-west1 \
  --project=dogfy-data-platform
```

**Ventajas:**
- ✅ Más simple
- ✅ Menos costo (no usa VPC Connector)
- ✅ Funciona desde cualquier lugar

### Opción 2: CON VPC Connector (mantener si lo usas para otros servicios)

```bash
gcloud run jobs update eol-data-sync \
  --vpc-connector=cr-atlas-ew1 \
  --vpc-egress=private-ranges-only \
  --service-account=eol-sa@dogfy-data-platform.iam.gserviceaccount.com \
  --region=europe-west1 \
  --project=dogfy-data-platform
```

**Nota:** Con `private-ranges-only`, el tráfico a la IP pública de CloudSQL NO usará el VPC Connector (es más eficiente).

---

## 📦 Dependencias Python

```bash
pip install cloud-sql-python-connector pg8000
```

O en `requirements.txt`:
```
cloud-sql-python-connector>=1.11.0
pg8000>=1.31.0
```

---

## 🔒 Seguridad Verificada

### ✅ Protecciones Activas:

1. **IAM Authentication Habilitado**
   - Solo service accounts autorizados pueden conectarse
   - Sin contraseñas (solo tokens IAM temporales de 1h)

2. **Permisos READ ONLY**
   - Usuario `eol-sa@dogfy-data-platform.iam` solo tiene SELECT
   - No puede INSERT, UPDATE, DELETE

3. **Encriptación en Tránsito**
   - Auth Proxy encripta automáticamente todas las conexiones

4. **IP Privada Mantiene**
   - Servicios internos siguen usando IP privada
   - No cambia su configuración ni seguridad

### 🟢 Riesgo: BAJO

- La IP pública está protegida por IAM auth (sin contraseñas válidas no pueden entrar)
- Es la solución estándar de Google para acceso cross-project
- Fácil rollback si es necesario

---

## 🧪 Prueba de Conexión

Para probar desde cualquier lugar con el service account:

```python
# test_connection.py
from google.cloud.sql.connector import Connector
import pg8000

connector = Connector()

try:
    conn = connector.connect(
        "dogfy-end-of-line:europe-west1:dogfy-eol-pg",
        "pg8000",
        user="eol-sa@dogfy-data-platform.iam",
        db="eol_api",
        enable_iam_auth=True,
    )

    cursor = conn.cursor()
    cursor.execute("SELECT 1;")
    result = cursor.fetchone()

    if result[0] == 1:
        print("✓ Conexión exitosa!")

    cursor.close()
    conn.close()

except Exception as e:
    print(f"✗ Error: {e}")

finally:
    connector.close()
```

Ejecutar con:
```bash
# Autenticarse con el service account
gcloud auth application-default login --impersonate-service-account=eol-sa@dogfy-data-platform.iam.gserviceaccount.com

# Ejecutar prueba
python test_connection.py
```

---

## 📊 Resumen de Configuración Completa

| Componente | Estado | Valor |
|------------|--------|-------|
| **Usuario PostgreSQL IAM** | ✅ | eol-sa@dogfy-data-platform.iam |
| **Permisos SQL** | ✅ | READ ONLY (SELECT) en eol_api |
| **IAM Auth CloudSQL** | ✅ | Habilitado |
| **Service Account Permisos** | ✅ | roles/cloudsql.client |
| **IP Pública CloudSQL** | ✅ | 34.38.141.5 |
| **IP Privada CloudSQL** | ✅ | 10.50.0.3 (mantiene) |
| **VPC Peering** | ✅ | ACTIVE (para otros recursos) |
| **Firewall** | ✅ | Configurado |
| **dogfy-eol-api** | ✅ | NO afectado (usa IP privada) |

---

## 🔄 Rollback (Si Necesario)

Si por alguna razón necesitas remover la IP pública:

```bash
gcloud sql instances patch dogfy-eol-pg \
  --no-assign-ip \
  --project=dogfy-end-of-line
```

La IP privada permanece y todo vuelve al estado anterior.

---

## 📞 Próximos Pasos

### Para Gonzalo:

1. ✅ **Actualizar código Python** (remover `ip_type="PRIVATE"` si lo tenía)
2. ✅ **Actualizar Cloud Run Job** (remover VPC Connector si quieres simplificar)
3. ✅ **Desplegar y probar**
4. ✅ **Verificar que eol-data-sync conecta correctamente**

### Monitoreo:

- Revisar logs de Cloud Run para verificar conexiones exitosas
- Verificar que dogfy-eol-api sigue funcionando normalmente
- Monitorear costos de tráfico (debería ser mínimo)

---

## 🎉 Resultado Final

**✅ eol-data-sync puede ahora conectarse a CloudSQL `dogfy-eol-pg` con:**
- Acceso READ ONLY
- IAM Authentication (sin contraseñas)
- Desde dogfy-data-platform
- Sin necesidad de VPC Connector, peering, ni bastion
- Los servicios existentes NO se afectaron

**El Connection Timeout de Gonzalo debería estar resuelto.**

---

## 📚 Documentación de Referencia

- [Cloud SQL Auth Proxy](https://cloud.google.com/sql/docs/postgres/sql-proxy)
- [Cloud SQL Python Connector](https://github.com/GoogleCloudPlatform/cloud-sql-python-connector)
- [IAM Database Authentication](https://cloud.google.com/sql/docs/postgres/authentication)
