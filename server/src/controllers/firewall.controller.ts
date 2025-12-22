/**
 * Firewall Controller
 * Handles CRUD operations for firewalls
 */

import { Response, NextFunction } from 'express';
import { prisma } from '../db';
import { AuthRequest } from '../types';
import { ApiError } from '../utils/apiError';
import { ApiResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { rulesEngine } from '../services/detection/rules.engine';

/**
 * Create a new firewall
 * POST /api/firewalls
 */
export const createFirewall = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { name, description, isActive = true } = req.body;
    const userId = req.user!.id;

    if (!name) {
      throw new ApiError(400, 'Firewall name is required');
    }

    const firewall = await prisma.firewall.create({
      data: {
        name,
        description,
        isActive,
        userId,
      },
      include: {
        rules: true,
      },
    });

    res.status(201).json(
      new ApiResponse(201, firewall, 'Firewall created successfully')
    );
  }
);

/**
 * Get all firewalls for the authenticated user
 * GET /api/firewalls
 */
export const getFirewalls = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;

    const firewalls = await prisma.firewall.findMany({
      where: { userId },
      include: {
        rules: {
          orderBy: {
            priority: 'desc',
          },
        },
        _count: {
          select: {
            rules: true,
            auditLogs: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(200).json(
      new ApiResponse(200, firewalls, 'Firewalls retrieved successfully')
    );
  }
);

/**
 * Get a single firewall by ID
 * GET /api/firewalls/:id
 */
export const getFirewallById = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const userId = req.user!.id;

    const firewall = await prisma.firewall.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        rules: {
          orderBy: {
            priority: 'desc',
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
      throw new ApiError(404, 'Firewall not found');
    }

    res.status(200).json(
      new ApiResponse(200, firewall, 'Firewall retrieved successfully')
    );
  }
);

/**
 * Update a firewall
 * PUT /api/firewalls/:id
 */
export const updateFirewall = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const userId = req.user!.id;
    const { name, description, isActive } = req.body;

    // Check if firewall exists and belongs to user
    const existingFirewall = await prisma.firewall.findFirst({
      where: { id, userId },
    });

    if (!existingFirewall) {
      throw new ApiError(404, 'Firewall not found');
    }

    const firewall = await prisma.firewall.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        rules: true,
      },
    });

    // Clear cache for this firewall
    rulesEngine.clearCache(id);

    res.status(200).json(
      new ApiResponse(200, firewall, 'Firewall updated successfully')
    );
  }
);

/**
 * Delete a firewall
 * DELETE /api/firewalls/:id
 */
export const deleteFirewall = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check if firewall exists and belongs to user
    const existingFirewall = await prisma.firewall.findFirst({
      where: { id, userId },
    });

    if (!existingFirewall) {
      throw new ApiError(404, 'Firewall not found');
    }

    // Delete firewall (rules will be cascade deleted)
    await prisma.firewall.delete({
      where: { id },
    });

    // Clear cache for this firewall
    rulesEngine.clearCache(id);

    res.status(200).json(
      new ApiResponse(200, null, 'Firewall deleted successfully')
    );
  }
);

/**
 * Test firewall with sample text
 * POST /api/firewalls/:id/test
 */
export const testFirewall = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const userId = req.user!.id;
    const { text } = req.body;

    if (!text) {
      throw new ApiError(400, 'Sample text is required');
    }

    // Check if firewall exists and belongs to user
    const firewall = await prisma.firewall.findFirst({
      where: { id, userId },
    });

    if (!firewall) {
      throw new ApiError(404, 'Firewall not found');
    }

    // Evaluate rules
    const result = await rulesEngine.evaluateRules(text, id, userId);

    res.status(200).json(
      new ApiResponse(200, result, 'Firewall tested successfully')
    );
  }
);

/**
 * Get firewall statistics
 * GET /api/firewalls/:id/statistics
 */
export const getFirewallStatistics = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const userId = req.user!.id;
    const { startDate, endDate } = req.query;

    // Check if firewall exists and belongs to user
    const firewall = await prisma.firewall.findFirst({
      where: { id, userId },
    });

    if (!firewall) {
      throw new ApiError(404, 'Firewall not found');
    }

    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;

    const statistics = await rulesEngine.getFirewallStatistics(id, start, end);

    res.status(200).json(
      new ApiResponse(200, statistics, 'Statistics retrieved successfully')
    );
  }
);

/**
 * Get recent audit logs for a firewall
 * GET /api/firewalls/:id/logs
 */
export const getFirewallLogs = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const userId = req.user!.id;
    const { limit = '50', offset = '0' } = req.query;

    // Check if firewall exists and belongs to user
    const firewall = await prisma.firewall.findFirst({
      where: { id, userId },
    });

    if (!firewall) {
      throw new ApiError(404, 'Firewall not found');
    }

    const logs = await prisma.auditLog.findMany({
      where: { firewallId: id },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
      select: {
        id: true,
        action: true,
        detectedIssues: true,
        createdAt: true,
        aiProvider: true,
        metadata: true,
      },
    });

    const total = await prisma.auditLog.count({
      where: { firewallId: id },
    });

    res.status(200).json(
      new ApiResponse(
        200,
        {
          logs,
          total,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
        },
        'Audit logs retrieved successfully'
      )
    );
  }
);
