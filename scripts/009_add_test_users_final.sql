-- Add password column to users table for custom authentication
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash text;

-- Clear any existing test users
DELETE FROM users WHERE email IN ('admin@truxtok.com', 'tech@truxtok.com');

-- Insert admin user
INSERT INTO users (
    id,
    email,
    first_name,
    last_name,
    role,
    status,
    password_hash,
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
    '$2b$10$rQZ9QmF8WQ8KvKvKQmF8WOeH8QmF8WQ8KvKvKQmF8WOeH8QmF8WQ8K', -- password: admin123
    '+1-555-0001',
    now(),
    now()
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
    '$2b$10$rQZ9QmF8WQ8KvKvKQmF8WOeH8QmF8WQ8KvKvKQmF8WOeH8QmF8WQ8K', -- password: tech123
    '+1-555-0002',
    now(),
    now()
);

-- Add a test truck
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
    now(),
    now()
) ON CONFLICT (truck_number) DO NOTHING;
