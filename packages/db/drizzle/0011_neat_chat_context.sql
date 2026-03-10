CREATE TABLE `chat_thread_contexts` (
  `id` text PRIMARY KEY NOT NULL,
  `thread_id` text NOT NULL,
  `summary` text DEFAULT '' NOT NULL,
  `summarized_message_count` integer DEFAULT 0 NOT NULL,
  `estimated_prompt_tokens` integer DEFAULT 0 NOT NULL,
  `context_capacity` integer DEFAULT 24000 NOT NULL,
  `usage_percent` integer DEFAULT 0 NOT NULL,
  `state` text DEFAULT 'ok' NOT NULL,
  `auto_summaries_count` integer DEFAULT 0 NOT NULL,
  `last_summarized_at` text,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL,
  FOREIGN KEY (`thread_id`) REFERENCES `chat_threads`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `chat_thread_contexts_thread_id_unique` ON `chat_thread_contexts` (`thread_id`);
