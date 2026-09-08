ALTER TABLE `receiving_orders` RENAME COLUMN "confirmed_at" TO "received_at";--> statement-breakpoint
ALTER TABLE `receiving_orders` ADD `approved_at` integer;--> statement-breakpoint
ALTER TABLE `receiving_orders` ADD `putaway_at` integer;--> statement-breakpoint
ALTER TABLE `receiving_items` ADD `damaged_qty` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `receiving_items` ADD `bin_id` integer REFERENCES bins(id);--> statement-breakpoint
ALTER TABLE `receiving_items` DROP COLUMN `condition`;