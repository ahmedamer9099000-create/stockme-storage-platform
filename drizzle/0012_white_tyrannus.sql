ALTER TABLE `pricing_plans` ADD `discount_pct_3m` real DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE `pricing_plans` ADD `discount_pct_6m` real DEFAULT 10 NOT NULL;--> statement-breakpoint
ALTER TABLE `pricing_plans` ADD `discount_pct_12m` real DEFAULT 15 NOT NULL;--> statement-breakpoint
ALTER TABLE `storage_allocations` ADD `duration_months` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `storage_allocations` ADD `pending_renewal_months` integer;