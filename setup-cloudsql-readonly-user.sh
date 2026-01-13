#!/bin/bash

# Configuración CloudSQL Read-Only User para Service Account
# Instancia: dogfy-eol-pg
# Service Account: eol-sa@dogfy-data-platform.iam.gserviceaccount.com
# Base de datos: eol_api

PROJECT_ID="dogfy-data-platform"
INSTANCE_NAME="dogfy-eol-pg"
SERVICE_ACCOUNT="eol-sa@dogfy-data-platform.iam.gserviceaccount.com"
DATABASE_NAME="eol_api"

echo "=== Paso 1: Agregar el Service Account como usuario IAM en CloudSQL ==="
gcloud sql users create "${SERVICE_ACCOUNT}" \
  --instance="${INSTANCE_NAME}" \
  --type=CLOUD_IAM_SERVICE_ACCOUNT \
  --project="${PROJECT_ID}"

echo ""
echo "=== Paso 2: Conectarse a CloudSQL y ejecutar comandos SQL ==="
echo "Ejecuta los siguientes comandos SQL en la instancia CloudSQL:"
echo ""
echo "-- Conectarse a la base de datos eol_api"
echo "\\c eol_api;"
echo ""
echo "-- Otorgar permisos de CONNECT a la base de datos"
echo "GRANT CONNECT ON DATABASE eol_api TO \"${SERVICE_ACCOUNT}\";"
echo ""
echo "-- Otorgar permisos de USAGE en el schema public"
echo "GRANT USAGE ON SCHEMA public TO \"${SERVICE_ACCOUNT}\";"
echo ""
echo "-- Otorgar permisos de SELECT en todas las tablas existentes"
echo "GRANT SELECT ON ALL TABLES IN SCHEMA public TO \"${SERVICE_ACCOUNT}\";"
echo ""
echo "-- Otorgar permisos de SELECT en todas las futuras tablas"
echo "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO \"${SERVICE_ACCOUNT}\";"
echo ""
echo "-- Otorgar permisos de USAGE en todas las secuencias (para SELECT que usen secuencias)"
echo "GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO \"${SERVICE_ACCOUNT}\";"
echo ""
echo "-- Otorgar permisos en futuras secuencias"
echo "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO \"${SERVICE_ACCOUNT}\";"
echo ""
echo "=== Para conectarse y ejecutar estos comandos SQL, usa: ==="
echo "gcloud sql connect ${INSTANCE_NAME} --user=postgres --project=${PROJECT_ID}"
