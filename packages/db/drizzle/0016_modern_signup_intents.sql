CREATE UNIQUE INDEX `user_profiles_username_unique` ON `user_profiles` (`username`);--> statement-breakpoint
CREATE TABLE `signup_intents` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`flow_type` text NOT NULL,
	`invite_id` text,
	`invite_token_hash` text,
	`verification_token_hash` text NOT NULL,
	`verification_code_hash` text NOT NULL,
	`verification_expires_at` text NOT NULL,
	`verification_sent_at` text NOT NULL,
	`verification_send_count` integer DEFAULT 1 NOT NULL,
	`email_verified_at` text,
	`completion_token_hash` text,
	`completion_expires_at` text,
	`legal_accepted_at` text,
	`legal_terms_version` text,
	`privacy_version` text,
	`locale` text,
	`expires_at` text NOT NULL,
	`completed_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`invite_id`) REFERENCES `invitations`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `signup_intents_verification_token_hash_unique` ON `signup_intents` (`verification_token_hash`);--> statement-breakpoint
CREATE UNIQUE INDEX `signup_intents_completion_token_hash_unique` ON `signup_intents` (`completion_token_hash`);--> statement-breakpoint
CREATE INDEX `signup_intents_email_idx` ON `signup_intents` (`email`);--> statement-breakpoint
CREATE INDEX `signup_intents_invite_idx` ON `signup_intents` (`invite_id`);--> statement-breakpoint
CREATE INDEX `signup_intents_expires_at_idx` ON `signup_intents` (`expires_at`);
