/**
 * API Key Controller
 * Handles API key management for programmatic access
 */

import { Response, NextFunction } from 'express';
import { prisma } from '../db';
import { AuthRequest } from '../types';
import { ApiError } from '../utils/apiError';
import { ApiResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import crypto from 'crypto';

/**
 * Generate a secure random API key
 */
function generateApiKey(): string {
  const prefix = 'qs'; // QueryShield prefix
  const random = crypto.randomBytes(32).toString('hex');
  return `${prefix}_${random}`;
}

/**
 * Hash API key for storage
 */
function hashApiKey(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

/**
 * Get all API keys for the authenticated user
 * GET /api/api-keys
 */
export const getApiKeys = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;

    const apiKeys = await prisma.apiKey.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        isActive: true,
        lastUsed: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(200).json(
      new ApiResponse(200, apiKeys, 'API keys retrieved successfully')
    );
  }
);

/**
 * Create a new API key
 * POST /api/api-keys
 * Body: { name: string, expiresInDays?: number }
 */
export const createApiKey = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const { name, expiresInDays } = req.body;

    if (!name) {
      throw new ApiError(400, 'API key name is required');
    }

    // Generate API key
    const apiKey = generateApiKey();
    const hashedKey = hashApiKey(apiKey);

    // Save to database
    const savedKey = await prisma.apiKey.create({
      data: {
        name,
        key: hashedKey,
        userId,
      },
      select: {
        id: true,
        name: true,
        isActive: true,
        createdAt: true,
      },
    });

    res.status(201).json(
      new ApiResponse(
        201,
        {
          ...savedKey,
          apiKey, // Return the actual key only once during creation
        },
        'API key created successfully. Please save this key securely as it will not be shown again.'
      )
    );
  }
);

/**
 * Update API key (only name and active status)
 * PUT /api/api-keys/:id
 * Body: { name?: string, isActive?: boolean }
 */
export const updateApiKey = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const userId = req.user!.id;
    const { name, isActive } = req.body;

    // Check if API key exists and belongs to user
    const existingKey = await prisma.apiKey.findFirst({
      where: { id, userId },
    });

    if (!existingKey) {
      throw new ApiError(404, 'API key not found');
    }

    const updatedKey = await prisma.apiKey.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(isActive !== undefined && { isActive }),
      },
      select: {
        id: true,
        name: true,
        isActive: true,
        lastUsed: true,
        createdAt: true,
      },
    });

    res.status(200).json(
      new ApiResponse(200, updatedKey, 'API key updated successfully')
    );
  }
);

/**
 * Delete an API key
 * DELETE /api/api-keys/:id
 */
export const deleteApiKey = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check if API key exists and belongs to user
    const existingKey = await prisma.apiKey.findFirst({
      where: { id, userId },
    });

    if (!existingKey) {
      throw new ApiError(404, 'API key not found');
    }

    await prisma.apiKey.delete({
      where: { id },
    });

    res.status(200).json(
      new ApiResponse(200, null, 'API key deleted successfully')
    );
  }
);

/**
 * Validate and get API key details
 * Used by middleware to authenticate API requests
 */
export async function validateApiKey(apiKey: string): Promise<any | null> {
  const hashedKey = hashApiKey(apiKey);

  const key = await prisma.apiKey.findFirst({
    where: {
      key: hashedKey,
      isActive: true,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
        },
      },
    },
  });

  if (!key) {
    return null;
  }

  // Check if user is active
  if (!key.user.isActive) {
    return null;
  }

  // Update last used timestamp
  await prisma.apiKey.update({
    where: { id: key.id },
    data: { lastUsed: new Date() },
  });

  return key.user;
}
