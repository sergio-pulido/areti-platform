CREATE TABLE `reflection_entries` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL,
  `title` text NOT NULL,
  `source_type` text NOT NULL,
  `raw_text` text DEFAULT '' NOT NULL,
  `clean_transcript` text,
  `refined_text` text,
  `commentary` text,
  `commentary_mode` text,
  `language` text DEFAULT 'en' NOT NULL,
  `is_favorite` integer DEFAULT false NOT NULL,
  `status` text DEFAULT 'draft' NOT NULL,
  `processing_error` text,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL,
  `deleted_at` text,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `reflection_entries_user_created_idx` ON `reflection_entries` (`user_id`,`created_at`);
--> statement-breakpoint
CREATE INDEX `reflection_entries_user_favorite_idx` ON `reflection_entries` (`user_id`,`is_favorite`);
--> statement-breakpoint
CREATE TABLE `reflection_audio_assets` (
  `id` text PRIMARY KEY NOT NULL,
  `reflection_id` text NOT NULL,
  `storage_key` text NOT NULL,
  `file_name` text NOT NULL,
  `mime_type` text NOT NULL,
  `size_bytes` integer NOT NULL,
  `duration_seconds` integer,
  `created_at` text NOT NULL,
  FOREIGN KEY (`reflection_id`) REFERENCES `reflection_entries`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `reflection_audio_assets_reflection_created_idx` ON `reflection_audio_assets` (`reflection_id`,`created_at`);
--> statement-breakpoint
CREATE TABLE `reflection_tags` (
  `id` text PRIMARY KEY NOT NULL,
  `reflection_id` text NOT NULL,
  `tag` text NOT NULL,
  `created_at` text NOT NULL,
  FOREIGN KEY (`reflection_id`) REFERENCES `reflection_entries`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reflection_tags_reflection_id_tag_unique` ON `reflection_tags` (`reflection_id`,`tag`);
--> statement-breakpoint
CREATE TABLE `reflection_processing_jobs` (
  `id` text PRIMARY KEY NOT NULL,
  `reflection_id` text NOT NULL,
  `step` text NOT NULL,
  `status` text NOT NULL,
  `error_message` text,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL,
  FOREIGN KEY (`reflection_id`) REFERENCES `reflection_entries`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `reflection_processing_jobs_reflection_step_idx` ON `reflection_processing_jobs` (`reflection_id`,`step`);
--> statement-breakpoint
CREATE TABLE `reflection_events` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL,
  `reflection_id` text,
  `event_type` text NOT NULL,
  `metadata_json` text DEFAULT '{}' NOT NULL,
  `created_at` text NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`reflection_id`) REFERENCES `reflection_entries`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `reflection_events_user_created_idx` ON `reflection_events` (`user_id`,`created_at`);
