import { Request } from 'express';

export interface UserPayload {
  id: string;
  email: string;
  role: string;
  accountType?: string;
  organizationId?: string;
  orgRole?: string;
}

export interface AuthRequest extends Request {
  user?: UserPayload;
}

export interface RegisterDTO {
  email: string;
  password: string;
  name?: string;
  accountType?: 'INDIVIDUAL' | 'ORGANIZATION';
  organizationName?: string;
  organizationUniqueId?: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

// Organization DTOs
export interface CreateOrganizationDTO {
  name: string;
  uniqueId: string;
  description?: string;
}

export interface UpdateOrganizationDTO {
  name?: string;
  description?: string;
}

export interface InviteMemberDTO {
  email: string;
  role: 'ADMIN' | 'MEMBER';
  organizationId: string;
}

// Team DTOs
export interface CreateTeamDTO {
  name: string;
  description?: string;
  organizationId: string;
}

export interface UpdateTeamDTO {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface AddTeamMemberDTO {
  userId: string;
  teamId: string;
}

// Invitation DTOs
export interface AcceptInvitationDTO {
  token: string;
  password?: string; // For new users
  name?: string;
}