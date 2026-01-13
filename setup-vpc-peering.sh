#!/bin/bash

# Setup VPC Peering entre proyectos para acceso a CloudSQL

echo "=== Verificar rangos CIDR (no deben solaparse) ==="
echo "dogfy-platform-vpc subnets:"
gcloud compute networks subnets list --network=dogfy-platform-vpc --project=dogfy-data-platform

echo ""
echo "dogfy-end-of-line default subnets:"
gcloud compute networks subnets list --network=default --project=dogfy-end-of-line

echo ""
echo "=== Crear VPC Peering desde dogfy-data-platform a dogfy-end-of-line ==="
gcloud compute networks peerings create data-platform-to-eol \
  --network=dogfy-platform-vpc \
  --peer-project=dogfy-end-of-line \
  --peer-network=default \
  --import-custom-routes \
  --export-custom-routes \
  --project=dogfy-data-platform

echo ""
echo "=== Crear VPC Peering desde dogfy-end-of-line a dogfy-data-platform ==="
gcloud compute networks peerings create eol-to-data-platform \
  --network=default \
  --peer-project=dogfy-data-platform \
  --peer-network=dogfy-platform-vpc \
  --import-custom-routes \
  --export-custom-routes \
  --project=dogfy-end-of-line

echo ""
echo "=== Verificar peering ==="
gcloud compute networks peerings list --project=dogfy-data-platform
gcloud compute networks peerings list --project=dogfy-end-of-line

echo ""
echo "=== Código Python después del peering ==="
cat << 'EOF'
from google.cloud.sql.connector import Connector
import pg8000

connector = Connector()

def getconn():
    conn = connector.connect(
        "dogfy-end-of-line:europe-west1:dogfy-eol-pg",
        "pg8000",
        user="eol-sa@dogfy-data-platform.iam",
        db="eol_api",
        enable_iam_auth=True,
    )
    return conn

# Funciona directamente sin túnel!
conn = getconn()
EOF
