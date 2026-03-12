ALTER TABLE `user_profiles` ADD `avatar_type` text DEFAULT 'initials' NOT NULL;
--> statement-breakpoint
ALTER TABLE `user_profiles` ADD `avatar_preset` text;
--> statement-breakpoint
ALTER TABLE `user_profiles` ADD `avatar_image_key` text;
--> statement-breakpoint
ALTER TABLE `user_onboarding_profiles` ADD `primary_goal` text DEFAULT 'explore_philosophy' NOT NULL;
--> statement-breakpoint
ALTER TABLE `user_onboarding_profiles` ADD `preferred_topics_json` text DEFAULT '["stoicism"]' NOT NULL;
--> statement-breakpoint
ALTER TABLE `user_onboarding_profiles` ADD `experience_level` text DEFAULT 'new_to_philosophy' NOT NULL;
