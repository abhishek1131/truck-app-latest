-- Stored procedures for inventory management

-- Function to update truck inventory safely
CREATE OR REPLACE FUNCTION update_truck_inventory(
  p_truck_id UUID,
  p_bin_id UUID,
  p_inventory_item_id UUID,
  p_quantity_change INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_quantity INTEGER;
  new_quantity INTEGER;
BEGIN
  -- Get current quantity
  SELECT quantity INTO current_quantity
  FROM truck_inventory
  WHERE truck_id = p_truck_id 
    AND bin_id = p_bin_id 
    AND inventory_item_id = p_inventory_item_id;
  
  -- If record doesn't exist and we're adding inventory, create it
  IF current_quantity IS NULL AND p_quantity_change > 0 THEN
    INSERT INTO truck_inventory (truck_id, bin_id, inventory_item_id, quantity)
    VALUES (p_truck_id, p_bin_id, p_inventory_item_id, p_quantity_change);
    RETURN TRUE;
  END IF;
  
  -- If record doesn't exist and we're removing inventory, fail
  IF current_quantity IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Calculate new quantity
  new_quantity := current_quantity + p_quantity_change;
  
  -- Don't allow negative quantities
  IF new_quantity < 0 THEN
    RETURN FALSE;
  END IF;
  
  -- Update the quantity
  UPDATE truck_inventory
  SET quantity = new_quantity,
      last_updated = NOW()
  WHERE truck_id = p_truck_id 
    AND bin_id = p_bin_id 
    AND inventory_item_id = p_inventory_item_id;
  
  -- Remove record if quantity is 0
  IF new_quantity = 0 THEN
    DELETE FROM truck_inventory
    WHERE truck_id = p_truck_id 
      AND bin_id = p_bin_id 
      AND inventory_item_id = p_inventory_item_id;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Function to get low stock items for a truck
CREATE OR REPLACE FUNCTION get_low_stock_items(p_truck_id UUID)
RETURNS TABLE (
  inventory_item_id UUID,
  item_name TEXT,
  part_number TEXT,
  bin_code TEXT,
  current_quantity INTEGER,
  min_stock_level INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ti.inventory_item_id,
    ii.name,
    ii.part_number,
    tb.bin_code,
    ti.quantity,
    ii.min_stock_level
  FROM truck_inventory ti
  JOIN inventory_items ii ON ti.inventory_item_id = ii.id
  JOIN truck_bins tb ON ti.bin_id = tb.id
  WHERE ti.truck_id = p_truck_id
    AND ti.quantity < ii.min_stock_level
  ORDER BY ti.quantity ASC;
END;
$$;

-- Function to generate QR code data for bins
CREATE OR REPLACE FUNCTION generate_bin_qr_data(p_bin_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  truck_number TEXT;
  bin_code TEXT;
  qr_data TEXT;
BEGIN
  SELECT t.truck_number, tb.bin_code
  INTO truck_number, bin_code
  FROM truck_bins tb
  JOIN trucks t ON tb.truck_id = t.id
  WHERE tb.id = p_bin_id;
  
  IF truck_number IS NULL OR bin_code IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Generate QR data in format: TRUCK:BIN_CODE:BIN_ID
  qr_data := truck_number || ':' || bin_code || ':' || p_bin_id::TEXT;
  
  RETURN qr_data;
END;
$$;
