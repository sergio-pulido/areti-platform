CREATE TABLE IF NOT EXISTS `chat_thread_branches` (
	`id` text PRIMARY KEY NOT NULL,
	`thread_id` text NOT NULL,
	`source_thread_id` text NOT NULL,
	`source_message_id` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`thread_id`) REFERENCES `chat_threads`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`source_thread_id`) REFERENCES `chat_threads`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`source_message_id`) REFERENCES `chat_messages`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `chat_thread_branches_thread_id_unique` ON `chat_thread_branches` (`thread_id`);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `chat_thread_branches_source_thread_source_message_unique` ON `chat_thread_branches` (`source_thread_id`,`source_message_id`,`thread_id`);
