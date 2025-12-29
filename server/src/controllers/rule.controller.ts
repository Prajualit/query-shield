/**
 * Rule Controller
 * Handles CRUD operations for firewall rules
 */

import { Response, NextFunction } from 'express';
import { prisma } from '../db';
import { AuthRequest } from '../types';
import { ApiError } from '../utils/apiError';
import { ApiResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { rulesEngine } from '../services/detection/rules.engine';

/**
 * Create a new rule for a firewall
 * POST /api/firewalls/:firewallId/rules OR POST /api/rules
 */
export const createRule = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { firewallId } = req.params;
    const userId = req.user!.id;
    const { 
      name, 
      type, 
      pattern, 
      action, 
      priority = 0, 
      isActive = true,
      severity,
      enabled,
      firewallId: bodyFirewallId 
    } = req.body;

    if (!name || !type || !pattern) {
      throw new ApiError(400, 'Name, type, and pattern are required');
    }

    // Determine the actual firewall ID and action
    let actualFirewallId = firewallId || bodyFirewallId;
    const actualAction = action || 'BLOCK'; // Default action
    const actualIsActive = isActive !== undefined ? isActive : (enabled !== undefined ? enabled : true);

    // If firewallId is provided, verify it exists and belongs to user
    if (actualFirewallId) {
      const firewall = await prisma.firewall.findFirst({
        where: { id: actualFirewallId, userId },
      });

      if (!firewall) {
        throw new ApiError(404, 'Firewall not found');
      }
    } else {
      // If no firewall specified, get user's first firewall
      const firewall = await prisma.firewall.findFirst({
        where: { userId },
      });

      if (!firewall) {
        throw new ApiError(400, 'No firewall found. Please create a firewall first.');
      }
      
      actualFirewallId = firewall.id;
    }

    // Validate pattern if it's a regex
    if (type === 'CUSTOM_REGEX' || type === 'custom') {
      try {
        new RegExp(pattern);
      } catch (error) {
        throw new ApiError(400, 'Invalid regex pattern');
      }
    }

    // Convert type to uppercase enum if needed
    // Map common patterns to enum values
    let ruleType = type.toUpperCase().replace(/-/g, '_');
    
    // Map specific types to valid RuleType enum values
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
        action: actualAction,
        priority,
        isActive: actualIsActive,
        firewallId: actualFirewallId,
      },
    });

    // Clear cache for this firewall
    if (actualFirewallId) {
      rulesEngine.clearCache(actualFirewallId);
    }

    res.status(201).json(
      new ApiResponse(201, rule, 'Rule created successfully')
    );
  }
);

/**
 * Get all rules for a firewall
 * GET /api/firewalls/:firewallId/rules
 */
export const getRules = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { firewallId } = req.params;
    const userId = req.user!.id;

    // Verify firewall exists and belongs to user
    const firewall = await prisma.firewall.findFirst({
      where: { id: firewallId, userId },
    });

    if (!firewall) {
      throw new ApiError(404, 'Firewall not found');
    }

    const rules = await prisma.rule.findMany({
      where: { firewallId },
      orderBy: {
        priority: 'desc',
      },
    });

    res.status(200).json(
      new ApiResponse(200, rules, 'Rules retrieved successfully')
    );
  }
);

/**
 * Get a single rule by ID
 * GET /api/firewalls/:firewallId/rules/:id
 */
export const getRuleById = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { firewallId, id } = req.params;
    const userId = req.user!.id;

    // Verify firewall exists and belongs to user
    const firewall = await prisma.firewall.findFirst({
      where: { id: firewallId, userId },
    });

    if (!firewall) {
      throw new ApiError(404, 'Firewall not found');
    }

    const rule = await prisma.rule.findFirst({
      where: {
        id,
        firewallId,
      },
    });

    if (!rule) {
      throw new ApiError(404, 'Rule not found');
    }

    res.status(200).json(
      new ApiResponse(200, rule, 'Rule retrieved successfully')
    );
  }
);

/**
 * Update a rule
 * PUT /api/firewalls/:firewallId/rules/:id
 */
