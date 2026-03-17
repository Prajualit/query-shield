/**
 * Audit Log Controller
 * Handles audit log queries and analytics
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

const buildAuditAccessFilter = async (
  req: AuthRequest,
  organizationIdParam: unknown,
  teamIdParam: unknown
): Promise<any> => {
  const userId = req.user!.id;
  const requestedOrganizationId = normalizeQueryParam(organizationIdParam);
  const requestedTeamId = normalizeQueryParam(teamIdParam);
  const effectiveOrganizationId = requestedOrganizationId || req.user?.organizationId;

  if (!effectiveOrganizationId) {
    return { userId };
  }

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
    return { userId };
  }

  if (membership.role === 'ADMIN') {
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

      const teamMembers = await prisma.teamMember.findMany({
        where: {
          teamId: team.id,
        },
        select: {
          userId: true,
        },
      });

      return {
        userId: {
          in: Array.from(new Set(teamMembers.map((member) => member.userId))),
        },
      };
    }

    const orgMembers = await prisma.organizationMember.findMany({
      where: {
        organizationId: effectiveOrganizationId,
      },
      select: {
        userId: true,
      },
    });

    return {
      userId: {
        in: Array.from(new Set(orgMembers.map((member) => member.userId))),
      },
    };
  }

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

  const managedTeamIds = Array.from(new Set(managerMemberships.map((membershipItem) => membershipItem.teamId)));

  if (requestedTeamId && managedTeamIds.length === 0) {
    throw new ApiError(403, 'You can only access teams you manage');
  }

  if (managedTeamIds.length === 0) {
    return { userId };
  }

  const teamMembers = await prisma.teamMember.findMany({
    where: {
      teamId: {
        in: managedTeamIds,
      },
    },
    select: {
      userId: true,
    },
  });

  return {
    userId: {
      in: Array.from(new Set(teamMembers.map((member) => member.userId))),
    },
  };
};

/**
 * Get all audit logs for the authenticated user with pagination and filters
 * 
 * Role-based access:
 * - Org Admin: can see ALL audit logs across the entire organization (all teams, all users)
 * - Team Manager: can see audit logs of their own team members only
 * - Member: can only see their own audit logs
 * - Individual (no org): can only see their own audit logs
 * 
 * GET /api/audit-logs
 * Query params: page, limit, firewallId, action, startDate, endDate, search, organizationId, teamId
 */
export const getAuditLogs = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const {
      page = '1',
      limit = '20',
      firewallId,
      action,
      startDate,
      endDate,
      search,
      organizationId,
      teamId,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = await buildAuditAccessFilter(req, organizationId, teamId);

    if (firewallId) {
      where.firewallId = firewallId;
    }

    if (action) {
      where.action = action;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate as string);
      }
    }

    if (search) {
      const searchClause = {
        OR: [
          { inputText: { contains: search as string, mode: 'insensitive' } },
          { sanitizedText: { contains: search as string, mode: 'insensitive' } },
        ],
      };

      where.AND = where.AND ? [...where.AND, searchClause] : [searchClause];
    }

    // Get total count for pagination
    const total = await prisma.auditLog.count({ where });

    // Get paginated logs
    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        firewall: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limitNum,
    });

    res.status(200).json(
      new ApiResponse(
        200,
        {
          logs,
          pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
          },
        },
        'Audit logs retrieved successfully'
      )
    );
  }
);

/**
 * Get a single audit log by ID
 * GET /api/audit-logs/:id
 */
export const getAuditLogById = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const userId = req.user!.id;

    const log = await prisma.auditLog.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        firewall: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!log) {
      throw new ApiError(404, 'Audit log not found');
    }

    res.status(200).json(
      new ApiResponse(200, log, 'Audit log retrieved successfully')
    );
  }
);

/**
 * Delete audit logs older than specified days
 * DELETE /api/audit-logs/cleanup
 * Body: { days: number }
 */
export const cleanupOldLogs = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const { days = 90 } = req.body;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await prisma.auditLog.deleteMany({
      where: {
        userId,
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    res.status(200).json(
      new ApiResponse(
        200,
        { deletedCount: result.count },
        `Successfully deleted ${result.count} old audit logs`
      )
    );
  }
);

/**
 * Export audit logs as CSV
 * GET /api/audit-logs/export
 * Query params: same as getAuditLogs
 */
export const exportAuditLogs = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { firewallId, action, startDate, endDate, organizationId, teamId } = req.query;

    // Build where clause
    const where: any = await buildAuditAccessFilter(req, organizationId, teamId);

    if (firewallId) {
      where.firewallId = firewallId;
    }

    if (action) {
      where.action = action;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate as string);
      }
    }

    // Get logs (limit to 10000 for export)
    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        firewall: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10000,
    });

    // Convert to CSV
    const csvHeader = 'Date,Firewall,Action,AI Provider,Detected Issues,Input Length,Output Length\n';
    const csvRows = logs.map(log => {
      const detectedIssues = Array.isArray(log.detectedIssues)
        ? (log.detectedIssues as any[]).length
        : 0;
      return `${log.createdAt.toISOString()},${log.firewall?.name || 'N/A'},${log.action},${log.aiProvider || 'N/A'},${detectedIssues},${log.inputText.length},${log.sanitizedText.length}`;
    }).join('\n');

    const csv = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${Date.now()}.csv"`);
    res.status(200).send(csv);
  }
);
