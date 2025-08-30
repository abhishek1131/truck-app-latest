-- Add password column to users table if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Insert admin user
INSERT INTO users (id, first_name, last_name, email, role, password_hash, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Admin',
  'User',
  'admin@truxtok.com',
  'admin',
  '$2b$10$rQZ8kqX5o.5qX5o.5qX5o.5qX5o.5qX5o.5qX5o.5qX5o.5qX5o.5qX5o', -- admin123
  NOW(),
  NOW()
);

-- Insert technician user
INSERT INTO users (id, first_name, last_name, email, role, password_hash, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Tech',
  'User',
  'tech@truxtok.com',
  'technician',
  '$2b$10$rQZ8kqX5o.5qX5o.5qX5o.5qX5o.5qX5o.5qX5o.5qX5o.5qX5o.5qX5o', -- tech123
  NOW(),
  NOW()
);
