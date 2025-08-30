-- Seed initial data for TruxkToK

-- Insert inventory categories
INSERT INTO public.inventory_categories (id, name, description) VALUES
  (uuid_generate_v4(), 'Plumbing', 'Plumbing parts and supplies'),
  (uuid_generate_v4(), 'Electrical', 'Electrical components and tools'),
  (uuid_generate_v4(), 'HVAC', 'Heating, ventilation, and air conditioning'),
  (uuid_generate_v4(), 'Tools', 'Hand tools and power tools'),
  (uuid_generate_v4(), 'Safety', 'Safety equipment and protective gear'),
  (uuid_generate_v4(), 'Hardware', 'General hardware and fasteners')
ON CONFLICT (name) DO NOTHING;

-- Insert sample inventory items
INSERT INTO public.inventory_items (part_number, name, description, category_id, unit_price, cost_price, supplier) 
SELECT 
  'PLB-001', 'Copper Pipe 1/2"', '1/2 inch copper pipe per foot', c.id, 3.50, 2.25, 'PlumbCorp'
FROM public.inventory_categories c WHERE c.name = 'Plumbing'
UNION ALL
SELECT 
  'PLB-002', 'PVC Elbow 90°', '90 degree PVC elbow fitting', c.id, 1.25, 0.75, 'PlumbCorp'
FROM public.inventory_categories c WHERE c.name = 'Plumbing'
UNION ALL
SELECT 
  'ELC-001', 'Wire Nuts (Pack of 10)', 'Standard wire nuts pack', c.id, 4.99, 2.50, 'ElectroSupply'
FROM public.inventory_categories c WHERE c.name = 'Electrical'
UNION ALL
SELECT 
  'ELC-002', '12 AWG Wire (100ft)', '12 gauge electrical wire', c.id, 89.99, 55.00, 'ElectroSupply'
FROM public.inventory_categories c WHERE c.name = 'Electrical'
UNION ALL
SELECT 
  'HVC-001', 'Air Filter 16x20x1', 'Standard HVAC air filter', c.id, 12.99, 7.50, 'AirFlow Inc'
FROM public.inventory_categories c WHERE c.name = 'HVAC'
UNION ALL
SELECT 
  'TOL-001', 'Adjustable Wrench 10"', '10 inch adjustable wrench', c.id, 24.99, 15.00, 'ToolMaster'
FROM public.inventory_categories c WHERE c.name = 'Tools'
UNION ALL
SELECT 
  'SAF-001', 'Safety Glasses', 'Clear safety glasses', c.id, 8.99, 4.50, 'SafetyFirst'
FROM public.inventory_categories c WHERE c.name = 'Safety'
UNION ALL
SELECT 
  'HRD-001', 'Screws Phillips #8 (Box)', 'Phillips head screws #8', c.id, 15.99, 9.00, 'Hardware Plus'
FROM public.inventory_categories c WHERE c.name = 'Hardware'
ON CONFLICT (part_number) DO NOTHING;

-- Insert system settings
INSERT INTO public.system_settings (key, value, description) VALUES
  ('platform_name', 'TruxkToK', 'Platform name'),
  ('support_email', 'support@truxtok.com', 'Support email address'),
  ('admin_email', 'admin@truxtok.com', 'Admin email address'),
  ('commission_rate', '0.05', 'Default commission rate (5%)'),
  ('tax_rate', '0.08', 'Default tax rate (8%)'),
  ('maintenance_mode', 'false', 'Maintenance mode flag'),
  ('max_order_items', '50', 'Maximum items per order'),
  ('low_stock_threshold', '5', 'Low stock alert threshold')
ON CONFLICT (key) DO NOTHING;
