CREATE TABLE `prompts` (
	`tweet_id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`command` text,
	`published_at` text NOT NULL,
	`prompt_text` text,
	`text_origin` text
);
--> statement-breakpoint
CREATE TABLE `refresh_state` (
	`id` text PRIMARY KEY NOT NULL,
	`last_checked_at` text NOT NULL
);