export const updateRule = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { firewallId, id } = req.params;
    const userId = req.user!.id;
    const { name, type, pattern, action, priority, isActive, enabled } = req.body;

    // Handle enabled field from frontend (maps to isActive)
    const actualIsActive = isActive !== undefined ? isActive : enabled;

    // If firewallId is in params, verify it belongs to user
    let actualFirewallId = firewallId;
    
    if (firewallId) {
      const firewall = await prisma.firewall.findFirst({
        where: { id: firewallId, userId },
      });

      if (!firewall) {
        throw new ApiError(404, 'Firewall not found');
      }
    } else {
      // If no firewallId in params, find the rule first to get its firewallId
      const existingRule = await prisma.rule.findUnique({
        where: { id },
        include: { firewall: true },
      });

      if (!existingRule) {
        throw new ApiError(404, 'Rule not found');
      }

      // Verify the firewall belongs to the user
      if (existingRule.firewall.userId !== userId) {
        throw new ApiError(403, 'Unauthorized');
      }

      actualFirewallId = existingRule.firewallId;
    }

    // Check if rule exists
    const existingRule = await prisma.rule.findFirst({
      where: { id, firewallId: actualFirewallId },
    });

    if (!existingRule) {
      throw new ApiError(404, 'Rule not found');
    }

    // Validate pattern if it's being updated to CUSTOM_REGEX
    if (type === 'CUSTOM_REGEX' || (pattern && existingRule.type === 'CUSTOM_REGEX')) {
      try {
        new RegExp(pattern || existingRule.pattern);
      } catch (error) {
        throw new ApiError(400, 'Invalid regex pattern');
      }
    }

    const rule = await prisma.rule.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(type && { type }),
        ...(pattern && { pattern }),
        ...(action && { action }),
        ...(priority !== undefined && { priority }),
        ...(actualIsActive !== undefined && { isActive: actualIsActive }),
      },
    });

    // Clear cache for this firewall
    rulesEngine.clearCache(actualFirewallId);

    res.status(200).json(
      new ApiResponse(200, rule, 'Rule updated successfully')
    );
  }
);

/**
 * Delete a rule
 * DELETE /api/firewalls/:firewallId/rules/:id
 */
export const deleteRule = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { firewallId, id } = req.params;
    const userId = req.user!.id;

    // Verify firewall exists and belongs to user
    const firewall = await prisma.firewall.findFirst({
      where: { id: firewallId, userId },
    });

    if (!firewall) {
      throw new ApiError(404, 'Firewall not found');
    }

    // Check if rule exists
    const existingRule = await prisma.rule.findFirst({
      where: { id, firewallId },
    });

    if (!existingRule) {
      throw new ApiError(404, 'Rule not found');
    }

    await prisma.rule.delete({
      where: { id },
    });

    // Clear cache for this firewall
    rulesEngine.clearCache(firewallId);

    res.status(200).json(
      new ApiResponse(200, null, 'Rule deleted successfully')
    );
  }
);

/**
 * Test a rule with sample text
 * POST /api/firewalls/:firewallId/rules/:id/test
 */
export const testRule = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { firewallId, id } = req.params;
    const userId = req.user!.id;
    const { text } = req.body;

    if (!text) {
      throw new ApiError(400, 'Sample text is required');
    }

    // Verify firewall exists and belongs to user
    const firewall = await prisma.firewall.findFirst({
      where: { id: firewallId, userId },
    });

    if (!firewall) {
      throw new ApiError(404, 'Firewall not found');
    }

    // Check if rule exists
    const rule = await prisma.rule.findFirst({
      where: { id, firewallId },
    });

    if (!rule) {
      throw new ApiError(404, 'Rule not found');
    }

    // Test the rule
    const result = await rulesEngine.testRule(id, text);

    res.status(200).json(
      new ApiResponse(200, result, 'Rule tested successfully')
    );
  }
);

/**
 * Bulk update rule priorities
 * PATCH /api/firewalls/:firewallId/rules/priorities
 */
export const updateRulePriorities = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { firewallId } = req.params;
    const userId = req.user!.id;
    const { priorities } = req.body; // Array of { id, priority }

    if (!Array.isArray(priorities)) {
      throw new ApiError(400, 'Priorities must be an array');
    }

    // Verify firewall exists and belongs to user
    const firewall = await prisma.firewall.findFirst({
      where: { id: firewallId, userId },
    });

    if (!firewall) {
      throw new ApiError(404, 'Firewall not found');
    }

    // Update priorities in a transaction
    await prisma.$transaction(
      priorities.map(({ id, priority }: any) =>
        prisma.rule.update({
          where: { id },
          data: { priority },
        })
      )
    );

    // Clear cache for this firewall
    rulesEngine.clearCache(firewallId);

    res.status(200).json(
      new ApiResponse(200, null, 'Rule priorities updated successfully')
    );
  }
);
