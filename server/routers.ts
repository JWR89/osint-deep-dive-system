import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  createInvestigation,
  getInvestigationById,
  getUserInvestigations,
  updateInvestigation,
  deleteInvestigation,
  getInvestigationFindings,
  createAnnotation,
  getAnnotationById,
  getInvestigationAnnotations,
  updateAnnotation,
  deleteAnnotation,
  createAlert,
  getAlertById,
  getUserAlerts,
  markAlertRead,
  getUnreadAlertCount,
  createBulkJob,
  getBulkJobById,
  getUserBulkJobs,
  updateBulkJob,
  createSocialMediaProfile,
  getSocialMediaProfiles,
  getSocialMediaProfileById,
  updateSocialMediaProfile,
  deleteSocialMediaProfile,
} from "./db";
import { runInvestigation, getOSINTSources } from "./osint-engine";
import { generatePdfReport } from "./pdf-generator";
import { storagePut } from "./storage";
import { TRPCError } from "@trpc/server";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  investigation: router({
    // Upload subject image
    uploadImage: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        fileData: z.string(), // base64 encoded
        mimeType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const buffer = Buffer.from(input.fileData, "base64");
        const fileKey = `investigations/${ctx.user.id}/${Date.now()}-${input.fileName}`;
        const { key, url } = await storagePut(fileKey, buffer, input.mimeType);
        return { key, url };
      }),

    // Start a new investigation
    start: protectedProcedure
      .input(z.object({
        name: z.string().min(1, "Subject name is required"),
        age: z.string().optional(),
        location: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        username: z.string().optional(),
        employer: z.string().optional(),
        additionalInfo: z.string().optional(),
        imageUrl: z.string().optional(),
        imageKey: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const investigationId = await createInvestigation({
          userId: ctx.user.id,
          subjectName: input.name,
          subjectDetails: input,
          status: "pending",
          progress: 0,
          imageUrl: input.imageUrl || null,
          imageKey: input.imageKey || null,
        });

        // Run investigation in background (non-blocking)
        runInvestigation(investigationId, {
          name: input.name,
          age: input.age,
          location: input.location,
          email: input.email,
          phone: input.phone,
          username: input.username,
          employer: input.employer,
          additionalInfo: input.additionalInfo,
          imageUrl: input.imageUrl,
        }).catch(err => {
          console.error("[Investigation] Background run failed:", err);
        });

        return { id: investigationId };
      }),

    // Get investigation status and progress
    status: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const investigation = await getInvestigationById(input.id);
        if (!investigation) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Investigation not found" });
        }
        if (investigation.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }
        return investigation;
      }),

    // Get full report with findings
    report: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const investigation = await getInvestigationById(input.id);
        if (!investigation) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Investigation not found" });
        }
        if (investigation.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }
        const findings = await getInvestigationFindings(input.id);
        return { investigation, findings };
      }),

    // List all user investigations (history)
    list: protectedProcedure.query(async ({ ctx }) => {
      return getUserInvestigations(ctx.user.id);
    }),

    // Delete an investigation
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const investigation = await getInvestigationById(input.id);
        if (!investigation) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Investigation not found" });
        }
        if (investigation.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }
        await deleteInvestigation(input.id);
        return { success: true };
      }),

    // Generate PDF report
    exportPdf: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const investigation = await getInvestigationById(input.id);
        if (!investigation) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Investigation not found" });
        }
        if (investigation.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }
        if (investigation.status !== "completed") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Investigation must be completed before export" });
        }

        // If PDF already generated, return existing URL
        if (investigation.pdfUrl) {
          return { url: investigation.pdfUrl };
        }

        const findings = await getInvestigationFindings(input.id);
        const { url, key } = await generatePdfReport(investigation, findings);
        
        await updateInvestigation(input.id, { pdfUrl: url, pdfKey: key });
        return { url };
      }),

    // Toggle monitoring
    toggleMonitoring: protectedProcedure
      .input(z.object({ id: z.number(), enabled: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        const investigation = await getInvestigationById(input.id);
        if (!investigation) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Investigation not found" });
        }
        if (investigation.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }

        const { parse: parseCookie } = await import("cookie");
        const { COOKIE_NAME } = await import("@shared/const");
        const { createHeartbeatJob, deleteHeartbeatJob } = await import("./_core/heartbeat");

        const sessionToken = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";

        if (input.enabled) {
          // Create a heartbeat cron job for daily monitoring (every 24 hours)
          try {
            const job = await createHeartbeatJob({
              name: `monitor-investigation-${input.id}`,
              cron: "0 0 9 * * *", // Daily at 9am UTC
              path: "/api/scheduled/monitoring",
              payload: { investigationId: input.id },
              description: `Daily monitoring for ${investigation.subjectName}`,
            }, sessionToken);

            await updateInvestigation(input.id, {
              monitoringEnabled: true,
              monitoringTaskUid: job.taskUid,
            });
          } catch (err: any) {
            // If heartbeat creation fails, still enable the flag for UI consistency
            console.error("[Monitoring] Failed to create heartbeat job:", err);
            await updateInvestigation(input.id, { monitoringEnabled: true });
          }
        } else {
          // Delete the heartbeat cron job
          if (investigation.monitoringTaskUid) {
            try {
              await deleteHeartbeatJob(investigation.monitoringTaskUid, sessionToken);
            } catch (err: any) {
              console.error("[Monitoring] Failed to delete heartbeat job:", err);
            }
          }
          await updateInvestigation(input.id, {
            monitoringEnabled: false,
            monitoringTaskUid: null,
          });
        }

        return { success: true, enabled: input.enabled };
      }),

    // Get available OSINT sources
    sources: publicProcedure.query(() => {
      return getOSINTSources();
    }),
  }),

  // Annotations router
  annotations: router({
    list: protectedProcedure
      .input(z.object({ investigationId: z.number() }))
      .query(async ({ ctx, input }) => {
        const investigation = await getInvestigationById(input.investigationId);
        if (!investigation || investigation.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }
        return getInvestigationAnnotations(input.investigationId);
      }),

    create: protectedProcedure
      .input(z.object({
        investigationId: z.number(),
        findingId: z.number().optional(),
        content: z.string().min(1),
        tag: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const investigation = await getInvestigationById(input.investigationId);
        if (!investigation || investigation.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }
        const id = await createAnnotation({
          userId: ctx.user.id,
          investigationId: input.investigationId,
          findingId: input.findingId || null,
          content: input.content,
          tag: input.tag || null,
        });
        return { id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        content: z.string().optional(),
        tag: z.string().optional(),
        highlighted: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const annotation = await getAnnotationById(input.id);
        if (!annotation) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Annotation not found" });
        }
        if (annotation.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }
        const updateData: any = {};
        if (input.content !== undefined) updateData.content = input.content;
        if (input.tag !== undefined) updateData.tag = input.tag;
        if (input.highlighted !== undefined) updateData.highlighted = input.highlighted;
        await updateAnnotation(input.id, updateData);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const annotation = await getAnnotationById(input.id);
        if (!annotation) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Annotation not found" });
        }
        if (annotation.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }
        await deleteAnnotation(input.id);
        return { success: true };
      }),
  }),

  // Alerts router
  alerts: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getUserAlerts(ctx.user.id);
    }),

    unreadCount: protectedProcedure.query(async ({ ctx }) => {
      return getUnreadAlertCount(ctx.user.id);
    }),

    markRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const alert = await getAlertById(input.id);
        if (!alert) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Alert not found" });
        }
        if (alert.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }
        await markAlertRead(input.id);
        return { success: true };
      }),
  }),

  // Bulk investigation router
  bulk: router({
    start: protectedProcedure
      .input(z.object({
        subjects: z.array(z.object({
          name: z.string().min(1),
          age: z.string().optional(),
          location: z.string().optional(),
          email: z.string().optional(),
          phone: z.string().optional(),
          username: z.string().optional(),
          employer: z.string().optional(),
          additionalInfo: z.string().optional(),
        })).min(1).max(50),
      }))
      .mutation(async ({ ctx, input }) => {
        const bulkJobId = await createBulkJob({
          userId: ctx.user.id,
          status: "running",
          totalSubjects: input.subjects.length,
          completedSubjects: 0,
          investigationIds: [],
        });

        // Start all investigations in background
        (async () => {
          const investigationIds: number[] = [];
          for (let i = 0; i < input.subjects.length; i++) {
            const subject = input.subjects[i];
            try {
              const investigationId = await createInvestigation({
                userId: ctx.user.id,
                subjectName: subject.name,
                subjectDetails: subject,
                status: "pending",
                progress: 0,
              });
              investigationIds.push(investigationId);

              await runInvestigation(investigationId, {
                name: subject.name,
                age: subject.age,
                location: subject.location,
                email: subject.email,
                phone: subject.phone,
                username: subject.username,
                employer: subject.employer,
                additionalInfo: subject.additionalInfo,
              });

              await updateBulkJob(bulkJobId, {
                completedSubjects: i + 1,
                investigationIds,
              });
            } catch (err) {
              console.error(`[Bulk] Failed investigation for ${subject.name}:`, err);
            }
          }

          await updateBulkJob(bulkJobId, {
            status: "completed",
            completedSubjects: input.subjects.length,
            investigationIds,
          });

          // Create alert for completion
          await createAlert({
            userId: ctx.user.id,
            investigationId: investigationIds[0] || 0,
            type: "bulk_complete",
            message: `Bulk investigation completed: ${input.subjects.length} subjects processed.`,
            metadata: { bulkJobId, investigationIds },
          });
        })().catch(err => {
          console.error("[Bulk] Background processing failed:", err);
          updateBulkJob(bulkJobId, { status: "failed" });
        });

        return { id: bulkJobId };
      }),

    status: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const job = await getBulkJobById(input.id);
        if (!job) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Bulk job not found" });
        }
        if (job.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }
        return job;
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      return getUserBulkJobs(ctx.user.id);
    }),
  }),

  socialMedia: router({
    // Get all social media profiles for an investigation
    getProfiles: protectedProcedure
      .input(z.object({ investigationId: z.number() }))
      .query(async ({ input }) => {
        return getSocialMediaProfiles(input.investigationId);
      }),

    // Get a single profile by ID
    getProfile: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const profile = await getSocialMediaProfileById(input.id);
        if (!profile) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Profile not found" });
        }
        return profile;
      }),

    // Add a social media profile with URL and optional manual data
    addProfile: protectedProcedure
      .input(z.object({
        investigationId: z.number(),
        platform: z.enum(["twitter", "instagram", "tiktok", "facebook", "reddit", "youtube", "pinterest", "snapchat"]),
        username: z.string().min(1),
        profileUrl: z.string().optional(),
        // Manual data entry fields
        bio: z.string().optional(),
        followers: z.number().optional(),
        following: z.number().optional(),
        posts: z.array(z.object({
          content: z.string(),
          timestamp: z.string().optional(),
          likes: z.number().optional(),
          comments: z.number().optional(),
          shares: z.number().optional(),
          url: z.string().optional(),
        })).optional(),
      }))
      .mutation(async ({ input }) => {
        const profileData: any = {};
        if (input.bio) profileData.bio = input.bio;
        if (input.followers != null) profileData.followers = input.followers;
        if (input.following != null) profileData.following = input.following;

        const posts = input.posts?.map((p, i) => ({
          id: `post-${Date.now()}-${i}`,
          ...p,
          timestamp: p.timestamp || new Date().toISOString(),
        })) || [];

        const hasData = input.bio || input.followers != null || (input.posts && input.posts.length > 0);

        const id = await createSocialMediaProfile({
          investigationId: input.investigationId,
          platform: input.platform,
          username: input.username,
          profileUrl: input.profileUrl || null,
          profileData: Object.keys(profileData).length > 0 ? profileData : null,
          posts: posts.length > 0 ? posts : null,
          followers: input.followers || null,
          following: input.following || null,
          scrapingStatus: hasData ? "success" : "pending",
          lastScrapedAt: hasData ? new Date() : null,
        });
        return { id };
      }),

    // Update a profile with manually entered data (from user or Grok analysis)
    updateProfileData: protectedProcedure
      .input(z.object({
        id: z.number(),
        bio: z.string().optional(),
        followers: z.number().optional(),
        following: z.number().optional(),
        verified: z.boolean().optional(),
        posts: z.array(z.object({
          content: z.string(),
          timestamp: z.string().optional(),
          likes: z.number().optional(),
          comments: z.number().optional(),
          shares: z.number().optional(),
          url: z.string().optional(),
        })).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const profile = await getSocialMediaProfileById(input.id);
        if (!profile) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Profile not found" });
        }

        const existingData = (profile.profileData as any) || {};
        const profileData: any = { ...existingData };
        if (input.bio !== undefined) profileData.bio = input.bio;
        if (input.followers !== undefined) profileData.followers = input.followers;
        if (input.following !== undefined) profileData.following = input.following;
        if (input.verified !== undefined) profileData.verified = input.verified;
        if (input.notes !== undefined) profileData.notes = input.notes;

        const posts = input.posts?.map((p, i) => ({
          id: `post-${Date.now()}-${i}`,
          ...p,
          timestamp: p.timestamp || new Date().toISOString(),
        }));

        const updateData: any = {
          profileData,
          lastScrapedAt: new Date(),
          scrapingStatus: "success",
          scrapingError: null,
        };

        if (input.followers !== undefined) updateData.followers = input.followers;
        if (input.following !== undefined) updateData.following = input.following;
        if (posts) updateData.posts = posts;

        await updateSocialMediaProfile(input.id, updateData);
        return { success: true };
      }),

    // Auto-scrape using API (Reddit and YouTube only)
    scrapeProfile: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const profile = await getSocialMediaProfileById(input.id);
        if (!profile) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Profile not found" });
        }

        const { supportsAutoScrape, scrapeSocialMediaProfile } = await import("./social-media-scrapers");

        if (!supportsAutoScrape(profile.platform)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `${profile.platform} does not support auto-scraping. Please enter data manually or use the Grok prompt to analyze the profile.`,
          });
        }

        try {
          await updateSocialMediaProfile(input.id, { scrapingStatus: "pending" });
          const result = await scrapeSocialMediaProfile(profile.platform, profile.username);

          await updateSocialMediaProfile(input.id, {
            profileData: result.profileData as any,
            posts: result.posts as any,
            stories: result.stories as any || null,
            followers: result.profileData.followers || null,
            following: result.profileData.following || null,
            engagementMetrics: result.engagementMetrics as any || null,
            lastScrapedAt: new Date(),
            scrapingStatus: "success",
            scrapingError: null,
          });

          return { success: true, data: result };
        } catch (error: any) {
          await updateSocialMediaProfile(input.id, {
            scrapingStatus: "failed",
            scrapingError: error.message || "Unknown scraping error",
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Scraping failed: ${error.message}`,
          });
        }
      }),

    // Scrape all API-supported profiles for an investigation
    scrapeAll: protectedProcedure
      .input(z.object({ investigationId: z.number() }))
      .mutation(async ({ input }) => {
        const profiles = await getSocialMediaProfiles(input.investigationId);
        const { supportsAutoScrape, scrapeSocialMediaProfile } = await import("./social-media-scrapers");

        const results = [];
        for (const profile of profiles) {
          if (!supportsAutoScrape(profile.platform)) {
            results.push({ id: profile.id, success: false, error: `${profile.platform} requires manual data entry` });
            continue;
          }
          try {
            const result = await scrapeSocialMediaProfile(profile.platform, profile.username);
            await updateSocialMediaProfile(profile.id, {
              profileData: result.profileData as any,
              posts: result.posts as any,
              stories: result.stories as any || null,
              followers: result.profileData.followers || null,
              following: result.profileData.following || null,
              engagementMetrics: result.engagementMetrics as any || null,
              lastScrapedAt: new Date(),
              scrapingStatus: "success",
              scrapingError: null,
            });
            results.push({ id: profile.id, success: true });
          } catch (error: any) {
            await updateSocialMediaProfile(profile.id, {
              scrapingStatus: "failed",
              scrapingError: error.message || "Unknown error",
            });
            results.push({ id: profile.id, success: false, error: error.message });
          }
        }
        return { results };
      }),

    // Delete a social media profile
    deleteProfile: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteSocialMediaProfile(input.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
