CREATE TABLE `invitations` (
	`id` text PRIMARY KEY NOT NULL,
	`token_hash` text NOT NULL,
	`email` text,
	`role_to_grant` text DEFAULT 'user' NOT NULL,
	`max_uses` integer DEFAULT 1 NOT NULL,
	`used_count` integer DEFAULT 0 NOT NULL,
	`expires_at` text NOT NULL,
	`created_by_user_id` text NOT NULL,
	`created_at` text NOT NULL,
	`used_at` text,
	`used_by_user_id` text,
	`revoked_at` text,
	FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`used_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invitations_token_hash_unique` ON `invitations` (`token_hash`);--> statement-breakpoint
CREATE INDEX `invitations_created_by_user_idx` ON `invitations` (`created_by_user_id`);--> statement-breakpoint
CREATE INDEX `invitations_expires_at_idx` ON `invitations` (`expires_at`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'user' NOT NULL,
	`mfa_enabled` integer DEFAULT false NOT NULL,
	`passkey_enabled` integer DEFAULT false NOT NULL,
	`email_verified_at` text,
	`onboarding_completed_at` text,
	`deleted_at` text,
	`anonymized_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_users`("id", "name", "email", "password_hash", "role", "mfa_enabled", "passkey_enabled", "email_verified_at", "onboarding_completed_at", "deleted_at", "anonymized_at", "created_at", "updated_at") SELECT "id", "name", "email", "password_hash", CASE
	WHEN lower("role") = 'admin' THEN 'admin'
	ELSE 'user'
END, "mfa_enabled", "passkey_enabled", "email_verified_at", "onboarding_completed_at", "deleted_at", "anonymized_at", "created_at", "updated_at" FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);
