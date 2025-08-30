-- Add password column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Delete any existing test users first
DELETE FROM users WHERE email IN ('admin@truxtok.com', 'tech@truxtok.com');

-- Insert admin user with a simple sequential ID approach
INSERT INTO users (
    id,
    email,
    first_name,
    last_name,
    role,
    status,
    password_hash,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'admin@truxtok.com',
    'Admin',
    'User',
    'admin',
    'active',
    '$2b$10$rQZ9QmZ9QmZ9QmZ9QmZ9Qu7Z9QmZ9QmZ9QmZ9QmZ9QmZ9QmZ9QmZ9Q', -- admin123
    NOW(),
    NOW()
);

-- Insert technician user
INSERT INTO users (
    id,
    email,
    first_name,
    last_name,
    role,
    status,
    password_hash,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'tech@truxtok.com',
    'Tech',
    'User',
    'technician',
    'active',
    '$2b$10$tQZ9QmZ9QmZ9QmZ9QmZ9Tu7Z9QmZ9QmZ9QmZ9QmZ9QmZ9QmZ9QmZ9T', -- tech123
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
    'TEST123',
    'TEST123456789',
    'active',
    'Main Depot',
    15000,
    NOW(),
    NOW()
) ON CONFLICT (truck_number) DO NOTHING;
