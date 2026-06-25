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
  category: mysqlEnum("category", ["identity", "social_media", "public_records", "criminal", "dating", "professional", "breaches", "dark_web"]).notNull(),
  title: varchar("title", { length: 512 }).notNull(),
  content: text("content").notNull(),
  source: varchar("source", { length: 512 }).notNull(),
  sourceUrl: varchar("sourceUrl", { length: 1024 }),
  confidence: mysqlEnum("confidence", ["high", "medium", "low"]).default("medium").notNull(),
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
