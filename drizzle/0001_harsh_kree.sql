CREATE TABLE `collection_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`trigger` text NOT NULL,
	`status` text NOT NULL,
	`started_at` text NOT NULL,
	`finished_at` text,
	`search_from` text NOT NULL,
	`search_to` text NOT NULL,
	`added_count` integer DEFAULT 0 NOT NULL,
	`evidence` text,
	`error_code` text
);
