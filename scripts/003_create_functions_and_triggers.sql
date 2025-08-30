-- Functions and Triggers for TruxkToK

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

-- Trigger for new user creation
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

-- Add update triggers to tables with updated_at columns
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trucks_updated_at
  BEFORE UPDATE ON public.trucks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at
  BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_truck_inventory_updated_at
  BEFORE UPDATE ON public.truck_inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to calculate order totals
CREATE OR REPLACE FUNCTION public.calculate_order_total(order_id UUID)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
AS $$
DECLARE
  total DECIMAL(10,2);
BEGIN
  SELECT COALESCE(SUM(total_price), 0)
  INTO total
  FROM public.order_items
  WHERE order_items.order_id = calculate_order_total.order_id;
  
  RETURN total;
END;
$$;

-- Function to update order total when items change
CREATE OR REPLACE FUNCTION public.update_order_total()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.orders
  SET total_amount = public.calculate_order_total(
    CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.order_id
      ELSE NEW.order_id
    END
  )
  WHERE id = CASE 
    WHEN TG_OP = 'DELETE' THEN OLD.order_id
    ELSE NEW.order_id
  END;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Triggers to update order totals
CREATE TRIGGER update_order_total_on_item_change
  AFTER INSERT OR UPDATE OR DELETE ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_order_total();

-- Function to generate order numbers
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  order_num TEXT;
  counter INTEGER;
BEGIN
  -- Get current date in YYYYMMDD format
  SELECT TO_CHAR(NOW(), 'YYYYMMDD') INTO order_num;
  
  -- Get count of orders today
  SELECT COUNT(*) + 1
  INTO counter
  FROM public.orders
  WHERE DATE(created_at) = CURRENT_DATE;
  
  -- Format: YYYYMMDD-001
  order_num := order_num || '-' || LPAD(counter::TEXT, 3, '0');
  
  RETURN order_num;
END;
$$;

-- Function to update credit balance
CREATE OR REPLACE FUNCTION public.update_credit_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  current_balance DECIMAL(10,2);
BEGIN
  -- Get current balance for user
  SELECT COALESCE(balance_after, 0)
  INTO current_balance
  FROM public.credits
  WHERE user_id = NEW.user_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Calculate new balance
  NEW.balance_after := current_balance + NEW.amount;
  
  RETURN NEW;
END;
$$;

-- Trigger to update credit balance
CREATE TRIGGER update_credit_balance_trigger
  BEFORE INSERT ON public.credits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_credit_balance();
