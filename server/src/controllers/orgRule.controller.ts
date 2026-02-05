/**
 * Organization Rule Controller
 * Handles CRUD operations for organization-level and team-level firewall rules
 * 
 * Authorization rules:
 * - Organization-level firewall rules: Can only be created/modified by org admins
 * - Team-level firewall rules: Can be created/modified by org admins OR team managers
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
 * Create a rule for an organization-level firewall
 * POST /api/organizations/:organizationId/firewalls/:firewallId/rules
 * Only org admins can create rules for org-level firewalls
 */
export const createOrgFirewallRule = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { organizationId, firewallId } = req.params;
    const userId = req.user!.id;
    const { name, type, pattern, action = 'BLOCK', priority = 0, isActive = true } = req.body;

    if (!name || !type || !pattern) {
      throw new ApiError(400, 'Name, type, and pattern are required');
    }

    // Check if user is an org admin
    if (!(await isOrgAdmin(userId, organizationId))) {
      throw new ApiError(403, 'Only organization admins can create rules for organization-level firewalls');
    }

    // Verify firewall exists and belongs to the org
    const firewall = await prisma.firewall.findFirst({
      where: {
        id: firewallId,
        organizationId,
        scope: 'ORGANIZATION',
      },
    });

    if (!firewall) {
      throw new ApiError(404, 'Organization firewall not found');
    }

    // Validate regex pattern if needed
    if (type === 'CUSTOM_REGEX' || type === 'custom') {
      try {
        new RegExp(pattern);
      } catch (error) {
        throw new ApiError(400, 'Invalid regex pattern');
      }
    }

    // Convert type to uppercase enum if needed
    let ruleType = type.toUpperCase().replace(/-/g, '_');
    const typeMapping: Record<string, string> = {
      'SQL_INJECTION': 'CUSTOM_REGEX',
      'XSS': 'CUSTOM_REGEX',
      'COMMAND_INJECTION': 'CUSTOM_REGEX',
      'PATH_TRAVERSAL': 'CUSTOM_REGEX',
      'CUSTOM': 'CUSTOM_REGEX',
    };
    if (typeMapping[ruleType]) {
      ruleType = typeMapping[ruleType];
    }

    const rule = await prisma.rule.create({
      data: {
        name,
        type: ruleType,
        pattern,
        action,
        priority,
        isActive,
        firewallId,
      },
    });

    rulesEngine.clearCache(firewallId);

    res.status(201).json(
      new ApiResponse(201, rule, 'Rule created successfully')
    );
  }
);

/**
 * Create a rule for a team-level firewall
 * POST /api/teams/:teamId/firewalls/:firewallId/rules
 * Org admins or team managers can create rules for team-level firewalls
 */
export const createTeamFirewallRule = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { teamId, firewallId } = req.params;
    const userId = req.user!.id;
    const { name, type, pattern, action = 'BLOCK', priority = 0, isActive = true } = req.body;

    if (!name || !type || !pattern) {
      throw new ApiError(400, 'Name, type, and pattern are required');
    }

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
      throw new ApiError(403, 'Only organization admins or team managers can create rules for team firewalls');
    }

    // Verify firewall exists and belongs to the team
    const firewall = await prisma.firewall.findFirst({
      where: {
        id: firewallId,
        teamId,
        scope: 'TEAM',
      },
    });

    if (!firewall) {
      throw new ApiError(404, 'Team firewall not found');
    }

    // Validate regex pattern if needed
    if (type === 'CUSTOM_REGEX' || type === 'custom') {
      try {
        new RegExp(pattern);
      } catch (error) {
        throw new ApiError(400, 'Invalid regex pattern');
      }
    }

    // Convert type to uppercase enum
    let ruleType = type.toUpperCase().replace(/-/g, '_');
    const typeMapping: Record<string, string> = {
      'SQL_INJECTION': 'CUSTOM_REGEX',
      'XSS': 'CUSTOM_REGEX',
      'COMMAND_INJECTION': 'CUSTOM_REGEX',
      'PATH_TRAVERSAL': 'CUSTOM_REGEX',
      'CUSTOM': 'CUSTOM_REGEX',
    };
    if (typeMapping[ruleType]) {
      ruleType = typeMapping[ruleType];
    }

    const rule = await prisma.rule.create({
      data: {
        name,
        type: ruleType,
        pattern,
        action,
        priority,
        isActive,
        firewallId,
      },
    });

    rulesEngine.clearCache(firewallId);

    res.status(201).json(
      new ApiResponse(201, rule, 'Rule created successfully')
    );
  }
);

