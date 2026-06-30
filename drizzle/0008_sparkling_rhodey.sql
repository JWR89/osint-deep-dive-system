CREATE TABLE `socialMediaProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`investigationId` int NOT NULL,
	`platform` enum('twitter','instagram','tiktok','facebook','reddit','youtube','pinterest','snapchat') NOT NULL,
	`username` varchar(255) NOT NULL,
	`profileUrl` varchar(1024),
	`profileData` json,
	`posts` json,
	`stories` json,
	`followers` int,
	`following` int,
	`engagementMetrics` json,
	`lastScrapedAt` timestamp,
	`scrapingStatus` enum('pending','success','failed') DEFAULT 'pending',
	`scrapingError` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `socialMediaProfiles_id` PRIMARY KEY(`id`)
);
