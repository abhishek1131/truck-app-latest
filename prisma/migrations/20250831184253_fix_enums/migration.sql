-- CreateTable
CREATE TABLE `users` (
    `id` CHAR(36) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `first_name` VARCHAR(100) NULL,
    `last_name` VARCHAR(100) NULL,
    `phone` VARCHAR(20) NULL,
    `role` ENUM('admin', 'technician') NOT NULL DEFAULT 'technician',
    `status` ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `password` VARCHAR(255) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `trucks` (
    `id` CHAR(36) NOT NULL,
    `truck_number` VARCHAR(50) NOT NULL,
    `name` VARCHAR(100) NULL,
    `make` VARCHAR(100) NOT NULL,
    `model` VARCHAR(100) NOT NULL,
    `year` INTEGER NOT NULL,
    `license_plate` VARCHAR(50) NULL,
    `vin` VARCHAR(50) NULL,
    `status` ENUM('active', 'maintenance', 'inactive') NOT NULL DEFAULT 'active',
    `location` VARCHAR(255) NULL,
    `mileage` INTEGER NOT NULL DEFAULT 0,
    `assigned_to` CHAR(36) NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `next_maintenance` DATE NULL,

    UNIQUE INDEX `trucks_truck_number_key`(`truck_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `truck_bins` (
    `id` CHAR(36) NOT NULL,
    `truck_id` CHAR(36) NOT NULL,
    `bin_code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(100) NULL,
    `description` TEXT NULL,
    `max_capacity` INTEGER NOT NULL DEFAULT 100,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `truck_bins_truck_id_bin_code_key`(`truck_id`, `bin_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inventory_categories` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `inventory_categories_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inventory_items` (
    `id` CHAR(36) NOT NULL,
    `part_number` VARCHAR(50) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `category_id` CHAR(36) NULL,
    `unit_price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `cost_price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `supplier` VARCHAR(100) NULL,
    `unit` VARCHAR(50) NOT NULL DEFAULT 'pieces',
    `min_quantity` INTEGER NOT NULL DEFAULT 0,
    `max_quantity` INTEGER NOT NULL DEFAULT 0,
    `standard_level` INTEGER NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `inventory_items_part_number_key`(`part_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `truck_inventory` (
    `id` CHAR(36) NOT NULL,
    `truck_id` CHAR(36) NOT NULL,
    `bin_id` CHAR(36) NOT NULL,
    `item_id` CHAR(36) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 0,
    `min_quantity` INTEGER NOT NULL DEFAULT 5,
    `max_quantity` INTEGER NOT NULL DEFAULT 50,
    `last_restocked` DATETIME NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `truck_inventory_truck_id_item_id_idx`(`truck_id`, `item_id`),
    INDEX `truck_inventory_quantity_min_quantity_idx`(`quantity`, `min_quantity`),
    INDEX `truck_inventory_item_id_idx`(`item_id`),
    UNIQUE INDEX `truck_inventory_truck_id_bin_id_item_id_key`(`truck_id`, `bin_id`, `item_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `supply_houses` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `location` VARCHAR(255) NOT NULL,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orders` (
    `id` CHAR(36) NOT NULL,
    `order_number` VARCHAR(50) NOT NULL,
    `type` ENUM('restock', 'manual') NOT NULL DEFAULT 'restock',
    `technician_id` CHAR(36) NOT NULL,
    `truck_id` CHAR(36) NOT NULL,
    `supply_house_id` VARCHAR(36) NULL,
    `status` ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled') NOT NULL DEFAULT 'pending',
    `priority` ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium',
    `total_amount` DECIMAL(10, 2) NULL,
    `tax_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `commission_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `notes` TEXT NULL,
    `requested_delivery_date` DATE NULL,
    `confirmed_by` CHAR(36) NULL,
    `confirmed_at` DATETIME NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `urgency` ENUM('low', 'normal', 'high', 'urgent') NOT NULL DEFAULT 'normal',
    `commission` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `credit` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `user_id` CHAR(36) NULL,

    UNIQUE INDEX `orders_order_number_key`(`order_number`),
    INDEX `orders_confirmed_by_idx`(`confirmed_by`),
    INDEX `orders_truck_id_idx`(`truck_id`),
    INDEX `orders_technician_id_idx`(`technician_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_items` (
    `id` CHAR(36) NOT NULL,
    `order_id` CHAR(36) NOT NULL,
    `item_id` CHAR(36) NOT NULL,
    `bin_id` CHAR(36) NULL,
    `quantity` INTEGER NOT NULL,
    `unit_price` DECIMAL(10, 2) NOT NULL,
    `total_price` DECIMAL(10, 2) NOT NULL,
    `reason` TEXT NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `part_number` VARCHAR(50) NULL,
    `bin_code` VARCHAR(20) NULL,
    `category` VARCHAR(50) NULL,
    `description` TEXT NULL,

    INDEX `order_items_order_id_idx`(`order_id`),
    INDEX `order_items_bin_id_idx`(`bin_id`),
    INDEX `order_items_item_id_idx`(`item_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `credits` (
    `id` CHAR(36) NOT NULL,
    `technician_id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `order_id` CHAR(36) NULL,
    `type` ENUM('earned', 'spent', 'bonus', 'adjustment') NOT NULL DEFAULT 'earned',
    `amount` DECIMAL(10, 2) NOT NULL,
    `balance_after` DECIMAL(10, 2) NOT NULL,
    `description` TEXT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` ENUM('issued', 'pending_redemption', 'redeemed') NOT NULL DEFAULT 'issued',

    INDEX `credits_user_id_idx`(`user_id`),
    INDEX `credits_order_id_idx`(`order_id`),
    INDEX `credits_technician_id_idx`(`technician_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `activities` (
    `id` CHAR(36) NOT NULL,
    `type` ENUM('order', 'technician', 'redemption', 'supply_house') NOT NULL DEFAULT 'order',
    `message` VARCHAR(255) NOT NULL,
    `status` ENUM('new', 'success', 'pending', 'info') NOT NULL DEFAULT 'new',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_sessions` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `action` VARCHAR(100) NOT NULL,
    `details` JSON NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` TEXT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `user_sessions_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `settings` (
    `id` CHAR(36) NOT NULL,
    `category` ENUM('platform', 'commission', 'security') NOT NULL DEFAULT 'platform',
    `key_name` VARCHAR(50) NOT NULL,
    `value` TEXT NOT NULL,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `settings_category_key_name_key`(`category`, `key_name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `truck_standard_inventory` (
    `id` VARCHAR(255) NOT NULL,
    `truck_id` VARCHAR(255) NOT NULL,
    `bin_id` VARCHAR(255) NOT NULL,
    `item_name` VARCHAR(255) NOT NULL,
    `standard_quantity` INTEGER NOT NULL,
    `unit` VARCHAR(50) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `trucks` ADD CONSTRAINT `trucks_assigned_to_fkey` FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `truck_bins` ADD CONSTRAINT `truck_bins_truck_id_fkey` FOREIGN KEY (`truck_id`) REFERENCES `trucks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_items` ADD CONSTRAINT `inventory_items_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `inventory_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `truck_inventory` ADD CONSTRAINT `truck_inventory_truck_id_fkey` FOREIGN KEY (`truck_id`) REFERENCES `trucks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `truck_inventory` ADD CONSTRAINT `truck_inventory_bin_id_fkey` FOREIGN KEY (`bin_id`) REFERENCES `truck_bins`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `truck_inventory` ADD CONSTRAINT `truck_inventory_item_id_fkey` FOREIGN KEY (`item_id`) REFERENCES `inventory_items`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_technician_id_fkey` FOREIGN KEY (`technician_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_truck_id_fkey` FOREIGN KEY (`truck_id`) REFERENCES `trucks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_confirmed_by_fkey` FOREIGN KEY (`confirmed_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_supply_house_id_fkey` FOREIGN KEY (`supply_house_id`) REFERENCES `supply_houses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_item_id_fkey` FOREIGN KEY (`item_id`) REFERENCES `inventory_items`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_bin_id_fkey` FOREIGN KEY (`bin_id`) REFERENCES `truck_bins`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `credits` ADD CONSTRAINT `credits_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `credits` ADD CONSTRAINT `credits_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `credits` ADD CONSTRAINT `credits_technician_id_fkey` FOREIGN KEY (`technician_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_sessions` ADD CONSTRAINT `user_sessions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `truck_standard_inventory` ADD CONSTRAINT `truck_standard_inventory_truck_id_fkey` FOREIGN KEY (`truck_id`) REFERENCES `trucks`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `truck_standard_inventory` ADD CONSTRAINT `truck_standard_inventory_bin_id_fkey` FOREIGN KEY (`bin_id`) REFERENCES `truck_bins`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
