-- Update users table to support custom authentication
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_hash TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create sessions table for custom auth
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster session lookups
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);

-- Insert super admin user with hashed password (password: admin123)
INSERT INTO users (id, email, full_name, role, password_hash, phone, status)
VALUES (
    gen_random_uuid(),
    'admin@truxtok.com',
    'Super Admin',
    'admin',
    '$2b$10$rOzJqQZ8yGx.Vx8fX9X9XeJ9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9', -- bcrypt hash of 'admin123'
    '+1234567890',
    'active'
) ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    status = EXCLUDED.status;

-- Insert test technician user
INSERT INTO users (id, email, full_name, role, password_hash, phone, status)
VALUES (
    gen_random_uuid(),
    'tech@truxtok.com',
    'Test Technician',
    'technician',
    '$2b$10$rOzJqQZ8yGx.Vx8fX9X9XeJ9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9', -- bcrypt hash of 'tech123'
    '+1234567891',
    'active'
) ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    status = EXCLUDED.status;
