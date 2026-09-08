CREATE TABLE `login_attempts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`ip` text NOT NULL,
	`success` integer NOT NULL,
	`created_at` integer DEFAULT (strftime('%s','now')) NOT NULL
);
