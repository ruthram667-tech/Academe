-- ============================================================
-- Academe Platform Database Initialization Script
-- Executed on initial PostgreSQL container startup
-- ============================================================

-- Enable UUID extension for primary key generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Notice of successful initialization
DO $$
BEGIN
    RAISE NOTICE 'Academe PostgreSQL database initialized with uuid-ossp and pgcrypto extensions.';
END
$$;
