CREATE TABLE `__new_library_lessons` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`tradition` text NOT NULL,
	`level` text NOT NULL,
	`minutes` integer NOT NULL,
	`summary` text NOT NULL,
	`content` text NOT NULL,
	`status` text DEFAULT 'PUBLISHED' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_library_lessons` (
	`id`,
	`slug`,
	`title`,
	`tradition`,
	`level`,
	`minutes`,
	`summary`,
	`content`,
	`status`,
	`created_at`,
	`updated_at`
)
SELECT
	`id`,
	`slug`,
	`title`,
	`tradition`,
	`level`,
	`minutes`,
	`summary`,
	`summary`,
	`status`,
	`created_at`,
	`updated_at`
FROM `library_lessons`;
--> statement-breakpoint
DROP TABLE `library_lessons`;
--> statement-breakpoint
ALTER TABLE `__new_library_lessons` RENAME TO `library_lessons`;
--> statement-breakpoint
CREATE UNIQUE INDEX `library_lessons_slug_unique` ON `library_lessons` (`slug`);
--> statement-breakpoint
CREATE TABLE `__new_practice_routines` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`cadence` text NOT NULL,
	`protocol` text NOT NULL,
	`status` text DEFAULT 'PUBLISHED' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_practice_routines` (
	`id`,
	`slug`,
	`title`,
	`description`,
	`cadence`,
	`protocol`,
	`status`,
	`created_at`,
	`updated_at`
)
SELECT
	`id`,
	`slug`,
	`title`,
	`description`,
	`cadence`,
	`description`,
	`status`,
	`created_at`,
	`updated_at`
FROM `practice_routines`;
--> statement-breakpoint
DROP TABLE `practice_routines`;
--> statement-breakpoint
ALTER TABLE `__new_practice_routines` RENAME TO `practice_routines`;
--> statement-breakpoint
CREATE UNIQUE INDEX `practice_routines_slug_unique` ON `practice_routines` (`slug`);
