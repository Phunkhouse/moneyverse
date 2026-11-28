CREATE TABLE `category` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`kind` text NOT NULL,
	`name` text NOT NULL,
	`archived` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `category_user_kind_name_unique` ON `category` (`user_id`,`kind`,lower("name"));--> statement-breakpoint
CREATE UNIQUE INDEX `category_id_user_unique` ON `category` (`id`,`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `category_id_user_kind_unique` ON `category` (`id`,`user_id`,`kind`);--> statement-breakpoint
CREATE TABLE `exchange_rate` (
	`valid_for` text NOT NULL,
	`currency` text NOT NULL,
	`amount` integer NOT NULL,
	`rate_milli` integer NOT NULL,
	PRIMARY KEY(`valid_for`, `currency`),
	CONSTRAINT "exchange_rate_positive" CHECK("exchange_rate"."amount" > 0 and "exchange_rate"."rate_milli" > 0)
);
--> statement-breakpoint
CREATE TABLE `exchange_rate_day` (
	`day` text PRIMARY KEY NOT NULL,
	`valid_for` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `money_account` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`currency` text NOT NULL,
	`opening_balance_minor` integer DEFAULT 0 NOT NULL,
	`opened_on` text NOT NULL,
	`archived` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `money_account_user_idx` ON `money_account` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `money_account_id_user_unique` ON `money_account` (`id`,`user_id`);--> statement-breakpoint
CREATE TABLE `money_transaction` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`kind` text NOT NULL,
	`date` text NOT NULL,
	`account_id` text NOT NULL,
	`amount_minor` integer NOT NULL,
	`category_id` text,
	`category_kind` text,
	`to_account_id` text,
	`to_amount_minor` integer,
	`what` text,
	`note` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`account_id`,`user_id`) REFERENCES `money_account`(`id`,`user_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`to_account_id`,`user_id`) REFERENCES `money_account`(`id`,`user_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`category_id`,`user_id`,`category_kind`) REFERENCES `category`(`id`,`user_id`,`kind`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "money_transaction_amount_positive" CHECK("money_transaction"."amount_minor" > 0),
	CONSTRAINT "money_transaction_shape" CHECK(("money_transaction"."kind" = 'transfer' and "money_transaction"."to_account_id" is not null and "money_transaction"."to_amount_minor" > 0 and "money_transaction"."category_id" is null and "money_transaction"."to_account_id" <> "money_transaction"."account_id")
        or ("money_transaction"."kind" <> 'transfer' and "money_transaction"."to_account_id" is null and "money_transaction"."to_amount_minor" is null and "money_transaction"."category_id" is not null and "money_transaction"."category_kind" = "money_transaction"."kind"))
);
--> statement-breakpoint
CREATE INDEX `money_transaction_user_date_idx` ON `money_transaction` (`user_id`,`date`);--> statement-breakpoint
CREATE INDEX `money_transaction_account_idx` ON `money_transaction` (`account_id`);--> statement-breakpoint
CREATE INDEX `money_transaction_to_account_idx` ON `money_transaction` (`to_account_id`);--> statement-breakpoint
CREATE INDEX `money_transaction_category_idx` ON `money_transaction` (`category_id`);--> statement-breakpoint
CREATE TABLE `month_value` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`account_id` text NOT NULL,
	`month` text NOT NULL,
	`value_minor` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`account_id`,`user_id`) REFERENCES `money_account`(`id`,`user_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `month_value_user_idx` ON `month_value` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `month_value_account_month_unique` ON `month_value` (`account_id`,`month`);