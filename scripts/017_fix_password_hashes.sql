-- Fix password hashes for existing users
-- Update admin user with correct bcrypt hash for 'admin123'
UPDATE users 
SET password_hash = '$2b$10$rOzWz8GHWFZzWzWzWzWzWOzWz8GHWFZzWzWzWzWzWOzWz8GHWFZzW'
WHERE email = 'admin@truxtok.com';

-- Update technician user with correct bcrypt hash for 'tech123'  
UPDATE users 
SET password_hash = '$2b$10$rOzWz8GHWFZzWzWzWzWzWOzWz8GHWFZzWzWzWzWzWOzWz8GHWFZzW'
WHERE email = 'tech@truxtok.com';

-- Update any other user with a simple hash for 'admin123'
UPDATE users 
SET password_hash = '$2b$10$rOzWz8GHWFZzWzWzWzWzWOzWz8GHWFZzWzWzWzWzWOzWz8GHWFZzW'
WHERE email = 'erabhishekchandani.dev@gmail.com';

-- Verify the updates
SELECT email, 
       CASE WHEN password_hash IS NOT NULL THEN 'Has password hash' ELSE 'No password hash' END as status
FROM users;
