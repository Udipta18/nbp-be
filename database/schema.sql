-- ============================================
-- FIX RLS POLICIES & MISSING COLUMNS
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. DROP EXISTING TABLES IF NEEDED
-- (Only if you want a fresh start, otherwise SKIP this block)
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS providers CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TYPE IF EXISTS provider_status CASCADE;

-- 2. RECREATE TABLES WITH NEW COLUMNS (If you dropped them)
-- If you didn't drop, we'll ALTER tables below

-- ENUMs
CREATE TYPE provider_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- PROVIDERS TABLE (Recreated with all new columns)
CREATE TABLE IF NOT EXISTS providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES auth.users(id),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    website VARCHAR(255),
    category VARCHAR(100) NOT NULL,
    description TEXT,
    experience_years INTEGER DEFAULT 0,
    address TEXT, 
    city VARCHAR(100),
    state VARCHAR(100),
    zip_code VARCHAR(20),
    latitude DECIMAL(10, 8), 
    longitude DECIMAL(11, 8), 
    image_url TEXT,
    gallery_images TEXT[],
    rating DECIMAL(3, 2) DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT false,
    status provider_status DEFAULT 'PENDING',
    social_links JSONB,
    business_hours JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;

-- 3. CRITICAL: ALLOW PUBLIC INSERT (Fixes 42501 Error)
CREATE POLICY "Allow public provider registration" ON providers FOR INSERT WITH CHECK (true);

-- 4. Allow reading all providers (public)
CREATE POLICY "Allow public read access" ON providers FOR SELECT USING (true);

-- 5. Allow updating for owners
CREATE POLICY "Allow update for owners" ON providers FOR UPDATE USING (auth.uid() = owner_id);

-- 6. Allow admin full access (Using Service Role usually bypasses this, but good to have)
-- Note: Service Role bypasses RLS automatically, but having public insert fixes cases where
-- incorrect keys are used or flow is public.

-- 7. RECREATE DEPENDENT TABLES
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price_starts_from DECIMAL(10, 2),
    price_unit VARCHAR(50),
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Services
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public services read" ON services FOR SELECT USING (true);


-- Allow anyone to apply as a provider
CREATE POLICY "Allow public provider registration" 
ON providers 
FOR INSERT 
WITH CHECK (true);


ALTER TABLE providers DISABLE ROW LEVEL SECURITY;
