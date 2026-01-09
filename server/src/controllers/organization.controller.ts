import { Response } from "express";
import { prisma } from "../db";
import { AuthRequest, CreateOrganizationDTO, UpdateOrganizationDTO, InviteMemberDTO } from "../types";
import { ApiError } from "../utils/apiError";
import { ApiResponse } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import crypto from "crypto";

// Get all organizations for the current user
export const getMyOrganizations = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const organizations = await prisma.organizationMember.findMany({
      where: { userId: req.user!.id },
      include: {
        organization: {
          include: {
            _count: {
              select: {
                members: true,
                teams: true,
              },
            },
          },
        },
      },
    });

    res.status(200).json(
      new ApiResponse(
        200,
        organizations.map(om => ({
          ...om.organization,
          role: om.role,
          memberCount: om.organization._count.members,
          teamCount: om.organization._count.teams,
        })),
        "Organizations retrieved successfully"
      )
    );
  }
);

// Get organization details
export const getOrganization = asyncHandler(
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

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                lastActive: true,
              },
            },
          },
        },
        teams: {
          include: {
            _count: {
              select: {
                members: true,
              },
            },
          },
        },
        _count: {
          select: {
            firewalls: true,
          },
        },
      },
    });

    if (!organization) {
      throw new ApiError(404, "Organization not found");
    }

    res.status(200).json(
      new ApiResponse(200, organization, "Organization retrieved successfully")
    );
  }
);

// Update organization
export const updateOrganization = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { organizationId } = req.params;
    const { name, description }: UpdateOrganizationDTO = req.body;

    // Check if user is an admin
    const membership = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: req.user!.id,
          organizationId,
        },
      },
    });

    if (!membership || membership.role !== 'ADMIN') {
      throw new ApiError(403, "Only administrators can update organization details");
    }

    const organization = await prisma.organization.update({
      where: { id: organizationId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
      },
    });

    res.status(200).json(
      new ApiResponse(200, organization, "Organization updated successfully")
    );
  }
);

// Delete organization
export const deleteOrganization = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { organizationId } = req.params;

    // Check if user is the creator
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new ApiError(404, "Organization not found");
    }

    if (organization.createdBy !== req.user!.id) {
      throw new ApiError(403, "Only the organization creator can delete it");
    }

    await prisma.organization.delete({
      where: { id: organizationId },
    });

    res.status(200).json(
      new ApiResponse(200, null, "Organization deleted successfully")
    );
  }
);

// Get organization members
export const getOrganizationMembers = asyncHandler(
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

    const members = await prisma.organizationMember.findMany({
      where: { organizationId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            lastActive: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        joinedAt: 'asc',
      },
    });

    res.status(200).json(
      new ApiResponse(200, members, "Organization members retrieved successfully")
    );
  }
);

