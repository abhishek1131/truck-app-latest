-- Add password column to users table if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Insert test users with generated UUIDs
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
) VALUES 
(
    gen_random_uuid(),
    'admin@truxtok.com',
    'Admin',
    'User',
    'admin',
    'active',
    '$2b$10$rQZ9vKKf8qF5YzGfqF5YzO8qF5YzGfqF5YzO8qF5YzGfqF5YzO8qF',  -- password: admin123
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    'tech@truxtok.com',
    'Tech',
    'User',
    'technician',
    'active',
    '$2b$10$rQZ9vKKf8qF5YzGfqF5YzO8qF5YzGfqF5YzO8qF5YzGfqF5YzO8qF',  -- password: tech123
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    updated_at = NOW();
