import { Response } from "express";
import { prisma } from "../db";
import { AuthRequest, CreateTeamDTO, UpdateTeamDTO, AddTeamMemberDTO } from "../types";
import { ApiError } from "../utils/apiError";
import { ApiResponse } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";

// Get all teams in an organization
export const getOrganizationTeams = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { organizationId } = req.params;

    // Check if user is a member of the organization
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

    // Admins see all teams, members only see teams they're part of
    const isAdmin = membership.role === 'ADMIN';
    
    const teams = await prisma.team.findMany({
      where: {
        organizationId,
        ...(isAdmin ? {} : {
          // Members only see teams they're part of
          members: {
            some: {
              userId: req.user!.id,
            },
          },
        }),
      },
      include: {
        _count: {
          select: {
            members: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(200).json(
      new ApiResponse(200, teams, "Teams retrieved successfully")
    );
  }
);

// Get team details
export const getTeam = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { teamId } = req.params;

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
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
      },
    });

    if (!team) {
      throw new ApiError(404, "Team not found");
    }

    // Check if user has access (organization member)
    const membership = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: req.user!.id,
          organizationId: team.organizationId,
        },
      },
    });

    if (!membership) {
      throw new ApiError(403, "You do not have access to this team");
    }

    res.status(200).json(
      new ApiResponse(200, team, "Team retrieved successfully")
    );
  }
);

// Create a new team
export const createTeam = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { name, description, organizationId }: CreateTeamDTO = req.body;

    // Check if user is an admin in the organization
    const membership = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: req.user!.id,
          organizationId,
        },
      },
    });

    if (!membership || membership.role !== 'ADMIN') {
      throw new ApiError(403, "Only administrators can create teams");
    }

    const team = await prisma.team.create({
      data: {
        name,
        description,
        organizationId,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.status(201).json(
      new ApiResponse(201, team, "Team created successfully")
    );
  }
);

// Update team
export const updateTeam = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { teamId } = req.params;
    const { name, description, isActive }: UpdateTeamDTO = req.body;

    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      throw new ApiError(404, "Team not found");
    }

    // Check if user is an admin in the organization
    const membership = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: req.user!.id,
          organizationId: team.organizationId,
        },
      },
    });

    if (!membership || membership.role !== 'ADMIN') {
      throw new ApiError(403, "Only administrators can update teams");
    }

    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    res.status(200).json(
      new ApiResponse(200, updatedTeam, "Team updated successfully")
    );
  }
);

// Delete team
export const deleteTeam = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { teamId } = req.params;

    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      throw new ApiError(404, "Team not found");
    }

    // Check if user is an admin in the organization
    const membership = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: req.user!.id,
          organizationId: team.organizationId,
        },
      },
    });

    if (!membership || membership.role !== 'ADMIN') {
      throw new ApiError(403, "Only administrators can delete teams");
    }

    // Delete team and all memberships
    await prisma.team.delete({
      where: { id: teamId },
    });

    res.status(200).json(
      new ApiResponse(200, null, "Team deleted successfully")
    );
  }
);

// Get team members
export const getTeamMembers = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { teamId } = req.params;

    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      throw new ApiError(404, "Team not found");
    }

    // Check if user has access
    const membership = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: req.user!.id,
          organizationId: team.organizationId,
        },
      },
    });

    if (!membership) {
      throw new ApiError(403, "You do not have access to this team");
    }

    const members = await prisma.teamMember.findMany({
      where: { teamId },
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
      orderBy: {
        joinedAt: 'asc',
      },
    });

    res.status(200).json(
      new ApiResponse(200, members, "Team members retrieved successfully")
    );
  }
);

// Add member to team
export const addTeamMember = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { teamId } = req.params;
    const { userId }: AddTeamMemberDTO = req.body;

    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      throw new ApiError(404, "Team not found");
    }

    // Check if user is an admin in the organization
    const membership = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: req.user!.id,
          organizationId: team.organizationId,
        },
      },
    });

    if (!membership || membership.role !== 'ADMIN') {
      throw new ApiError(403, "Only administrators can add team members");
    }

    // Check if target user is a member of the organization
    const targetMembership = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: team.organizationId,
        },
      },
    });

    if (!targetMembership) {
      throw new ApiError(400, "User is not a member of this organization");
    }

    // Check if already a team member
    const existingTeamMember = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId,
          teamId,
        },
      },
    });

    if (existingTeamMember) {
      throw new ApiError(400, "User is already a member of this team");
    }

    const teamMember = await prisma.teamMember.create({
      data: {
        userId,
        teamId,
      },
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

    res.status(201).json(
      new ApiResponse(201, teamMember, "Team member added successfully")
    );
  }
);

// Remove member from team
export const removeTeamMember = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { teamId, memberId } = req.params;

    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      throw new ApiError(404, "Team not found");
    }

    // Check if user is an admin in the organization
    const membership = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: req.user!.id,
          organizationId: team.organizationId,
        },
      },
    });

    if (!membership || membership.role !== 'ADMIN') {
      throw new ApiError(403, "Only administrators can remove team members");
    }

    await prisma.teamMember.delete({
      where: {
        userId_teamId: {
          userId: memberId,
          teamId,
        },
      },
    });

    res.status(200).json(
      new ApiResponse(200, null, "Team member removed successfully")
    );
  }
);
