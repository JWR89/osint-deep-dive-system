import { desc, eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  investigations, findings,
  annotations, alerts, bulkJobs,
  InsertInvestigation, InsertFinding,
  InsertAnnotation, InsertAlert, InsertBulkJob
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// --- Investigation Helpers ---

export async function createInvestigation(data: InsertInvestigation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(investigations).values(data);
  return result[0].insertId;
}

export async function getInvestigationById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(investigations).where(eq(investigations.id, id)).limit(1);
  return result[0] ?? null;
}

export async function getUserInvestigations(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(investigations).where(eq(investigations.userId, userId)).orderBy(desc(investigations.createdAt));
}

export async function updateInvestigation(id: number, data: Partial<Pick<typeof investigations.$inferSelect, 'status' | 'progress' | 'currentSource' | 'completedAt' | 'pdfUrl' | 'pdfKey' | 'riskScore' | 'riskBreakdown' | 'relationships' | 'timeline' | 'geolocations' | 'monitoringEnabled' | 'lastMonitoredAt' | 'monitoringTaskUid' | 'executiveSummary' | 'patternOfLife' | 'financialFootprint' | 'vehicleAssets' | 'networkAnalysis' | 'digitalFingerprint' | 'aliases' | 'communicationPatterns' | 'threatMatrix' | 'deceptionIndicators' | 'mediaSentiment' | 'domainInfrastructure' | 'courtDocuments' | 'professionalVerification'>>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(investigations).set(data).where(eq(investigations.id, id));
}

export async function deleteInvestigation(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(annotations).where(eq(annotations.investigationId, id));
  await db.delete(alerts).where(eq(alerts.investigationId, id));
  await db.delete(findings).where(eq(findings.investigationId, id));
  await db.delete(investigations).where(eq(investigations.id, id));
}

// --- Findings Helpers ---

export async function addFinding(data: InsertFinding) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(findings).values(data);
  return result[0].insertId;
}

export async function addFindings(data: InsertFinding[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (data.length === 0) return;
  await db.insert(findings).values(data);
}

export async function getInvestigationFindings(investigationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(findings).where(eq(findings.investigationId, investigationId)).orderBy(findings.category, findings.createdAt);
}

// --- Annotations Helpers ---

export async function createAnnotation(data: InsertAnnotation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(annotations).values(data);
  return result[0].insertId;
}

export async function getInvestigationAnnotations(investigationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(annotations).where(eq(annotations.investigationId, investigationId)).orderBy(desc(annotations.createdAt));
}

export async function getAnnotationById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(annotations).where(eq(annotations.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateAnnotation(id: number, data: Partial<Pick<typeof annotations.$inferSelect, 'content' | 'tag' | 'highlighted'>>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(annotations).set(data).where(eq(annotations.id, id));
}

export async function deleteAnnotation(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(annotations).where(eq(annotations.id, id));
}

// --- Alerts Helpers ---

export async function createAlert(data: InsertAlert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(alerts).values(data);
  return result[0].insertId;
}

export async function getUserAlerts(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(alerts).where(eq(alerts.userId, userId)).orderBy(desc(alerts.createdAt));
}

export async function getAlertById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(alerts).where(eq(alerts.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function markAlertRead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(alerts).set({ isRead: true }).where(eq(alerts.id, id));
}

export async function getUnreadAlertCount(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(alerts).where(and(eq(alerts.userId, userId), eq(alerts.isRead, false)));
  return result.length;
}

// --- Bulk Jobs Helpers ---

export async function createBulkJob(data: InsertBulkJob) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(bulkJobs).values(data);
  return result[0].insertId;
}

export async function getBulkJobById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(bulkJobs).where(eq(bulkJobs.id, id)).limit(1);
  return result[0] ?? null;
}

export async function getUserBulkJobs(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(bulkJobs).where(eq(bulkJobs.userId, userId)).orderBy(desc(bulkJobs.createdAt));
}

export async function updateBulkJob(id: number, data: Partial<Pick<typeof bulkJobs.$inferSelect, 'status' | 'completedSubjects' | 'investigationIds'>>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(bulkJobs).set(data).where(eq(bulkJobs.id, id));
}

// --- Monitoring Helpers ---

export async function getMonitoredInvestigations() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(investigations).where(eq(investigations.monitoringEnabled, true));
}
