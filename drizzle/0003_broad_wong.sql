ALTER TABLE `storage_allocations` ADD `approval_status` text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `storage_allocations` ADD `rejection_reason` text;