-- Database initialization script
-- This script runs when the PostgreSQL container starts for the first time

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create database (if not already created by environment variables)
-- The database is already created by POSTGRES_DB environment variable

-- Set timezone
SET timezone = 'UTC';

-- Grant permissions (if needed for specific users)
-- GRANT ALL PRIVILEGES ON DATABASE learn_english TO postgres;