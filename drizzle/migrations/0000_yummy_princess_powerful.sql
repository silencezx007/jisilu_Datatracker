CREATE TABLE `lof_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fundId` varchar(20) NOT NULL,
	`fundName` varchar(100) NOT NULL,
	`price` decimal(10,4),
	`discountRate` decimal(10,2) NOT NULL,
	`applyStatus` varchar(50) NOT NULL,
	`fundNav` decimal(10,4),
	`estimateValue` decimal(10,4),
	`stockRatio` decimal(10,2),
	`issuerName` varchar(100),
	`monitorTime` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lof_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `monitor_configs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`discountThreshold` decimal(10,2) NOT NULL DEFAULT '2.00',
	`cronExpression` varchar(255) NOT NULL DEFAULT '45 14 * * *',
	`enabled` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `monitor_configs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `push_histories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pushTime` timestamp NOT NULL,
	`fundCount` int NOT NULL,
	`content` text NOT NULL,
	`status` enum('success','failed') NOT NULL,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `push_histories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