/**
 * Get all rules for an organization-level firewall
 * GET /api/organizations/:organizationId/firewalls/:firewallId/rules
 */
export const getOrgFirewallRules = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { organizationId, firewallId } = req.params;
    const userId = req.user!.id;

    // Check if user has access to the org
    if (!(await hasOrgAccess(userId, organizationId))) {
      throw new ApiError(403, 'You do not have access to this organization');
    }

    // Verify firewall exists and belongs to the org
    const firewall = await prisma.firewall.findFirst({
      where: {
        id: firewallId,
        organizationId,
        scope: 'ORGANIZATION',
      },
    });

    if (!firewall) {
      throw new ApiError(404, 'Organization firewall not found');
    }

    const rules = await prisma.rule.findMany({
      where: { firewallId },
      orderBy: { priority: 'desc' },
    });

    res.status(200).json(
      new ApiResponse(200, rules, 'Rules retrieved successfully')
    );
  }
);

/**
 * Get all rules for a team-level firewall
 * GET /api/teams/:teamId/firewalls/:firewallId/rules
 */
export const getTeamFirewallRules = asyncHandler(
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

    // Verify firewall exists and belongs to the team
    const firewall = await prisma.firewall.findFirst({
      where: {
        id: firewallId,
        teamId,
        scope: 'TEAM',
      },
    });

    if (!firewall) {
      throw new ApiError(404, 'Team firewall not found');
    }

    const rules = await prisma.rule.findMany({
      where: { firewallId },
      orderBy: { priority: 'desc' },
    });

    res.status(200).json(
      new ApiResponse(200, rules, 'Rules retrieved successfully')
    );
  }
);

/**
 * Update a rule in an organization-level firewall
 * PUT /api/organizations/:organizationId/firewalls/:firewallId/rules/:ruleId
 */
