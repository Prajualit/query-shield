import { Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../db";
import { AuthRequest, AcceptInvitationDTO } from "../types";
import { ApiError } from "../utils/apiError";
import { ApiResponse } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.util";

// Get invitation details by token (public endpoint)
export const getInvitationByToken = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { token } = req.params;

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            uniqueId: true,
          },
        },
        inviter: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!invitation) {
      throw new ApiError(404, "Invitation not found");
    }

    if (invitation.status !== 'PENDING') {
      throw new ApiError(400, `Invitation has already been ${invitation.status.toLowerCase()}`);
    }

    if (new Date() > invitation.expiresAt) {
      // Update invitation status
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });
      throw new ApiError(400, "Invitation has expired");
    }

    res.status(200).json(
      new ApiResponse(200, invitation, "Invitation retrieved successfully")
    );
  }
);

// Accept invitation (register or login + join)
export const acceptInvitation = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { token, password, name }: AcceptInvitationDTO = req.body;

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        organization: true,
      },
    });

    if (!invitation) {
      throw new ApiError(404, "Invitation not found");
    }

    if (invitation.status !== 'PENDING') {
      throw new ApiError(400, `Invitation has already been ${invitation.status.toLowerCase()}`);
    }

    if (new Date() > invitation.expiresAt) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });
      throw new ApiError(400, "Invitation has expired");
    }

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email: invitation.email },
    });

    let isNewUser = false;
    let accessToken: string;
    let refreshToken: string;

    if (!user) {
      // New user - register them
      if (!password || !name) {
        throw new ApiError(400, "Password and name are required for new users");
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user and add to organization
      const result = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email: invitation.email,
            password: hashedPassword,
            name,
            accountType: 'ORGANIZATION',
          },
        });

        // Add to organization
        await tx.organizationMember.create({
          data: {
            userId: newUser.id,
            organizationId: invitation.organizationId!,
            role: invitation.role,
          },
        });

        // Update invitation status
        await tx.invitation.update({
          where: { id: invitation.id },
          data: {
            status: 'ACCEPTED',
            acceptedAt: new Date(),
          },
        });

        // Create notification for inviter
        await tx.notification.create({
          data: {
            userId: invitation.invitedBy,
            type: 'TEAM',
            title: 'Invitation Accepted',
            message: `${newUser.email} accepted your invitation and joined the organization`,
            severity: 'INFO',
            metadata: {
              userId: newUser.id,
              email: newUser.email,
              organizationId: invitation.organizationId,
            },
          },
        });

        return newUser;
      });

      user = result;
      isNewUser = true;

      accessToken = generateAccessToken({
        id: user.id,
        email: user.email,
        role: 'USER',
        accountType: 'ORGANIZATION',
        organizationId: invitation.organizationId || undefined,
        orgRole: invitation.role,
      });

      refreshToken = generateRefreshToken({
        id: user.id,
        email: user.email,
        role: 'USER',
        accountType: 'ORGANIZATION',
        organizationId: invitation.organizationId || undefined,
        orgRole: invitation.role,
      });
    } else {
      // Existing user - add to organization
      const existingMembership = await prisma.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId: user.id,
            organizationId: invitation.organizationId!,
          },
        },
      });

      if (existingMembership) {
        throw new ApiError(400, "You are already a member of this organization");
      }

      await prisma.$transaction([
        prisma.organizationMember.create({
          data: {
            userId: user.id,
            organizationId: invitation.organizationId!,
            role: invitation.role,
          },
        }),
        prisma.invitation.update({
          where: { id: invitation.id },
          data: {
            status: 'ACCEPTED',
            acceptedAt: new Date(),
          },
        }),
        prisma.notification.create({
          data: {
            userId: invitation.invitedBy,
            type: 'TEAM',
            title: 'Invitation Accepted',
            message: `${user.email} accepted your invitation and joined the organization`,
            severity: 'INFO',
            metadata: {
              userId: user.id,
              email: user.email,
              organizationId: invitation.organizationId,
            },
          },
        }),
      ]);

      // Generate tokens for existing user
      accessToken = generateAccessToken({
        id: user.id,
        email: user.email,
        role: 'USER',
        accountType: user.accountType,
        organizationId: invitation.organizationId || undefined,
        orgRole: invitation.role,
      });

      refreshToken = generateRefreshToken({
        id: user.id,
        email: user.email,
        role: 'USER',
        accountType: user.accountType,
        organizationId: invitation.organizationId || undefined,
        orgRole: invitation.role,
      });
    }

    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json(
      new ApiResponse(
        200,
        {
          user: userWithoutPassword,
          organization: invitation.organization,
          accessToken,
          refreshToken,
          isNewUser,
        },
        "Invitation accepted successfully"
      )
    );
  }
);

