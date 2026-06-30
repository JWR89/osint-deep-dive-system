import { z } from 'zod';
import { protectedProcedure } from './_core/trpc';
import { TRPCError } from '@trpc/server';
import { generateSimulatedAlerts, calculateAlertStats, filterAlerts } from './monitoring-simulator';
import { parse as parseCookie } from 'cookie';
import { COOKIE_NAME } from '@shared/const';
import { createHeartbeatJob, updateHeartbeatJob, deleteHeartbeatJob } from './_core/heartbeat';

/**
 * Create a monitoring job for an investigation
 */
export const createMonitoringJob = protectedProcedure
  .input(z.object({
    investigationId: z.number(),
    subjectName: z.string(),
    platforms: z.array(z.enum(['twitter', 'instagram', 'facebook', 'reddit', 'tiktok', 'linkedin'])).optional(),
  }))
  .mutation(async ({ ctx, input }) => {
    try {
      // Get session token from cookie
      const sessionToken = parseCookie(ctx.req.headers.cookie ?? '')[COOKIE_NAME] ?? '';
      if (!sessionToken) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Session token required' });
      }

      // Create a Heartbeat job for monitoring
      const jobName = `monitor-investigation-${input.investigationId}-${Date.now()}`;
      const job = await createHeartbeatJob({
        name: jobName,
        cron: '0 */5 * * * *', // Every 5 minutes
        path: '/api/scheduled/monitoring',
        payload: {
          investigationId: input.investigationId,
          subjectName: input.subjectName,
          platforms: input.platforms || ['twitter', 'instagram', 'facebook', 'reddit'],
        },
        description: `Monitor ${input.subjectName} across social platforms`,
      }, sessionToken);

      return {
        taskUid: job.taskUid,
        nextExecutionAt: job.nextExecutionAt,
        message: 'Monitoring job created successfully',
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create monitoring job',
      });
    }
  });

/**
 * Stop monitoring for an investigation
 */
export const stopMonitoring = protectedProcedure
  .input(z.object({
    taskUid: z.string(),
  }))
  .mutation(async ({ ctx, input }) => {
    try {
      const sessionToken = parseCookie(ctx.req.headers.cookie ?? '')[COOKIE_NAME] ?? '';
      if (!sessionToken) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Session token required' });
      }

      await deleteHeartbeatJob(input.taskUid, sessionToken);

      return {
        message: 'Monitoring stopped successfully',
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to stop monitoring',
      });
    }
  });

/**
 * Get simulated alerts for an investigation
 */
export const getMonitoringAlerts = protectedProcedure
  .input(z.object({
    investigationId: z.number(),
    subjectName: z.string(),
    limit: z.number().default(10),
    platform: z.string().optional(),
    severity: z.string().optional(),
  }))
  .query(({ input }) => {
    // Generate simulated alerts
    const alerts = generateSimulatedAlerts(
      input.investigationId,
      input.subjectName,
      input.limit
    );

    // Filter if criteria provided
    const filtered = filterAlerts(alerts, {
      platform: input.platform,
      severity: input.severity as any,
    });

    // Calculate statistics
    const stats = calculateAlertStats(alerts);

    return {
      alerts: filtered,
      stats,
      totalGenerated: alerts.length,
    };
  });

/**
 * Get alert statistics for an investigation
 */
export const getAlertStatistics = protectedProcedure
  .input(z.object({
    investigationId: z.number(),
    subjectName: z.string(),
  }))
  .query(({ input }) => {
    // Generate a larger set for statistics
    const alerts = generateSimulatedAlerts(
      input.investigationId,
      input.subjectName,
      50
    );

    const stats = calculateAlertStats(alerts);

    return {
      ...stats,
      lastUpdated: new Date().toISOString(),
    };
  });
