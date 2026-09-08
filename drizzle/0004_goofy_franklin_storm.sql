CREATE TABLE `carton_handoffs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`customer_id` integer NOT NULL,
	`warehouse_id` integer NOT NULL,
	`carton_count` integer NOT NULL,
	`space_freed_m2` real DEFAULT 0 NOT NULL,
	`courier` text,
	`notes` text,
	`created_by` integer,
	`created_at` integer DEFAULT (strftime('%s','now')) NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
