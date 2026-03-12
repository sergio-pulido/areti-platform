CREATE TABLE `rate_limit_block_events` (
	`id` text PRIMARY KEY NOT NULL,
	`policy_key` text NOT NULL,
	`route` text NOT NULL,
	`method` text NOT NULL,
	`ip_hash` text NOT NULL,
	`ip_masked` text,
	`user_id` text,
	`country` text,
	`plan` text,
	`trust_level` text,
	`blocked` integer DEFAULT true NOT NULL,
	`retry_after_seconds` integer NOT NULL,
	`request_count` integer NOT NULL,
	`limit_value` integer NOT NULL,
	`window_seconds` integer NOT NULL,
	`scope_type` text NOT NULL,
	`user_agent` text,
	`request_id` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `rate_limit_block_events_created_at_idx` ON `rate_limit_block_events` (`created_at`);--> statement-breakpoint
CREATE INDEX `rate_limit_block_events_policy_key_idx` ON `rate_limit_block_events` (`policy_key`);--> statement-breakpoint
CREATE INDEX `rate_limit_block_events_route_idx` ON `rate_limit_block_events` (`route`);--> statement-breakpoint
CREATE INDEX `rate_limit_block_events_user_id_idx` ON `rate_limit_block_events` (`user_id`);--> statement-breakpoint
CREATE INDEX `rate_limit_block_events_ip_hash_idx` ON `rate_limit_block_events` (`ip_hash`);--> statement-breakpoint
CREATE TABLE `rate_limit_policy_overrides` (
	`id` text PRIMARY KEY NOT NULL,
	`policy_key` text NOT NULL,
	`scope_type` text NOT NULL,
	`scope_value` text,
	`window_seconds` integer,
	`max_requests` integer,
	`anonymous_max_requests` integer,
	`authenticated_max_requests` integer,
	`burst_requests` integer,
	`cost_weight` integer,
	`enabled` integer,
	`starts_at` text,
	`ends_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `rate_limit_policy_overrides_policy_key_idx` ON `rate_limit_policy_overrides` (`policy_key`);--> statement-breakpoint
CREATE INDEX `rate_limit_policy_overrides_scope_idx` ON `rate_limit_policy_overrides` (`scope_type`,`scope_value`);--> statement-breakpoint
CREATE INDEX `rate_limit_policy_overrides_starts_at_idx` ON `rate_limit_policy_overrides` (`starts_at`);--> statement-breakpoint
CREATE INDEX `rate_limit_policy_overrides_ends_at_idx` ON `rate_limit_policy_overrides` (`ends_at`);--> statement-breakpoint
CREATE INDEX `rate_limit_policy_overrides_enabled_idx` ON `rate_limit_policy_overrides` (`enabled`);
