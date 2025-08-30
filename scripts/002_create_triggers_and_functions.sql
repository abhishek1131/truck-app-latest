-- Triggers and Functions for TruxkToK

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'technician')
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Trigger for auto-creating user profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Add updated_at triggers to all relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_trucks_updated_at BEFORE UPDATE ON public.trucks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON public.inventory_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate order numbers
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('order_number_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

-- Create sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

-- Trigger for auto-generating order numbers
CREATE TRIGGER generate_order_number_trigger
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_order_number();

-- Function to calculate order totals
CREATE OR REPLACE FUNCTION public.calculate_order_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  order_total DECIMAL(10,2);
  commission_rate DECIMAL(5,4) := 0.05; -- 5% commission
BEGIN
  -- Calculate total from order items
  SELECT COALESCE(SUM(total_price), 0)
  INTO order_total
  FROM public.order_items
  WHERE order_id = COALESCE(NEW.order_id, OLD.order_id);
  
  -- Update order totals
  UPDATE public.orders
  SET 
    total_amount = order_total,
    commission_amount = order_total * commission_rate
  WHERE id = COALESCE(NEW.order_id, OLD.order_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Triggers for order total calculation
CREATE TRIGGER calculate_order_totals_insert
  AFTER INSERT ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_order_totals();

CREATE TRIGGER calculate_order_totals_update
  AFTER UPDATE ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_order_totals();

CREATE TRIGGER calculate_order_totals_delete
  AFTER DELETE ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_order_totals();
