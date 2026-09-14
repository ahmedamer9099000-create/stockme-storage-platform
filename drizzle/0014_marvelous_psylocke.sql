ALTER TABLE `storage_allocations` ADD `clearance_status` text DEFAULT 'admin_confirmed' NOT NULL;--> statement-breakpoint
ALTER TABLE `storage_allocations` DROP COLUMN `clearance_confirmed`;