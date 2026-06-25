CREATE TABLE `alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`investigationId` int NOT NULL,
	`type` varchar(100) NOT NULL,
	`message` text NOT NULL,
	`isRead` boolean DEFAULT false,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `annotations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`investigationId` int NOT NULL,
	`findingId` int,
	`content` text NOT NULL,
	`tag` varchar(100),
	`highlighted` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `annotations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bulkJobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`status` enum('pending','running','completed','failed') NOT NULL DEFAULT 'pending',
	`totalSubjects` int NOT NULL DEFAULT 0,
	`completedSubjects` int NOT NULL DEFAULT 0,
	`investigationIds` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bulkJobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `findings` MODIFY COLUMN `category` enum('identity','social_media','public_records','criminal','dating','professional','breaches','dark_web') NOT NULL;--> statement-breakpoint
ALTER TABLE `findings` ADD `corroborationCount` int DEFAULT 1;--> statement-breakpoint
ALTER TABLE `investigations` ADD `riskScore` int;--> statement-breakpoint
ALTER TABLE `investigations` ADD `riskBreakdown` json;--> statement-breakpoint
ALTER TABLE `investigations` ADD `relationships` json;--> statement-breakpoint
ALTER TABLE `investigations` ADD `timeline` json;--> statement-breakpoint
ALTER TABLE `investigations` ADD `geolocations` json;--> statement-breakpoint
ALTER TABLE `investigations` ADD `monitoringEnabled` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `investigations` ADD `lastMonitoredAt` timestamp;