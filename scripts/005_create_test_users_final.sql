-- TruxkToK Test Users and Sample Data
-- This script creates test data with conflict handling

-- First, let's clean up any existing test data to avoid conflicts
DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE technician_id IN (
  SELECT id FROM users WHERE email IN ('admin@truxtok.com', 'tech@truxtok.com')
));
DELETE FROM orders WHERE technician_id IN (
  SELECT id FROM users WHERE email IN ('admin@truxtok.com', 'tech@truxtok.com')
);
DELETE FROM truck_inventory WHERE truck_id IN (SELECT id FROM trucks WHERE truck_number LIKE 'TEST-%');
DELETE FROM bin_inventory WHERE bin_id IN (SELECT id FROM bins WHERE bin_code LIKE 'TEST-%');
DELETE FROM bins WHERE bin_code LIKE 'TEST-%';
DELETE FROM inventory_items WHERE part_number LIKE 'TEST-%';
DELETE FROM user_trucks WHERE truck_id IN (SELECT id FROM trucks WHERE truck_number LIKE 'TEST-%');
DELETE FROM trucks WHERE truck_number LIKE 'TEST-%';
DELETE FROM credits WHERE user_id IN (SELECT id FROM users WHERE email IN ('admin@truxtok.com', 'tech@truxtok.com'));
DELETE FROM users WHERE email IN ('admin@truxtok.com', 'tech@truxtok.com');

-- Create test trucks with unique numbers
INSERT INTO trucks (truck_number, make, model, year, license_plate, status, location, created_at, updated_at) VALUES
('TEST-001', 'Ford', 'Transit 350', 2023, 'TRK001TX', 'active', 'Downtown Route', NOW(), NOW()),
('TEST-002', 'Chevrolet', 'Express 3500', 2022, 'TRK002TX', 'active', 'Warehouse', NOW(), NOW()),
('TEST-003', 'Ford', 'Transit 250', 2024, 'TRK003TX', 'maintenance', 'Service Center', NOW(), NOW());

-- Create test inventory items
INSERT INTO inventory_items (part_number, name, description, category, unit_price, supplier, created_at, updated_at) VALUES
('TEST-PIPE-001', 'Copper Pipe 1/2"', '1/2 inch copper pipe - 10ft length', 'Plumbing', 15.99, 'ABC Supply', NOW(), NOW()),
('TEST-FITTING-001', 'PVC Elbow 90°', '1/2 inch PVC elbow fitting', 'Plumbing', 2.49, 'ABC Supply', NOW(), NOW()),
('TEST-WIRE-001', '12 AWG Wire', '12 gauge electrical wire - 100ft roll', 'Electrical', 45.99, 'Electric Supply Co', NOW(), NOW()),
('TEST-VALVE-001', 'Ball Valve 3/4"', '3/4 inch brass ball valve', 'Plumbing', 12.99, 'ABC Supply', NOW(), NOW()),
('TEST-OUTLET-001', 'GFCI Outlet', 'Ground fault circuit interrupter outlet', 'Electrical', 18.99, 'Electric Supply Co', NOW(), NOW());

-- Create test bins
INSERT INTO bins (bin_code, truck_id, location, capacity, current_stock, created_at, updated_at) VALUES
('TEST-A1-1', (SELECT id FROM trucks WHERE truck_number = 'TEST-001'), 'Aisle A, Bay 1, Shelf 1', 50, 25, NOW(), NOW()),
('TEST-A1-2', (SELECT id FROM trucks WHERE truck_number = 'TEST-001'), 'Aisle A, Bay 1, Shelf 2', 50, 30, NOW(), NOW()),
('TEST-B2-1', (SELECT id FROM trucks WHERE truck_number = 'TEST-002'), 'Aisle B, Bay 2, Shelf 1', 75, 40, NOW(), NOW()),
('TEST-B2-2', (SELECT id FROM trucks WHERE truck_number = 'TEST-002'), 'Aisle B, Bay 2, Shelf 2', 75, 20, NOW(), NOW());

