CREATE TABLE `system_job_runs` (
  `id` text PRIMARY KEY NOT NULL,
  `job_name` text NOT NULL,
  `status` text NOT NULL,
  `users_scanned` integer DEFAULT 0 NOT NULL,
  `users_with_digest_enabled` integer DEFAULT 0 NOT NULL,
  `notifications_created` integer DEFAULT 0 NOT NULL,
  `duplicates_skipped` integer DEFAULT 0 NOT NULL,
  `started_at` text NOT NULL,
  `finished_at` text,
  `error_message` text
);
--> statement-breakpoint
CREATE INDEX `system_job_runs_job_name_started_at_idx` ON `system_job_runs` (`job_name`, `started_at`);
