/**
 * Analytics Controller
 * Handles analytics and dashboard statistics
 */

import { Response, NextFunction } from 'express';
import { prisma } from '../db';
import { AuthRequest } from '../types';
import { ApiResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';

/**
 * Get dashboard statistics
 * GET /api/analytics/dashboard
 */
export const getDashboardStats = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate as string);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate as string);
    }

    // Get counts
    const [
      totalFirewalls,
      activeFirewalls,
      totalRules,
      totalAuditLogs,
      blockedRequests,
      sanitizedRequests,
      allowedRequests,
    ] = await Promise.all([
      prisma.firewall.count({ where: { userId } }),
      prisma.firewall.count({ where: { userId, isActive: true } }),
      prisma.rule.count({
        where: {
          firewall: { userId },
        },
      }),
      prisma.auditLog.count({
        where: {
          userId,
          ...(Object.keys(dateFilter).length > 0 && {
            createdAt: dateFilter,
          }),
        },
      }),
      prisma.auditLog.count({
        where: {
          userId,
          action: 'BLOCKED',
          ...(Object.keys(dateFilter).length > 0 && {
            createdAt: dateFilter,
          }),
        },
      }),
      prisma.auditLog.count({
        where: {
          userId,
          action: 'REDACTED',
          ...(Object.keys(dateFilter).length > 0 && {
            createdAt: dateFilter,
          }),
        },
      }),
      prisma.auditLog.count({
        where: {
          userId,
          action: 'ALLOWED',
          ...(Object.keys(dateFilter).length > 0 && {
            createdAt: dateFilter,
          }),
        },
      }),
    ]);

    // Get detection type breakdown
    const recentLogs = await prisma.auditLog.findMany({
      where: {
        userId,
        ...(Object.keys(dateFilter).length > 0 && {
          createdAt: dateFilter,
        }),
      },
      select: {
        detectedIssues: true,
      },
      take: 1000, // Limit for performance
    });

    // Aggregate detection types
    const detectionTypes: { [key: string]: number } = {};
    recentLogs.forEach((log) => {
      if (Array.isArray(log.detectedIssues)) {
        (log.detectedIssues as any[]).forEach((issue: any) => {
          const type = issue.type || 'UNKNOWN';
          detectionTypes[type] = (detectionTypes[type] || 0) + 1;
        });
      }
    });

    res.status(200).json(
      new ApiResponse(
        200,
        {
          overview: {
            totalFirewalls,
            activeFirewalls,
            totalRules,
            totalRequests: totalAuditLogs,
          },
          requests: {
            blocked: blockedRequests,
            sanitized: sanitizedRequests,
            allowed: allowedRequests,
            total: totalAuditLogs,
          },
          detectionTypes,
        },
        'Dashboard stats retrieved successfully'
      )
    );
  }
);

/**
 * Get request timeline data for charts
 * GET /api/analytics/timeline
 */
export const getTimeline = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const { days = '30', firewallId } = req.query;

    const daysNum = parseInt(days as string);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    // Build where clause
    const where: any = {
      userId,
      createdAt: {
        gte: startDate,
      },
    };

    if (firewallId) {
      where.firewallId = firewallId;
    }

    // Get logs grouped by date
    const logs = await prisma.auditLog.findMany({
      where,
      select: {
        createdAt: true,
        action: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group by date
    const timeline: {
      [date: string]: {
        blocked: number;
        sanitized: number;
        allowed: number;
        total: number;
      };
    } = {};

    logs.forEach((log) => {
      const date = log.createdAt.toISOString().split('T')[0];
      if (!timeline[date]) {
        timeline[date] = { blocked: 0, sanitized: 0, allowed: 0, total: 0 };
      }
      timeline[date].total++;
      if (log.action === 'BLOCKED') {
        timeline[date].blocked++;
      } else if (log.action === 'REDACTED') {
        timeline[date].sanitized++;
      } else if (log.action === 'ALLOWED') {
        timeline[date].allowed++;
      }
    });

    // Convert to array format
    const timelineArray = Object.entries(timeline).map(([date, stats]) => ({
      date,
      ...stats,
    }));

    res.status(200).json(
      new ApiResponse(200, timelineArray, 'Timeline data retrieved successfully')
    );
  }
);

/**
 * Get top detected patterns
 * GET /api/analytics/patterns
 */
export const getTopPatterns = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const { limit = '10', startDate, endDate } = req.query;

    const limitNum = parseInt(limit as string);

    // Build date filter
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate as string);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate as string);
    }

    // Get recent logs
    const logs = await prisma.auditLog.findMany({
      where: {
        userId,
        ...(Object.keys(dateFilter).length > 0 && {
          createdAt: dateFilter,
        }),
      },
      select: {
        detectedIssues: true,
      },
      take: 5000, // Limit for performance
    });

    // Count pattern occurrences
    const patternCounts: { [key: string]: number } = {};
    logs.forEach((log) => {
      if (Array.isArray(log.detectedIssues)) {
        (log.detectedIssues as any[]).forEach((issue: any) => {
          const type = issue.type || 'UNKNOWN';
          patternCounts[type] = (patternCounts[type] || 0) + 1;
        });
      }
    });

    // Convert to array and sort
    const patterns = Object.entries(patternCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limitNum);

    res.status(200).json(
      new ApiResponse(200, patterns, 'Top patterns retrieved successfully')
    );
  }
);

/**
 * Get firewall performance metrics
 * GET /api/analytics/firewall-performance
 */
export const getFirewallPerformance = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate as string);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate as string);
    }

    // Get all user firewalls
    const firewalls = await prisma.firewall.findMany({
      where: { userId },
      include: {
        _count: {
          select: {
            rules: true,
          },
        },
      },
    });

    // Get log counts per firewall
    const performance = await Promise.all(
      firewalls.map(async (firewall) => {
        const [totalRequests, blockedRequests, detections] = await Promise.all([
          prisma.auditLog.count({
            where: {
              firewallId: firewall.id,
              ...(Object.keys(dateFilter).length > 0 && {
                createdAt: dateFilter,
              }),
            },
          }),
          prisma.auditLog.count({
            where: {
              firewallId: firewall.id,
              action: 'BLOCKED',
              ...(Object.keys(dateFilter).length > 0 && {
                createdAt: dateFilter,
              }),
            },
          }),
          prisma.auditLog.findMany({
            where: {
              firewallId: firewall.id,
              ...(Object.keys(dateFilter).length > 0 && {
                createdAt: dateFilter,
              }),
            },
            select: {
              detectedIssues: true,
            },
          }),
        ]);

        // Count total detections
        let totalDetections = 0;
        detections.forEach((log) => {
          if (Array.isArray(log.detectedIssues)) {
            totalDetections += (log.detectedIssues as any[]).length;
          }
        });

        return {
          firewallId: firewall.id,
          firewallName: firewall.name,
          isActive: firewall.isActive,
          rulesCount: firewall._count.rules,
          totalRequests,
          blockedRequests,
          totalDetections,
          blockRate: totalRequests > 0 ? (blockedRequests / totalRequests) * 100 : 0,
        };
      })
    );

    // Sort by total requests
    performance.sort((a, b) => b.totalRequests - a.totalRequests);

    res.status(200).json(
      new ApiResponse(
        200,
        performance,
        'Firewall performance metrics retrieved successfully'
      )
    );
  }
);
