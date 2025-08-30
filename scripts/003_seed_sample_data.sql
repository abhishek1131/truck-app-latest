-- Sample data for TruxkToK system

-- Insert sample inventory items
INSERT INTO public.inventory_items (part_number, name, description, category, unit_price, stock_quantity, min_stock_level) VALUES
('PIPE-001', 'PVC Pipe 1/2"', '1/2 inch PVC pipe, 10ft length', 'Plumbing', 12.50, 100, 20),
('PIPE-002', 'PVC Pipe 3/4"', '3/4 inch PVC pipe, 10ft length', 'Plumbing', 18.75, 80, 15),
('FITTING-001', 'PVC Elbow 1/2"', '1/2 inch PVC elbow fitting', 'Plumbing', 2.25, 200, 50),
('FITTING-002', 'PVC Tee 1/2"', '1/2 inch PVC tee fitting', 'Plumbing', 3.50, 150, 30),
('VALVE-001', 'Ball Valve 1/2"', '1/2 inch ball valve', 'Plumbing', 15.00, 50, 10),
('WIRE-001', 'Electrical Wire 12AWG', '12 AWG electrical wire, 100ft roll', 'Electrical', 45.00, 25, 5),
('OUTLET-001', 'GFCI Outlet', 'Ground fault circuit interrupter outlet', 'Electrical', 25.00, 40, 10),
('BREAKER-001', '20A Circuit Breaker', '20 amp single pole circuit breaker', 'Electrical', 18.00, 30, 8),
('TOOL-001', 'Pipe Wrench 12"', '12 inch pipe wrench', 'Tools', 35.00, 15, 3),
('TOOL-002', 'Wire Strippers', 'Professional wire stripping tool', 'Tools', 22.00, 20, 5),
('GASKET-001', 'Rubber Gasket Set', 'Assorted rubber gaskets', 'Hardware', 8.50, 75, 15),
('SCREW-001', 'Wood Screws 2"', '2 inch wood screws, box of 100', 'Hardware', 12.00, 60, 12),
('TAPE-001', 'Teflon Tape', 'Thread sealing tape', 'Plumbing', 3.25, 100, 25),
('GLUE-001', 'PVC Cement', 'PVC pipe cement, 8oz can', 'Plumbing', 8.75, 40, 10),
('FLUX-001', 'Soldering Flux', 'Electrical soldering flux', 'Electrical', 6.50, 30, 8)
ON CONFLICT (part_number) DO NOTHING;

-- Insert sample trucks
INSERT INTO public.trucks (truck_number, make, model, year, license_plate, vin, status, location, mileage) VALUES
('TRK-001', 'Ford', 'Transit 350', 2023, 'ABC-1234', '1FTBW3XM5NKA12345', 'active', 'Downtown Route', 15420),
('TRK-002', 'Chevrolet', 'Express 3500', 2022, 'DEF-5678', '1GCWGBFG8N1234567', 'active', 'North Side Route', 22150),
('TRK-003', 'Ford', 'Transit 250', 2023, 'GHI-9012', '1FTBR1XM5NKB98765', 'maintenance', 'Service Center', 8750),
('TRK-004', 'Ram', 'ProMaster 2500', 2022, 'JKL-3456', '3C6TRVBG8NE123456', 'active', 'South Route', 18900),
('TRK-005', 'Ford', 'Transit 350', 2024, 'MNO-7890', '1FTBW3XM5PKC54321', 'active', 'East Route', 5200)
ON CONFLICT (truck_number) DO NOTHING;

-- Insert sample bins for each truck
DO $$
DECLARE
    truck_record RECORD;
    aisle_letter CHAR;
    bay_num INTEGER;
    shelf_num INTEGER;
BEGIN
    FOR truck_record IN SELECT id, truck_number FROM public.trucks LOOP
        -- Create bins for each truck (3 aisles, 4 bays per aisle, 3 shelves per bay)
        FOR aisle_letter IN SELECT unnest(ARRAY['A', 'B', 'C']) LOOP
            FOR bay_num IN 1..4 LOOP
                FOR shelf_num IN 1..3 LOOP
                    INSERT INTO public.truck_bins (truck_id, bin_code, name, description, capacity)
                    VALUES (
                        truck_record.id,
                        aisle_letter || bay_num || '-S' || shelf_num,
                        'Bin ' || aisle_letter || bay_num || '-S' || shelf_num,
                        'Storage bin in aisle ' || aisle_letter || ', bay ' || bay_num || ', shelf ' || shelf_num,
                        50
                    )
                    ON CONFLICT (truck_id, bin_code) DO NOTHING;
                END LOOP;
            END LOOP;
        END LOOP;
    END LOOP;
END $$;

-- Insert sample truck inventory (distribute items across bins)
DO $$
DECLARE
    truck_record RECORD;
    bin_record RECORD;
    item_record RECORD;
    random_quantity INTEGER;
BEGIN
    FOR truck_record IN SELECT id FROM public.trucks WHERE status = 'active' LOOP
        FOR item_record IN SELECT id FROM public.inventory_items ORDER BY RANDOM() LIMIT 10 LOOP
            -- Get a random bin for this truck
            SELECT id INTO bin_record FROM public.truck_bins 
            WHERE truck_id = truck_record.id 
            ORDER BY RANDOM() 
            LIMIT 1;
            
            -- Add random quantity (1-20) of this item to the bin
            random_quantity := floor(random() * 20 + 1)::INTEGER;
            
            INSERT INTO public.truck_inventory (truck_id, bin_id, inventory_item_id, quantity)
            VALUES (truck_record.id, bin_record.id, item_record.id, random_quantity)
            ON CONFLICT (truck_id, bin_id, inventory_item_id) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;
