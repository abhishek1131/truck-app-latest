CREATE TABLE users (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  role ENUM('admin', 'technician') NOT NULL DEFAULT 'technician',
  status ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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
  location VARCHAR(255),
  mileage INT DEFAULT 0,
  assigned_to CHAR(36),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
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