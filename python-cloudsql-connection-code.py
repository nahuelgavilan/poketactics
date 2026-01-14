#!/usr/bin/env python3
"""
Código Python para conectarse a CloudSQL con VPC Peering + IAM Auth
Service Account: eol-sa@dogfy-data-platform.iam.gserviceaccount.com
"""

from google.cloud.sql.connector import Connector
import pg8000

# Configuración
INSTANCE_CONNECTION_NAME = "dogfy-end-of-line:europe-west1:dogfy-eol-pg"
DB_USER = "eol-sa@dogfy-data-platform.iam"  # Sin .gserviceaccount.com
DB_NAME = "eol_api"

# Inicializar el conector
connector = Connector()

def getconn():
    """
    Crea y retorna una conexión a CloudSQL usando IAM authentication

    Gracias al VPC peering, el conector se conecta directamente a la IP privada
    sin necesidad de túneles SSH ni bastion.
    """
    conn = connector.connect(
        INSTANCE_CONNECTION_NAME,
        "pg8000",
        user=DB_USER,
        db=DB_NAME,
        enable_iam_auth=True,  # Usa autenticación IAM (sin contraseña)
    )
    return conn

# Ejemplo de uso
def main():
    try:
        print(f"Conectando a {INSTANCE_CONNECTION_NAME}...")
        conn = getconn()
        cursor = conn.cursor()

        # Ejecutar query de ejemplo
        cursor.execute("SELECT COUNT(*) FROM stages;")
        result = cursor.fetchone()
        print(f"Cantidad de registros en 'stages': {result[0]}")

        # Listar todas las tablas
        cursor.execute("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name;
        """)
        tables = cursor.fetchall()
        print("\nTablas disponibles:")
        for table in tables:
            print(f"  - {table[0]}")

        cursor.close()
        conn.close()
        print("\n✓ Conexión exitosa!")

    except Exception as e:
        print(f"✗ Error: {e}")
    finally:
        connector.close()

if __name__ == "__main__":
    main()


# ==========================================
# Para usar en tu pipeline/job:
# ==========================================

# 1. Instalar dependencias:
#    pip install cloud-sql-python-connector pg8000

# 2. El job debe ejecutarse con el service account:
#    eol-sa@dogfy-data-platform.iam.gserviceaccount.com

# 3. Si usas Cloud Run, configurar:
#    - VPC Connector: cr-atlas-ew1 (ya existe)
#    - VPC Egress: all-traffic o private-ranges-only

# 4. Permisos ya configurados:
#    ✓ roles/cloudsql.client
#    ✓ Usuario PostgreSQL: eol-sa@dogfy-data-platform.iam
#    ✓ Permisos SQL: READ ONLY (SELECT)
#    ✓ VPC Peering: data-platform-to-eol (ACTIVE)

# 5. NO necesitas:
#    - Contraseña (usa IAM auth)
#    - Túnel SSH
#    - Bastion
#    - IP pública

# ==========================================
# Ejemplo con pooling (para producción):
# ==========================================

import sqlalchemy

def create_pool():
    """
    Crea un connection pool para manejar múltiples conexiones eficientemente
    """
    pool = sqlalchemy.create_engine(
        "postgresql+pg8000://",
        creator=getconn,
        pool_size=5,  # Número de conexiones en el pool
        max_overflow=2,  # Conexiones adicionales si el pool está lleno
        pool_timeout=30,  # Timeout al esperar una conexión
        pool_recycle=1800,  # Reciclar conexiones cada 30 min
    )
    return pool

# Uso con pool:
# engine = create_pool()
# with engine.connect() as conn:
#     result = conn.execute(sqlalchemy.text("SELECT * FROM stages"))
#     for row in result:
#         print(row)