-- Create bin inventory
INSERT INTO bin_inventory (bin_id, inventory_item_id, quantity, min_quantity, max_quantity, created_at, updated_at) VALUES
-- Bin TEST-A1-1 inventory
((SELECT id FROM bins WHERE bin_code = 'TEST-A1-1'), (SELECT id FROM inventory_items WHERE part_number = 'TEST-PIPE-001'), 15, 5, 25, NOW(), NOW()),
((SELECT id FROM bins WHERE bin_code = 'TEST-A1-1'), (SELECT id FROM inventory_items WHERE part_number = 'TEST-FITTING-001'), 10, 10, 50, NOW(), NOW()),

-- Bin TEST-A1-2 inventory
((SELECT id FROM bins WHERE bin_code = 'TEST-A1-2'), (SELECT id FROM inventory_items WHERE part_number = 'TEST-WIRE-001'), 8, 3, 15, NOW(), NOW()),
((SELECT id FROM bins WHERE bin_code = 'TEST-A1-2'), (SELECT id FROM inventory_items WHERE part_number = 'TEST-VALVE-001'), 12, 5, 20, NOW(), NOW()),

-- Bin TEST-B2-1 inventory
((SELECT id FROM bins WHERE bin_code = 'TEST-B2-1'), (SELECT id FROM inventory_items WHERE part_number = 'TEST-OUTLET-001'), 20, 8, 30, NOW(), NOW()),
((SELECT id FROM bins WHERE bin_code = 'TEST-B2-1'), (SELECT id FROM inventory_items WHERE part_number = 'TEST-PIPE-001'), 15, 5, 25, NOW(), NOW()),

-- Bin TEST-B2-2 inventory
((SELECT id FROM bins WHERE bin_code = 'TEST-B2-2'), (SELECT id FROM inventory_items WHERE part_number = 'TEST-FITTING-001'), 25, 10, 40, NOW(), NOW()),
((SELECT id FROM bins WHERE bin_code = 'TEST-B2-2'), (SELECT id FROM inventory_items WHERE part_number = 'TEST-VALVE-001'), 8, 5, 20, NOW(), NOW());

-- Note: To complete the test setup, you need to:
-- 1. Create users in Supabase Auth Dashboard:
--    - admin@truxtok.com (password: admin123)
--    - tech@truxtok.com (password: tech123)
-- 
-- 2. After creating auth users, get their UUIDs and run:
--    INSERT INTO users (id, email, full_name, role, phone, created_at, updated_at) VALUES
--    ('AUTH_USER_UUID_HERE', 'admin@truxtok.com', 'Admin User', 'admin', '+1234567890', NOW(), NOW()),
--    ('AUTH_USER_UUID_HERE', 'tech@truxtok.com', 'Tech User', 'technician', '+1234567891', NOW(), NOW());
--
-- 3. Assign technician to truck:
--    INSERT INTO user_trucks (user_id, truck_id, assigned_at) VALUES
--    ('TECH_USER_UUID', (SELECT id FROM trucks WHERE truck_number = 'TEST-001'), NOW());
--
-- 4. Create sample order and credits as needed.

-- Display created test data
SELECT 'Test trucks created:' as info;
SELECT truck_number, make, model, status FROM trucks WHERE truck_number LIKE 'TEST-%';

SELECT 'Test inventory items created:' as info;
SELECT part_number, name, category, unit_price FROM inventory_items WHERE part_number LIKE 'TEST-%';

SELECT 'Test bins created:' as info;
SELECT bin_code, location, capacity, current_stock FROM bins WHERE bin_code LIKE 'TEST-%';

SELECT 'Test bin inventory created:' as info;
SELECT b.bin_code, i.part_number, bi.quantity, bi.min_quantity, bi.max_quantity 
FROM bin_inventory bi
JOIN bins b ON bi.bin_id = b.id
JOIN inventory_items i ON bi.inventory_item_id = i.id
WHERE b.bin_code LIKE 'TEST-%';
