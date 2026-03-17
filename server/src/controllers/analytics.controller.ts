/**
 * Analytics Controller
 * Handles analytics and dashboard statistics
 */

import { Response, NextFunction } from 'express';
import { prisma } from '../db';
import { AuthRequest } from '../types';
import { ApiError } from '../utils/apiError';
import { ApiResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';

const normalizeQueryParam = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const buildAnalyticsScopeFilters = async (
  req: AuthRequest,
  organizationIdParam: unknown,
  teamIdParam: unknown
): Promise<{ userFilter: any; firewallFilter: any }> => {
  const userId = req.user!.id;
  const requestedOrganizationId = normalizeQueryParam(organizationIdParam);
  const requestedTeamId = normalizeQueryParam(teamIdParam);
  const effectiveOrganizationId = requestedOrganizationId || req.user?.organizationId;

  let userIds: string[] = [userId];
  let teamIds: string[] = [];
  let includeOrganizationFirewalls = false;

  if (effectiveOrganizationId) {
    const membership = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: effectiveOrganizationId,
        },
      },
    });

    if (!membership) {
      if (requestedOrganizationId) {
        throw new ApiError(403, 'You are not a member of this organization');
      }
    } else if (membership.role === 'ADMIN') {
      if (requestedTeamId) {
        const team = await prisma.team.findFirst({
          where: {
            id: requestedTeamId,
            organizationId: effectiveOrganizationId,
          },
          select: {
            id: true,
          },
        });

        if (!team) {
          throw new ApiError(403, 'Team not found in your organization');
        }

        teamIds = [team.id];

        const teamMembers = await prisma.teamMember.findMany({
          where: {
            teamId: team.id,
          },
          select: {
            userId: true,
          },
        });

        userIds = Array.from(new Set(teamMembers.map((member) => member.userId)));
      } else {
        const orgMembers = await prisma.organizationMember.findMany({
          where: {
            organizationId: effectiveOrganizationId,
          },
          select: {
            userId: true,
          },
        });

        userIds = Array.from(new Set(orgMembers.map((member) => member.userId)));
        includeOrganizationFirewalls = true;
      }
    } else {
      const managerMemberships = await prisma.teamMember.findMany({
        where: {
          userId,
          role: 'MANAGER',
          team: {
            organizationId: effectiveOrganizationId,
          },
          ...(requestedTeamId ? { teamId: requestedTeamId } : {}),
        },
        select: {
          teamId: true,
        },
      });

      teamIds = Array.from(new Set(managerMemberships.map((membershipItem) => membershipItem.teamId)));

      if (requestedTeamId && teamIds.length === 0) {
        throw new ApiError(403, 'You can only access teams you manage');
      }

      if (teamIds.length > 0) {
        const teamMembers = await prisma.teamMember.findMany({
          where: {
            teamId: {
              in: teamIds,
            },
          },
          select: {
            userId: true,
          },
        });

        userIds = Array.from(new Set(teamMembers.map((member) => member.userId)));
      }
    }
  }

  const userFilter = {
    userId: {
      in: userIds,
    },
  };

  const firewallFilters: any[] = [
    {
      userId: {
        in: userIds,
      },
    },
  ];

  if (teamIds.length > 0) {
    firewallFilters.push({
      teamId: {
        in: teamIds,
      },
    });
  }

  if (includeOrganizationFirewalls && effectiveOrganizationId) {
    firewallFilters.push({
      organizationId: effectiveOrganizationId,
    });
  }

  const firewallFilter = firewallFilters.length === 1
    ? firewallFilters[0]
    : { OR: firewallFilters };

  return {
    userFilter,
    firewallFilter,
  };
};

/**
 * Get dashboard statistics
 * 
 * Role-based:
 * - Org Admin: sees all org stats (all teams, all members)
 * - Team Manager: sees stats for their team members
 * - Member: sees only their own stats
 * - Individual: sees only their own stats
 * 
 * GET /api/analytics/dashboard
 * Query params: startDate, endDate, organizationId, teamId
 */
export const getDashboardStats = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { startDate, endDate, organizationId, teamId } = req.query;

    // Build date filter
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate as string);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate as string);
    }

    const { userFilter, firewallFilter } = await buildAnalyticsScopeFilters(
      req,
      organizationId,
      teamId
    );

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
      prisma.firewall.count({ where: firewallFilter }),
      prisma.firewall.count({ where: { ...firewallFilter, isActive: true } }),
      prisma.rule.count({
        where: {
          firewall: firewallFilter,
        },
      }),
      prisma.auditLog.count({
        where: {
          ...userFilter,
          ...(Object.keys(dateFilter).length > 0 && {
            createdAt: dateFilter,
          }),
        },
      }),
      prisma.auditLog.count({
        where: {
          ...userFilter,
          action: 'BLOCKED',
          ...(Object.keys(dateFilter).length > 0 && {
            createdAt: dateFilter,
          }),
        },
      }),
      prisma.auditLog.count({
        where: {
          ...userFilter,
          action: { in: ['REDACTED', 'SANITIZED'] },
          ...(Object.keys(dateFilter).length > 0 && {
            createdAt: dateFilter,
          }),
        },
      }),
      prisma.auditLog.count({
        where: {
          ...userFilter,
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
        ...userFilter,
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
 * Query params: days, firewallId, organizationId, teamId
 */
export const getTimeline = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { days = '30', firewallId, organizationId, teamId } = req.query;

    const parsedDays = parseInt(days as string, 10);
    const daysNum = Number.isNaN(parsedDays) ? 30 : parsedDays;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    const { userFilter } = await buildAnalyticsScopeFilters(req, organizationId, teamId);

    // Build where clause
    const where: any = {
      ...userFilter,
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
      } else if (log.action === 'REDACTED' || log.action === 'SANITIZED') {
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
 * Query params: limit, startDate, endDate, organizationId, teamId
 */
export const getTopPatterns = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { limit = '10', startDate, endDate, organizationId, teamId } = req.query;

    const limitNum = parseInt(limit as string);

    // Build date filter
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate as string);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate as string);
    }

    const { userFilter } = await buildAnalyticsScopeFilters(req, organizationId, teamId);

    // Get recent logs
    const logs = await prisma.auditLog.findMany({
      where: {
        ...userFilter,
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
 * Query params: startDate, endDate, organizationId, teamId
 */
export const getFirewallPerformance = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { startDate, endDate, organizationId, teamId } = req.query;

    // Build date filter
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate as string);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate as string);
    }

    const { firewallFilter } = await buildAnalyticsScopeFilters(req, organizationId, teamId);

    // Get firewalls
    const firewalls = await prisma.firewall.findMany({
      where: firewallFilter,
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
