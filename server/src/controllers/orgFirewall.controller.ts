/**
 * Organization Firewall Controller
 * Handles CRUD operations for organization-level and team-level firewalls
 * 
 * Authorization rules:
 * - Organization-level firewalls: Can only be created/modified by org admins
 * - Team-level firewalls: Can be created/modified by org admins OR team managers
 */

import { Response, NextFunction } from 'express';
import { prisma } from '../db';
import { AuthRequest } from '../types';
import { ApiError } from '../utils/apiError';
import { ApiResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { rulesEngine } from '../services/detection/rules.engine';

/**
 * Helper to check if user is an org admin
 */
async function isOrgAdmin(userId: string, organizationId: string): Promise<boolean> {
  const membership = await prisma.organizationMember.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId,
      },
    },
  });
  return membership?.role === 'ADMIN';
}

/**
 * Helper to check if user is a team manager
 */
async function isTeamManager(userId: string, teamId: string): Promise<boolean> {
  const membership = await prisma.teamMember.findUnique({
    where: {
      userId_teamId: {
        userId,
        teamId,
      },
    },
  });
  return membership?.role === 'MANAGER';
}

/**
 * Helper to check if user has access to the organization
 */
async function hasOrgAccess(userId: string, organizationId: string): Promise<boolean> {
  const membership = await prisma.organizationMember.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId,
      },
    },
  });
  return !!membership;
}

/**
 * Create an organization-level firewall
 * POST /api/organizations/:organizationId/firewalls
 * Only org admins can create org-level firewalls
 */
export const createOrgFirewall = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { organizationId } = req.params;
    const { name, description, isActive = true } = req.body;
    const userId = req.user!.id;

    if (!name) {
      throw new ApiError(400, 'Firewall name is required');
    }

    // Check if user is an org admin
    if (!(await isOrgAdmin(userId, organizationId))) {
      throw new ApiError(403, 'Only organization admins can create organization-level firewalls');
    }

    const firewall = await prisma.firewall.create({
      data: {
        name,
        description,
        isActive,
        userId,
        organizationId,
        scope: 'ORGANIZATION',
      },
      include: {
        rules: true,
      },
    });

    res.status(201).json(
      new ApiResponse(201, firewall, 'Organization firewall created successfully')
    );
  }
);

/**
 * Create a team-level firewall
 * POST /api/teams/:teamId/firewalls
 * Org admins or team managers can create team-level firewalls
 */
export const createTeamFirewall = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { teamId } = req.params;
    const { name, description, isActive = true } = req.body;
    const userId = req.user!.id;

    if (!name) {
      throw new ApiError(400, 'Firewall name is required');
    }

    // Get team and its organization
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { organization: true },
    });

    if (!team) {
      throw new ApiError(404, 'Team not found');
    }

    // Check if user is org admin or team manager
    const isAdmin = await isOrgAdmin(userId, team.organizationId);
    const isManager = await isTeamManager(userId, teamId);

    if (!isAdmin && !isManager) {
      throw new ApiError(403, 'Only organization admins or team managers can create team firewalls');
    }

    const firewall = await prisma.firewall.create({
      data: {
        name,
        description,
        isActive,
        userId,
        organizationId: team.organizationId,
        teamId,
        scope: 'TEAM',
      },
      include: {
        rules: true,
      },
    });

    res.status(201).json(
      new ApiResponse(201, firewall, 'Team firewall created successfully')
    );
  }
);

/**
 * Get all organization-level firewalls
 * GET /api/organizations/:organizationId/firewalls
 * Any org member can view org firewalls
 */
