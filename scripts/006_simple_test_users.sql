-- Simple test users for TruxkToK
-- Run this script to create admin and technician test users

-- Insert admin user
INSERT INTO users (
    id,
    email,
    first_name,
    last_name,
    role,
    status,
    phone,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'admin@truxtok.com',
    'Admin',
    'User',
    'admin',
    'active',
    '+1-555-0001',
    now(),
    now()
) ON CONFLICT (email) DO UPDATE SET
    role = 'admin',
    status = 'active',
    updated_at = now();

-- Insert technician user
INSERT INTO users (
    id,
    email,
    first_name,
    last_name,
    role,
    status,
    phone,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'tech@truxtok.com',
    'Tech',
    'User',
    'technician',
    'active',
    '+1-555-0002',
    now(),
    now()
) ON CONFLICT (email) DO UPDATE SET
    role = 'technician',
    status = 'active',
    updated_at = now();

-- Add a simple truck for testing
INSERT INTO trucks (
    id,
    truck_number,
    make,
    model,
    year,
    license_plate,
    vin,
    status,
    location,
    mileage,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'TEST-001',
    'Ford',
    'Transit',
    2023,
    'TRK001',
    '1FTBW2CM5NKA12345',
    'active',
    'Main Depot',
    15000,
    now(),
    now()
) ON CONFLICT (truck_number) DO UPDATE SET
    status = 'active',
    updated_at = now();
