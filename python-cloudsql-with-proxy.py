#!/usr/bin/env python3
"""
Opción alternativa: Usar Cloud SQL Auth Proxy sin VPC Connector
Funciona porque el proxy establece conexión a través de las APIs públicas de Google,
no requiere acceso directo a la VPC privada.
"""

from google.cloud.sql.connector import Connector
import pg8000

# Configuración
INSTANCE_CONNECTION_NAME = "dogfy-end-of-line:europe-west1:dogfy-eol-pg"
DB_USER = "eol-sa@dogfy-data-platform.iam"
DB_NAME = "eol_api"

connector = Connector()

def getconn():
    """
    Conecta usando Cloud SQL Auth Proxy (no requiere VPC Connector)

    IMPORTANTE: NO usar ip_type="PRIVATE" si Cloud Run no tiene VPC Connector
    Por defecto usa conexión pública a través de APIs de Google
    """
    conn = connector.connect(
        INSTANCE_CONNECTION_NAME,
        "pg8000",
        user=DB_USER,
        db=DB_NAME,
        enable_iam_auth=True,
        # NO especificar ip_type="PRIVATE" - usa el modo por defecto
    )
    return conn

# Uso
conn = getconn()
cursor = conn.cursor()
cursor.execute("SELECT * FROM stages")
results = cursor.fetchall()
cursor.close()
conn.close()
connector.close()

print("✓ Conexión exitosa sin VPC Connector!")