// Cancel invitation (admin only)
export const cancelInvitation = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { invitationId } = req.params;

    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new ApiError(404, "Invitation not found");
    }

    // Check if user is an admin in the organization
    if (invitation.organizationId) {
      const membership = await prisma.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId: req.user!.id,
            organizationId: invitation.organizationId,
          },
        },
      });

      if (!membership || membership.role !== 'ADMIN') {
        throw new ApiError(403, "Only administrators can cancel invitations");
      }
    }

    await prisma.invitation.update({
      where: { id: invitationId },
      data: { status: 'CANCELLED' },
    });

    res.status(200).json(
      new ApiResponse(200, null, "Invitation cancelled successfully")
    );
  }
);

// Get pending invitations for an organization
export const getOrganizationInvitations = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { organizationId } = req.params;

    // Check if user is a member
    const membership = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: req.user!.id,
          organizationId,
        },
      },
    });

    if (!membership) {
      throw new ApiError(403, "You are not a member of this organization");
    }

    const invitations = await prisma.invitation.findMany({
      where: {
        organizationId,
        invitationType: 'ORGANIZATION',
      },
      include: {
        inviter: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(200).json(
      new ApiResponse(200, invitations, "Invitations retrieved successfully")
    );
  }
);

// Resend invitation
export const resendInvitation = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { invitationId } = req.params;

    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new ApiError(404, "Invitation not found");
    }

    // Check if user is an admin
    if (invitation.organizationId) {
      const membership = await prisma.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId: req.user!.id,
            organizationId: invitation.organizationId,
          },
        },
      });

      if (!membership || membership.role !== 'ADMIN') {
        throw new ApiError(403, "Only administrators can resend invitations");
      }
    }

    if (invitation.status !== 'PENDING') {
      throw new ApiError(400, "Can only resend pending invitations");
    }

    // Extend expiration and generate new token
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);
    
    const crypto = require('crypto');
    const newToken = crypto.randomBytes(32).toString('hex');

    const updatedInvitation = await prisma.invitation.update({
      where: { id: invitationId },
      data: { 
        expiresAt: newExpiresAt,
        token: newToken,
      },
      include: {
        organization: {
          select: {
            name: true,
            uniqueId: true,
          },
        },
      },
    });

    // Notify the inviter
    await prisma.notification.create({
      data: {
        userId: req.user!.id,
        type: 'TEAM',
        title: 'Invitation Resent',
        message: `You resent the invitation to ${invitation.email}`,
        severity: 'INFO',
        metadata: {
          invitationId: invitation.id,
          email: invitation.email,
        },
      },
    });

    // Check if invited user has an account and send them a new notification
    const invitedUser = await prisma.user.findUnique({
      where: { email: invitation.email },
    });

    if (invitedUser) {
      // Delete old invitation notification if exists
      await prisma.notification.deleteMany({
        where: {
          userId: invitedUser.id,
          metadata: {
            path: ['invitationId'],
            equals: invitation.id,
          },
        },
      });

      // Get inviter's name for notification
      const inviter = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { name: true, email: true },
      });

      // Create new notification for the invited user
      await prisma.notification.create({
        data: {
          userId: invitedUser.id,
          type: 'TEAM',
          title: 'Organization Invitation',
          message: `${inviter?.name || inviter?.email || 'Someone'} invited you to join ${updatedInvitation.organization?.name || 'an organization'} as ${invitation.role.toLowerCase()}`,
          severity: 'INFO',
          metadata: {
            invitationId: invitation.id,
            inviterId: req.user!.id,
            organizationId: invitation.organizationId,
            organizationName: updatedInvitation.organization?.name,
            role: invitation.role,
            token: newToken,
            actionType: 'JOIN_ORGANIZATION',
            actionLabel: 'Join Organization',
          },
        },
      });
    }

    // TODO: Resend invitation email

    res.status(200).json(
      new ApiResponse(200, updatedInvitation, "Invitation resent successfully")
    );
  }
);