// Invite member to organization
export const inviteMember = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { organizationId } = req.params;
    const { email, role }: InviteMemberDTO = req.body;

    // Check if user is an admin
    const membership = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: req.user!.id,
          organizationId,
        },
      },
    });

    if (!membership || membership.role !== 'ADMIN') {
      throw new ApiError(403, "Only administrators can invite members");
    }

    // Check if user is already a member
    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: {
        organizationMemberships: {
          where: { organizationId },
        },
      },
    });

    if (existingUser && existingUser.organizationMemberships.length > 0) {
      throw new ApiError(400, "User is already a member of this organization");
    }

    // Check for existing invitation
    const existingInvite = await prisma.invitation.findUnique({
      where: {
        email_organizationId_invitationType: {
          email,
          organizationId,
          invitationType: 'ORGANIZATION',
        },
      },
    });

    if (existingInvite && existingInvite.status === 'PENDING') {
      throw new ApiError(400, "An invitation has already been sent to this email");
    }

    // Generate invitation token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

    let invitation;
    
    // If there's an existing cancelled/expired invitation, update it instead of creating new
    if (existingInvite && (existingInvite.status === 'CANCELLED' || existingInvite.status === 'EXPIRED')) {
      invitation = await prisma.invitation.update({
        where: { id: existingInvite.id },
        data: {
          role,
          invitedBy: req.user!.id,
          token,
          expiresAt,
          status: 'PENDING',
          acceptedAt: null,
        },
        include: {
          organization: {
            select: {
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
    } else {
      // Create new invitation
      invitation = await prisma.invitation.create({
        data: {
          email,
          invitationType: 'ORGANIZATION',
          organizationId,
          role,
          invitedBy: req.user!.id,
          token,
          expiresAt,
        },
        include: {
          organization: {
            select: {
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
    }

    // Create notification for the inviter
    await prisma.notification.create({
      data: {
        userId: req.user!.id,
        type: 'TEAM',
        title: 'Invitation Sent',
        message: `You invited ${email} to join ${invitation.organization?.name || 'the organization'} as ${role.toLowerCase()}`,
        severity: 'INFO',
        metadata: {
          invitationId: invitation.id,
          email,
          role,
          organizationId,
        },
      },
    });

    // Check if invited user already has an account and notify them
    const invitedUser = await prisma.user.findUnique({
      where: { email },
    });

    if (invitedUser) {
      // Get inviter's name for notification
      const inviter = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { name: true, email: true },
      });

      // Create notification for the invited user
      await prisma.notification.create({
        data: {
          userId: invitedUser.id,
          type: 'TEAM',
          title: 'Organization Invitation',
          message: `${inviter?.name || inviter?.email || 'Someone'} invited you to join ${invitation.organization?.name || 'an organization'} as ${role.toLowerCase()}`,
          severity: 'INFO',
          metadata: {
            invitationId: invitation.id,
            inviterId: req.user!.id,
            organizationId,
            organizationName: invitation.organization?.name,
            role,
            token: invitation.token,
            actionType: 'JOIN_ORGANIZATION',
            actionLabel: 'Join Organization',
          },
        },
      });
    }

    // TODO: Send invitation email with token link
    // Email should contain: ${FRONTEND_URL}/invite/accept?token=${token}

    res.status(201).json(
      new ApiResponse(201, invitation, "Invitation sent successfully")
    );
  }
);

// Remove member from organization
export const removeMember = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { organizationId, memberId } = req.params;

    // Check if user is an admin
    const membership = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: req.user!.id,
          organizationId,
        },
      },
    });

    if (!membership || membership.role !== 'ADMIN') {
      throw new ApiError(403, "Only administrators can remove members");
    }

    // Get the member to remove by membership ID
    const memberToRemove = await prisma.organizationMember.findUnique({
      where: { id: memberId },
      include: { user: true },
    });

    if (!memberToRemove || memberToRemove.organizationId !== organizationId) {
      throw new ApiError(404, "Member not found in organization");
    }

    // Prevent removing organization creator
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (organization?.createdBy === memberToRemove.userId) {
      throw new ApiError(400, "Cannot remove organization creator");
    }

    // Remove member and all team memberships
    await prisma.$transaction([
      prisma.teamMember.deleteMany({
        where: {
          userId: memberToRemove.userId,
          team: {
            organizationId,
          },
        },
      }),
      prisma.organizationMember.delete({
        where: { id: memberId },
      }),
    ]);

    res.status(200).json(
      new ApiResponse(200, null, "Member removed successfully")
    );
  }
);

// Update member role
export const updateMemberRole = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { organizationId, memberId } = req.params;
    const { role } = req.body;

    // Check if user is an admin
    const membership = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: req.user!.id,
          organizationId,
        },
      },
    });

    if (!membership || membership.role !== 'ADMIN') {
      throw new ApiError(403, "Only administrators can update member roles");
    }

    // Prevent changing organization creator's role
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (organization?.createdBy === memberId) {
      throw new ApiError(400, "Cannot change organization creator's role");
    }

    const updatedMember = await prisma.organizationMember.update({
      where: {
        userId_organizationId: {
          userId: memberId,
          organizationId,
        },
      },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    res.status(200).json(
      new ApiResponse(200, updatedMember, "Member role updated successfully")
    );
  }
);
