import { int, json, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const investigations = mysqlTable("investigations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  subjectName: varchar("subjectName", { length: 255 }).notNull(),
  subjectDetails: json("subjectDetails"),
  status: mysqlEnum("status", ["pending", "running", "completed", "failed"]).default("pending").notNull(),
  progress: int("progress").default(0).notNull(),
  currentSource: varchar("currentSource", { length: 255 }),
  riskScore: int("riskScore"),
  riskBreakdown: json("riskBreakdown"),
  relationships: json("relationships"),
  timeline: json("timeline"),
  geolocations: json("geolocations"),
  // New FBI-grade intelligence fields
  patternOfLife: json("patternOfLife"),
  financialFootprint: json("financialFootprint"),
  vehicleAssets: json("vehicleAssets"),
  networkAnalysis: json("networkAnalysis"),
  digitalFingerprint: json("digitalFingerprint"),
  aliases: json("aliases"),
  communicationPatterns: json("communicationPatterns"),
  threatMatrix: json("threatMatrix"),
  deceptionIndicators: json("deceptionIndicators"),
  mediaSentiment: json("mediaSentiment"),
  domainInfrastructure: json("domainInfrastructure"),
  courtDocuments: json("courtDocuments"),
  professionalVerification: json("professionalVerification"),
  executiveSummary: text("executiveSummary"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: timestamp("completedAt"),
  pdfUrl: varchar("pdfUrl", { length: 512 }),
  pdfKey: varchar("pdfKey", { length: 512 }),
  imageUrl: varchar("imageUrl", { length: 512 }),
  imageKey: varchar("imageKey", { length: 512 }),
  monitoringEnabled: boolean("monitoringEnabled").default(false),
  lastMonitoredAt: timestamp("lastMonitoredAt"),
  monitoringTaskUid: varchar("monitoringTaskUid", { length: 65 }),
});

export const findings = mysqlTable("findings", {
  id: int("id").autoincrement().primaryKey(),
  investigationId: int("investigationId").notNull(),
  category: mysqlEnum("category", [
    "identity", "social_media", "public_records", "criminal", "dating", "professional",
    "breaches", "dark_web", "financial", "vehicles_assets", "digital_fingerprint",
    "aliases", "media_sentiment", "domain_infrastructure", "court_documents", "professional_verification"
  ]).notNull(),
  title: varchar("title", { length: 512 }).notNull(),
  content: text("content").notNull(),
  source: varchar("source", { length: 512 }).notNull(),
  sourceUrl: varchar("sourceUrl", { length: 1024 }),
  confidence: mysqlEnum("confidence", ["high", "medium", "low"]).default("medium").notNull(),
  // Source Reliability Rating (A1-F6 intelligence scale)
  sourceReliability: varchar("sourceReliability", { length: 4 }),
  corroborationCount: int("corroborationCount").default(1),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const annotations = mysqlTable("annotations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  investigationId: int("investigationId").notNull(),
  findingId: int("findingId"),
  content: text("content").notNull(),
  tag: varchar("tag", { length: 100 }),
  highlighted: boolean("highlighted").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const alerts = mysqlTable("alerts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  investigationId: int("investigationId").notNull(),
  type: varchar("type", { length: 100 }).notNull(),
  message: text("message").notNull(),
  isRead: boolean("isRead").default(false),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// API integration cache and raw data storage
export const apiCache = mysqlTable("apiCache", {
  id: int("id").autoincrement().primaryKey(),
  investigationId: int("investigationId").notNull(),
  apiProvider: varchar("apiProvider", { length: 100 }).notNull(), // 'pipl', 'spokeo', 'whois', 'news', 'breach', 'phone', 'social'
  rawData: json("rawData").notNull(),
  processedFindings: int("processedFindings").default(0),
  status: mysqlEnum("status", ["pending", "success", "failed"]).default("pending"),
  error: text("error"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"), // cache expiration
});

// ML-derived patterns and insights
export const mlInsights = mysqlTable("mlInsights", {
  id: int("id").autoincrement().primaryKey(),
  investigationId: int("investigationId").notNull(),
  userId: int("userId").notNull(),
  insightType: varchar("insightType", { length: 100 }).notNull(), // 'pattern', 'prediction', 'anomaly', 'risk_factor'
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  confidence: int("confidence").notNull(), // 0-100
  relatedInvestigationIds: json("relatedInvestigationIds"), // array of investigation IDs
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Cross-subject comparison results
export const subjectComparisons = mysqlTable("subjectComparisons", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  investigationId1: int("investigationId1").notNull(),
  investigationId2: int("investigationId2").notNull(),
  connectionStrength: int("connectionStrength").notNull(), // 0-100
  sharedConnections: json("sharedConnections"), // array of shared entities
  sharedLocations: json("sharedLocations"), // array of shared addresses
  sharedSocialAccounts: json("sharedSocialAccounts"), // array of shared usernames
  temporalOverlap: json("temporalOverlap"), // time periods when both were active in same location
  riskIndicators: json("riskIndicators"), // array of concerning patterns
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const bulkJobs = mysqlTable("bulkJobs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  status: mysqlEnum("status", ["pending", "running", "completed", "failed"]).default("pending").notNull(),
  totalSubjects: int("totalSubjects").default(0).notNull(),
  completedSubjects: int("completedSubjects").default(0).notNull(),
  investigationIds: json("investigationIds"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Investigation = typeof investigations.$inferSelect;
export type InsertInvestigation = typeof investigations.$inferInsert;
export type Finding = typeof findings.$inferSelect;
export type InsertFinding = typeof findings.$inferInsert;
export type Annotation = typeof annotations.$inferSelect;
export type InsertAnnotation = typeof annotations.$inferInsert;
export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = typeof alerts.$inferInsert;
export type BulkJob = typeof bulkJobs.$inferSelect;
export type InsertBulkJob = typeof bulkJobs.$inferInsert;
export type ApiCache = typeof apiCache.$inferSelect;
export type InsertApiCache = typeof apiCache.$inferInsert;
export type MlInsight = typeof mlInsights.$inferSelect;
export type InsertMlInsight = typeof mlInsights.$inferInsert;
export type SubjectComparison = typeof subjectComparisons.$inferSelect;
export type InsertSubjectComparison = typeof subjectComparisons.$inferInsert;
