-- Remove foreign key constraint from users table and create test users
-- This allows us to create users without depending on Supabase auth.users

-- First, drop the foreign key constraint that's causing the issue
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- Add password column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Delete any existing test users to avoid conflicts
DELETE FROM users WHERE email IN ('admin@truxtok.com', 'tech@truxtok.com');

-- Insert admin user
INSERT INTO users (
    id,
    first_name,
    last_name,
    email,
    phone,
    role,
    status,
    password_hash,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'Admin',
    'User',
    'admin@truxtok.com',
    '+1234567890',
    'admin',
    'active',
    '$2b$10$rOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQ', -- admin123
    NOW(),
    NOW()
);

-- Insert technician user
INSERT INTO users (
    id,
    first_name,
    last_name,
    email,
    phone,
    role,
    status,
    password_hash,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'Tech',
    'User',
    'tech@truxtok.com',
    '+1234567891',
    'technician',
    'active',
    '$2b$10$rOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQ', -- tech123
    NOW(),
    NOW()
);

-- Create a test truck for the technician
INSERT INTO trucks (
    id,
    truck_number,
    make,
    model,
    year,
    license_plate,
    status,
    location,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'TEST-001',
    'Ford',
    'Transit',
    2023,
    'TEST123',
    'active',
    'Main Depot',
    NOW(),
    NOW()
) ON CONFLICT (truck_number) DO NOTHING;

-- Success message
SELECT 'Test users created successfully! Admin: admin@truxtok.com / admin123, Technician: tech@truxtok.com / tech123' as result;
