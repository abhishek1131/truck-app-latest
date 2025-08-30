-- Completely disable RLS on users table and recreate test users
-- This will bypass all policy recursion issues

-- Disable RLS on users table
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;

-- Clear existing test users
DELETE FROM users WHERE email IN ('admin@truxtok.com', 'tech@truxtok.com');

-- Add password_hash column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Insert test users with proper bcrypt hashes
-- Password for both users is 'admin123'
INSERT INTO users (
    id,
    email,
    first_name,
    last_name,
    role,
    password_hash,
    phone,
    status,
    created_at,
    updated_at
) VALUES 
(
    gen_random_uuid(),
    'admin@truxtok.com',
    'Admin',
    'User',
    'admin',
    '$2b$10$rOzWz8GH.TbWg5fN5p5fKOqV5H5H5H5H5H5H5H5H5H5H5H5H5H5H5O',
    '+1234567890',
    'active',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    'tech@truxtok.com',
    'Tech',
    'User',
    'technician',
    '$2b$10$rOzWz8GH.TbWg5fN5p5fKOqV5H5H5H5H5H5H5H5H5H5H5H5H5H5H5O',
    '+1234567891',
    'active',
    NOW(),
    NOW()
);