export const getOrgFirewalls = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { organizationId } = req.params;
    const userId = req.user!.id;

    // Check if user has access to the org
    if (!(await hasOrgAccess(userId, organizationId))) {
      throw new ApiError(403, 'You do not have access to this organization');
    }

    const firewalls = await prisma.firewall.findMany({
      where: {
        organizationId,
        scope: 'ORGANIZATION',
      },
      include: {
        rules: {
          orderBy: { priority: 'desc' },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            rules: true,
            auditLogs: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json(
      new ApiResponse(200, firewalls, 'Organization firewalls retrieved successfully')
    );
  }
);

/**
 * Get all team-level firewalls for a team
 * GET /api/teams/:teamId/firewalls
 * Any org member can view team firewalls
 */
export const getTeamFirewalls = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { teamId } = req.params;
    const userId = req.user!.id;

    // Get team
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      throw new ApiError(404, 'Team not found');
    }

    // Check if user has access to the org
    if (!(await hasOrgAccess(userId, team.organizationId))) {
      throw new ApiError(403, 'You do not have access to this team');
    }

    const firewalls = await prisma.firewall.findMany({
      where: {
        teamId,
        scope: 'TEAM',
      },
      include: {
        rules: {
          orderBy: { priority: 'desc' },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            rules: true,
            auditLogs: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json(
      new ApiResponse(200, firewalls, 'Team firewalls retrieved successfully')
    );
  }
);

/**
 * Get all firewalls applicable to a user (personal + org-level + team-level)
 * GET /api/firewalls/applicable
 * Returns combined firewalls for the user
 */
export const getApplicableFirewalls = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;

    // Get user's organization membership
    const orgMembership = await prisma.organizationMember.findFirst({
      where: { userId },
    });

    // Get user's team memberships
    const teamMemberships = await prisma.teamMember.findMany({
      where: { userId },
      select: { teamId: true },
    });

    const teamIds = teamMemberships.map((tm) => tm.teamId);

    const firewalls = await prisma.firewall.findMany({
      where: {
        OR: [
          // Personal firewalls
          { userId, scope: 'PERSONAL' },
          // Organization-level firewalls
          ...(orgMembership
            ? [{ organizationId: orgMembership.organizationId, scope: 'ORGANIZATION' as const }]
            : []),
          // Team-level firewalls
          ...(teamIds.length > 0
            ? [{ teamId: { in: teamIds }, scope: 'TEAM' as const }]
            : []),
        ],
      },
      include: {
        rules: {
          orderBy: { priority: 'desc' },
        },
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            rules: true,
            auditLogs: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json(
      new ApiResponse(200, firewalls, 'Applicable firewalls retrieved successfully')
    );
  }
);

/**
 * Update an organization-level firewall
 * PUT /api/organizations/:organizationId/firewalls/:firewallId
 * Only org admins can update org-level firewalls
 */
export const updateOrgFirewall = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { organizationId, firewallId } = req.params;
    const userId = req.user!.id;
    const { name, description, isActive } = req.body;

    // Check if user is an org admin
    if (!(await isOrgAdmin(userId, organizationId))) {
      throw new ApiError(403, 'Only organization admins can update organization-level firewalls');
    }

    // Check if firewall exists and belongs to the org
    const existingFirewall = await prisma.firewall.findFirst({
      where: {
        id: firewallId,
        organizationId,
        scope: 'ORGANIZATION',
      },
    });

    if (!existingFirewall) {
      throw new ApiError(404, 'Organization firewall not found');
    }

    const firewall = await prisma.firewall.update({
      where: { id: firewallId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        rules: true,
      },
    });

    rulesEngine.clearCache(firewallId);

    res.status(200).json(
      new ApiResponse(200, firewall, 'Organization firewall updated successfully')
    );
  }
);

/**
 * Update a team-level firewall
 * PUT /api/teams/:teamId/firewalls/:firewallId
 * Org admins or team managers can update team-level firewalls
 */
export const updateTeamFirewall = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { teamId, firewallId } = req.params;
    const userId = req.user!.id;
    const { name, description, isActive } = req.body;

    // Get team
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      throw new ApiError(404, 'Team not found');
    }

    // Check if user is org admin or team manager
    const isAdmin = await isOrgAdmin(userId, team.organizationId);
    const isManager = await isTeamManager(userId, teamId);

    if (!isAdmin && !isManager) {
      throw new ApiError(403, 'Only organization admins or team managers can update team firewalls');
    }

    // Check if firewall exists and belongs to the team
    const existingFirewall = await prisma.firewall.findFirst({
      where: {
        id: firewallId,
        teamId,
        scope: 'TEAM',
      },
    });

    if (!existingFirewall) {
      throw new ApiError(404, 'Team firewall not found');
    }

    const firewall = await prisma.firewall.update({
      where: { id: firewallId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        rules: true,
      },
    });

    rulesEngine.clearCache(firewallId);

    res.status(200).json(
      new ApiResponse(200, firewall, 'Team firewall updated successfully')
    );
  }
);

