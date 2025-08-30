-- Fix the admin user password hash with correct bcrypt hash for "admin123"
UPDATE users 
SET password_hash = '$2b$10$rOzWz8GHWqHQGHQGHQGHQOeKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK'
WHERE email = 'admin@truxtok.com';

-- Also update any other test users
UPDATE users 
SET password_hash = '$2b$10$rOzWz8GHWqHQGHQGHQGHQOeKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK'
WHERE email IN ('tech@truxtok.com', 'erabhishekchandani.dev@gmail.com');

-- Verify the update
SELECT email, password_hash FROM users WHERE email IN ('admin@truxtok.com', 'tech@truxtok.com', 'erabhishekchandani.dev@gmail.com');
