CREATE TABLE users (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  role ENUM('admin', 'technician') NOT NULL DEFAULT 'technician',
  status ENUM
('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON
UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE trucks (
  id CHAR(36) PRIMARY KEY,
  truck_number VARCHAR(50) NOT NULL UNIQUE,
  make VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INT NOT NULL,
  license_plate VARCHAR(50),
  vin VARCHAR(50),
  status ENUM('active', 'maintenance', 'inactive') NOT NULL DEFAULT 'active',
  location VARCHAR
(255),
  mileage INT DEFAULT 0,
  assigned_to CHAR
(36),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON
UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY
(assigned_to) REFERENCES users
(id) ON
DELETE
SET NULL
);

CREATE TABLE inventory_categories
(
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE inventory_items
(
  id CHAR(36) PRIMARY KEY,
  part_number VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category_id CHAR(36),
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  cost_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  supplier VARCHAR(100),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  ON
  UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY
  (category_id) REFERENCES inventory_categories
  (id) ON
  DELETE
  SET NULL
  );

  CREATE TABLE truck_bins
  (
    id CHAR(36) PRIMARY KEY,
    truck_id CHAR(36) NOT NULL,
    bin_code VARCHAR(50) NOT NULL,
    name VARCHAR(100),
    description TEXT,
    max_capacity INT DEFAULT 100,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (truck_id, bin_code),
    FOREIGN KEY (truck_id) REFERENCES trucks(id) ON DELETE CASCADE
  );

  CREATE TABLE truck_inventory
  (
    id CHAR(36) PRIMARY KEY,
    truck_id CHAR(36) NOT NULL,
    bin_id CHAR(36) NOT NULL,
    item_id CHAR(36) NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    min_quantity INT DEFAULT 5,
    max_quantity INT DEFAULT 50,
    last_restocked DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ON
    UPDATE CURRENT_TIMESTAMP,
  UNIQUE (truck_id, bin_id, item_id),
  FOREIGN KEY
    (truck_id) REFERENCES trucks
    (id) ON
    DELETE CASCADE,
  FOREIGN KEY (bin_id)
    REFERENCES truck_bins
    (id) ON
    DELETE CASCADE,
  FOREIGN KEY (item_id)
    REFERENCES inventory_items
    (id) ON
    DELETE CASCADE
);

    CREATE TABLE orders (
  id CHAR(36) PRIMARY KEY,
  order_number VARCHAR(50) NOT NULL UNIQUE,
  technician_id CHAR(36) NOT NULL,
  truck_id CHAR(36) NOT NULL,
  status ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled') NOT NULL DEFAULT 'pending',
  priority ENUM
    ('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium',
  total_amount DECIMAL
    (10,2) NOT NULL DEFAULT 0.00,
  tax_amount DECIMAL
    (10,2) NOT NULL DEFAULT 0.00,
  commission_amount DECIMAL
    (10,2) NOT NULL DEFAULT 0.00,
  notes TEXT,
  requested_delivery_date DATE,
  confirmed_by CHAR
    (36),
  confirmed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON
    UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY
    (technician_id) REFERENCES users
    (id) ON
    DELETE CASCADE,
  FOREIGN KEY (truck_id)
    REFERENCES trucks
    (id) ON
    DELETE CASCADE,
  FOREIGN KEY (confirmed_by)
    REFERENCES users
    (id) ON
    DELETE
    SET NULL
    );

    CREATE TABLE order_items
    (
      id CHAR(36) PRIMARY KEY,
      order_id CHAR(36) NOT NULL,
      item_id CHAR(36) NOT NULL,
      bin_id CHAR(36),
      quantity INT NOT NULL,
      unit_price DECIMAL(10,2) NOT NULL,
      total_price DECIMAL(10,2) NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (item_id) REFERENCES inventory_items(id) ON DELETE CASCADE,
      FOREIGN KEY (bin_id) REFERENCES truck_bins(id) ON DELETE SET NULL
    );

    CREATE TABLE credits (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  order_id CHAR(36),
  type ENUM('earned', 'spent', 'bonus', 'adjustment') NOT NULL,
  amount DECIMAL
    (10,2) NOT NULL,
  balance_after DECIMAL
    (10,2) NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY
    (user_id) REFERENCES users
    (id) ON
    DELETE CASCADE,
  FOREIGN KEY (order_id)
    REFERENCES orders
    (id) ON
    DELETE
    SET NULL
    );

    CREATE TABLE user_sessions
    (
      id CHAR(36) PRIMARY KEY,
      user_id CHAR(36) NOT NULL,
      action VARCHAR(100) NOT NULL,
      details JSON,
      ip_address VARCHAR(45),
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE system_settings
    (
      id CHAR(36) PRIMARY KEY,
      key VARCHAR
      (100) NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  updated_by CHAR
      (36),
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON
      UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY
      (updated_by) REFERENCES users
      (id) ON
      DELETE
      SET NULL
      );


      ALTER TABLE users ADD password VARCHAR(255) NOT NULL;

      CREATE INDEX idx_truck_inventory_truck_item ON truck_inventory(truck_id, item_id);

      DELIMITER
//
      CREATE TRIGGER calculate_order_total
BEFORE
      UPDATE ON orders
FOR EACH ROW
      BEGIN
        SET NEW
        .total_amount =
        (
    SELECT SUM(total_price)
        FROM order_items
        WHERE order_id = NEW.id
  );
      END
      //
DELIMITER ;

DELIMITER
//
      CREATE TRIGGER update_order_total_after_item_change
AFTER
      INSERT ON
      order_items
      FOR
      EACH
      ROW
      BEGIN
        UPDATE orders
  SET total_amount = (
    SELECT SUM(total_price)
        FROM order_items
        WHERE order_id = NEW.order_id
  )
  WHERE id = NEW.order_id;
      END
      //

      CREATE TRIGGER update_order_total_after_item_update
AFTER
      UPDATE ON order_items
FOR EACH ROW
      BEGIN
        UPDATE orders
  SET total_amount = (
    SELECT SUM(total_price)
        FROM order_items
        WHERE order_id = NEW.order_id
  )
  WHERE id = NEW.order_id;
      END
      //

      CREATE TRIGGER update_order_total_after_item_delete
AFTER
      DELETE ON order_items
FOR EACH
      ROW
      BEGIN
        UPDATE orders
  SET total_amount = (
    SELECT SUM(total_price)
        FROM order_items
        WHERE order_id = OLD.order_id
  )
  WHERE id = OLD.order_id;
      END
      //
DELIMITER ;


      CREATE TABLE activities (
  id CHAR(36) PRIMARY KEY,
  type ENUM('order', 'technician', 'redemption', 'supply_house') NOT NULL,
  message VARCHAR
      (255) NOT NULL,
  status ENUM
      ('new', 'success', 'pending', 'info') NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

      ALTER TABLE orders
ADD FOREIGN KEY (truck_id) REFERENCES trucks(id);


      ALTER TABLE orders
ADD urgency ENUM
      ('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
      ADD commission DECIMAL
      (10, 2) DEFAULT 0.00,
      ADD credit DECIMAL
      (10, 2) DEFAULT 0.00;

      ALTER TABLE order_items
ADD part_number VARCHAR(50)
      ,
      ADD bin_code VARCHAR
      (20),
      ADD category VARCHAR
      (50),
      ADD description TEXT;


      ALTER TABLE orders
ADD user_id CHAR(36) NOT NULL
      ,
      ADD FOREIGN KEY
      (user_id) REFERENCES users
      (id);

      ALTER TABLE orders
ADD user_id CHAR(36);
      -- Update existing rows with a default user_id or valid user IDs
      UPDATE orders SET user_id = (SELECT id
      FROM users
      WHERE role = 'technician' LIMIT 1
      );
      -- Then add the NOT NULL constraint and foreign key
      ALTER TABLE orders
MODIFY user_id CHAR
      (36) NOT NULL,
      ADD FOREIGN KEY
      (user_id) REFERENCES users
      (id);





populate 10 users
      use truck_local;
      INSERT INTO `users` (`
      id`,
      `email
      `, `first_name`, `last_name`, `phone`, `role`, `status`, `created_at`, `updated_at`, `password`) VALUES
      ('1001-1234-5678-9012-345678901234', 'user1@example.com', 'John', 'Doe', '(555) 111-1111', 'technician', 'active', '2025-09-03 05:00:00', '2025-09-03 05:00:00', '$2b$10$dummyhash1'),
      ('1002-1234-5678-9012-345678901234', 'user2@example.com', 'Alice', 'Smith', '(555) 222-2222', 'technician', 'active', '2025-09-03 05:00:00', '2025-09-03 05:00:00', '$2b$10$dummyhash2'),
      ('1003-1234-5678-9012-345678901234', 'user3@example.com', 'Bob', 'Johnson', '(555) 333-3333', 'technician', 'active', '2025-09-03 05:00:00', '2025-09-03 05:00:00', '$2b$10$dummyhash3'),
      ('1004-1234-5678-9012-345678901234', 'user4@example.com', 'Emma', 'Brown', '(555) 444-4444', 'technician', 'active', '2025-09-03 05:00:00', '2025-09-03 05:00:00', '$2b$10$dummyhash4'),
      ('1005-1234-5678-9012-345678901234', 'user5@example.com', 'Michael', 'Davis', '(555) 555-5555', 'technician', 'active', '2025-09-03 05:00:00', '2025-09-03 05:00:00', '$2b$10$dummyhash5'),
      ('1006-1234-5678-9012-345678901234', 'admin1@example.com', 'Sarah', 'Wilson', '(555) 666-6666', 'admin', 'active', '2025-09-03 05:00:00', '2025-09-03 05:00:00', '$2b$10$dummyhash6'),
      ('1007-1234-5678-9012-345678901234', 'admin2@example.com', 'David', 'Taylor', '(555) 777-7777', 'admin', 'active', '2025-09-03 05:00:00', '2025-09-03 05:00:00', '$2b$10$dummyhash7'),
      ('1008-1234-5678-9012-345678901234', 'user8@example.com', 'Laura', 'Martinez', '(555) 888-8888', 'technician', 'active', '2025-09-03 05:00:00', '2025-09-03 05:00:00', '$2b$10$dummyhash8'),
      ('1009-1234-5678-9012-345678901234', 'user9@example.com', 'James', 'Anderson', '(555) 999-9999', 'technician', 'active', '2025-09-03 05:00:00', '2025-09-03 05:00:00', '$2b$10$dummyhash9'),
      ('1010-1234-5678-9012-345678901234', 'admin3@example.com', 'Emily', 'Thomas', '(555) 000-0000', 'admin', 'active', '2025-09-03 05:00:00', '2025-09-03 05:00:00', '$2b$10$dummyhash10');



populate trucks

      INSERT INTO `settings` (`
      id`,
      `category
      `, `key_name`, `value`, `updated_at`) VALUES
      ('2001-1234-5678-9012-345678901234', 'platform', 'max_login_attempts', '5', '2025-09-03 05:00:00'),
      ('2002-1234-5678-9012-345678901234', 'platform', 'session_timeout', '3600', '2025-09-03 05:00:00'),
      ('2003-1234-5678-9012-345678901234', 'commission', 'base_rate', '0.05', '2025-09-03 05:00:00'),
      ('2004-1234-5678-9012-345678901234', 'commission', 'urgent_order_rate', '0.10', '2025-09-03 05:00:00'),
      ('2005-1234-5678-9012-345678901234', 'security', 'password_min_length', '8', '2025-09-03 05:00:00'),
      ('2006-1234-5678-9012-345678901234', 'security', 'two_factor_enabled', 'true', '2025-09-03 05:00:00'),
      ('2007-1234-5678-9012-345678901234', 'platform', 'default_timezone', 'UTC', '2025-09-03 05:00:00'),
      ('2008-1234-5678-9012-345678901234', 'commission', 'min_commission', '1.00', '2025-09-03 05:00:00'),
      ('2009-1234-5678-9012-345678901234', 'security', 'session_expiry_days', '30', '2025-09-03 05:00:00'),
      ('2010-1234-5678-9012-345678901234', 'platform', 'max_trucks_per_technician', '2', '2025-09-03 05:00:00');



      
-- Insert into `supply_houses` (10 records)
INSERT INTO `supply_houses` (`id`,`name`, `location`, `status`, `created_at`, `updated_at`) VALUES
('3001-1234-5678-9012-345678901234', 'Supply House A', '123 Main St, City A', 'active', '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('3002-1234-5678-9012-345678901234', 'Supply House B', '456 Oak St, City B', 'active', '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('3003-1234-5678-9012-345678901234', 'Supply House C', '789 Pine St, City C', 'inactive', '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('3004-1234-5678-9012-345678901234', 'Supply House D', '101 Maple St, City D', 'active', '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('3005-1234-5678-9012-345678901234', 'Supply House E', '202 Cedar St, City E', 'active', '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('3006-1234-5678-9012-345678901234', 'Supply House F', '303 Birch St, City F', 'active', '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('3007-1234-5678-9012-345678901234', 'Supply House G', '404 Elm St, City G', 'inactive', '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('3008-1234-5678-9012-345678901234', 'Supply House H', '505 Spruce St, City H', 'active', '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('3009-1234-5678-9012-345678901234', 'Supply House I', '606 Walnut St, City I', 'active', '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('3010-1234-5678-9012-345678901234', 'Supply House J', '707 Chestnut St, City J', 'active', '2025-09-03 05:00:00', '2025-09-03 05:00:00');


-- Insert into `truck_bins` (10 records, referencing provided truck_id)
INSERT INTO `truck_bins` (`
id`,
`truck_id
`, `bin_code`, `name`, `description`, `max_capacity`, `created_at`, `updated_at`) VALUES
('4001-1234-5678-9012-345678901234', '2de3146f-885f-11f0-bba2-80ce629ed0db', 'BIN-A01', 'Bin A01', '{"location":"Top Shelf","section":"Main","binType":"Storage","description":"Main storage bin"}', 50, '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('4002-1234-5678-9012-345678901234', '2de3146f-885f-11f0-bba2-80ce629ed0db', 'BIN-A02', 'Bin A02', '{"location":"Bottom Shelf","section":"Tools","binType":"Tool Bin","description":"Tool storage"}', 30, '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('4003-1234-5678-9012-345678901234', '2de3146f-885f-11f0-bba2-80ce629ed0db', 'BIN-A03', 'Bin A03', '{"location":"Side Compartment","section":"Parts","binType":"Parts Bin","description":"Spare parts"}', 40, '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('4004-1234-5678-9012-345678901234', '2de3146f-885f-11f0-bba2-80ce629ed0db', 'BIN-A04', 'Bin A04', '{"location":"Under-bed","section":"Main","binType":"Storage","description":"Extra storage"}', 60, '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('4005-1234-5678-9012-345678901234', '2de3146f-885f-11f0-bba2-80ce629ed0db', 'BIN-A05', 'Bin A05', '{"location":"Top Shelf","section":"Supplies","binType":"Supply Bin","description":"General supplies"}', 45, '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('4006-1234-5678-9012-345678901234', '2de3146f-885f-11f0-bba2-80ce629ed0db', 'BIN-A06', 'Bin A06', '{"location":"Bottom Shelf","section":"Tools","binType":"Tool Bin","description":"Specialized tools"}', 25, '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('4007-1234-5678-9012-345678901234', '2de3146f-885f-11f0-bba2-80ce629ed0db', 'BIN-A07', 'Bin A07', '{"location":"Side Compartment","section":"Parts","binType":"Parts Bin","description":"Electrical parts"}', 35, '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('4008-1234-5678-9012-345678901234', '2de3146f-885f-11f0-bba2-80ce629ed0db', 'BIN-A08', 'Bin A08', '{"location":"Under-bed","section":"Main","binType":"Storage","description":"Backup storage"}', 55, '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('4009-1234-5678-9012-345678901234', '2de3146f-885f-11f0-bba2-80ce629ed0db', 'BIN-A09', 'Bin A09', '{"location":"Top Shelf","section":"Supplies","binType":"Supply Bin","description":"Cleaning supplies"}', 40, '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('4010-1234-5678-9012-345678901234', '2de3146f-885f-11f0-bba2-80ce629ed0db', 'BIN-A10', 'Bin A10', '{"location":"Side Compartment","section":"Parts","binType":"Parts Bin","description":"Mechanical parts"}', 50, '2025-09-03 05:00:00', '2025-09-03 05:00:00');


-- Insert into `inventory_categories` (10 records)
INSERT INTO `inventory_categories` (`
id`,
`name
`, `description`, `created_at`) VALUES
('5001-1234-5678-9012-345678901234', 'Tools', 'Hand and power tools', '2025-09-03 05:00:00'),
('5002-1234-5678-9012-345678901234', 'Electrical Parts', 'Wires, connectors, and fuses', '2025-09-03 05:00:00'),
('5003-1234-5678-9012-345678901234', 'Mechanical Parts', 'Bolts, nuts, and bearings', '2025-09-03 05:00:00'),
('5004-1234-5678-9012-345678901234', 'Cleaning Supplies', 'Cleaning agents and materials', '2025-09-03 05:00:00'),
('5005-1234-5678-9012-345678901234', 'Filters', 'Oil and air filters', '2025-09-03 05:00:00'),
('5006-1234-5678-9012-345678901234', 'Lubricants', 'Oils and greases', '2025-09-03 05:00:00'),
('5007-1234-5678-9012-345678901234', 'Safety Gear', 'Gloves, helmets, and vests', '2025-09-03 05:00:00'),
('5008-1234-5678-9012-345678901234', 'Brake Components', 'Brake pads and rotors', '2025-09-03 05:00:00'),
('5009-1234-5678-9012-345678901234', 'Engine Parts', 'Spark plugs and belts', '2025-09-03 05:00:00'),
('5010-1234-5678-9012-345678901234', 'Miscellaneous', 'General supplies', '2025-09-03 05:00:00');

-- Insert into `inventory_items` (10 records, referencing inventory_categories)
INSERT INTO `inventory_items` (`
id`,
`part_number`,
`name`,
`description`,
`category_id`,
`unit_price
`, `cost_price`, `supplier`, `unit`, `min_quantity`, `max_quantity`, `standard_level`, `created_at`, `updated_at`) VALUES
('1001-1234-5678-9012-345678901234', 'PN-1001', 'Screwdriver Set', 'Set of 10 screwdrivers', '5001-1234-5678-9012-345678901234', 25.00, 15.00, 'ToolCo', 'pieces', 5, 20, 10, '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('1002-1234-5678-9012-345678901234', 'PN-1002', 'Wire Connectors', 'Pack of 100 connectors', '5002-1234-5678-9012-345678901234', 10.00, 6.00, 'ElectroSupply', 'pieces', 10, 50, 20, '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('1003-1234-5678-9012-345678901234', 'PN-1003', 'Steel Bolts', 'Pack of 50 bolts', '5003-1234-5678-9012-345678901234', 15.00, 8.00, 'MetalWorks', 'pieces', 10, 40, 15, '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('1004-1234-5678-9012-345678901234', 'PN-1004', 'Cleaning Spray', '500ml spray bottle', '5004-1234-5678-9012-345678901234', 8.00, 4.00, 'CleanCo', 'pieces', 5, 30, 10, '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('1005-1234-5678-9012-345678901234', 'PN-1005', 'Oil Filter', 'Standard oil filter', '5005-1234-5678-9012-345678901234', 12.00, 7.00, 'AutoParts', 'pieces', 5, 25, 10, '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('1006-1234-5678-9012-345678901234', 'PN-1006', 'Lubricating Oil', '1L oil can', '5006-1234-5678-9012-345678901234', 20.00, 12.00, 'LubeCo', 'pieces', 5, 20, 8, '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('1007-1234-5678-9012-345678901234', 'PN-1007', 'Safety Gloves', 'Pair of work gloves', '5007-1234-5678-9012-345678901234', 15.00, 9.00, 'SafetyGear', 'pieces', 5, 30, 10, '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('1008-1234-5678-9012-345678901234', 'PN-1008', 'Brake Pads', 'Set of brake pads', '5008-1234-5678-9012-345678901234', 50.00, 30.00, 'AutoParts', 'pieces', 5, 20, 8, '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('1009-1234-5678-9012-345678901234', 'PN-1009', 'Spark Plug', 'Standard spark plug', '5009-1234-5678-9012-345678901234', 10.00, 5.00, 'AutoParts', 'pieces', 5, 25, 10, '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('1010-1234-5678-9012-345678901234', 'PN-1010', 'Tape Measure', '5m tape measure', '5001-1234-5678-9012-345678901234', 8.00, 4.00, 'ToolCo', 'pieces', 5, 15, 5, '2025-09-03 05:00:00', '2025-09-03 05:00:00');


-- Insert into `truck_standard_inventory` (10 records, referencing truck_id, bin_id, and inventory_items)


-- Insert into `restock_orders` (10 records, referencing truck_id, technician_id, and supply_house_id)
INSERT INTO `restock_orders` (`
id`,
`truck_id
`, `supply_house_id`, `technician_id`, `status`, `created_at`, `updated_at`) VALUES
('9001-1234-5678-9012-345678901234', '2de3146f-885f-11f0-bba2-80ce629ed0db', '3001-1234-5678-9012-345678901234', '809d9ce0-885e-11f0-bba2-80ce629ed0db', 'pending', '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('9002-1234-5678-9012-345678901234', '2de3146f-885f-11f0-bba2-80ce629ed0db', '3002-1234-5678-9012-345678901234', '809d9ce0-885e-11f0-bba2-80ce629ed0db', 'submitted', '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('9003-1234-5678-9012-345678901234', '2de3146f-885f-11f0-bba2-80ce629ed0db', '3003-1234-5678-9012-345678901234', '809d9ce0-885e-11f0-bba2-80ce629ed0db', 'completed', '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('9004-1234-5678-9012-345678901234', '2de3146f-885f-11f0-bba2-80ce629ed0db', '3004-1234-5678-9012-345678901234', '809d9ce0-885e-11f0-bba2-80ce629ed0db', 'pending', '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('9005-1234-5678-9012-345678901234', '2de3146f-885f-11f0-bba2-80ce629ed0db', '3005-1234-5678-9012-345678901234', '809d9ce0-885e-11f0-bba2-80ce629ed0db', 'submitted', '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('9006-1234-5678-9012-345678901234', '2de3146f-885f-11f0-bba2-80ce629ed0db', '3006-1234-5678-9012-345678901234', '809d9ce0-885e-11f0-bba2-80ce629ed0db', 'completed', '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('9007-1234-5678-9012-345678901234', '2de3146f-885f-11f0-bba2-80ce629ed0db', '3007-1234-5678-9012-345678901234', '809d9ce0-885e-11f0-bba2-80ce629ed0db', 'cancelled', '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('9008-1234-5678-9012-345678901234', '2de3146f-885f-11f0-bba2-80ce629ed0db', '3008-1234-5678-9012-345678901234', '809d9ce0-885e-11f0-bba2-80ce629ed0db', 'pending', '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('9009-1234-5678-9012-345678901234', '2de3146f-885f-11f0-bba2-80ce629ed0db', '3009-1234-5678-9012-345678901234', '809d9ce0-885e-11f0-bba2-80ce629ed0db', 'submitted', '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('9010-1234-5678-9012-345678901234', '2de3146f-885f-11f0-bba2-80ce629ed0db', '3010-1234-5678-9012-345678901234', '809d9ce0-885e-11f0-bba2-80ce629ed0db', 'completed', '2025-09-03 05:00:00', '2025-09-03 05:00:00');


INSERT INTO `truck_inventory` (`
id`,
`truck_id
`, `bin_id`, `item_id`, `quantity`, `min_quantity`, `max_quantity`, `last_restocked`, `created_at`, `updated_at`) VALUES
('7001-1234-5678-9012-345678901234', '2de3146f-885f-11f0-bba2-80ce629ed0db', '4001-1234-5678-9012-345678901234', '1001-1234-5678-9012-345678901234', 15, 5, 20, '2025-09-02 05:00:00', '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('7002-1234-5678-9012-345678901234', '2de3146f-885f-11f0-bba2-80ce629ed0db', '4002-1234-5678-9012-345678901234', '1002-1234-5678-9012-345678901234', 40, 10, 50, '2025-09-02 05:00:00', '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('7003-1234-5678-9012-345678901234', '2de3146f-885f-11f0-bba2-80ce629ed0db', '4003-1234-5678-9012-345678901234', '1003-1234-5678-9012-345678901234', 30, 10, 40, '2025-09-02 05:00:00', '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('7004-1234-5678-9012-345678901234', '2de3146f-885f-11f0-bba2-80ce629ed0db', '4004-1234-5678-9012-345678901234', '1004-1234-5678-9012-345678901234', 20, 5, 30, '2025-09-02 05:00:00', '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('7005-1234-5678-9012-345678901234', '2de3146f-885f-11f0-bba2-80ce629ed0db', '4005-1234-5678-9012-345678901234', '1005-1234-5678-9012-345678901234', 15, 5, 25, '2025-09-02 05:00:00', '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('7006-1234-5678-9012-345678901234', '2de3146f-885f-11f0-bba2-80ce629ed0db', '4006-1234-5678-9012-345678901234', '1006-1234-5678-9012-345678901234', 10, 5, 20, '2025-09-02 05:00:00', '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('7007-1234-5678-9012-345678901234', '2de3146f-885f-11f0-bba2-80ce629ed0db', '4007-1234-5678-9012-345678901234', '1007-1234-5678-9012-345678901234', 25, 5, 30, '2025-09-02 05:00:00', '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('7008-1234-5678-9012-345678901234', '2de3146f-885f-11f0-bba2-80ce629ed0db', '4008-1234-5678-9012-345678901234', '1008-1234-5678-9012-345678901234', 12, 5, 20, '2025-09-02 05:00:00', '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('7009-1234-5678-9012-345678901234', '2de3146f-885f-11f0-bba2-80ce629ed0db', '4009-1234-5678-9012-345678901234', '1009-1234-5678-9012-345678901234', 15, 5, 25, '2025-09-02 05:00:00', '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('7010-1234-5678-9012-345678901234', '2de3146f-885f-11f0-bba2-80ce629ed0db', '4010-1234-5678-9012-345678901234', '1010-1234-5678-9012-345678901234', 10, 5, 15, '2025-09-02 05:00:00', '2025-09-03 05:00:00', '2025-09-03 05:00:00');

use truck_local;

-- Insert into `orders` (10 records, referencing technician_id, truck_id, supply_house_id, and admin as confirmed_by)
INSERT INTO `orders` (`id`, `order_number`, `type`, `technician_id`, `truck_id`, `supply_house_id`, `status`, `priority`, `total_amount`, `tax_amount`, `commission_amount`, `notes`, `requested_delivery_date`, `confirmed_by`, `confirmed_at`, `created_at`, `updated_at`, `urgency`, `commission`, `credit`, `user_id`) VALUES
('11001-1234-5678-9012-345678901234', '#ORD-2001', 'restock', '809d9ce0-885e-11f0-bba2-80ce629ed0db', '2de3146f-885f-11f0-bba2-80ce629ed0db', '3001-1234-5678-9012-345678901234', 'pending', 'medium', 100.00, 5.00, 2.50, 'Restock tools', '2025-09-05', '68cee79f-885e-11f0-bba2-80ce629ed0db', '2025-09-03 05:00:00', '2025-09-03 05:00:00', '2025-09-03 05:00:00', 'normal', 2.50, 0.00, '809d9ce0-885e-11f0-bba2-80ce629ed0db'),
('11002-1234-5678-9012-345678901234', '#ORD-2002', 'restock', '809d9ce0-885e-11f0-bba2-80ce629ed0db', '2de3146f-885f-11f0-bba2-80ce629ed0db', '3002-1234-5678-9012-345678901234', 'confirmed', 'high', 150.00, 7.50, 3.75, 'Urgent restock', '2025-09-04', '68cee79f-885e-11f0-bba2-80ce629ed0db', '2025-09-03 05:00:00', '2025-09-03 05:00:00', '2025-09-03 05:00:00', 'high', 3.75, 0.00, '809d9ce0-885e-11f0-bba2-80ce629ed0db'),
('11003-1234-5678-9012-345678901234', '#ORD-2003', 'manual', '809d9ce0-885e-11f0-bba2-80ce629ed0db', '2de3146f-885f-11f0-bba2-80ce629ed0db', '3003-1234-5678-9012-345678901234', 'processing', 'medium', 200.00, 10.00, 5.00, 'Manual order', '2025-09-06', '68cee79f-885e-11f0-bba2-80ce629ed0db', '2025-09-03 05:00:00', '2025-09-03 05:00:00', '2025-09-03 05:00:00', 'normal', 5.00, 0.00, '809d9ce0-885e-11f0-bba2-80ce629ed0db'),
('11004-1234-5678-9012-345678901234', '#ORD-2004', 'restock', '809d9ce0-885e-11f0-bba2-80ce629ed0db', '2de3146f-885f-11f0-bba2-80ce629ed0db', '3004-1234-5678-9012-345678901234', 'shipped', 'low', 80.00, 4.00, 2.00, 'Low priority restock', '2025-09-07', '68cee79f-885e-11f0-bba2-80ce629ed0db', '2025-09-03 05:00:00', '2025-09-03 05:00:00', '2025-09-03 05:00:00', 'low', 2.00, 0.00, '809d9ce0-885e-11f0-bba2-80ce629ed0db'),
('11005-1234-5678-9012-345678901234', '#ORD-2005', 'restock', '809d9ce0-885e-11f0-bba2-80ce629ed0db', '2de3146f-885f-11f0-bba2-80ce629ed0db', '3005-1234-5678-9012-345678901234', 'delivered', 'medium', 120.00, 6.00, 3.00, 'Delivered restock', '2025-09-03', '68cee79f-885e-11f0-bba2-80ce629ed0db', '2025-09-03 05:00:00', '2025-09-03 05:00:00', '2025-09-03 05:00:00', 'normal', 3.00, 0.00, '809d9ce0-885e-11f0-bba2-80ce629ed0db'),
('11006-1234-5678-9012-345678901234', '#ORD-2006', 'restock', '809d9ce0-885e-11f0-bba2-80ce629ed0db', '2de3146f-885f-11f0-bba2-80ce629ed0db', '3006-1234-5678-9012-345678901234', 'cancelled', 'medium', 0.00, 0.00, 0.00, 'Cancelled order', '2025-09-05', '68cee79f-885e-11f0-bba2-80ce629ed0db', '2025-09-03 05:00:00', '2025-09-03 05:00:00', '2025-09-03 05:00:00', 'normal', 0.00, 0.00, '809d9ce0-885e-11f0-bba2-80ce629ed0db'),
('11007-1234-5678-9012-345678901234', '#ORD-2007', 'manual', '809d9ce0-885e-11f0-bba2-80ce629ed0db', '2de3146f-885f-11f0-bba2-80ce629ed0db', '3007-1234-5678-9012-345678901234', 'pending', 'urgent', 300.00, 15.00, 7.50, 'Urgent manual order', '2025-09-04', '68cee79f-885e-11f0-bba2-80ce629ed0db', '2025-09-03 05:00:00', '2025-09-03 05:00:00', '2025-09-03 05:00:00', 'urgent', 7.50, 0.00, '809d9ce0-885e-11f0-bba2-80ce629ed0db'),
('11008-1234-5678-9012-345678901234', '#ORD-2008', 'restock', '809d9ce0-885e-11f0-bba2-80ce629ed0db', '2de3146f-885f-11f0-bba2-80ce629ed0db', '3008-1234-5678-9012-345678901234', 'processing', 'medium', 140.00, 7.00, 3.50, 'Restock parts', '2025-09-06', '68cee79f-885e-11f0-bba2-80ce629ed0db', '2025-09-03 05:00:00', '2025-09-03 05:00:00', '2025-09-03 05:00:00', 'normal', 3.50, 0.00, '809d9ce0-885e-11f0-bba2-80ce629ed0db'),
('11009-1234-5678-9012-345678901234', '#ORD-2009', 'restock', '809d9ce0-885e-11f0-bba2-80ce629ed0db', '2de3146f-885f-11f0-bba2-80ce629ed0db', '3009-1234-5678-9012-345678901234', 'shipped', 'medium', 160.00, 8.00, 4.00, 'Restock supplies', '2025-09-05', '68cee79f-885e-11f0-bba2-80ce629ed0db', '2025-09-03 05:00:00', '2025-09-03 05:00:00', '2025-09-03 05:00:00', 'normal', 4.00, 0.00, '809d9ce0-885e-11f0-bba2-80ce629ed0db'),
('11010-1234-5678-9012-345678901234', '#ORD-2010', 'restock', '809d9ce0-885e-11f0-bba2-80ce629ed0db', '2de3146f-885f-11f0-bba2-80ce629ed0db', '3010-1234-5678-9012-345678901234', 'delivered', 'medium', 180.00, 9.00, 4.50, 'Delivered restock', '2025-09-03', '68cee79f-885e-11f0-bba2-80ce629ed0db', '2025-09-03 05:00:00', '2025-09-03 05:00:00', '2025-09-03 05:00:00', 'normal', 4.50, 0.00, '809d9ce0-885e-11f0-bba2-80ce629ed0db');

-- Insert into `order_items` (10 records, referencing orders, inventory_items, and truck_bins)
INSERT INTO `order_items` (`id`, `order_id`, `item_id`, `bin_id`, `quantity`, `unit_price`, `total_price`, `reason`, `notes`, `created_at`, `part_number`, `bin_code`, `category`, `description`) VALUES
('12001-1234-5678-9012-345678901234', '11001-1234-5678-9012-345678901234', '1001-1234-5678-9012-345678901234', '4001-1234-5678-9012-345678901234', 10, 25.00, 250.00, 'Restock', 'Screwdriver set for truck', '2025-09-03 05:00:00', 'PN-1001', 'BIN-A01', 'Tools', 'Set of 10 screwdrivers'),
('12002-1234-5678-9012-345678901234', '11002-1234-5678-9012-345678901234', '1002-1234-5678-9012-345678901234', '4002-1234-5678-9012-345678901234', 20, 10.00, 200.00, 'Restock', 'Wire connectors for electrical work', '2025-09-03 05:00:00', 'PN-1002', 'BIN-A02', 'Electrical Parts', 'Pack of 100 connectors'),
('12003-1234-5678-9012-345678901234', '11003-1234-5678-9012-345678901234', '1003-1234-5678-9012-345678901234', '4003-1234-5678-9012-345678901234', 15, 15.00, 225.00, 'Restock', 'Steel bolts for repairs', '2025-09-03 05:00:00', 'PN-1003', 'BIN-A03', 'Mechanical Parts', 'Pack of 50 bolts'),
('12004-1234-5678-9012-345678901234', '11004-1234-5678-9012-345678901234', '1004-1234-5678-9012-345678901234', '4004-1234-5678-9012-345678901234', 10, 8.00, 80.00, 'Restock', 'Cleaning spray for maintenance', '2025-09-03 05:00:00', 'PN-1004', 'BIN-A04', 'Cleaning Supplies', '500ml spray bottle'),
('12005-1234-5678-9012-345678901234', '11005-1234-5678-9012-345678901234', '1005-1234-5678-9012-345678901234', '4005-1234-5678-9012-345678901234', 10, 12.00, 120.00, 'Restock', 'Oil filter for truck maintenance', '2025-09-03 05:00:00', 'PN-1005', 'BIN-A05', 'Filters', 'Standard oil filter'),
('12006-1234-5678-9012-345678901234', '11006-1234-5678-9012-345678901234', '1006-1234-5678-9012-345678901234', '4006-1234-5678-9012-345678901234', 8, 20.00, 160.00, 'Restock', 'Lubricating oil for repairs', '2025-09-03 05:00:00', 'PN-1006', 'BIN-A06', 'Lubricants', '1L oil can'),
('12007-1234-5678-9012-345678901234', '11007-1234-5678-9012-345678901234', '1007-1234-5678-9012-345678901234', '4007-1234-5678-9012-345678901234', 10, 15.00, 150.00, 'Restock', 'Safety gloves for technician', '2025-09-03 05:00:00', 'PN-1007', 'BIN-A07', 'Safety Gear', 'Pair of work gloves'),
('12008-1234-5678-9012-345678901234', '11008-1234-5678-9012-345678901234', '1008-1234-5678-9012-345678901234', '4008-1234-5678-9012-345678901234', 8, 50.00, 400.00, 'Restock', 'Brake pads for truck', '2025-09-03 05:00:00', 'PN-1008', 'BIN-A08', 'Brake Components', 'Set of brake pads'),
('12009-1234-5678-9012-345678901234', '11009-1234-5678-9012-345678901234', '1009-1234-5678-9012-345678901234', '4009-1234-5678-9012-345678901234', 10, 10.00, 100.00, 'Restock', 'Spark plugs for engine', '2025-09-03 05:00:00', 'PN-1009', 'BIN-A09', 'Engine Parts', 'Standard spark plug'),
('12010-1234-5678-9012-345678901234', '11010-1234-5678-9012-345678901234', '1010-1234-5678-9012-345678901234', '4010-1234-5678-9012-345678901234', 5, 8.00, 40.00, 'Restock', 'Tape measure for measurements', '2025-09-03 05:00:00', 'PN-1010', 'BIN-A10', 'Tools', '5m tape measure');

-- Insert into `user_sessions` (10 records, referencing technician_id and admin_id)
INSERT INTO `user_sessions` (`id`, `user_id`, `action`, `details`, `ip_address`, `user_agent`, `created_at`) VALUES
('13001-1234-5678-9012-345678901234', '809d9ce0-885e-11f0-bba2-80ce629ed0db', 'login', '{"status":"success"}', '192.168.1.1', 'Mozilla/5.0', '2025-09-03 05:00:00'),
('13002-1234-5678-9012-345678901234', '809d9ce0-885e-11f0-bba2-80ce629ed0db', 'logout', '{"status":"success"}', '192.168.1.2', 'Mozilla/5.0', '2025-09-03 05:00:00'),
('13003-1234-5678-9012-345678901234', '68cee79f-885e-11f0-bba2-80ce629ed0db', 'login', '{"status":"success"}', '192.168.1.3', 'Mozilla/5.0', '2025-09-03 05:00:00'),
('13004-1234-5678-9012-345678901234', '68cee79f-885e-11f0-bba2-80ce629ed0db', 'update_profile', '{"status":"success"}', '192.168.1.4', 'Mozilla/5.0', '2025-09-03 05:00:00'),
('13005-1234-5678-9012-345678901234', '809d9ce0-885e-11f0-bba2-80ce629ed0db', 'create_order', '{"order_id":"11001-1234-5678-9012-345678901234"}', '192.168.1.5', 'Mozilla/5.0', '2025-09-03 05:00:00'),
('13006-1234-5678-9012-345678901234', '68cee79f-885e-11f0-bba2-80ce629ed0db', 'confirm_order', '{"order_id":"11001-1234-5678-9012-345678901234"}', '192.168.1.6', 'Mozilla/5.0', '2025-09-03 05:00:00'),
('13007-1234-5678-9012-345678901234', '809d9ce0-885e-11f0-bba2-80ce629ed0db', 'view_inventory', '{"truck_id":"2de3146f-885f-11f0-bba2-80ce629ed0db"}', '192.168.1.7', 'Mozilla/5.0', '2025-09-03 05:00:00'),
('13008-1234-5678-9012-345678901234', '68cee79f-885e-11f0-bba2-80ce629ed0db', 'update_settings', '{"setting":"max_login_attempts"}', '192.168.1.8', 'Mozilla/5.0', '2025-09-03 05:00:00'),
('13009-1234-5678-9012-345678901234', '809d9ce0-885e-11f0-bba2-80ce629ed0db', 'restock_request', '{"restock_order_id":"9001-1234-5678-9012-345678901234"}', '192.168.1.9', 'Mozilla/5.0', '2025-09-03 05:00:00'),
('13010-1234-5678-9012-345678901234', '68cee79f-885e-11f0-bba2-80ce629ed0db', 'logout', '{"status":"success"}', '192.168.1.10', 'Mozilla/5.0', '2025-09-03 05:00:00');

-- Insert into `activities` (10 records, referencing orders and technician_id)
INSERT INTO `activities` (`id`, `type`, `message`, `status`, `created_at`) VALUES
('14001-1234-5678-9012-345678901234', 'order', 'New order #ORD-2001 created by technician', 'new', '2025-09-03 05:00:00'),
('14002-1234-5678-9012-345678901234', 'order', 'Order #ORD-2002 confirmed by admin', 'success', '2025-09-03 05:00:00'),
('14003-1234-5678-9012-345678901234', 'technician', 'Technician updated truck inventory', 'success', '2025-09-03 05:00:00'),
('14004-1234-5678-9012-345678901234', 'supply_house', 'Supply House A restocked items', 'info', '2025-09-03 05:00:00'),
('14005-1234-5678-9012-345678901234', 'order', 'Order #ORD-2003 processing started', 'pending', '2025-09-03 05:00:00'),
('14006-1234-5678-9012-345678901234', 'redemption', 'Technician requested credit redemption', 'pending', '2025-09-03 05:00:00'),
('14007-1234-5678-9012-345678901234', 'order', 'Order #ORD-2004 shipped', 'success', '2025-09-03 05:00:00'),
('14008-1234-5678-9012-345678901234', 'technician', 'Technician logged in', 'success', '2025-09-03 05:00:00'),
('14009-1234-5678-9012-345678901234', 'supply_house', 'Supply House B updated inventory', 'info', '2025-09-03 05:00:00'),
('14010-1234-5678-9012-345678901234', 'order', 'Order #ORD-2005 delivered', 'success', '2025-09-03 05:00:00');

-- Insert into `credits` (10 records, referencing technician_id, admin_id, and orders)
INSERT INTO `credits` (`id`, `technician_id`, `user_id`, `order_id`, `type`, `amount`, `balance_after`, `description`, `created_at`, `status`) VALUES
('15001-1234-5678-9012-345678901234', '809d9ce0-885e-11f0-bba2-80ce629ed0db', '809d9ce0-885e-11f0-bba2-80ce629ed0db', '11001-1234-5678-9012-345678901234', 'earned', 5.00, 5.00, 'Credit for order #ORD-2001', '2025-09-03 05:00:00', 'issued'),
('15002-1234-5678-9012-345678901234', '809d9ce0-885e-11f0-bba2-80ce629ed0db', '809d9ce0-885e-11f0-bba2-80ce629ed0db', '11002-1234-5678-9012-345678901234', 'earned', 7.50, 12.50, 'Credit for order #ORD-2002', '2025-09-03 05:00:00', 'issued'),
('15003-1234-5678-9012-345678901234', '809d9ce0-885e-11f0-bba2-80ce629ed0db', '809d9ce0-885e-11f0-bba2-80ce629ed0db', NULL, 'bonus', 10.00, 22.50, 'Monthly performance bonus', '2025-09-03 05:00:00', 'issued'),
('15004-1234-5678-9012-345678901234', '809d9ce0-885e-11f0-bba2-80ce629ed0db', '809d9ce0-885e-11f0-bba2-80ce629ed0db', NULL, 'spent', 5.00, 17.50, 'Cash withdrawal request', '2025-09-03 05:00:00', 'pending_redemption'),
('15005-1234-5678-9012-345678901234', '809d9ce0-885e-11f0-bba2-80ce629ed0db', '809d9ce0-885e-11f0-bba2-80ce629ed0db', '11003-1234-5678-9012-345678901234', 'earned', 10.00, 27.50, 'Credit for order #ORD-2003', '2025-09-03 05:00:00', 'issued'),
('15006-1234-5678-9012-345678901234', '809d9ce0-885e-11f0-bba2-80ce629ed0db', '809d9ce0-885e-11f0-bba2-80ce629ed0db', '11004-1234-5678-9012-345678901234', 'earned', 2.00, 29.50, 'Credit for order #ORD-2004', '2025-09-03 05:00:00', 'issued'),
('15007-1234-5678-9012-345678901234', '809d9ce0-885e-11f0-bba2-80ce629ed0db', '809d9ce0-885e-11f0-bba2-80ce629ed0db', '11005-1234-5678-9012-345678901234', 'earned', 3.00, 32.50, 'Credit for order #ORD-2005', '2025-09-03 05:00:00', 'issued'),
('15008-1234-5678-9012-345678901234', '809d9ce0-885e-11f0-bba2-80ce629ed0db', '809d9ce0-885e-11f0-bba2-80ce629ed0db', '11006-1234-5678-9012-345678901234', 'earned', 0.00, 32.50, 'Credit for order #ORD-2006', '2025-09-03 05:00:00', 'issued'),
('15009-1234-5678-9012-345678901234', '809d9ce0-885e-11f0-bba2-80ce629ed0db', '809d9ce0-885e-11f0-bba2-80ce629ed0db', '11007-1234-5678-9012-345678901234', 'earned', 7.50, 40.00, 'Credit for order #ORD-2007', '2025-09-03 05:00:00', 'issued'),
('15010-1234-5678-9012-345678901234', '809d9ce0-885e-11f0-bba2-80ce629ed0db', '809d9ce0-885e-11f0-bba2-80ce629ed0db', '11008-1234-5678-9012-345678901234', 'earned', 3.50, 43.50, 'Credit for order #ORD-2008', '2025-09-03 05:00:00', 'issued');













-- test

use truck_local;
INSERT INTO `users` (`
id`,`email
`, `first_name`, `last_name`, `phone`, `role`, `status`, `created_at`, `updated_at`, `password`) VALUES
('1001-1234-5678-9012-345678901234', 'user1@example.com', 'John', 'Doe', '(555) 111-1111', 'technician', 'active', '2025-09-03 05:00:00', '2025-09-03 05:00:00', '$2b$10$dummyhash1'),
('1002-1234-5678-9012-345678901234', 'user2@example.com', 'Alice', 'Smith', '(555) 222-2222', 'technician', 'active', '2025-09-03 05:00:00', '2025-09-03 05:00:00', '$2b$10$dummyhash2'),
('1003-1234-5678-9012-345678901234', 'user3@example.com', 'Bob', 'Johnson', '(555) 333-3333', 'technician', 'active', '2025-09-03 05:00:00', '2025-09-03 05:00:00', '$2b$10$dummyhash3'),
('1004-1234-5678-9012-345678901234', 'user4@example.com', 'Emma', 'Brown', '(555) 444-4444', 'technician', 'active', '2025-09-03 05:00:00', '2025-09-03 05:00:00', '$2b$10$dummyhash4'),
('1005-1234-5678-9012-345678901234', 'user5@example.com', 'Michael', 'Davis', '(555) 555-5555', 'technician', 'active', '2025-09-03 05:00:00', '2025-09-03 05:00:00', '$2b$10$dummyhash5'),
('1006-1234-5678-9012-345678901234', 'admin1@example.com', 'Sarah', 'Wilson', '(555) 666-6666', 'admin', 'active', '2025-09-03 05:00:00', '2025-09-03 05:00:00', '$2b$10$dummyhash6'),
('1007-1234-5678-9012-345678901234', 'admin2@example.com', 'David', 'Taylor', '(555) 777-7777', 'admin', 'active', '2025-09-03 05:00:00', '2025-09-03 05:00:00', '$2b$10$dummyhash7'),
('1008-1234-5678-9012-345678901234', 'user8@example.com', 'Laura', 'Martinez', '(555) 888-8888', 'technician', 'active', '2025-09-03 05:00:00', '2025-09-03 05:00:00', '$2b$10$dummyhash8'),
('1009-1234-5678-9012-345678901234', 'user9@example.com', 'James', 'Anderson', '(555) 999-9999', 'technician', 'active', '2025-09-03 05:00:00', '2025-09-03 05:00:00', '$2b$10$dummyhash9'),
('1010-1234-5678-9012-345678901234', 'admin3@example.com', 'Emily', 'Thomas', '(555) 000-0000', 'admin', 'active', '2025-09-03 05:00:00', '2025-09-03 05:00:00', '$2b$10$dummyhash10');


INSERT INTO `settings` (`
id`,`category
`, `key_name`, `value`, `updated_at`) VALUES
('2001-1234-5678-9012-345678901234', 'platform', 'max_login_attempts', '5', '2025-09-03 05:00:00'),
('2002-1234-5678-9012-345678901234', 'platform', 'session_timeout', '3600', '2025-09-03 05:00:00'),
('2003-1234-5678-9012-345678901234', 'commission', 'base_rate', '0.05', '2025-09-03 05:00:00'),
('2004-1234-5678-9012-345678901234', 'commission', 'urgent_order_rate', '0.10', '2025-09-03 05:00:00'),
('2005-1234-5678-9012-345678901234', 'security', 'password_min_length', '8', '2025-09-03 05:00:00'),
('2006-1234-5678-9012-345678901234', 'security', 'two_factor_enabled', 'true', '2025-09-03 05:00:00'),
('2007-1234-5678-9012-345678901234', 'platform', 'default_timezone', 'UTC', '2025-09-03 05:00:00'),
('2008-1234-5678-9012-345678901234', 'commission', 'min_commission', '1.00', '2025-09-03 05:00:00'),
('2009-1234-5678-9012-345678901234', 'security', 'session_expiry_days', '30', '2025-09-03 05:00:00'),
('2010-1234-5678-9012-345678901234', 'platform', 'max_trucks_per_technician', '2', '2025-09-03 05:00:00');




-- Insert into `supply_houses` (10 records)
INSERT INTO `supply_houses` (`
id`,`name
`, `location`, `status`, `created_at`, `updated_at`) VALUES
('3001-1234-5678-9012-345678901234', 'Supply House A', '123 Main St, City A', 'active', '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('3002-1234-5678-9012-345678901234', 'Supply House B', '456 Oak St, City B', 'active', '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('3003-1234-5678-9012-345678901234', 'Supply House C', '789 Pine St, City C', 'inactive', '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('3004-1234-5678-9012-345678901234', 'Supply House D', '101 Maple St, City D', 'active', '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('3005-1234-5678-9012-345678901234', 'Supply House E', '202 Cedar St, City E', 'active', '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('3006-1234-5678-9012-345678901234', 'Supply House F', '303 Birch St, City F', 'active', '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('3007-1234-5678-9012-345678901234', 'Supply House G', '404 Elm St, City G', 'inactive', '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('3008-1234-5678-9012-345678901234', 'Supply House H', '505 Spruce St, City H', 'active', '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('3009-1234-5678-9012-345678901234', 'Supply House I', '606 Walnut St, City I', 'active', '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('3010-1234-5678-9012-345678901234', 'Supply House J', '707 Chestnut St, City J', 'active', '2025-09-03 05:00:00', '2025-09-03 05:00:00');



-- Insert into `truck_bins` (10 records, referencing provided truck_id)
INSERT INTO `truck_bins` (`
id`,`truck_id
`, `bin_code`, `name`, `description`, `max_capacity`, `created_at`, `updated_at`) VALUES
('4001-1234-5678-9012-345678901234', '2de3146f-885f-11f0-bba2-80ce629ed0db', 'BIN-A01', 'Bin A01', '{"location":"Top Shelf","section":"Main","binType":"Storage","description":"Main storage bin"}', 50, '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('4002-1234-5678-9012-345678901234', '2de3146f-885f-11f0-bba2-80ce629ed0db', 'BIN-A02', 'Bin A02', '{"location":"Bottom Shelf","section":"Tools","binType":"Tool Bin","description":"Tool storage"}', 30, '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('4003-1234-5678-9012-345678901234', '2de3146f-885f-11f0-bba2-80ce629ed0db', 'BIN-A03', 'Bin A03', '{"location":"Side Compartment","section":"Parts","binType":"Parts Bin","description":"Spare parts"}', 40, '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('4004-1234-5678-9012-345678901234', '2de3146f-885f-11f0-bba2-80ce629ed0db', 'BIN-A04', 'Bin A04', '{"location":"Under-bed","section":"Main","binType":"Storage","description":"Extra storage"}', 60, '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('4005-1234-5678-9012-345678901234', '2de3146f-885f-11f0-bba2-80ce629ed0db', 'BIN-A05', 'Bin A05', '{"location":"Top Shelf","section":"Supplies","binType":"Supply Bin","description":"General supplies"}', 45, '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('4006-1234-5678-9012-345678901234', '2de3146f-885f-11f0-bba2-80ce629ed0db', 'BIN-A06', 'Bin A06', '{"location":"Bottom Shelf","section":"Tools","binType":"Tool Bin","description":"Specialized tools"}', 25, '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('4007-1234-5678-9012-345678901234', '2de3146f-885f-11f0-bba2-80ce629ed0db', 'BIN-A07', 'Bin A07', '{"location":"Side Compartment","section":"Parts","binType":"Parts Bin","description":"Electrical parts"}', 35, '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('4008-1234-5678-9012-345678901234', '2de3146f-885f-11f0-bba2-80ce629ed0db', 'BIN-A08', 'Bin A08', '{"location":"Under-bed","section":"Main","binType":"Storage","description":"Backup storage"}', 55, '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('4009-1234-5678-9012-345678901234', '2de3146f-885f-11f0-bba2-80ce629ed0db', 'BIN-A09', 'Bin A09', '{"location":"Top Shelf","section":"Supplies","binType":"Supply Bin","description":"Cleaning supplies"}', 40, '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('4010-1234-5678-9012-345678901234', '2de3146f-885f-11f0-bba2-80ce629ed0db', 'BIN-A10', 'Bin A10', '{"location":"Side Compartment","section":"Parts","binType":"Parts Bin","description":"Mechanical parts"}', 50, '2025-09-03 05:00:00', '2025-09-03 05:00:00');



-- Insert into `inventory_categories` (10 records)
INSERT INTO `inventory_categories` (`
id`,`name
`, `description`, `created_at`) VALUES
('5001-1234-5678-9012-345678901234', 'Tools', 'Hand and power tools', '2025-09-03 05:00:00'),
('5002-1234-5678-9012-345678901234', 'Electrical Parts', 'Wires, connectors, and fuses', '2025-09-03 05:00:00'),
('5003-1234-5678-9012-345678901234', 'Mechanical Parts', 'Bolts, nuts, and bearings', '2025-09-03 05:00:00'),
('5004-1234-5678-9012-345678901234', 'Cleaning Supplies', 'Cleaning agents and materials', '2025-09-03 05:00:00'),
('5005-1234-5678-9012-345678901234', 'Filters', 'Oil and air filters', '2025-09-03 05:00:00'),
('5006-1234-5678-9012-345678901234', 'Lubricants', 'Oils and greases', '2025-09-03 05:00:00'),
('5007-1234-5678-9012-345678901234', 'Safety Gear', 'Gloves, helmets, and vests', '2025-09-03 05:00:00'),
('5008-1234-5678-9012-345678901234', 'Brake Components', 'Brake pads and rotors', '2025-09-03 05:00:00'),
('5009-1234-5678-9012-345678901234', 'Engine Parts', 'Spark plugs and belts', '2025-09-03 05:00:00'),
('5010-1234-5678-9012-345678901234', 'Miscellaneous', 'General supplies', '2025-09-03 05:00:00');

-- Insert into `inventory_items` (10 records, referencing inventory_categories)
INSERT INTO `inventory_items` (`
id`,`part_number`,`name`,`description`,`category_id`,`unit_price
`, `cost_price`, `supplier`, `unit`, `min_quantity`, `max_quantity`, `standard_level`, `created_at`, `updated_at`) VALUES
('1001-1234-5678-9012-345678901234', 'PN-1001', 'Screwdriver Set', 'Set of 10 screwdrivers', '5001-1234-5678-9012-345678901234', 25.00, 15.00, 'ToolCo', 'pieces', 5, 20, 10, '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('1002-1234-5678-9012-345678901234', 'PN-1002', 'Wire Connectors', 'Pack of 100 connectors', '5002-1234-5678-9012-345678901234', 10.00, 6.00, 'ElectroSupply', 'pieces', 10, 50, 20, '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('1003-1234-5678-9012-345678901234', 'PN-1003', 'Steel Bolts', 'Pack of 50 bolts', '5003-1234-5678-9012-345678901234', 15.00, 8.00, 'MetalWorks', 'pieces', 10, 40, 15, '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('1004-1234-5678-9012-345678901234', 'PN-1004', 'Cleaning Spray', '500ml spray bottle', '5004-1234-5678-9012-345678901234', 8.00, 4.00, 'CleanCo', 'pieces', 5, 30, 10, '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('1005-1234-5678-9012-345678901234', 'PN-1005', 'Oil Filter', 'Standard oil filter', '5005-1234-5678-9012-345678901234', 12.00, 7.00, 'AutoParts', 'pieces', 5, 25, 10, '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('1006-1234-5678-9012-345678901234', 'PN-1006', 'Lubricating Oil', '1L oil can', '5006-1234-5678-9012-345678901234', 20.00, 12.00, 'LubeCo', 'pieces', 5, 20, 8, '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('1007-1234-5678-9012-345678901234', 'PN-1007', 'Safety Gloves', 'Pair of work gloves', '5007-1234-5678-9012-345678901234', 15.00, 9.00, 'SafetyGear', 'pieces', 5, 30, 10, '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('1008-1234-5678-9012-345678901234', 'PN-1008', 'Brake Pads', 'Set of brake pads', '5008-1234-5678-9012-345678901234', 50.00, 30.00, 'AutoParts', 'pieces', 5, 20, 8, '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('1009-1234-5678-9012-345678901234', 'PN-1009', 'Spark Plug', 'Standard spark plug', '5009-1234-5678-9012-345678901234', 10.00, 5.00, 'AutoParts', 'pieces', 5, 25, 10, '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('1010-1234-5678-9012-345678901234', 'PN-1010', 'Tape Measure', '5m tape measure', '5001-1234-5678-9012-345678901234', 8.00, 4.00, 'ToolCo', 'pieces', 5, 15, 5, '2025-09-03 05:00:00', '2025-09-03 05:00:00');


-- Insert into `restock_orders` (10 records, referencing truck_id, technician_id, and supply_house_id)
INSERT INTO `restock_orders` (`
id`,`truck_id
`, `supply_house_id`, `technician_id`, `status`, `created_at`, `updated_at`) VALUES
('9001-1234-5678-9012-345678901234', '2de3146f-885f-11f0-bba2-80ce629ed0db', '3001-1234-5678-9012-345678901234', '809d9ce0-885e-11f0-bba2-80ce629ed0db', 'pending', '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('9002-1234-5678-9012-345678901234', '2de3146f-885f-11f0-bba2-80ce629ed0db', '3002-1234-5678-9012-345678901234', '809d9ce0-885e-11f0-bba2-80ce629ed0db', 'submitted', '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('9003-1234-5678-9012-345678901234', '2de3146f-885f-11f0-bba2-80ce629ed0db', '3003-1234-5678-9012-345678901234', '809d9ce0-885e-11f0-bba2-80ce629ed0db', 'completed', '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('9004-1234-5678-9012-345678901234', '2de3146f-885f-11f0-bba2-80ce629ed0db', '3004-1234-5678-9012-345678901234', '809d9ce0-885e-11f0-bba2-80ce629ed0db', 'pending', '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('9005-1234-5678-9012-345678901234', '2de3146f-885f-11f0-bba2-80ce629ed0db', '3005-1234-5678-9012-345678901234', '809d9ce0-885e-11f0-bba2-80ce629ed0db', 'submitted', '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('9006-1234-5678-9012-345678901234', '2de3146f-885f-11f0-bba2-80ce629ed0db', '3006-1234-5678-9012-345678901234', '809d9ce0-885e-11f0-bba2-80ce629ed0db', 'completed', '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('9007-1234-5678-9012-345678901234', '2de3146f-885f-11f0-bba2-80ce629ed0db', '3007-1234-5678-9012-345678901234', '809d9ce0-885e-11f0-bba2-80ce629ed0db', 'cancelled', '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('9008-1234-5678-9012-345678901234', '2de3146f-885f-11f0-bba2-80ce629ed0db', '3008-1234-5678-9012-345678901234', '809d9ce0-885e-11f0-bba2-80ce629ed0db', 'pending', '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('9009-1234-5678-9012-345678901234', '2de3146f-885f-11f0-bba2-80ce629ed0db', '3009-1234-5678-9012-345678901234', '809d9ce0-885e-11f0-bba2-80ce629ed0db', 'submitted', '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('9010-1234-5678-9012-345678901234', '2de3146f-885f-11f0-bba2-80ce629ed0db', '3010-1234-5678-9012-345678901234', '809d9ce0-885e-11f0-bba2-80ce629ed0db', 'completed', '2025-09-03 05:00:00', '2025-09-03 05:00:00');


INSERT INTO `truck_inventory` (`id`,`truck_id`, `bin_id`, `item_id`, `quantity`, `min_quantity`, `max_quantity`, `last_restocked`, `created_at`, `updated_at`) VALUES
('7001-1234-5678-9012-345678901234', '2de3146f-885f-11f0-bba2-80ce629ed0db', '4001-1234-5678-9012-345678901234', '1001-1234-5678-9012-345678901234', 15, 5, 20, '2025-09-02 05:00:00', '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('7002-1234-5678-9012-345678901234', '2de3146f-885f-11f0-bba2-80ce629ed0db', '4002-1234-5678-9012-345678901234', '1002-1234-5678-9012-345678901234', 40, 10, 50, '2025-09-02 05:00:00', '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('7003-1234-5678-9012-345678901234', '2de3146f-885f-11f0-bba2-80ce629ed0db', '4003-1234-5678-9012-345678901234', '1003-1234-5678-9012-345678901234', 30, 10, 40, '2025-09-02 05:00:00', '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('7004-1234-5678-9012-345678901234', '2de3146f-885f-11f0-bba2-80ce629ed0db', '4004-1234-5678-9012-345678901234', '1004-1234-5678-9012-345678901234', 20, 5, 30, '2025-09-02 05:00:00', '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('7005-1234-5678-9012-345678901234', '2de3146f-885f-11f0-bba2-80ce629ed0db', '4005-1234-5678-9012-345678901234', '1005-1234-5678-9012-345678901234', 15, 5, 25, '2025-09-02 05:00:00', '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('7006-1234-5678-9012-345678901234', '2de3146f-885f-11f0-bba2-80ce629ed0db', '4006-1234-5678-9012-345678901234', '1006-1234-5678-9012-345678901234', 10, 5, 20, '2025-09-02 05:00:00', '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('7007-1234-5678-9012-345678901234', '2de3146f-885f-11f0-bba2-80ce629ed0db', '4007-1234-5678-9012-345678901234', '1007-1234-5678-9012-345678901234', 25, 5, 30, '2025-09-02 05:00:00', '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('7008-1234-5678-9012-345678901234', '2de3146f-885f-11f0-bba2-80ce629ed0db', '4008-1234-5678-9012-345678901234', '1008-1234-5678-9012-345678901234', 12, 5, 20, '2025-09-02 05:00:00', '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('7009-1234-5678-9012-345678901234', '2de3146f-885f-11f0-bba2-80ce629ed0db', '4009-1234-5678-9012-345678901234', '1009-1234-5678-9012-345678901234', 15, 5, 25, '2025-09-02 05:00:00', '2025-09-03 05:00:00', '2025-09-03 05:00:00'),
('7010-1234-5678-9012-345678901234', '2de3146f-885f-11f0-bba2-80ce629ed0db', '4010-1234-5678-9012-345678901234', '1010-1234-5678-9012-345678901234', 10, 5, 15, '2025-09-02 05:00:00', '2025-09-03 05:00:00', '2025-09-03 05:00:00');

use truck_local;

-- Insert into `orders` (10 records, referencing technician_id, truck_id, supply_house_id, and admin as confirmed_by)
INSERT INTO `orders` (`id`, `order_number`, `type`, `technician_id`, `truck_id`, `supply_house_id`, `status`, `priority`, `total_amount`, `tax_amount`, `commission_amount`, `notes`, `requested_delivery_date`, `confirmed_by`, `confirmed_at`, `created_at`, `updated_at`, `urgency`, `commission`, `credit`, `user_id`) VALUES
('11001-1234-5678-9012-345678901234', '#ORD-2001', 'restock', '809d9ce0-885e-11f0-bba2-80ce629ed0db', '2de3146f-885f-11f0-bba2-80ce629ed0db', '3001-1234-5678-9012-345678901234', 'pending', 'medium', 100.00, 5.00, 2.50, 'Restock tools', '2025-09-05', '68cee79f-885e-11f0-bba2-80ce629ed0db', '2025-09-03 05:00:00', '2025-09-03 05:00:00', '2025-09-03 05:00:00', 'normal', 2.50, 0.00, '809d9ce0-885e-11f0-bba2-80ce629ed0db'),
('11002-1234-5678-9012-345678901234', '#ORD-2002', 'restock', '809d9ce0-885e-11f0-bba2-80ce629ed0db', '2de3146f-885f-11f0-bba2-80ce629ed0db', '3002-1234-5678-9012-345678901234', 'confirmed', 'high', 150.00, 7.50, 3.75, 'Urgent restock', '2025-09-04', '68cee79f-885e-11f0-bba2-80ce629ed0db', '2025-09-03 05:00:00', '2025-09-03 05:00:00', '2025-09-03 05:00:00', 'high', 3.75, 0.00, '809d9ce0-885e-11f0-bba2-80ce629ed0db'),
('11003-1234-5678-9012-345678901234', '#ORD-2003', 'manual', '809d9ce0-885e-11f0-bba2-80ce629ed0db', '2de3146f-885f-11f0-bba2-80ce629ed0db', '3003-1234-5678-9012-345678901234', 'processing', 'medium', 200.00, 10.00, 5.00, 'Manual order', '2025-09-06', '68cee79f-885e-11f0-bba2-80ce629ed0db', '2025-09-03 05:00:00', '2025-09-03 05:00:00', '2025-09-03 05:00:00', 'normal', 5.00, 0.00, '809d9ce0-885e-11f0-bba2-80ce629ed0db'),
('11004-1234-5678-9012-345678901234', '#ORD-2004', 'restock', '809d9ce0-885e-11f0-bba2-80ce629ed0db', '2de3146f-885f-11f0-bba2-80ce629ed0db', '3004-1234-5678-9012-345678901234', 'shipped', 'low', 80.00, 4.00, 2.00, 'Low priority restock', '2025-09-07', '68cee79f-885e-11f0-bba2-80ce629ed0db', '2025-09-03 05:00:00', '2025-09-03 05:00:00', '2025-09-03 05:00:00', 'low', 2.00, 0.00, '809d9ce0-885e-11f0-bba2-80ce629ed0db'),
('11005-1234-5678-9012-345678901234', '#ORD-2005', 'restock', '809d9ce0-885e-11f0-bba2-80ce629ed0db', '2de3146f-885f-11f0-bba2-80ce629ed0db', '3005-1234-5678-9012-345678901234', 'delivered', 'medium', 120.00, 6.00, 3.00, 'Delivered restock', '2025-09-03', '68cee79f-885e-11f0-bba2-80ce629ed0db', '2025-09-03 05:00:00', '2025-09-03 05:00:00', '2025-09-03 05:00:00', 'normal', 3.00, 0.00, '809d9ce0-885e-11f0-bba2-80ce629ed0db'),
('11006-1234-5678-9012-345678901234', '#ORD-2006', 'restock', '809d9ce0-885e-11f0-bba2-80ce629ed0db', '2de3146f-885f-11f0-bba2-80ce629ed0db', '3006-1234-5678-9012-345678901234', 'cancelled', 'medium', 0.00, 0.00, 0.00, 'Cancelled order', '2025-09-05', '68cee79f-885e-11f0-bba2-80ce629ed0db', '2025-09-03 05:00:00', '2025-09-03 05:00:00', '2025-09-03 05:00:00', 'normal', 0.00, 0.00, '809d9ce0-885e-11f0-bba2-80ce629ed0db'),
('11007-1234-5678-9012-345678901234', '#ORD-2007', 'manual', '809d9ce0-885e-11f0-bba2-80ce629ed0db', '2de3146f-885f-11f0-bba2-80ce629ed0db', '3007-1234-5678-9012-345678901234', 'pending', 'urgent', 300.00, 15.00, 7.50, 'Urgent manual order', '2025-09-04', '68cee79f-885e-11f0-bba2-80ce629ed0db', '2025-09-03 05:00:00', '2025-09-03 05:00:00', '2025-09-03 05:00:00', 'urgent', 7.50, 0.00, '809d9ce0-885e-11f0-bba2-80ce629ed0db'),
('11008-1234-5678-9012-345678901234', '#ORD-2008', 'restock', '809d9ce0-885e-11f0-bba2-80ce629ed0db', '2de3146f-885f-11f0-bba2-80ce629ed0db', '3008-1234-5678-9012-345678901234', 'processing', 'medium', 140.00, 7.00, 3.50, 'Restock parts', '2025-09-06', '68cee79f-885e-11f0-bba2-80ce629ed0db', '2025-09-03 05:00:00', '2025-09-03 05:00:00', '2025-09-03 05:00:00', 'normal', 3.50, 0.00, '809d9ce0-885e-11f0-bba2-80ce629ed0db'),
('11009-1234-5678-9012-345678901234', '#ORD-2009', 'restock', '809d9ce0-885e-11f0-bba2-80ce629ed0db', '2de3146f-885f-11f0-bba2-80ce629ed0db', '3009-1234-5678-9012-345678901234', 'shipped', 'medium', 160.00, 8.00, 4.00, 'Restock supplies', '2025-09-05', '68cee79f-885e-11f0-bba2-80ce629ed0db', '2025-09-03 05:00:00', '2025-09-03 05:00:00', '2025-09-03 05:00:00', 'normal', 4.00, 0.00, '809d9ce0-885e-11f0-bba2-80ce629ed0db'),
('11010-1234-5678-9012-345678901234', '#ORD-2010', 'restock', '809d9ce0-885e-11f0-bba2-80ce629ed0db', '2de3146f-885f-11f0-bba2-80ce629ed0db', '3010-1234-5678-9012-345678901234', 'delivered', 'medium', 180.00, 9.00, 4.50, 'Delivered restock', '2025-09-03', '68cee79f-885e-11f0-bba2-80ce629ed0db', '2025-09-03 05:00:00', '2025-09-03 05:00:00', '2025-09-03 05:00:00', 'normal', 4.50, 0.00, '809d9ce0-885e-11f0-bba2-80ce629ed0db');

-- Insert into `order_items` (10 records, referencing orders, inventory_items, and truck_bins)
INSERT INTO `order_items` (`id`, `order_id`, `item_id`, `bin_id`, `quantity`, `unit_price`, `total_price`, `reason`, `notes`, `created_at`, `part_number`, `bin_code`, `category`, `description`) VALUES
('12001-1234-5678-9012-345678901234', '11001-1234-5678-9012-345678901234', '1001-1234-5678-9012-345678901234', '4001-1234-5678-9012-345678901234', 10, 25.00, 250.00, 'Restock', 'Screwdriver set for truck', '2025-09-03 05:00:00', 'PN-1001', 'BIN-A01', 'Tools', 'Set of 10 screwdrivers'),
('12002-1234-5678-9012-345678901234', '11002-1234-5678-9012-345678901234', '1002-1234-5678-9012-345678901234', '4002-1234-5678-9012-345678901234', 20, 10.00, 200.00, 'Restock', 'Wire connectors for electrical work', '2025-09-03 05:00:00', 'PN-1002', 'BIN-A02', 'Electrical Parts', 'Pack of 100 connectors'),
('12003-1234-5678-9012-345678901234', '11003-1234-5678-9012-345678901234', '1003-1234-5678-9012-345678901234', '4003-1234-5678-9012-345678901234', 15, 15.00, 225.00, 'Restock', 'Steel bolts for repairs', '2025-09-03 05:00:00', 'PN-1003', 'BIN-A03', 'Mechanical Parts', 'Pack of 50 bolts'),
('12004-1234-5678-9012-345678901234', '11004-1234-5678-9012-345678901234', '1004-1234-5678-9012-345678901234', '4004-1234-5678-9012-345678901234', 10, 8.00, 80.00, 'Restock', 'Cleaning spray for maintenance', '2025-09-03 05:00:00', 'PN-1004', 'BIN-A04', 'Cleaning Supplies', '500ml spray bottle'),
('12005-1234-5678-9012-345678901234', '11005-1234-5678-9012-345678901234', '1005-1234-5678-9012-345678901234', '4005-1234-5678-9012-345678901234', 10, 12.00, 120.00, 'Restock', 'Oil filter for truck maintenance', '2025-09-03 05:00:00', 'PN-1005', 'BIN-A05', 'Filters', 'Standard oil filter'),
('12006-1234-5678-9012-345678901234', '11006-1234-5678-9012-345678901234', '1006-1234-5678-9012-345678901234', '4006-1234-5678-9012-345678901234', 8, 20.00, 160.00, 'Restock', 'Lubricating oil for repairs', '2025-09-03 05:00:00', 'PN-1006', 'BIN-A06', 'Lubricants', '1L oil can'),
('12007-1234-5678-9012-345678901234', '11007-1234-5678-9012-345678901234', '1007-1234-5678-9012-345678901234', '4007-1234-5678-9012-345678901234', 10, 15.00, 150.00, 'Restock', 'Safety gloves for technician', '2025-09-03 05:00:00', 'PN-1007', 'BIN-A07', 'Safety Gear', 'Pair of work gloves'),
('12008-1234-5678-9012-345678901234', '11008-1234-5678-9012-345678901234', '1008-1234-5678-9012-345678901234', '4008-1234-5678-9012-345678901234', 8, 50.00, 400.00, 'Restock', 'Brake pads for truck', '2025-09-03 05:00:00', 'PN-1008', 'BIN-A08', 'Brake Components', 'Set of brake pads'),
('12009-1234-5678-9012-345678901234', '11009-1234-5678-9012-345678901234', '1009-1234-5678-9012-345678901234', '4009-1234-5678-9012-345678901234', 10, 10.00, 100.00, 'Restock', 'Spark plugs for engine', '2025-09-03 05:00:00', 'PN-1009', 'BIN-A09', 'Engine Parts', 'Standard spark plug'),
('12010-1234-5678-9012-345678901234', '11010-1234-5678-9012-345678901234', '1010-1234-5678-9012-345678901234', '4010-1234-5678-9012-345678901234', 5, 8.00, 40.00, 'Restock', 'Tape measure for measurements', '2025-09-03 05:00:00', 'PN-1010', 'BIN-A10', 'Tools', '5m tape measure');

-- Insert into `user_sessions` (10 records, referencing technician_id and admin_id)
INSERT INTO `user_sessions` (`id`, `user_id`, `action`, `details`, `ip_address`, `user_agent`, `created_at`) VALUES
('13001-1234-5678-9012-345678901234', '809d9ce0-885e-11f0-bba2-80ce629ed0db', 'login', '{"status":"success"}', '192.168.1.1', 'Mozilla/5.0', '2025-09-03 05:00:00'),
('13002-1234-5678-9012-345678901234', '809d9ce0-885e-11f0-bba2-80ce629ed0db', 'logout', '{"status":"success"}', '192.168.1.2', 'Mozilla/5.0', '2025-09-03 05:00:00'),
('13003-1234-5678-9012-345678901234', '68cee79f-885e-11f0-bba2-80ce629ed0db', 'login', '{"status":"success"}', '192.168.1.3', 'Mozilla/5.0', '2025-09-03 05:00:00'),
('13004-1234-5678-9012-345678901234', '68cee79f-885e-11f0-bba2-80ce629ed0db', 'update_profile', '{"status":"success"}', '192.168.1.4', 'Mozilla/5.0', '2025-09-03 05:00:00'),
('13005-1234-5678-9012-345678901234', '809d9ce0-885e-11f0-bba2-80ce629ed0db', 'create_order', '{"order_id":"11001-1234-5678-9012-345678901234"}', '192.168.1.5', 'Mozilla/5.0', '2025-09-03 05:00:00'),
('13006-1234-5678-9012-345678901234', '68cee79f-885e-11f0-bba2-80ce629ed0db', 'confirm_order', '{"order_id":"11001-1234-5678-9012-345678901234"}', '192.168.1.6', 'Mozilla/5.0', '2025-09-03 05:00:00'),
('13007-1234-5678-9012-345678901234', '809d9ce0-885e-11f0-bba2-80ce629ed0db', 'view_inventory', '{"truck_id":"2de3146f-885f-11f0-bba2-80ce629ed0db"}', '192.168.1.7', 'Mozilla/5.0', '2025-09-03 05:00:00'),
('13008-1234-5678-9012-345678901234', '68cee79f-885e-11f0-bba2-80ce629ed0db', 'update_settings', '{"setting":"max_login_attempts"}', '192.168.1.8', 'Mozilla/5.0', '2025-09-03 05:00:00'),
('13009-1234-5678-9012-345678901234', '809d9ce0-885e-11f0-bba2-80ce629ed0db', 'restock_request', '{"restock_order_id":"9001-1234-5678-9012-345678901234"}', '192.168.1.9', 'Mozilla/5.0', '2025-09-03 05:00:00'),
('13010-1234-5678-9012-345678901234', '68cee79f-885e-11f0-bba2-80ce629ed0db', 'logout', '{"status":"success"}', '192.168.1.10', 'Mozilla/5.0', '2025-09-03 05:00:00');

-- Insert into `activities` (10 records, referencing orders and technician_id)
INSERT INTO `activities` (`id`, `type`, `message`, `status`, `created_at`) VALUES
('14001-1234-5678-9012-345678901234', 'order', 'New order #ORD-2001 created by technician', 'new', '2025-09-03 05:00:00'),
('14002-1234-5678-9012-345678901234', 'order', 'Order #ORD-2002 confirmed by admin', 'success', '2025-09-03 05:00:00'),
('14003-1234-5678-9012-345678901234', 'technician', 'Technician updated truck inventory', 'success', '2025-09-03 05:00:00'),
('14004-1234-5678-9012-345678901234', 'supply_house', 'Supply House A restocked items', 'info', '2025-09-03 05:00:00'),
('14005-1234-5678-9012-345678901234', 'order', 'Order #ORD-2003 processing started', 'pending', '2025-09-03 05:00:00'),
('14006-1234-5678-9012-345678901234', 'redemption', 'Technician requested credit redemption', 'pending', '2025-09-03 05:00:00'),
('14007-1234-5678-9012-345678901234', 'order', 'Order #ORD-2004 shipped', 'success', '2025-09-03 05:00:00'),
('14008-1234-5678-9012-345678901234', 'technician', 'Technician logged in', 'success', '2025-09-03 05:00:00'),
('14009-1234-5678-9012-345678901234', 'supply_house', 'Supply House B updated inventory', 'info', '2025-09-03 05:00:00'),
('14010-1234-5678-9012-345678901234', 'order', 'Order #ORD-2005 delivered', 'success', '2025-09-03 05:00:00');

-- Insert into `credits` (10 records, referencing technician_id, admin_id, and orders)
INSERT INTO `credits` (`id`, `technician_id`, `user_id`, `order_id`, `type`, `amount`, `balance_after`, `description`, `created_at`, `status`) VALUES
('15001-1234-5678-9012-345678901234', '809d9ce0-885e-11f0-bba2-80ce629ed0db', '809d9ce0-885e-11f0-bba2-80ce629ed0db', '11001-1234-5678-9012-345678901234', 'earned', 5.00, 5.00, 'Credit for order #ORD-2001', '2025-09-03 05:00:00', 'issued'),
('15002-1234-5678-9012-345678901234', '809d9ce0-885e-11f0-bba2-80ce629ed0db', '809d9ce0-885e-11f0-bba2-80ce629ed0db', '11002-1234-5678-9012-345678901234', 'earned', 7.50, 12.50, 'Credit for order #ORD-2002', '2025-09-03 05:00:00', 'issued'),
('15003-1234-5678-9012-345678901234', '809d9ce0-885e-11f0-bba2-80ce629ed0db', '809d9ce0-885e-11f0-bba2-80ce629ed0db', NULL, 'bonus', 10.00, 22.50, 'Monthly performance bonus', '2025-09-03 05:00:00', 'issued'),
('15004-1234-5678-9012-345678901234', '809d9ce0-885e-11f0-bba2-80ce629ed0db', '809d9ce0-885e-11f0-bba2-80ce629ed0db', NULL, 'spent', 5.00, 17.50, 'Cash withdrawal request', '2025-09-03 05:00:00', 'pending_redemption'),
('15005-1234-5678-9012-345678901234', '809d9ce0-885e-11f0-bba2-80ce629ed0db', '809d9ce0-885e-11f0-bba2-80ce629ed0db', '11003-1234-5678-9012-345678901234', 'earned', 10.00, 27.50, 'Credit for order #ORD-2003', '2025-09-03 05:00:00', 'issued'),
('15006-1234-5678-9012-345678901234', '809d9ce0-885e-11f0-bba2-80ce629ed0db', '809d9ce0-885e-11f0-bba2-80ce629ed0db', '11004-1234-5678-9012-345678901234', 'earned', 2.00, 29.50, 'Credit for order #ORD-2004', '2025-09-03 05:00:00', 'issued'),
('15007-1234-5678-9012-345678901234', '809d9ce0-885e-11f0-bba2-80ce629ed0db', '809d9ce0-885e-11f0-bba2-80ce629ed0db', '11005-1234-5678-9012-345678901234', 'earned', 3.00, 32.50, 'Credit for order #ORD-2005', '2025-09-03 05:00:00', 'issued'),
('15008-1234-5678-9012-345678901234', '809d9ce0-885e-11f0-bba2-80ce629ed0db', '809d9ce0-885e-11f0-bba2-80ce629ed0db', '11006-1234-5678-9012-345678901234', 'earned', 0.00, 32.50, 'Credit for order #ORD-2006', '2025-09-03 05:00:00', 'issued'),
('15009-1234-5678-9012-345678901234', '809d9ce0-885e-11f0-bba2-80ce629ed0db', '809d9ce0-885e-11f0-bba2-80ce629ed0db', '11007-1234-5678-9012-345678901234', 'earned', 7.50, 40.00, 'Credit for order #ORD-2007', '2025-09-03 05:00:00', 'issued'),
('15010-1234-5678-9012-345678901234', '809d9ce0-885e-11f0-bba2-80ce629ed0db', '809d9ce0-885e-11f0-bba2-80ce629ed0db', '11008-1234-5678-9012-345678901234', 'earned', 3.50, 43.50, 'Credit for order #ORD-2008', '2025-09-03 05:00:00', 'issued');