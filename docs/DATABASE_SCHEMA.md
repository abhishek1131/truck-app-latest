# TruxkToK Database Schema Documentation

## Overview
The TruxkToK database is designed using PostgreSQL with a normalized structure to ensure data integrity, performance, and scalability. The schema supports role-based access control through Row Level Security (RLS) policies.

## Core Tables

### 1. users
Extends Supabase auth.users with profile and role information.

\`\`\`sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'technician')) DEFAULT 'technician',
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'suspended')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
\`\`\`

**Purpose**: Store user profile information and role assignments
**Key Features**:
- Links to Supabase auth.users for authentication
- Role-based access control (admin/technician)
- User status management
- Automatic timestamp tracking

### 2. trucks
Central registry for all trucks in the fleet.

\`\`\`sql
CREATE TABLE public.trucks (
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
  assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
\`\`\`

**Purpose**: Track all trucks and their assignments
**Key Features**:
- Unique truck identification
- Assignment to technicians
- Status tracking for maintenance
- Location and mileage tracking

### 3. inventory_categories
Hierarchical organization of inventory items.

\`\`\`sql
CREATE TABLE public.inventory_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
\`\`\`

**Purpose**: Organize inventory items into logical categories
**Examples**: Plumbing, Electrical, HVAC, Tools, Safety, Hardware

### 4. inventory_items
Master catalog of all available inventory items.

\`\`\`sql
CREATE TABLE public.inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  part_number TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.inventory_categories(id) ON DELETE SET NULL,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  cost_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  supplier TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
\`\`\`

**Purpose**: Central catalog of all inventory items
**Key Features**:
- Unique part number identification
- Pricing information for profitability
- Supplier tracking
- Category organization

### 5. truck_bins
Physical storage locations within trucks.

\`\`\`sql
CREATE TABLE public.truck_bins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  truck_id UUID NOT NULL REFERENCES public.trucks(id) ON DELETE CASCADE,
  bin_code TEXT NOT NULL, -- Format: A1-B2-S3 (Aisle-Bay-Shelf)
  name TEXT,
  description TEXT,
  max_capacity INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(truck_id, bin_code)
);
\`\`\`

**Purpose**: Define storage locations within trucks
**Key Features**:
- Hierarchical bin coding system (Aisle-Bay-Shelf)
- Capacity management
- Truck-specific organization

### 6. truck_inventory
Current inventory levels in truck bins.

\`\`\`sql
CREATE TABLE public.truck_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  truck_id UUID NOT NULL REFERENCES public.trucks(id) ON DELETE CASCADE,
  bin_id UUID NOT NULL REFERENCES public.truck_bins(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  min_quantity INTEGER DEFAULT 5,
  max_quantity INTEGER DEFAULT 50,
  last_restocked TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(truck_id, bin_id, item_id)
);
\`\`\`

**Purpose**: Track actual inventory levels in truck bins
**Key Features**:
- Real-time quantity tracking
- Min/max thresholds for reordering
- Restocking history
- Prevents duplicate items in same bin

### 7. orders
Order requests from technicians.

\`\`\`sql
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT NOT NULL UNIQUE,
  technician_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  truck_id UUID NOT NULL REFERENCES public.trucks(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')) DEFAULT 'pending',
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  commission_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  requested_delivery_date DATE,
  confirmed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
\`\`\`

**Purpose**: Track order requests and their lifecycle
**Key Features**:
- Automatic order number generation
- Status workflow management
- Financial calculations
- Admin confirmation tracking
- Priority management

### 8. order_items
Individual items within orders.

\`\`\`sql
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  bin_id UUID REFERENCES public.truck_bins(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
\`\`\`

**Purpose**: Detail individual items within orders
**Key Features**:
- Links to specific inventory items
- Bin location for restocking
- Price tracking at time of order
- Item-specific notes

### 9. credits
Financial transaction tracking for technicians.

\`\`\`sql
CREATE TABLE public.credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('earned', 'spent', 'bonus', 'adjustment')),
  amount DECIMAL(10,2) NOT NULL,
  balance_after DECIMAL(10,2) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
\`\`\`

**Purpose**: Track credit transactions and balances
**Key Features**:
- Multiple transaction types
- Running balance calculation
- Order linkage for earned credits
- Audit trail for all transactions

### 10. user_sessions
Activity logging and session tracking.

\`\`\`sql
CREATE TABLE public.user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
\`\`\`

**Purpose**: Log user activities for security and analytics
**Key Features**:
- Action tracking
- JSON details for flexible data
- IP and user agent logging
- Security audit trail

### 11. system_settings
Application configuration management.

\`\`\`sql
CREATE TABLE public.system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
\`\`\`

**Purpose**: Store system-wide configuration settings
**Examples**: Commission rates, tax rates, platform settings

## Relationships and Constraints

### Primary Relationships
1. **users** ← **trucks** (assigned_to): One-to-many truck assignments
2. **trucks** ← **truck_bins**: One-to-many bin locations
3. **truck_bins** ← **truck_inventory**: One-to-many inventory items
4. **inventory_categories** ← **inventory_items**: One-to-many categorization
5. **users** ← **orders** (technician_id): One-to-many order creation
6. **trucks** ← **orders**: One-to-many truck orders
7. **orders** ← **order_items**: One-to-many order details
8. **users** ← **credits**: One-to-many credit transactions

### Referential Integrity
- **CASCADE DELETE**: Child records deleted when parent is removed
- **SET NULL**: Foreign keys set to null when referenced record is deleted
- **RESTRICT**: Prevents deletion if child records exist

### Check Constraints
- **Role validation**: Ensures valid user roles (admin/technician)
- **Status validation**: Enforces valid status values across tables
- **Priority validation**: Ensures valid order priorities
- **Transaction types**: Validates credit transaction types

## Indexes and Performance

### Primary Indexes
All tables have primary key indexes on UUID columns for fast lookups.

### Secondary Indexes
\`\`\`sql
-- User role and status lookups
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_status ON public.users(status);

-- Truck assignment and status
CREATE INDEX idx_trucks_status ON public.trucks(status);
CREATE INDEX idx_trucks_assigned_to ON public.trucks(assigned_to);

-- Order queries
CREATE INDEX idx_orders_technician_id ON public.orders(technician_id);
CREATE INDEX idx_orders_truck_id ON public.orders(truck_id);
CREATE INDEX idx_orders_status ON public.orders(status);

-- Order item relationships
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);

-- Inventory lookups
CREATE INDEX idx_truck_inventory_truck_id ON public.truck_inventory(truck_id);

-- Credit transactions
CREATE INDEX idx_credits_user_id ON public.credits(user_id);
\`\`\`

### Query Optimization
- **Composite indexes** for multi-column queries
- **Partial indexes** for filtered queries
- **Covering indexes** to avoid table lookups

## Row Level Security (RLS)

### Security Model
All tables implement RLS policies to ensure data isolation and role-based access.

### Policy Categories

#### 1. User Data Access
- Users can view/edit their own profile
- Admins can view/edit all user profiles
- User creation restricted to admins

#### 2. Truck Access
- Technicians can only access assigned trucks
- Admins have full truck access
- Truck management restricted to admins

#### 3. Order Security
- Technicians can only access their own orders
- Admins can view all orders
- Order creation tied to authenticated user

#### 4. Inventory Protection
- Technicians can view inventory for assigned trucks
- Inventory modifications restricted to admins
- Read-only access to item catalog

#### 5. Financial Data
- Credit transactions isolated by user
- Admin-only access to financial operations
- Audit trail protection

### Example RLS Policy
\`\`\`sql
-- Users can only see their own data or admin can see all
CREATE POLICY "users_select_own_or_admin" ON public.users
  FOR SELECT USING (
    auth.uid() = id OR 
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );
\`\`\`

## Functions and Triggers

### Automated Functions

#### 1. User Profile Creation
\`\`\`sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, first_name, last_name, role)
  VALUES (NEW.id, NEW.email, ...);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
\`\`\`

#### 2. Order Number Generation
\`\`\`sql
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT AS $$
-- Generates format: YYYYMMDD-001
\`\`\`

#### 3. Order Total Calculation
\`\`\`sql
CREATE OR REPLACE FUNCTION public.calculate_order_total(order_id UUID)
RETURNS DECIMAL(10,2) AS $$
-- Calculates total from order_items
\`\`\`

#### 4. Credit Balance Management
\`\`\`sql
CREATE OR REPLACE FUNCTION public.update_credit_balance()
RETURNS TRIGGER AS $$
-- Maintains running balance
\`\`\`

### Trigger Implementation
- **BEFORE INSERT**: Data validation and preparation
- **AFTER INSERT**: Related record creation
- **BEFORE UPDATE**: Timestamp updates
- **AFTER UPDATE/DELETE**: Cascade operations

## Data Integrity

### Constraints
- **NOT NULL**: Required fields enforced
- **UNIQUE**: Prevents duplicate values
- **CHECK**: Business rule validation
- **FOREIGN KEY**: Referential integrity

### Business Rules
1. **Truck Assignment**: One truck per technician
2. **Order Ownership**: Orders tied to creating technician
3. **Inventory Uniqueness**: One item per bin location
4. **Status Transitions**: Valid status change workflows
5. **Financial Accuracy**: Automatic total calculations

### Validation
- **Email Format**: Valid email addresses required
- **Positive Values**: Quantities and prices must be positive
- **Date Logic**: Created dates before updated dates
- **Role Consistency**: Role changes maintain data access

## Backup and Recovery

### Backup Strategy
- **Automated Backups**: Daily Supabase backups
- **Point-in-Time Recovery**: Transaction log backups
- **Cross-Region Replication**: Geographic redundancy
- **Schema Versioning**: Migration script tracking

### Recovery Procedures
- **Data Restoration**: Point-in-time recovery
- **Schema Recovery**: Version-controlled migrations
- **Disaster Recovery**: Cross-region failover
- **Testing**: Regular recovery testing

This schema provides a robust foundation for the TruxkToK system with comprehensive data protection, performance optimization, and scalability considerations.
