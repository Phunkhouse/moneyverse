DROP INDEX `category_user_kind_name_unique`;--> statement-breakpoint
ALTER TABLE `category` ADD `name_key` text DEFAULT '' NOT NULL;--> statement-breakpoint
-- Fill existing rows before the unique index (hand-added). SQLite folds ASCII only; the app writes the full Czech key from now on.
UPDATE `category` SET `name_key` = lower(`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `category_user_kind_name_key_unique` ON `category` (`user_id`,`kind`,`name_key`);