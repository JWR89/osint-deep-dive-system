ALTER TABLE `findings` MODIFY COLUMN `category` enum('identity','social_media','public_records','criminal','dating','professional','breaches','dark_web','financial','vehicles_assets','digital_fingerprint','aliases','media_sentiment','domain_infrastructure','court_documents','professional_verification') NOT NULL;--> statement-breakpoint
ALTER TABLE `findings` ADD `sourceReliability` varchar(4);--> statement-breakpoint
ALTER TABLE `investigations` ADD `patternOfLife` json;--> statement-breakpoint
ALTER TABLE `investigations` ADD `financialFootprint` json;--> statement-breakpoint
ALTER TABLE `investigations` ADD `vehicleAssets` json;--> statement-breakpoint
ALTER TABLE `investigations` ADD `networkAnalysis` json;--> statement-breakpoint
ALTER TABLE `investigations` ADD `digitalFingerprint` json;--> statement-breakpoint
ALTER TABLE `investigations` ADD `aliases` json;--> statement-breakpoint
ALTER TABLE `investigations` ADD `communicationPatterns` json;--> statement-breakpoint
ALTER TABLE `investigations` ADD `threatMatrix` json;--> statement-breakpoint
ALTER TABLE `investigations` ADD `deceptionIndicators` json;--> statement-breakpoint
ALTER TABLE `investigations` ADD `mediaSentiment` json;--> statement-breakpoint
ALTER TABLE `investigations` ADD `domainInfrastructure` json;--> statement-breakpoint
ALTER TABLE `investigations` ADD `courtDocuments` json;--> statement-breakpoint
ALTER TABLE `investigations` ADD `professionalVerification` json;--> statement-breakpoint
ALTER TABLE `investigations` ADD `executiveSummary` text;