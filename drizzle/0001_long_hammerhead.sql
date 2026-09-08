ALTER TABLE `products` ADD `space_m2` real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `requested_initial_qty` integer;--> statement-breakpoint
ALTER TABLE `products` ADD `approval_status` text DEFAULT 'approved' NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `rejection_reason` text;