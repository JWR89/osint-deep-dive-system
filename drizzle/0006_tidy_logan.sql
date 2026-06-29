CREATE TABLE `apiCache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`investigationId` int NOT NULL,
	`apiProvider` varchar(100) NOT NULL,
	`rawData` json NOT NULL,
	`processedFindings` int DEFAULT 0,
	`status` enum('pending','success','failed') DEFAULT 'pending',
	`error` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	CONSTRAINT `apiCache_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mlInsights` (
	`id` int AUTO_INCREMENT NOT NULL,
	`investigationId` int NOT NULL,
	`userId` int NOT NULL,
	`insightType` varchar(100) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`confidence` int NOT NULL,
	`relatedInvestigationIds` json,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mlInsights_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subjectComparisons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`investigationId1` int NOT NULL,
	`investigationId2` int NOT NULL,
	`connectionStrength` int NOT NULL,
	`sharedConnections` json,
	`sharedLocations` json,
	`sharedSocialAccounts` json,
	`temporalOverlap` json,
	`riskIndicators` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subjectComparisons_id` PRIMARY KEY(`id`)
);
