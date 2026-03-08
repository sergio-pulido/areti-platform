ALTER TABLE `users` ADD `deleted_at` text;
--> statement-breakpoint
ALTER TABLE `users` ADD `anonymized_at` text;
--> statement-breakpoint
CREATE TABLE `user_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`username` text,
	`headline` text DEFAULT '' NOT NULL,
	`summary` text DEFAULT '' NOT NULL,
	`gender` text DEFAULT '' NOT NULL,
	`birthday` text,
	`phone` text DEFAULT '' NOT NULL,
	`city` text DEFAULT '' NOT NULL,
	`country` text DEFAULT '' NOT NULL,
	`organization` text DEFAULT '' NOT NULL,
	`professional_role` text DEFAULT '' NOT NULL,
	`relation_type` text DEFAULT '' NOT NULL,
	`social_links_json` text DEFAULT '[]' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_profiles_user_id_unique` ON `user_profiles` (`user_id`);
--> statement-breakpoint
CREATE TABLE `user_preferences` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`language` text DEFAULT 'en' NOT NULL,
	`timezone` text DEFAULT 'UTC' NOT NULL,
	`profile_visibility` text DEFAULT 'private' NOT NULL,
	`show_email` integer DEFAULT false NOT NULL,
	`show_phone` integer DEFAULT false NOT NULL,
	`allow_contact` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_preferences_user_id_unique` ON `user_preferences` (`user_id`);
--> statement-breakpoint
CREATE TABLE `user_notification_preferences` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`email_challenges` integer DEFAULT true NOT NULL,
	`email_events` integer DEFAULT true NOT NULL,
	`email_updates` integer DEFAULT true NOT NULL,
	`email_marketing` integer DEFAULT false NOT NULL,
	`push_challenges` integer DEFAULT true NOT NULL,
	`push_events` integer DEFAULT false NOT NULL,
	`push_updates` integer DEFAULT true NOT NULL,
	`digest` text DEFAULT 'immediate' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_notification_preferences_user_id_unique` ON `user_notification_preferences` (`user_id`);
--> statement-breakpoint
CREATE TABLE `user_deletion_audit` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`reason` text NOT NULL,
	`deleted_at` text NOT NULL,
	`created_at` text NOT NULL
);
