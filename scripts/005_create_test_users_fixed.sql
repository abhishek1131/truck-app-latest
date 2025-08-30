-- Create test users for TruxkToK system
-- This script creates admin and technician users with sample data

-- Insert test users into the users table
INSERT INTO public.users (
    id,
    email,
    first_name,
    last_name,
    phone,
    role,
    status,
    created_at,
    updated_at
) VALUES 
-- Admin User
(
    gen_random_uuid(),
    'admin@truxtok.com',
    'Admin',
    'User',
    '+1-555-0101',
    'admin',
    'active',
    now(),
    now()
),
-- Technician User
(
    gen_random_uuid(),
    'tech@truxtok.com',
    'John',
    'Technician',
    '+1-555-0102',
    'technician',
    'active',
    now(),
    now()
);

-- Get the technician user ID for truck assignment
DO $$
DECLARE
    tech_user_id uuid;
    truck1_id uuid;
    truck2_id uuid;
    bin1_id uuid;
    bin2_id uuid;
    bin3_id uuid;
    item1_id uuid;
    item2_id uuid;
    item3_id uuid;
    order_id uuid;
BEGIN
    -- Get technician user ID
    SELECT id INTO tech_user_id FROM public.users WHERE email = 'tech@truxtok.com';
    
    -- Insert sample trucks
    INSERT INTO public.trucks (
        id, truck_number, make, model, year, license_plate, vin, 
        status, location, mileage, assigned_technician_id, created_at, updated_at
    ) VALUES 
    (
        gen_random_uuid(), 'TRK-001', 'Ford', 'Transit 350', 2023, 'ABC-1234', 
        '1FTBW3XM5NKA12345', 'active', 'Downtown Route', 15420, tech_user_id, now(), now()
    ),
    (
        gen_random_uuid(), 'TRK-002', 'Chevrolet', 'Express 3500', 2022, 'XYZ-5678', 
        '1GCWGBFG8N1234567', 'active', 'Warehouse', 8750, NULL, now(), now()
    )
    RETURNING id INTO truck1_id;
    
    -- Get truck IDs
    SELECT id INTO truck1_id FROM public.trucks WHERE truck_number = 'TRK-001';
    SELECT id INTO truck2_id FROM public.trucks WHERE truck_number = 'TRK-002';
    
    -- Insert truck bins
    INSERT INTO public.truck_bins (
        id, truck_id, name, description, bin_code, capacity, created_at, updated_at
    ) VALUES 
    (gen_random_uuid(), truck1_id, 'Front Left Bin', 'Main storage compartment', 'A1-B2-S3', 100, now(), now()),
    (gen_random_uuid(), truck1_id, 'Rear Storage', 'Large items storage', 'A2-B1-S1', 150, now(), now()),
    (gen_random_uuid(), truck2_id, 'Side Compartment', 'Tools and small parts', 'A1-B1-S2', 75, now(), now())
    RETURNING id INTO bin1_id;
    
    -- Get bin IDs
    SELECT id INTO bin1_id FROM public.truck_bins WHERE bin_code = 'A1-B2-S3';
    SELECT id INTO bin2_id FROM public.truck_bins WHERE bin_code = 'A2-B1-S1';
    SELECT id INTO bin3_id FROM public.truck_bins WHERE bin_code = 'A1-B1-S2';
    
    -- Insert inventory items
    INSERT INTO public.inventory_items (
        id, name, description, part_number, category, unit_price, 
        stock_quantity, min_stock_level, created_at, updated_at
    ) VALUES 
    (
        gen_random_uuid(), 'Copper Pipe 1/2"', '1/2 inch copper pipe - 10ft length', 
        'CP-12-10', 'Plumbing', 15.99, 50, 10, now(), now()
    ),
    (
        gen_random_uuid(), 'PVC Elbow 90°', '90 degree PVC elbow fitting', 
        'PVC-ELB-90', 'Plumbing', 2.49, 100, 20, now(), now()
    ),
    (
        gen_random_uuid(), 'Wire Nuts (Pack of 10)', 'Electrical wire connectors', 
        'WN-10PK', 'Electrical', 5.99, 75, 15, now(), now()
    )
    RETURNING id INTO item1_id;
    
    -- Get inventory item IDs
    SELECT id INTO item1_id FROM public.inventory_items WHERE part_number = 'CP-12-10';
    SELECT id INTO item2_id FROM public.inventory_items WHERE part_number = 'PVC-ELB-90';
    SELECT id INTO item3_id FROM public.inventory_items WHERE part_number = 'WN-10PK';
    
    -- Insert truck inventory
    INSERT INTO public.truck_inventory (
        id, truck_id, bin_id, inventory_item_id, quantity, last_updated
    ) VALUES 
    (gen_random_uuid(), truck1_id, bin1_id, item1_id, 10, now()),
    (gen_random_uuid(), truck1_id, bin1_id, item2_id, 25, now()),
    (gen_random_uuid(), truck1_id, bin2_id, item3_id, 15, now());
    
    -- Insert sample order
    INSERT INTO public.orders (
        id, order_number, technician_id, truck_id, status, total_amount, 
        commission_amount, credit_amount, notes, created_at, updated_at
    ) VALUES (
        gen_random_uuid(), 'ORD-2024-001', tech_user_id, truck1_id, 'pending', 
        45.47, 4.55, 2.27, 'Sample order for testing', now(), now()
    )
    RETURNING id INTO order_id;
    
    -- Insert order items
    INSERT INTO public.order_items (
        id, order_id, inventory_item_id, bin_id, quantity, unit_price, total_price, created_at
    ) VALUES 
    (gen_random_uuid(), order_id, item1_id, bin1_id, 2, 15.99, 31.98, now()),
    (gen_random_uuid(), order_id, item2_id, bin1_id, 3, 2.49, 7.47, now()),
    (gen_random_uuid(), order_id, item3_id, bin2_id, 1, 5.99, 5.99, now());
    
    -- Insert credit history
    INSERT INTO public.credits (
        id, technician_id, order_id, type, amount, description, created_at
    ) VALUES 
    (gen_random_uuid(), tech_user_id, order_id, 'commission', 4.55, 'Commission from order ORD-2024-001', now()),
    (gen_random_uuid(), tech_user_id, NULL, 'bonus', 10.00, 'Monthly performance bonus', now() - interval '1 week');
    
END $$;

-- Display created test users
SELECT 
    email,
    first_name,
    last_name,
    role,
    status
FROM public.users 
WHERE email IN ('admin@truxtok.com', 'tech@truxtok.com');
