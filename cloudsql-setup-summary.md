# CloudSQL Read-Only Setup - Resumen Completo

## Configuración realizada para el pipeline ETL

### Escenario
- **Job/ETL**: Corre en proyecto `dogfy-data-platform`
- **Service Account**: `eol-sa@dogfy-data-platform.iam.gserviceaccount.com`
- **CloudSQL Instance**: `dogfy-eol-pg` en proyecto `dogfy-end-of-line`
- **Base de datos**: `eol_api`
- **Método de conexión**: A través de bastion SQL vía IAP

---

## 1. Usuario PostgreSQL (READ ONLY)

### Usuario IAM creado en CloudSQL:
```
Usuario: eol-sa@dogfy-data-platform.iam
Tipo: CLOUD_IAM_SERVICE_ACCOUNT
Instancia: dogfy-eol-pg
```

### Permisos SQL otorgados:
```sql
-- Conexión a la base de datos
GRANT CONNECT ON DATABASE eol_api TO "eol-sa@dogfy-data-platform.iam";

-- Uso del schema
GRANT USAGE ON SCHEMA public TO "eol-sa@dogfy-data-platform.iam";

-- SELECT en todas las tablas (existentes y futuras)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO "eol-sa@dogfy-data-platform.iam";
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO "eol-sa@dogfy-data-platform.iam";

-- Uso de secuencias
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO "eol-sa@dogfy-data-platform.iam";
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO "eol-sa@dogfy-data-platform.iam";
```

### Tablas con acceso:
- `box` (SELECT)
- `stages` (SELECT)
- Todas las tablas futuras que se creen en schema `public`

---

## 2. Configuración CloudSQL

### Autenticación IAM habilitada:
```bash
cloudsql.iam_authentication=on
```

### Información de la instancia:
```
Nombre: dogfy-eol-pg
Región: europe-west1-d
Database Version: POSTGRES_16
Tier: db-g1-small
IP Privada: 10.50.0.3
Estado: RUNNABLE
```

---

## 3. Permisos IAM del Service Account

### En proyecto `dogfy-end-of-line`:

| Rol | Propósito |
|-----|-----------|
| `roles/cloudsql.client` | Conectarse a instancias CloudSQL |
| `roles/iap.tunnelResourceAccessor` | Acceder al bastion vía IAP tunnel |
| `roles/compute.osLogin` | Autenticarse en el bastion con OS Login |
| `roles/compute.viewer` | Ver información de instancias Compute |

---

## 4. Configuración del Bastion

### Bastion SQL:
```
Nombre: bastion-sql
Zona: europe-west1-b
Estado: RUNNING
OS Login: Habilitado a nivel de proyecto
```

---

## 5. Cómo conectarse desde el ETL

### Método 1: SSH vía IAP + psql

```bash
# El job debe ejecutarse con el service account eol-sa@dogfy-data-platform.iam.gserviceaccount.com

# Conectarse al bastion vía IAP y ejecutar psql
gcloud compute ssh bastion-sql \
  --project=dogfy-end-of-line \
  --zone=europe-west1-b \
  --tunnel-through-iap \
  --command="PGPASSWORD=\$(gcloud sql generate-login-token --instance=dogfy-eol-pg --project=dogfy-end-of-line) \
    psql -h 10.50.0.3 -U eol-sa@dogfy-data-platform.iam -d eol_api -c 'SELECT * FROM stages;'"
```

### Método 2: Port forwarding + psql

```bash
# 1. Crear túnel IAP al bastion
gcloud compute start-iap-tunnel bastion-sql 22 \
  --project=dogfy-end-of-line \
  --zone=europe-west1-b \
  --local-host-port=localhost:2222

# 2. SSH al bastion con port forwarding
ssh -L 5432:10.50.0.3:5432 -p 2222 localhost

# 3. Conectarse a PostgreSQL
PGPASSWORD=$(gcloud sql generate-login-token --instance=dogfy-eol-pg --project=dogfy-end-of-line) \
  psql -h localhost -p 5432 -U eol-sa@dogfy-data-platform.iam -d eol_api
```

### Importante sobre el password:
- NO usar contraseña fija
- Usar `gcloud sql generate-login-token` para generar token IAM temporal
- El token expira en ~1 hora

---

## 6. Verificación de configuración

### Verificar usuario en CloudSQL:
```bash
gcloud sql users list --instance=dogfy-eol-pg --project=dogfy-end-of-line
```

### Verificar permisos IAM:
```bash
gcloud projects get-iam-policy dogfy-end-of-line \
  --flatten="bindings[].members" \
  --filter="bindings.members:eol-sa@dogfy-data-platform.iam.gserviceaccount.com"
```

### Verificar permisos SQL:
```bash
gcloud compute ssh bastion-sql --project=dogfy-end-of-line --zone=europe-west1-b \
  --command="PGPASSWORD='~gxv7F>:h=^^=gMI' psql -h 10.50.0.3 -U eol_user -d eol_api \
    -c \"SELECT has_database_privilege('eol-sa@dogfy-data-platform.iam', 'eol_api', 'CONNECT'), \
         has_schema_privilege('eol-sa@dogfy-data-platform.iam', 'public', 'USAGE');\""
```

---

## 7. Checklist de configuración completada

- [x] Usuario IAM creado en CloudSQL: `eol-sa@dogfy-data-platform.iam`
- [x] Permisos READ ONLY otorgados en PostgreSQL
- [x] Autenticación IAM habilitada en instancia CloudSQL
- [x] Permiso `roles/cloudsql.client` otorgado
- [x] Permiso `roles/iap.tunnelResourceAccessor` otorgado
- [x] Permiso `roles/compute.osLogin` otorgado
- [x] Permiso `roles/compute.viewer` otorgado
- [x] OS Login habilitado en proyecto dogfy-end-of-line
- [x] Verificado acceso a tablas: box, stages

---

## 8. Conexión de la instancia

```
Connection name: dogfy-end-of-line:europe-west1:dogfy-eol-pg
```
