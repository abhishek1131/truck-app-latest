-- Create test users for TruxkToK system
-- Note: You must first create these users in Supabase Auth Dashboard with these emails:
-- admin@truxtok.com (password: admin123)
-- tech@truxtok.com (password: tech123)

-- Insert user profiles (using generated UUIDs that you'll need to replace with actual auth.users IDs)
-- After creating users in Supabase Auth, get their UUIDs and replace the ones below

-- Sample trucks
INSERT INTO trucks (id, truck_number, make, model, year, license_plate, vin, status, location, mileage, assigned_technician_id, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'TRK-001', 'Ford', 'Transit 350', 2023, 'ABC-123', '1FTBW3XM5NKA12345', 'active', 'Downtown Route', 15000, NULL, NOW(), NOW()),
  (gen_random_uuid(), 'TRK-002', 'Mercedes', 'Sprinter 2500', 2022, 'XYZ-789', '1FTBW3XM5NKA67890', 'active', 'Uptown Route', 22000, NULL, NOW(), NOW());

-- Sample inventory items
INSERT INTO inventory_items (id, name, description, part_number, category, unit_price, stock_quantity, min_stock_level, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'Copper Pipe 1/2"', '1/2 inch copper pipe', 'CP-12-10', 'Plumbing', 15.50, 100, 20, NOW(), NOW()),
  (gen_random_uuid(), 'PVC Elbow 90°', '90 degree PVC elbow fitting', 'PVC-E90-34', 'Plumbing', 2.25, 200, 50, NOW(), NOW()),
  (gen_random_uuid(), 'Wire Nuts (Pack of 10)', 'Electrical wire nuts', 'WN-10PK', 'Electrical', 8.75, 150, 30, NOW(), NOW()),
  (gen_random_uuid(), 'GFCI Outlet', 'Ground fault circuit interrupter outlet', 'GFCI-15A', 'Electrical', 24.99, 75, 15, NOW(), NOW());

-- Sample truck bins (for TRK-001)
WITH truck_data AS (
  SELECT id as truck_id FROM trucks WHERE truck_number = 'TRK-001' LIMIT 1
)
INSERT INTO truck_bins (id, truck_id, name, description, bin_code, capacity, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  truck_data.truck_id,
  bin_name,
  bin_desc,
  bin_code,
  capacity,
  NOW(),
  NOW()
FROM truck_data,
(VALUES 
  ('Bin A1', 'Front left storage compartment', 'A1-FL', 50),
  ('Bin B2', 'Center storage compartment', 'B2-CT', 75),
  ('Bin C3', 'Rear right storage compartment', 'C3-RR', 60)
) AS bins(bin_name, bin_desc, bin_code, capacity);

-- Add some inventory to truck bins
WITH truck_bin_data AS (
  SELECT 
    tb.id as bin_id,
    tb.truck_id,
    ii.id as item_id
  FROM truck_bins tb
  JOIN trucks t ON t.id = tb.truck_id
  JOIN inventory_items ii ON ii.part_number IN ('CP-12-10', 'PVC-E90-34', 'WN-10PK')
  WHERE t.truck_number = 'TRK-001'
  AND tb.bin_code = 'A1-FL'
)
INSERT INTO truck_inventory (id, truck_id, bin_id, inventory_item_id, quantity, last_updated)
SELECT 
  gen_random_uuid(),
  truck_id,
  bin_id,
  item_id,
  CASE 
    WHEN item_id = (SELECT id FROM inventory_items WHERE part_number = 'CP-12-10') THEN 10
    WHEN item_id = (SELECT id FROM inventory_items WHERE part_number = 'PVC-E90-34') THEN 25
    ELSE 15
  END,
  NOW()
FROM truck_bin_data;

-- Instructions for completing setup:
-- 1. Go to Supabase Auth Dashboard
-- 2. Create user with email: admin@truxtok.com, password: admin123
-- 3. Create user with email: tech@truxtok.com, password: tech123
-- 4. Get their UUIDs from auth.users table
-- 5. Run the following INSERT statements with the actual UUIDs:

-- INSERT INTO users (id, email, first_name, last_name, role, status, phone, created_at, updated_at)
-- VALUES 
--   ('[REPLACE_WITH_ADMIN_UUID]', 'admin@truxtok.com', 'Admin', 'User', 'admin', 'active', '+1-555-0101', NOW(), NOW()),
--   ('[REPLACE_WITH_TECH_UUID]', 'tech@truxtok.com', 'John', 'Technician', 'technician', 'active', '+1-555-0102', NOW(), NOW());

-- 6. Update truck assignment:
-- UPDATE trucks SET assigned_technician_id = '[REPLACE_WITH_TECH_UUID]' WHERE truck_number = 'TRK-001';