export const updateOrgFirewallRule = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { organizationId, firewallId, ruleId } = req.params;
    const userId = req.user!.id;
    const { name, type, pattern, action, priority, isActive } = req.body;

    // Check if user is an org admin
    if (!(await isOrgAdmin(userId, organizationId))) {
      throw new ApiError(403, 'Only organization admins can update rules for organization-level firewalls');
    }

    // Verify firewall exists and belongs to the org
    const firewall = await prisma.firewall.findFirst({
      where: {
        id: firewallId,
        organizationId,
        scope: 'ORGANIZATION',
      },
    });

    if (!firewall) {
      throw new ApiError(404, 'Organization firewall not found');
    }

    // Verify rule exists
    const existingRule = await prisma.rule.findFirst({
      where: { id: ruleId, firewallId },
    });

    if (!existingRule) {
      throw new ApiError(404, 'Rule not found');
    }

    // Validate pattern if updating to regex
    if (type === 'CUSTOM_REGEX' || (pattern && existingRule.type === 'CUSTOM_REGEX')) {
      try {
        new RegExp(pattern || existingRule.pattern);
      } catch (error) {
        throw new ApiError(400, 'Invalid regex pattern');
      }
    }

    const rule = await prisma.rule.update({
      where: { id: ruleId },
      data: {
        ...(name && { name }),
        ...(type && { type }),
        ...(pattern && { pattern }),
        ...(action && { action }),
        ...(priority !== undefined && { priority }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    rulesEngine.clearCache(firewallId);

    res.status(200).json(
      new ApiResponse(200, rule, 'Rule updated successfully')
    );
  }
);

/**
 * Update a rule in a team-level firewall
 * PUT /api/teams/:teamId/firewalls/:firewallId/rules/:ruleId
 */
export const updateTeamFirewallRule = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { teamId, firewallId, ruleId } = req.params;
    const userId = req.user!.id;
    const { name, type, pattern, action, priority, isActive } = req.body;

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
      throw new ApiError(403, 'Only organization admins or team managers can update rules for team firewalls');
    }

    // Verify firewall exists and belongs to the team
    const firewall = await prisma.firewall.findFirst({
      where: {
        id: firewallId,
        teamId,
        scope: 'TEAM',
      },
    });

    if (!firewall) {
      throw new ApiError(404, 'Team firewall not found');
    }

    // Verify rule exists
    const existingRule = await prisma.rule.findFirst({
      where: { id: ruleId, firewallId },
    });

    if (!existingRule) {
      throw new ApiError(404, 'Rule not found');
    }

    // Validate pattern if updating to regex
    if (type === 'CUSTOM_REGEX' || (pattern && existingRule.type === 'CUSTOM_REGEX')) {
      try {
        new RegExp(pattern || existingRule.pattern);
      } catch (error) {
        throw new ApiError(400, 'Invalid regex pattern');
      }
    }

    const rule = await prisma.rule.update({
      where: { id: ruleId },
      data: {
        ...(name && { name }),
        ...(type && { type }),
        ...(pattern && { pattern }),
        ...(action && { action }),
        ...(priority !== undefined && { priority }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    rulesEngine.clearCache(firewallId);

    res.status(200).json(
      new ApiResponse(200, rule, 'Rule updated successfully')
    );
  }
);

/**
 * Delete a rule from an organization-level firewall
 * DELETE /api/organizations/:organizationId/firewalls/:firewallId/rules/:ruleId
 */
export const deleteOrgFirewallRule = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { organizationId, firewallId, ruleId } = req.params;
    const userId = req.user!.id;

    // Check if user is an org admin
    if (!(await isOrgAdmin(userId, organizationId))) {
      throw new ApiError(403, 'Only organization admins can delete rules from organization-level firewalls');
    }

    // Verify firewall exists and belongs to the org
    const firewall = await prisma.firewall.findFirst({
      where: {
        id: firewallId,
        organizationId,
        scope: 'ORGANIZATION',
      },
    });

    if (!firewall) {
      throw new ApiError(404, 'Organization firewall not found');
    }

    // Verify rule exists
    const existingRule = await prisma.rule.findFirst({
      where: { id: ruleId, firewallId },
    });

    if (!existingRule) {
      throw new ApiError(404, 'Rule not found');
    }

    await prisma.rule.delete({
      where: { id: ruleId },
    });

    rulesEngine.clearCache(firewallId);

    res.status(200).json(
      new ApiResponse(200, null, 'Rule deleted successfully')
    );
  }
);

/**
 * Delete a rule from a team-level firewall
 * DELETE /api/teams/:teamId/firewalls/:firewallId/rules/:ruleId
 */
export const deleteTeamFirewallRule = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { teamId, firewallId, ruleId } = req.params;
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
      throw new ApiError(403, 'Only organization admins or team managers can delete rules from team firewalls');
    }

    // Verify firewall exists and belongs to the team
    const firewall = await prisma.firewall.findFirst({
      where: {
        id: firewallId,
        teamId,
        scope: 'TEAM',
      },
    });

    if (!firewall) {
      throw new ApiError(404, 'Team firewall not found');
    }

    // Verify rule exists
    const existingRule = await prisma.rule.findFirst({
      where: { id: ruleId, firewallId },
    });

    if (!existingRule) {
      throw new ApiError(404, 'Rule not found');
    }

    await prisma.rule.delete({
      where: { id: ruleId },
    });

    rulesEngine.clearCache(firewallId);

    res.status(200).json(
      new ApiResponse(200, null, 'Rule deleted successfully')
    );
  }
);
