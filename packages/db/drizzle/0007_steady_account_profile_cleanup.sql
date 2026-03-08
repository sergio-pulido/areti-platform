CREATE TABLE `__new_user_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`username` text,
	`summary` text DEFAULT '' NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`city` text DEFAULT '' NOT NULL,
	`country` text DEFAULT '' NOT NULL,
	`social_links_json` text DEFAULT '[]' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_user_profiles` (`id`, `user_id`, `username`, `summary`, `phone`, `city`, `country`, `social_links_json`, `created_at`, `updated_at`)
SELECT `id`, `user_id`, `username`, `summary`, `phone`, `city`, `country`, `social_links_json`, `created_at`, `updated_at`
FROM `user_profiles`;
--> statement-breakpoint
DROP TABLE `user_profiles`;
--> statement-breakpoint
ALTER TABLE `__new_user_profiles` RENAME TO `user_profiles`;
--> statement-breakpoint
CREATE UNIQUE INDEX `user_profiles_user_id_unique` ON `user_profiles` (`user_id`);
