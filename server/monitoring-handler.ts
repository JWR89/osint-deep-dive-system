import type { Request, Response } from "express";
import { sdk } from "./_core/sdk";
import { getDb } from "./db";
import { investigations, findings, alerts } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";

/**
 * Scheduled monitoring handler.
 * Called by the Heartbeat cron system at /api/scheduled/monitoring.
 * Looks up the investigation by taskUid, re-runs a lightweight check,
 * and creates an alert if new information is found.
 */
export async function monitoringHandler(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    
    if (!(user as any).isCron || !(user as any).taskUid) {
      return res.status(403).json({ error: "cron-only" });
    }

    const taskUid = (user as any).taskUid as string;
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    // Look up the investigation by monitoringTaskUid
    const [investigation] = await db
      .select()
      .from(investigations)
      .where(eq(investigations.monitoringTaskUid, taskUid))
      .limit(1);

    if (!investigation) {
      // Orphan cron — return 200 so platform stops retrying
      return res.json({ ok: true, skipped: "orphan" });
    }

    if (!investigation.monitoringEnabled) {
      return res.json({ ok: true, skipped: "monitoring_disabled" });
    }

    // Get existing findings count for comparison
    const existingFindings = await db
      .select()
      .from(findings)
      .where(eq(findings.investigationId, investigation.id));

    const existingCount = existingFindings.length;

    // Run a lightweight re-check using LLM
    const subjectDetails = investigation.subjectDetails as any;
    const subjectInfo = [
      `Name: ${investigation.subjectName}`,
      subjectDetails?.email ? `Email: ${subjectDetails.email}` : null,
      subjectDetails?.username ? `Username: ${subjectDetails.username}` : null,
      subjectDetails?.location ? `Location: ${subjectDetails.location}` : null,
    ].filter(Boolean).join(", ");

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are an OSINT monitoring agent. Check if there would be any NEW public information about this subject since the last check. Respond with JSON only.",
        },
        {
          role: "user",
          content: `Subject: ${subjectInfo}. Last monitored: ${investigation.lastMonitoredAt?.toISOString() || "never"}. Existing findings count: ${existingCount}. Check for any new social media posts, public records changes, news mentions, or other publicly available updates. Respond with: {"hasNewInfo": true/false, "summary": "brief description of what's new or 'No new information found'", "category": "social_media"|"public_records"|"criminal"|"professional"|"breaches"|"dark_web"|"identity"|"dating"}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "monitoring_check",
          strict: true,
          schema: {
            type: "object",
            properties: {
              hasNewInfo: { type: "boolean" },
              summary: { type: "string" },
              category: { type: "string", enum: ["social_media", "public_records", "criminal", "professional", "breaches", "dark_web", "identity", "dating"] },
            },
            required: ["hasNewInfo", "summary", "category"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    let checkResult = { hasNewInfo: false, summary: "No new information found", category: "identity" };
    
    if (content && typeof content === "string") {
      try {
        checkResult = JSON.parse(content);
      } catch {
        // Use default
      }
    }

    // Update lastMonitoredAt
    await db
      .update(investigations)
      .set({ lastMonitoredAt: new Date() })
      .where(eq(investigations.id, investigation.id));

    // If new info found, create an alert
    if (checkResult.hasNewInfo) {
      await db.insert(alerts).values({
        userId: investigation.userId,
        investigationId: investigation.id,
        type: "monitoring_update",
        message: `New information detected for ${investigation.subjectName}: ${checkResult.summary}`,
        metadata: {
          category: checkResult.category,
          detectedAt: new Date().toISOString(),
        },
      });
    }

    return res.json({
      ok: true,
      investigationId: investigation.id,
      hasNewInfo: checkResult.hasNewInfo,
      summary: checkResult.summary,
    });
  } catch (error: any) {
    console.error("[Monitoring] Handler error:", error);
    return res.status(500).json({
      error: error.message || "Internal error",
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      context: { url: req.url, taskUid: (error as any)?.taskUid },
      timestamp: new Date().toISOString(),
    });
  }
}
