CREATE TABLE `user_content_completions` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL,
  `content_kind` text NOT NULL,
  `content_slug` text NOT NULL,
  `completion_count` integer DEFAULT 1 NOT NULL,
  `last_completed_at` text NOT NULL,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_content_completions_user_kind_slug_unique` ON `user_content_completions` (
  `user_id`,
  `content_kind`,
  `content_slug`
);
