CREATE TABLE `academy_concept_persons` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`concept_id` integer NOT NULL,
	`person_id` integer NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`concept_id`) REFERENCES `academy_concepts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`person_id`) REFERENCES `academy_persons`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `academy_concept_persons_concept_person_unique` ON `academy_concept_persons` (`concept_id`,`person_id`);--> statement-breakpoint
CREATE TABLE `academy_concept_traditions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`concept_id` integer NOT NULL,
	`tradition_id` integer NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`concept_id`) REFERENCES `academy_concepts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tradition_id`) REFERENCES `academy_traditions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `academy_concept_traditions_concept_tradition_unique` ON `academy_concept_traditions` (`concept_id`,`tradition_id`);--> statement-breakpoint
CREATE TABLE `academy_concept_works` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`concept_id` integer NOT NULL,
	`work_id` integer NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`concept_id`) REFERENCES `academy_concepts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`work_id`) REFERENCES `academy_works`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `academy_concept_works_concept_work_unique` ON `academy_concept_works` (`concept_id`,`work_id`);--> statement-breakpoint
CREATE TABLE `academy_concepts` (
	`id` integer PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`concept_family` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `academy_concepts_slug_unique` ON `academy_concepts` (`slug`);--> statement-breakpoint
CREATE TABLE `academy_domains` (
	`id` integer PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description_short` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `academy_domains_slug_unique` ON `academy_domains` (`slug`);--> statement-breakpoint
CREATE TABLE `academy_path_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`path_id` integer NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` integer NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`rationale` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`path_id`) REFERENCES `academy_paths`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `academy_path_items_path_entity_unique` ON `academy_path_items` (`path_id`,`entity_type`,`entity_id`);--> statement-breakpoint
CREATE TABLE `academy_paths` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`summary` text NOT NULL,
	`tone` text DEFAULT 'beginner' NOT NULL,
	`difficulty_level` text DEFAULT 'beginner' NOT NULL,
	`progression_order` integer DEFAULT 0 NOT NULL,
	`recommendation_weight` integer DEFAULT 0 NOT NULL,
	`recommendation_hint` text DEFAULT '' NOT NULL,
	`is_featured` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `academy_paths_slug_unique` ON `academy_paths` (`slug`);--> statement-breakpoint
CREATE TABLE `academy_person_relationships` (
	`id` integer PRIMARY KEY NOT NULL,
	`source_person_id` integer NOT NULL,
	`target_person_id` integer NOT NULL,
	`relationship_type` text NOT NULL,
	`notes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`source_person_id`) REFERENCES `academy_persons`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`target_person_id`) REFERENCES `academy_persons`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `academy_persons` (
	`id` integer PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`display_name` text NOT NULL,
	`birth_year` integer,
	`death_year` integer,
	`country_or_region` text,
	`tradition_id` integer,
	`role_type` text,
	`is_founder` integer DEFAULT false NOT NULL,
	`credibility_band` text,
	`bio_short` text,
	`evidence_profile` text,
	`claim_risk_level` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`tradition_id`) REFERENCES `academy_traditions`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `academy_persons_slug_unique` ON `academy_persons` (`slug`);--> statement-breakpoint
CREATE TABLE `academy_traditions` (
	`id` integer PRIMARY KEY NOT NULL,
	`domain_id` integer NOT NULL,
	`parent_tradition_id` integer,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`origin_region` text,
	`description_short` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`domain_id`) REFERENCES `academy_domains`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`parent_tradition_id`) REFERENCES `academy_traditions`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `academy_traditions_slug_unique` ON `academy_traditions` (`slug`);--> statement-breakpoint
CREATE TABLE `academy_works` (
	`id` integer PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`person_id` integer,
	`tradition_id` integer,
	`title` text NOT NULL,
	`work_type` text,
	`publication_year` integer,
	`is_primary_text` integer DEFAULT false NOT NULL,
	`summary_short` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`person_id`) REFERENCES `academy_persons`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`tradition_id`) REFERENCES `academy_traditions`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `academy_works_slug_unique` ON `academy_works` (`slug`);