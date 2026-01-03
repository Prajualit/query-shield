import { Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../db";
import { AuthRequest, RegisterDTO, LoginDTO } from "../types";
import { ApiError } from "../utils/apiError";
import { ApiResponse } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.util";

export const register = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { email, password, name, accountType, organizationName, organizationUniqueId }: RegisterDTO = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ApiError(400, "Email already registered");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Determine account type (default to INDIVIDUAL)
    const userAccountType = accountType || 'INDIVIDUAL';

    // If organization account, create organization
    if (userAccountType === 'ORGANIZATION') {
      if (!organizationName) {
        throw new ApiError(400, "Organization name is required for organization accounts");
      }

      // Generate unique ID if not provided
      let uniqueId = organizationUniqueId;
      if (!uniqueId) {
        // Generate a unique ID based on organization name and timestamp
        const baseId = organizationName.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 20);
        const timestamp = Date.now().toString(36);
        uniqueId = `${baseId}-${timestamp}`;
      }

      // Check if organization unique ID already exists
      const existingOrg = await prisma.organization.findUnique({
        where: { uniqueId: uniqueId }
      });
      if (existingOrg) {
        throw new ApiError(400, "Organization unique ID already taken");
      }

      // Create user and organization in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create user (accountType stays INDIVIDUAL - org membership is separate)
        const user = await tx.user.create({
          data: {
            email,
            password: hashedPassword,
            name,
            accountType: 'INDIVIDUAL',
          },
          select: {
            id: true,
            email: true,
            name: true,
            accountType: true,
            createdAt: true,
          },
        });

        // Create organization
        const organization = await tx.organization.create({
          data: {
            name: organizationName,
            uniqueId: uniqueId,
            createdBy: user.id,
          },
        });

        // Add user as admin to organization
        await tx.organizationMember.create({
          data: {
            userId: user.id,
            organizationId: organization.id,
            role: 'ADMIN',
          },
        });

        return { user, organization };
      });

      // Generate tokens with organization context
      const accessToken = generateAccessToken({
        id: result.user.id,
        email: result.user.email,
        role: 'USER',
        accountType: 'INDIVIDUAL',
        organizationId: result.organization.id,
        orgRole: 'ADMIN',
      });

      const refreshToken = generateRefreshToken({
        id: result.user.id,
        email: result.user.email,
        role: 'USER',
        accountType: 'INDIVIDUAL',
        organizationId: result.organization.id,
        orgRole: 'ADMIN',
      });

      return res.status(201).json(
        new ApiResponse(
          201,
          {
            user: {
              ...result.user,
              organizationId: result.organization.id,
              orgRole: 'ADMIN' as const,
            },
            organization: result.organization,
            accessToken,
            refreshToken,
          },
          "Organization and user registered successfully"
        )
      );
    }

    // Individual account creation
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        accountType: 'INDIVIDUAL',
      },
      select: {
        id: true,
        email: true,
        name: true,
        accountType: true,
        createdAt: true,
      },
    });

    // Generate tokens
    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: 'USER',
      accountType: 'INDIVIDUAL',
    });

    const refreshToken = generateRefreshToken({
      id: user.id,
      email: user.email,
      role: 'USER',
      accountType: 'INDIVIDUAL',
    });

    res.status(201).json(
      new ApiResponse(
        201,
        {
          user,
          accessToken,
          refreshToken,
        },
        "User registered successfully"
      )
    );
  }
);

export const login = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { email, password }: LoginDTO = req.body;

    // Find user with organization memberships
    const user = await prisma.user.findUnique({ 
      where: { email },
      include: {
        organizationMemberships: {
          include: {
            organization: true,
          },
        },
      },
    });
    
    if (!user) {
      throw new ApiError(401, "Invalid credentials");
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new ApiError(401, "Invalid credentials");
    }

    // Prepare user payload - check for organization memberships regardless of accountType
    // Users are always INDIVIDUAL but may belong to organizations as members/admins
    let tokenPayload: any = {
      id: user.id,
      email: user.email,
      role: 'USER',
      accountType: user.accountType,
    };

    // Primary organization context (first/default organization if user belongs to any)
    let primaryOrganization: any = null;
    let primaryOrgRole: string | null = null;

    // Include organization context if user has any memberships
    if (user.organizationMemberships.length > 0) {
      // Use the first organization as primary (could be enhanced to let user choose)
      const primaryMembership = user.organizationMemberships[0];
      primaryOrganization = primaryMembership.organization;
      primaryOrgRole = primaryMembership.role;
      
      tokenPayload = {
        ...tokenPayload,
        organizationId: primaryMembership.organizationId,
        orgRole: primaryMembership.role,
      };
    }

    // Generate tokens
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Return user without password
    const { password: _, organizationMemberships, ...userWithoutPassword } = user;

    // Build user response with organization context
    const userResponse: any = {
      ...userWithoutPassword,
      organizations: user.organizationMemberships.map((m: any) => ({
        id: m.organization.id,
        name: m.organization.name,
        uniqueId: m.organization.uniqueId,
        role: m.role,
      })),
    };

    // Add primary organization context to user object for frontend
    if (primaryOrganization) {
      userResponse.organizationId = primaryOrganization.id;
      userResponse.orgRole = primaryOrgRole;
      userResponse.organizationName = primaryOrganization.name;
    }

    res.status(200).json(
      new ApiResponse(
        200,
        {
          user: userResponse,
          accessToken,
          refreshToken,
        },
        "Login successful"
      )
    );
  }
);

export const getCurrentUser = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        accountType: true,
        createdAt: true,
        organizationMemberships: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                uniqueId: true,
                plan: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Build user response with primary organization context
    const userResponse: any = {
      id: user.id,
      email: user.email,
      name: user.name,
      accountType: user.accountType,
      createdAt: user.createdAt,
      organizationMemberships: user.organizationMemberships,
    };

    // Add primary organization context if user has memberships
    if (user.organizationMemberships.length > 0) {
      const primaryMembership = user.organizationMemberships[0];
      userResponse.organizationId = primaryMembership.organization.id;
      userResponse.orgRole = primaryMembership.role;
      userResponse.organizationName = primaryMembership.organization.name;
    }

    res
      .status(200)
      .json(new ApiResponse(200, { user: userResponse }, "User retrieved successfully"));
  }
);
