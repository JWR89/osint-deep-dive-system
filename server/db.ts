import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, investigations, findings, InsertInvestigation, InsertFinding } from "../drizzle/schema";
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

export async function updateInvestigation(id: number, data: Partial<Pick<typeof investigations.$inferSelect, 'status' | 'progress' | 'currentSource' | 'completedAt' | 'pdfUrl' | 'pdfKey'>>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(investigations).set(data).where(eq(investigations.id, id));
}

export async function deleteInvestigation(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
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
