CREATE TABLE `chat_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`thread_id` text NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`thread_id`) REFERENCES `chat_threads`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `chat_threads` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`archived` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `community_challenges` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`duration` text NOT NULL,
	`summary` text NOT NULL,
	`status` text DEFAULT 'PUBLISHED' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `community_challenges_slug_unique` ON `community_challenges` (`slug`);--> statement-breakpoint
CREATE TABLE `community_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`schedule` text NOT NULL,
	`summary` text NOT NULL,
	`status` text DEFAULT 'PUBLISHED' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `community_events_slug_unique` ON `community_events` (`slug`);--> statement-breakpoint
CREATE TABLE `community_experts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`focus` text NOT NULL,
	`status` text DEFAULT 'PUBLISHED' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `community_experts_slug_unique` ON `community_experts` (`slug`);--> statement-breakpoint
CREATE TABLE `community_resources` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`href` text NOT NULL,
	`cta` text NOT NULL,
	`status` text DEFAULT 'PUBLISHED' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `community_resources_slug_unique` ON `community_resources` (`slug`);--> statement-breakpoint
CREATE TABLE `creator_videos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`format` text NOT NULL,
	`summary` text NOT NULL,
	`video_url` text NOT NULL,
	`status` text DEFAULT 'PUBLISHED' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `creator_videos_slug_unique` ON `creator_videos` (`slug`);--> statement-breakpoint
CREATE TABLE `user_devices` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`fingerprint` text NOT NULL,
	`label` text NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`revoked_at` text,
	`last_seen_at` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`href` text NOT NULL,
	`read_at` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_totp_secrets` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`secret` text NOT NULL,
	`verified_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_totp_secrets_user_id_unique` ON `user_totp_secrets` (`user_id`);--> statement-breakpoint
ALTER TABLE `passkey_credentials` ADD `nickname` text;--> statement-breakpoint
ALTER TABLE `passkey_credentials` ADD `last_used_at` text;--> statement-breakpoint
ALTER TABLE `passkey_credentials` ADD `updated_at` text NOT NULL DEFAULT '1970-01-01T00:00:00.000Z';--> statement-breakpoint
ALTER TABLE `refresh_sessions` ADD `device_id` text REFERENCES user_devices(id);--> statement-breakpoint
ALTER TABLE `sessions` ADD `device_id` text REFERENCES user_devices(id);
