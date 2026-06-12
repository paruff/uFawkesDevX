#!/bin/bash
set -e

# Create score database
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Create score database for Score service
    CREATE DATABASE score;
    
    -- Note: For production, create a dedicated user with limited privileges:
    -- CREATE USER score_user WITH PASSWORD 'secure_password';
    -- GRANT CONNECT ON DATABASE score TO score_user;
    -- Then grant only SELECT, INSERT, UPDATE, DELETE on specific tables
    
    -- For development, using the main user
    GRANT ALL PRIVILEGES ON DATABASE score TO $POSTGRES_USER;
EOSQL

echo "Additional databases created successfully"
