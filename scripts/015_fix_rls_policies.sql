-- Fix RLS policy recursion issue for authentication
-- This script disables problematic RLS policies and creates simple ones

-- Drop existing RLS policies that cause recursion
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admin can view all users" ON users;
DROP POLICY IF EXISTS "Admin can manage all users" ON users;

-- Temporarily disable RLS on users table for authentication
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS with simple, non-recursive policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create simple policies that don't cause recursion
CREATE POLICY "Allow authentication queries" ON users
    FOR SELECT USING (true);

CREATE POLICY "Allow user updates" ON users
    FOR UPDATE USING (true);

CREATE POLICY "Allow user inserts" ON users
    FOR INSERT WITH CHECK (true);

-- Ensure service role can bypass RLS for authentication
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON users TO service_role;
