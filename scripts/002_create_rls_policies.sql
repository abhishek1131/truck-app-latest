-- Row Level Security Policies for TruxkToK

-- Users policies
CREATE POLICY "users_select_own_or_admin" ON public.users
  FOR SELECT USING (
    auth.uid() = id OR 
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "users_insert_admin_only" ON public.users
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "users_update_own_or_admin" ON public.users
  FOR UPDATE USING (
    auth.uid() = id OR 
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "users_delete_admin_only" ON public.users
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Trucks policies
CREATE POLICY "trucks_select_assigned_or_admin" ON public.trucks
  FOR SELECT USING (
    assigned_to = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "trucks_insert_admin_only" ON public.trucks
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "trucks_update_admin_only" ON public.trucks
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "trucks_delete_admin_only" ON public.trucks
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Inventory categories policies (read-only for technicians, full access for admins)
CREATE POLICY "inventory_categories_select_all" ON public.inventory_categories
  FOR SELECT USING (true);

CREATE POLICY "inventory_categories_modify_admin_only" ON public.inventory_categories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Inventory items policies
CREATE POLICY "inventory_items_select_all" ON public.inventory_items
  FOR SELECT USING (true);

CREATE POLICY "inventory_items_modify_admin_only" ON public.inventory_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Truck bins policies
CREATE POLICY "truck_bins_select_assigned_or_admin" ON public.truck_bins
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.trucks WHERE id = truck_id AND assigned_to = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "truck_bins_modify_admin_only" ON public.truck_bins
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Truck inventory policies
CREATE POLICY "truck_inventory_select_assigned_or_admin" ON public.truck_inventory
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.trucks WHERE id = truck_id AND assigned_to = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "truck_inventory_update_assigned_or_admin" ON public.truck_inventory
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.trucks WHERE id = truck_id AND assigned_to = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "truck_inventory_insert_admin_only" ON public.truck_inventory
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "truck_inventory_delete_admin_only" ON public.truck_inventory
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Orders policies
CREATE POLICY "orders_select_own_or_admin" ON public.orders
  FOR SELECT USING (
    technician_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "orders_insert_own" ON public.orders
  FOR INSERT WITH CHECK (technician_id = auth.uid());

CREATE POLICY "orders_update_own_or_admin" ON public.orders
  FOR UPDATE USING (
    technician_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "orders_delete_admin_only" ON public.orders
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Order items policies
CREATE POLICY "order_items_select_own_or_admin" ON public.order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND technician_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "order_items_insert_own" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND technician_id = auth.uid())
  );

CREATE POLICY "order_items_update_own_or_admin" ON public.order_items
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND technician_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "order_items_delete_own_or_admin" ON public.order_items
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND technician_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Credits policies
CREATE POLICY "credits_select_own_or_admin" ON public.credits
  FOR SELECT USING (
    user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "credits_modify_admin_only" ON public.credits
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- User sessions policies
CREATE POLICY "user_sessions_select_own_or_admin" ON public.user_sessions
  FOR SELECT USING (
    user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "user_sessions_insert_own" ON public.user_sessions
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- System settings policies
CREATE POLICY "system_settings_select_admin_only" ON public.system_settings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "system_settings_modify_admin_only" ON public.system_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );
