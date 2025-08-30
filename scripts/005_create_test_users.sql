-- Create test users for TruxkToK system
-- This script creates admin and technician users for testing

-- Insert test users into auth.users (Supabase auth table)
-- Note: In production, users would be created through the signup process
-- For testing, we'll create them directly

-- Create admin user
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@truxtok.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"role": "admin"}',
  false,
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- Create technician user
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  '00000000-0000-0000-0000-000000000002',
  'tech@truxtok.com',
  crypt('tech123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"role": "technician"}',
  false,
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- Create profiles for the test users
INSERT INTO profiles (
  id,
  email,
  full_name,
  role,
  phone,
  address,
  hire_date,
  status,
  created_at,
  updated_at
) VALUES 
(
  '00000000-0000-0000-0000-000000000001',
  'admin@truxtok.com',
  'Admin User',
  'admin',
  '+1-555-0001',
  '123 Admin Street, Admin City, AC 12345',
  '2024-01-01',
  'active',
  now(),
  now()
),
(
  '00000000-0000-0000-0000-000000000002',
  'tech@truxtok.com',
  'John Technician',
  'technician',
  '+1-555-0002',
  '456 Tech Avenue, Tech City, TC 67890',
  '2024-01-15',
  'active',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- Create sample trucks
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
  assigned_technician_id,
  created_at,
  updated_at
) VALUES 
(
  '10000000-0000-0000-0000-000000000001',
  'TRK-001',
  'Ford',
  'Transit 350',
  2023,
  'TRX-001',
  '1FTBW3XM5NKA12345',
  'active',
  'Main Depot - Bay 1',
  '00000000-0000-0000-0000-000000000002',
  now(),
  now()
),
(
  '10000000-0000-0000-0000-000000000002',
  'TRK-002',
  'Chevrolet',
  'Express 3500',
  2023,
  'TRX-002',
  '1GCWGBFG5N1234567',
  'active',
  'Main Depot - Bay 2',
  null,
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- Create sample bins for the trucks
INSERT INTO bins (
  id,
  truck_id,
  bin_code,
  location,
  capacity,
  current_stock,
  status,
  created_at,
  updated_at
) VALUES 
-- Bins for TRK-001
(
  '20000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  'A1-B2-S3',
  'Aisle A, Bay 1, Shelf 2, Position 3',
  100,
  75,
  'active',
  now(),
  now()
),
(
  '20000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000001',
  'A2-B1-S1',
  'Aisle A, Bay 2, Shelf 1, Position 1',
  50,
  30,
  'active',
  now(),
  now()
),
-- Bins for TRK-002
(
  '20000000-0000-0000-0000-000000000003',
  '10000000-0000-0000-0000-000000000002',
  'B1-B1-S2',
  'Aisle B, Bay 1, Shelf 1, Position 2',
  80,
  60,
  'active',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- Create sample inventory items
INSERT INTO inventory_items (
  id,
  bin_id,
  part_number,
  part_name,
  description,
  category,
  quantity,
  unit_price,
  supplier,
  reorder_level,
  status,
  created_at,
  updated_at
) VALUES 
(
  '30000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001',
  'PRT-001',
  'Copper Pipe 1/2"',
  '1/2 inch copper pipe, 10 foot length',
  'plumbing',
  25,
  15.99,
  'PlumbCorp',
  10,
  'active',
  now(),
  now()
),
(
  '30000000-0000-0000-0000-000000000002',
  '20000000-0000-0000-0000-000000000001',
  'PRT-002',
  'PVC Elbow 90°',
  '90 degree PVC elbow fitting',
  'plumbing',
  50,
  2.49,
  'PlumbCorp',
  20,
  'active',
  now(),
  now()
),
(
  '30000000-0000-0000-0000-000000000003',
  '20000000-0000-0000-0000-000000000002',
  'ELC-001',
  'Wire Nuts (Pack of 10)',
  'Electrical wire nuts, assorted sizes',
  'electrical',
  30,
  8.99,
  'ElectroSupply',
  15,
  'active',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- Create sample orders
INSERT INTO orders (
  id,
  technician_id,
  truck_id,
  order_number,
  status,
  total_amount,
  tax_amount,
  commission_amount,
  notes,
  created_at,
  updated_at
) VALUES 
(
  '40000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000001',
  'ORD-2024-001',
  'pending',
  125.47,
  10.47,
  6.25,
  'Emergency plumbing repair order',
  now() - interval '2 hours',
  now() - interval '2 hours'
) ON CONFLICT (id) DO NOTHING;

-- Create order items
INSERT INTO order_items (
  id,
  order_id,
  inventory_item_id,
  quantity,
  unit_price,
  total_price,
  created_at
) VALUES 
(
  '50000000-0000-0000-0000-000000000001',
  '40000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000001',
  3,
  15.99,
  47.97
),
(
  '50000000-0000-0000-0000-000000000002',
  '40000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000002',
  5,
  2.49,
  12.45
),
(
  '50000000-0000-0000-0000-000000000003',
  '40000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000003',
  2,
  8.99,
  17.98
) ON CONFLICT (id) DO NOTHING;

-- Create credits for the technician
INSERT INTO credits (
  id,
  technician_id,
  amount,
  type,
  description,
  order_id,
  created_at
) VALUES 
(
  '60000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  25.00,
  'order_commission',
  'Commission from order ORD-2024-001',
  '40000000-0000-0000-0000-000000000001',
  now() - interval '1 hour'
) ON CONFLICT (id) DO NOTHING;

-- Update truck assignment
UPDATE profiles 
SET assigned_truck_id = '10000000-0000-0000-0000-000000000001'
WHERE id = '00000000-0000-0000-0000-000000000002';

-- Display created test users
SELECT 
  'Test users created successfully!' as message,
  email,
  full_name,
  role
FROM profiles 
WHERE id IN (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002'
);
