-- TruxkToK Database Schema
-- Complete database structure for technician and admin flows

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'technician')) DEFAULT 'technician',
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'suspended')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trucks table
CREATE TABLE IF NOT EXISTS public.trucks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  truck_number TEXT NOT NULL UNIQUE,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  license_plate TEXT,
  vin TEXT,
  status TEXT NOT NULL CHECK (status IN ('active', 'maintenance', 'inactive')) DEFAULT 'active',
  location TEXT,
  mileage INTEGER DEFAULT 0,
  assigned_technician_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventory Items table
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  part_number TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  min_stock_level INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Truck Bins table
CREATE TABLE IF NOT EXISTS public.truck_bins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  truck_id UUID NOT NULL REFERENCES public.trucks(id) ON DELETE CASCADE,
  bin_code TEXT NOT NULL, -- Format: A1-B2-S3 (Aisle-Bay-Shelf)
  name TEXT NOT NULL,
  description TEXT,
  capacity INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(truck_id, bin_code)
);

-- Truck Inventory table (items in specific truck bins)
CREATE TABLE IF NOT EXISTS public.truck_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  truck_id UUID NOT NULL REFERENCES public.trucks(id) ON DELETE CASCADE,
  bin_id UUID NOT NULL REFERENCES public.truck_bins(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(truck_id, bin_id, inventory_item_id)
);

-- Orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT NOT NULL UNIQUE,
  technician_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  truck_id UUID NOT NULL REFERENCES public.trucks(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  commission_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  credit_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Order Items table
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  bin_id UUID REFERENCES public.truck_bins(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Credits table
CREATE TABLE IF NOT EXISTS public.credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  technician_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('earned', 'used', 'adjustment')),
  description TEXT,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trucks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.truck_bins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.truck_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "users_select_own_or_admin" ON public.users FOR SELECT USING (
  auth.uid() = id OR 
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "users_insert_admin_only" ON public.users FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "users_update_own_or_admin" ON public.users FOR UPDATE USING (
  auth.uid() = id OR 
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "users_delete_admin_only" ON public.users FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for trucks table
CREATE POLICY "trucks_select_assigned_or_admin" ON public.trucks FOR SELECT USING (
  assigned_technician_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "trucks_insert_admin_only" ON public.trucks FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "trucks_update_admin_only" ON public.trucks FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "trucks_delete_admin_only" ON public.trucks FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for inventory_items table
CREATE POLICY "inventory_items_select_all" ON public.inventory_items FOR SELECT USING (true);

CREATE POLICY "inventory_items_insert_admin_only" ON public.inventory_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "inventory_items_update_admin_only" ON public.inventory_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "inventory_items_delete_admin_only" ON public.inventory_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for truck_bins table
CREATE POLICY "truck_bins_select_assigned_or_admin" ON public.truck_bins FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.trucks WHERE id = truck_id AND (assigned_technician_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')))
);

CREATE POLICY "truck_bins_insert_admin_only" ON public.truck_bins FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "truck_bins_update_admin_only" ON public.truck_bins FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "truck_bins_delete_admin_only" ON public.truck_bins FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for truck_inventory table
CREATE POLICY "truck_inventory_select_assigned_or_admin" ON public.truck_inventory FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.trucks WHERE id = truck_id AND (assigned_technician_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')))
);

CREATE POLICY "truck_inventory_insert_assigned_or_admin" ON public.truck_inventory FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.trucks WHERE id = truck_id AND (assigned_technician_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')))
);

CREATE POLICY "truck_inventory_update_assigned_or_admin" ON public.truck_inventory FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.trucks WHERE id = truck_id AND (assigned_technician_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')))
);

CREATE POLICY "truck_inventory_delete_assigned_or_admin" ON public.truck_inventory FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.trucks WHERE id = truck_id AND (assigned_technician_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')))
);

-- RLS Policies for orders table
CREATE POLICY "orders_select_own_or_admin" ON public.orders FOR SELECT USING (
  technician_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "orders_insert_own" ON public.orders FOR INSERT WITH CHECK (
  technician_id = auth.uid()
);

CREATE POLICY "orders_update_own_or_admin" ON public.orders FOR UPDATE USING (
  technician_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "orders_delete_admin_only" ON public.orders FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for order_items table
CREATE POLICY "order_items_select_own_or_admin" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND (technician_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')))
);

CREATE POLICY "order_items_insert_own" ON public.order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND technician_id = auth.uid())
);

CREATE POLICY "order_items_update_own_or_admin" ON public.order_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND (technician_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')))
);

CREATE POLICY "order_items_delete_own_or_admin" ON public.order_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND (technician_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')))
);

-- RLS Policies for credits table
CREATE POLICY "credits_select_own_or_admin" ON public.credits FOR SELECT USING (
  technician_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "credits_insert_admin_only" ON public.credits FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "credits_update_admin_only" ON public.credits FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "credits_delete_admin_only" ON public.credits FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
