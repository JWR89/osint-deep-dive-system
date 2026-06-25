CREATE TABLE `findings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`investigationId` int NOT NULL,
	`category` enum('identity','social_media','public_records','criminal','dating','professional') NOT NULL,
	`title` varchar(512) NOT NULL,
	`content` text NOT NULL,
	`source` varchar(512) NOT NULL,
	`sourceUrl` varchar(1024),
	`confidence` enum('high','medium','low') NOT NULL DEFAULT 'medium',
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `findings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `investigations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`subjectName` varchar(255) NOT NULL,
	`subjectDetails` json,
	`status` enum('pending','running','completed','failed') NOT NULL DEFAULT 'pending',
	`progress` int NOT NULL DEFAULT 0,
	`currentSource` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`completedAt` timestamp,
	`pdfUrl` varchar(512),
	`pdfKey` varchar(512),
	CONSTRAINT `investigations_id` PRIMARY KEY(`id`)
);
