PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE IF NOT EXISTS "d1_migrations"(
		id         INTEGER PRIMARY KEY AUTOINCREMENT,
		name       TEXT UNIQUE,
		applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(1,'0000_flippant_cobalt_man.sql','2026-08-23 09:36:26');
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
CREATE TABLE `bins` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`shelf_id` integer NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	FOREIGN KEY (`shelf_id`) REFERENCES `shelves`(`id`) ON UPDATE no action ON DELETE no action
);
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
INSERT INTO "customers" ("id","user_id","company_name","business_type","phone","whatsapp","address","status","created_at") VALUES(3,19,'Pet care','Pet accessories ',NULL,'01122733412',NULL,'active',1787651880);
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
INSERT INTO "inventory_movements" ("id","product_id","type","quantity","previous_balance","new_balance","user_id","reason","reference_type","reference_id","created_at") VALUES(1,1,'IN',50,0,50,19,'رصيد افتتاحي عند إنشاء المنتج','manual',NULL,1787652105);
INSERT INTO "inventory_movements" ("id","product_id","type","quantity","previous_balance","new_balance","user_id","reason","reference_type","reference_id","created_at") VALUES(2,1,'OUT',10,50,40,14,'Picking لطلب رقم 1','order',1,1787664950);
CREATE TABLE `invoice_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`invoice_id` integer NOT NULL,
	`description` text NOT NULL,
	`type` text NOT NULL,
	`quantity` real DEFAULT 1 NOT NULL,
	`amount` real NOT NULL,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE no action
);
INSERT INTO "invoice_items" ("id","invoice_id","description","type","quantity","amount") VALUES(4,2,'رسوم تخزين 5 م²','storage',1,2250);
INSERT INTO "invoice_items" ("id","invoice_id","description","type","quantity","amount") VALUES(5,2,'رسوم تجهيز طلبات (1 طلب)','picking',1,20);
INSERT INTO "invoice_items" ("id","invoice_id","description","type","quantity","amount") VALUES(6,2,'رسوم تغليف طلبات (1 طلب)','packing',1,15);
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
INSERT INTO "invoices" ("id","invoice_number","customer_id","period_start","period_end","subtotal","tax_rate","tax_amount","total","status","due_date","created_at") VALUES(2,'INV-MT8IIYJ0',3,1785061146,1787653146,2285,14,319.9,2604.9,'pending',1788862746,1787653144);
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
INSERT INTO "notifications" ("id","user_id","type","title","message","is_read","created_at") VALUES(1,18,'storage_booked','تم حجز المساحة','تم حجز 5 م² في 8 مقابل 2,250 جنيه شهريًا.',0,1787572670);
INSERT INTO "notifications" ("id","user_id","type","title","message","is_read","created_at") VALUES(2,19,'order_shipped','تم شحن طلبك','تم شحن طلبك رقم ORD-MT8I2W80 — رقم التتبع: msv-10115544445.',0,1787665031);
INSERT INTO "notifications" ("id","user_id","type","title","message","is_read","created_at") VALUES(3,19,'order_delivered','تم تسليم طلبك','تم تأكيد تسليم الطلب رقم ORD-MT8I2W80.',0,1787665125);
CREATE TABLE `order_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`quantity` integer NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
INSERT INTO "order_items" ("id","order_id","product_id","quantity") VALUES(1,1,1,10);
CREATE TABLE `orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_number` text NOT NULL,
	`customer_id` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`shipping_address` text,
	`payment_status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer DEFAULT (strftime('%s','now')) NOT NULL, payment_proof_url TEXT,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
INSERT INTO "orders" ("id","order_number","customer_id","status","shipping_address","payment_status","created_at","payment_proof_url") VALUES(1,'ORD-MT8I2W80',3,'delivered','الحي الخامس عقد ثاني مجاورة اولى ','paid',1787652395,NULL);
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
INSERT INTO "packing_tasks" ("id","order_id","packaging_type","weight_kg","dimensions","packaging_cost","status","notes","packed_by","created_at","completed_at") VALUES(1,1,'كرتونة متوسطة',2,NULL,0,'packed',NULL,14,1787664999,1787664999);
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
INSERT INTO "picking_tasks" ("id","order_id","order_item_id","assigned_to","status","picked_qty","notes","created_at","completed_at") VALUES(1,1,1,14,'picked',10,NULL,1787652432,1787664950);
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
INSERT INTO "pricing_plans" ("id","name","price_per_m2","min_monthly_fee","price_per_carton","price_per_pallet","receiving_fee","picking_fee","packing_fee","return_fee","shipping_handling_fee","is_default") VALUES(1,'الخطة الافتراضية',450,500,15,200,25,20,15,30,10,1);
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
INSERT INTO "products" ("id","customer_id","sku","barcode","name","category","description","quantity","min_stock","unit_weight_kg","unit_dimensions","image_url","bin_id","created_at") VALUES(1,3,'Collar1234567',NULL,'Pink cat collar','150',NULL,40,5,NULL,NULL,NULL,NULL,1787652105);
CREATE TABLE `racks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`zone_id` integer NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	FOREIGN KEY (`zone_id`) REFERENCES `zones`(`id`) ON UPDATE no action ON DELETE no action
);
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
CREATE TABLE `return_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`return_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`quantity` integer NOT NULL,
	FOREIGN KEY (`return_id`) REFERENCES `returns`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
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
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
INSERT INTO "settings" ("key","value") VALUES('company_name','مساحة — Storage & Fulfillment');
INSERT INTO "settings" ("key","value") VALUES('currency','EGP');
INSERT INTO "settings" ("key","value") VALUES('default_tax_rate','14');
CREATE TABLE `shelves` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`rack_id` integer NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	FOREIGN KEY (`rack_id`) REFERENCES `racks`(`id`) ON UPDATE no action ON DELETE no action
);
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
INSERT INTO "shipments" ("id","order_id","courier","tracking_number","shipping_cost","status","shipped_at","delivered_at") VALUES(1,1,'bosta','msv-10115544445',0,'delivered',1787665029,1787665125);
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
INSERT INTO "storage_allocations" ("id","customer_id","warehouse_id","allocated_m2","used_m2","monthly_fee","start_date","end_date","status") VALUES(2,3,6,5,0,2250,1787651914,NULL,'active');
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
INSERT INTO "users" ("id","email","password_hash","name","phone","role","customer_id","is_active","created_at") VALUES(14,'amer14205@gmail.com','$2b$10$oDjq83XURyogVFXmXyBe1OUnuMi9cLArCjArpD4mFluO0ab9BYjWu','ahmed amer',NULL,'SUPER_ADMIN',NULL,1,1787479447);
INSERT INTO "users" ("id","email","password_hash","name","phone","role","customer_id","is_active","created_at") VALUES(18,'ahmedamer9099000@gmail.com','$2b$10$udSX27DMWN8U9LG7ppMLXOLgIfFCwIUn2NzDbZvavACPNJv78VRwG','محمد',NULL,'CUSTOMER',1,1,1787567637);
INSERT INTO "users" ("id","email","password_hash","name","phone","role","customer_id","is_active","created_at") VALUES(19,'Fahmyaisha917@gmail.com','$2b$10$mAtDIGgeQQs5llH78b.G2OnW11TOAlKOuseSxslMsxTamdzGTxpWi','Sara',NULL,'CUSTOMER',3,1,1787651881);
CREATE TABLE `warehouses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	`address` text,
	`total_capacity_m2` real NOT NULL,
	`created_at` integer DEFAULT (strftime('%s','now')) NOT NULL
);
INSERT INTO "warehouses" ("id","name","code","address","total_capacity_m2","created_at") VALUES(6,'الحي تامن ','01','الحي التامن',100,1787650286);
INSERT INTO "warehouses" ("id","name","code","address","total_capacity_m2","created_at") VALUES(7,'الحي العاشر','02','الحي العاشر',70,1787650320);
CREATE TABLE `zones` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`warehouse_id` integer NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON UPDATE no action ON DELETE no action
);
DELETE FROM sqlite_sequence;
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('d1_migrations',1);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('pricing_plans',1);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('warehouses',7);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('zones',2);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('racks',4);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('shelves',12);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('bins',24);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('users',19);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('leads',6);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('customers',3);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('storage_allocations',2);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('notifications',3);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('products',1);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('inventory_movements',2);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('orders',1);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('order_items',1);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('invoices',2);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('invoice_items',6);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('picking_tasks',1);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('packing_tasks',1);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('shipments',1);
CREATE UNIQUE INDEX `invoices_invoice_number_unique` ON `invoices` (`invoice_number`);
CREATE UNIQUE INDEX `orders_order_number_unique` ON `orders` (`order_number`);
CREATE UNIQUE INDEX `returns_return_number_unique` ON `returns` (`return_number`);
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);
CREATE UNIQUE INDEX `warehouses_code_unique` ON `warehouses` (`code`);
