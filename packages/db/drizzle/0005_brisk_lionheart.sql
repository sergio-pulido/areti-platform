ALTER TABLE `users` ADD `email_verified_at` text;
--> statement-breakpoint
ALTER TABLE `users` ADD `onboarding_completed_at` text;
--> statement-breakpoint
CREATE TABLE `user_legal_consents` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`policy_type` text NOT NULL,
	`policy_version` text NOT NULL,
	`accepted_at` text NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_legal_consents_user_policy_version_unique` ON `user_legal_consents` (`user_id`,`policy_type`,`policy_version`);
--> statement-breakpoint
CREATE TABLE `email_verification_challenges` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`code_hash` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text NOT NULL,
	`consumed_at` text,
	`last_sent_at` text NOT NULL,
	`send_count` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `email_verification_challenges_token_hash_unique` ON `email_verification_challenges` (`token_hash`);
--> statement-breakpoint
CREATE INDEX `email_verification_challenges_user_id_idx` ON `email_verification_challenges` (`user_id`);
--> statement-breakpoint
CREATE TABLE `user_onboarding_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`primary_objective` text NOT NULL,
	`biggest_difficulty` text NOT NULL,
	`main_need` text NOT NULL,
	`daily_time_commitment` text NOT NULL,
	`coaching_style` text NOT NULL,
	`contemplative_experience` text NOT NULL,
	`preferred_practice_format` text NOT NULL,
	`success_definition_30d` text NOT NULL,
	`notes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_onboarding_profiles_user_id_unique` ON `user_onboarding_profiles` (`user_id`);
