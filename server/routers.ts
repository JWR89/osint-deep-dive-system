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
} from "./db";
import { runInvestigation, getOSINTSources } from "./osint-engine";
import { generatePdfReport } from "./pdf-generator";
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
      }))
      .mutation(async ({ ctx, input }) => {
        const investigationId = await createInvestigation({
          userId: ctx.user.id,
          subjectName: input.name,
          subjectDetails: input,
          status: "pending",
          progress: 0,
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

    // Get available OSINT sources
    sources: publicProcedure.query(() => {
      return getOSINTSources();
    }),
  }),
});

export type AppRouter = typeof appRouter;
