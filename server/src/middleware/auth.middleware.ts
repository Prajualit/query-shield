import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { verifyAccessToken } from '../utils/jwt.util';
import { ApiError } from '../utils/apiError';
import { prisma } from '../db';

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'No token provided');
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);
    
    req.user = decoded;
    next();
  } catch (error) {
    next(new ApiError(401, 'Invalid or expired token'));
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, 'Unauthorized'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'Forbidden - Insufficient permissions'));
    }

    next();
  };
};

// NEW: Check if user is an organization admin
export const requireOrgAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Unauthorized');
    }

    // Get organizationId from params or user context
    const organizationId = req.params.organizationId || req.user.organizationId;

    if (!organizationId) {
      throw new ApiError(400, 'Organization ID is required');
    }

    const membership = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: req.user.id,
          organizationId,
        },
      },
    });

    if (!membership || membership.role !== 'ADMIN') {
      throw new ApiError(403, 'Organization administrator access required');
    }

    next();
  } catch (error) {
    next(error);
  }
};

// NEW: Check if user is a member of an organization
export const requireOrgMember = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Unauthorized');
    }

    const organizationId = req.params.organizationId || req.user.organizationId;

    if (!organizationId) {
      throw new ApiError(400, 'Organization ID is required');
    }

    const membership = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: req.user.id,
          organizationId,
        },
      },
    });

    if (!membership) {
      throw new ApiError(403, 'Organization membership required');
    }

    // Add organization role to request
    req.user.orgRole = membership.role;

    next();
  } catch (error) {
    next(error);
  }
};

// NEW: Check if user can access resource (own data or admin access)
export const canAccessUserData = (userIdParam: string = 'userId') => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Unauthorized');
      }

      const targetUserId = req.params[userIdParam] || req.query[userIdParam];

      // User can access their own data
      if (targetUserId === req.user.id) {
        return next();
      }

      // Check if user is an admin in the same organization
      if (req.user.accountType === 'ORGANIZATION' && req.user.organizationId) {
        const membership = await prisma.organizationMember.findUnique({
          where: {
            userId_organizationId: {
              userId: req.user.id,
              organizationId: req.user.organizationId,
            },
          },
        });

        if (membership?.role === 'ADMIN') {
          // Verify target user is in the same organization
          const targetMembership = await prisma.organizationMember.findUnique({
            where: {
              userId_organizationId: {
                userId: targetUserId as string,
                organizationId: req.user.organizationId,
              },
            },
          });

          if (targetMembership) {
            return next();
          }
        }
      }

      throw new ApiError(403, 'Access denied');
    } catch (error) {
      next(error);
    }
  };
};