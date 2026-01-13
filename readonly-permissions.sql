-- Conectarse a la base de datos eol_api
\c eol_api;

-- Otorgar permisos de CONNECT a la base de datos
GRANT CONNECT ON DATABASE eol_api TO "eol-sa@dogfy-data-platform.iam.gserviceaccount.com";

-- Otorgar permisos de USAGE en el schema public
GRANT USAGE ON SCHEMA public TO "eol-sa@dogfy-data-platform.iam.gserviceaccount.com";

-- Otorgar permisos de SELECT en todas las tablas existentes
GRANT SELECT ON ALL TABLES IN SCHEMA public TO "eol-sa@dogfy-data-platform.iam.gserviceaccount.com";

-- Otorgar permisos de SELECT en todas las futuras tablas
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO "eol-sa@dogfy-data-platform.iam.gserviceaccount.com";

-- Otorgar permisos de USAGE en todas las secuencias (para SELECT que usen secuencias)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO "eol-sa@dogfy-data-platform.iam.gserviceaccount.com";

-- Otorgar permisos en futuras secuencias
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO "eol-sa@dogfy-data-platform.iam.gserviceaccount.com";

-- Verificar los permisos otorgados
\dp
