CREATE TABLE `audit_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` integer,
	`details` text,
	`created_at` integer DEFAULT (strftime('%s','now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `bins` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`shelf_id` integer NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	FOREIGN KEY (`shelf_id`) REFERENCES `shelves`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
	`company_name` text NOT NULL,
	`business_type` text,
	`phone` text,
	`whatsapp` text,
	`address` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer DEFAULT (strftime('%s','now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `inventory_movements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`type` text NOT NULL,
	`quantity` integer NOT NULL,
	`previous_balance` integer NOT NULL,
	`new_balance` integer NOT NULL,
	`user_id` integer,
	`reason` text,
	`reference_type` text,
	`reference_id` integer,
	`created_at` integer DEFAULT (strftime('%s','now')) NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `invoice_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`invoice_id` integer NOT NULL,
	`description` text NOT NULL,
	`type` text NOT NULL,
	`quantity` real DEFAULT 1 NOT NULL,
	`amount` real NOT NULL,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`invoice_number` text NOT NULL,
	`customer_id` integer NOT NULL,
	`period_start` integer NOT NULL,
	`period_end` integer NOT NULL,
	`subtotal` real DEFAULT 0 NOT NULL,
	`tax_rate` real DEFAULT 14 NOT NULL,
	`tax_amount` real DEFAULT 0 NOT NULL,
	`total` real DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`due_date` integer,
	`created_at` integer DEFAULT (strftime('%s','now')) NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invoices_invoice_number_unique` ON `invoices` (`invoice_number`);--> statement-breakpoint
CREATE TABLE `leads` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`phone` text,
	`whatsapp` text,
	`business_type` text,
	`required_space_m2` real,
	`number_of_products` integer,
	`required_services` text,
	`status` text DEFAULT 'new' NOT NULL,
	`notes` text,
	`follow_up_date` integer,
	`assigned_to` integer,
	`created_at` integer DEFAULT (strftime('%s','now')) NOT NULL,
	FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`is_read` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (strftime('%s','now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`quantity` integer NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_number` text NOT NULL,
	`customer_id` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`shipping_address` text,
	`payment_status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer DEFAULT (strftime('%s','now')) NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_order_number_unique` ON `orders` (`order_number`);--> statement-breakpoint
CREATE TABLE `packing_tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`packaging_type` text,
	`weight_kg` real,
	`dimensions` text,
	`packaging_cost` real DEFAULT 0,
	`status` text DEFAULT 'pending' NOT NULL,
	`notes` text,
	`packed_by` integer,
	`created_at` integer DEFAULT (strftime('%s','now')) NOT NULL,
	`completed_at` integer,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`packed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`invoice_id` integer NOT NULL,
	`amount` real NOT NULL,
	`method` text NOT NULL,
	`status` text DEFAULT 'completed' NOT NULL,
	`paid_at` integer DEFAULT (strftime('%s','now')),
	`notes` text,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `picking_tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`order_item_id` integer NOT NULL,
	`assigned_to` integer,
	`status` text DEFAULT 'pending' NOT NULL,
	`picked_qty` integer DEFAULT 0 NOT NULL,
	`notes` text,
	`created_at` integer DEFAULT (strftime('%s','now')) NOT NULL,
	`completed_at` integer,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`order_item_id`) REFERENCES `order_items`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `pricing_plans` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`price_per_m2` real NOT NULL,
	`min_monthly_fee` real DEFAULT 0 NOT NULL,
	`price_per_carton` real DEFAULT 0,
	`price_per_pallet` real DEFAULT 0,
	`receiving_fee` real DEFAULT 0,
	`picking_fee` real DEFAULT 0,
	`packing_fee` real DEFAULT 0,
	`return_fee` real DEFAULT 0,
	`shipping_handling_fee` real DEFAULT 0,
	`is_default` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`customer_id` integer NOT NULL,
	`sku` text NOT NULL,
	`barcode` text,
	`name` text NOT NULL,
	`category` text,
	`description` text,
	`quantity` integer DEFAULT 0 NOT NULL,
	`min_stock` integer DEFAULT 0 NOT NULL,
	`unit_weight_kg` real,
	`unit_dimensions` text,
	`image_url` text,
	`bin_id` integer,
	`created_at` integer DEFAULT (strftime('%s','now')) NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`bin_id`) REFERENCES `bins`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `racks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`zone_id` integer NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	FOREIGN KEY (`zone_id`) REFERENCES `zones`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `receiving_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`receiving_order_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`expected_qty` integer DEFAULT 0 NOT NULL,
	`received_qty` integer DEFAULT 0 NOT NULL,
	`condition` text DEFAULT 'good' NOT NULL,
	`notes` text,
	FOREIGN KEY (`receiving_order_id`) REFERENCES `receiving_orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `receiving_orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`customer_id` integer NOT NULL,
	`warehouse_id` integer NOT NULL,
	`supplier` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`notes` text,
	`created_by` integer,
	`created_at` integer DEFAULT (strftime('%s','now')) NOT NULL,
	`confirmed_at` integer,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `return_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`return_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`quantity` integer NOT NULL,
	FOREIGN KEY (`return_id`) REFERENCES `returns`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `returns` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`return_number` text NOT NULL,
	`order_id` integer,
	`customer_id` integer NOT NULL,
	`reason` text,
	`condition` text DEFAULT 'good' NOT NULL,
	`decision` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer DEFAULT (strftime('%s','now')) NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `returns_return_number_unique` ON `returns` (`return_number`);--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `shelves` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`rack_id` integer NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	FOREIGN KEY (`rack_id`) REFERENCES `racks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `shipments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`courier` text,
	`tracking_number` text,
	`shipping_cost` real DEFAULT 0,
	`status` text DEFAULT 'pending' NOT NULL,
	`shipped_at` integer,
	`delivered_at` integer,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `storage_allocations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`customer_id` integer NOT NULL,
	`warehouse_id` integer NOT NULL,
	`allocated_m2` real NOT NULL,
	`used_m2` real DEFAULT 0 NOT NULL,
	`monthly_fee` real NOT NULL,
	`start_date` integer DEFAULT (strftime('%s','now')) NOT NULL,
	`end_date` integer,
	`status` text DEFAULT 'active' NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`name` text NOT NULL,
	`phone` text,
	`role` text NOT NULL,
	`customer_id` integer,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (strftime('%s','now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `warehouses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	`address` text,
	`total_capacity_m2` real NOT NULL,
	`created_at` integer DEFAULT (strftime('%s','now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `warehouses_code_unique` ON `warehouses` (`code`);--> statement-breakpoint
CREATE TABLE `zones` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`warehouse_id` integer NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON UPDATE no action ON DELETE no action
);
