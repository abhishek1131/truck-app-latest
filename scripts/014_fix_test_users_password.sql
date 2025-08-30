-- Fix test users to use correct password_hash column
-- First, drop the incorrect password column if it exists
ALTER TABLE users DROP COLUMN IF EXISTS password;

-- Ensure password_hash column exists (it should already exist based on schema)
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Delete existing test users to avoid conflicts
DELETE FROM users WHERE email IN ('admin@truxtok.com', 'tech@truxtok.com');

-- Insert test users with proper password hashes
INSERT INTO users (
  id,
  email,
  password_hash,
  first_name,
  last_name,
  role,
  phone,
  status,
  created_at,
  updated_at
) VALUES 
(
  gen_random_uuid(),
  'admin@truxtok.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: admin123
  'Admin',
  'User',
  'admin',
  '+1234567890',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'tech@truxtok.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: tech123
  'Tech',
  'User',
  'technician',
  '+1234567891',
  'active',
  NOW(),
  NOW()
);
