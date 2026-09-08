PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_returns` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`return_number` text NOT NULL,
	`order_id` integer,
	`customer_id` integer NOT NULL,
	`reason` text NOT NULL,
	`condition` text,
	`decision` text,
	`status` text DEFAULT 'requested' NOT NULL,
	`received_at` integer,
	`processed_at` integer,
	`created_at` integer DEFAULT (strftime('%s','now')) NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_returns`("id", "return_number", "order_id", "customer_id", "reason", "condition", "decision", "status", "received_at", "processed_at", "created_at") SELECT "id", "return_number", "order_id", "customer_id", "reason", "condition", "decision", "status", "received_at", "processed_at", "created_at" FROM `returns`;--> statement-breakpoint
DROP TABLE `returns`;--> statement-breakpoint
ALTER TABLE `__new_returns` RENAME TO `returns`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `returns_return_number_unique` ON `returns` (`return_number`);