/**
 * Delete an organization-level firewall
 * DELETE /api/organizations/:organizationId/firewalls/:firewallId
 * Only org admins can delete org-level firewalls
 */
export const deleteOrgFirewall = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { organizationId, firewallId } = req.params;
    const userId = req.user!.id;

    // Check if user is an org admin
    if (!(await isOrgAdmin(userId, organizationId))) {
      throw new ApiError(403, 'Only organization admins can delete organization-level firewalls');
    }

    // Check if firewall exists and belongs to the org
    const existingFirewall = await prisma.firewall.findFirst({
      where: {
        id: firewallId,
        organizationId,
        scope: 'ORGANIZATION',
      },
    });

    if (!existingFirewall) {
      throw new ApiError(404, 'Organization firewall not found');
    }

    await prisma.firewall.delete({
      where: { id: firewallId },
    });

    rulesEngine.clearCache(firewallId);

    res.status(200).json(
      new ApiResponse(200, null, 'Organization firewall deleted successfully')
    );
  }
);

/**
 * Delete a team-level firewall
 * DELETE /api/teams/:teamId/firewalls/:firewallId
 * Org admins or team managers can delete team-level firewalls
 */
export const deleteTeamFirewall = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { teamId, firewallId } = req.params;
    const userId = req.user!.id;

    // Get team
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      throw new ApiError(404, 'Team not found');
    }

    // Check if user is org admin or team manager
    const isAdmin = await isOrgAdmin(userId, team.organizationId);
    const isManager = await isTeamManager(userId, teamId);

    if (!isAdmin && !isManager) {
      throw new ApiError(403, 'Only organization admins or team managers can delete team firewalls');
    }

    // Check if firewall exists and belongs to the team
    const existingFirewall = await prisma.firewall.findFirst({
      where: {
        id: firewallId,
        teamId,
        scope: 'TEAM',
      },
    });

    if (!existingFirewall) {
      throw new ApiError(404, 'Team firewall not found');
    }

    await prisma.firewall.delete({
      where: { id: firewallId },
    });

    rulesEngine.clearCache(firewallId);

    res.status(200).json(
      new ApiResponse(200, null, 'Team firewall deleted successfully')
    );
  }
);

/**
 * Get a specific firewall with permission check
 * GET /api/organizations/:organizationId/firewalls/:firewallId
 * or GET /api/teams/:teamId/firewalls/:firewallId
 */
export const getOrgFirewallById = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { organizationId, firewallId } = req.params;
    const userId = req.user!.id;

    // Check if user has access to the org
    if (!(await hasOrgAccess(userId, organizationId))) {
      throw new ApiError(403, 'You do not have access to this organization');
    }

    const firewall = await prisma.firewall.findFirst({
      where: {
        id: firewallId,
        organizationId,
        scope: 'ORGANIZATION',
      },
      include: {
        rules: {
          orderBy: { priority: 'desc' },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            rules: true,
            auditLogs: true,
          },
        },
      },
    });

    if (!firewall) {
      throw new ApiError(404, 'Organization firewall not found');
    }

    res.status(200).json(
      new ApiResponse(200, firewall, 'Organization firewall retrieved successfully')
    );
  }
);

export const getTeamFirewallById = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { teamId, firewallId } = req.params;
    const userId = req.user!.id;

    // Get team
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      throw new ApiError(404, 'Team not found');
    }

    // Check if user has access to the org
    if (!(await hasOrgAccess(userId, team.organizationId))) {
      throw new ApiError(403, 'You do not have access to this team');
    }

    const firewall = await prisma.firewall.findFirst({
      where: {
        id: firewallId,
        teamId,
        scope: 'TEAM',
      },
      include: {
        rules: {
          orderBy: { priority: 'desc' },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            rules: true,
            auditLogs: true,
          },
        },
      },
    });

    if (!firewall) {
      throw new ApiError(404, 'Team firewall not found');
    }

    res.status(200).json(
      new ApiResponse(200, firewall, 'Team firewall retrieved successfully')
    );
  }
);
