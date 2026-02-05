/**
 * TypeScript types for QueryShield API
 */

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  accountType?: 'INDIVIDUAL' | 'ORGANIZATION';
  organizationId?: string;
  orgRole?: 'ADMIN' | 'MEMBER';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Invitation {
  id: string;
  email: string;
  token: string;
  role: 'ADMIN' | 'MEMBER';
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED';
  organizationId: string;
  organization?: {
    id: string;
    name: string;
  };
  inviter?: {
    name: string;
  };
  createdAt: string;
  expiresAt: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    accessToken: string;
    refreshToken: string;
    user: User;
  };
  message: string;
}

export interface Firewall {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  userId: string;
  organizationId?: string | null;
  teamId?: string | null;
  scope: 'PERSONAL' | 'ORGANIZATION' | 'TEAM';
  createdAt: string;
  updatedAt: string;
  rules?: Rule[];
  _count?: {
    rules: number;
    auditLogs: number;
  };
  user?: {
    id: string;
    name: string | null;
    email: string;
  };
  organization?: {
    id: string;
    name: string;
  } | null;
  team?: {
    id: string;
    name: string;
  } | null;
  targetUrl?: string;
  rateLimit?: number;
  sqlInjectionProtection?: boolean;
  xssProtection?: boolean;
  pathTraversalProtection?: boolean;
  aiValidation?: boolean;
  enabled?: boolean;
  stats?: {
    totalRequests: number;
    threatsBlocked: number;
    successRate: number;
    avgResponseTime: number;
  };
}

export interface Rule {
  id: string;
  name: string;
  type: RuleType | string;
  pattern: string;
  action: Action;
  priority: number;
  isActive: boolean;
  firewallId: string;
  createdAt: string;
  updatedAt: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  enabled?: boolean;
  detectionCount?: number;
}

export type RuleType =
  | 'EMAIL'
  | 'PHONE'
  | 'CREDIT_CARD'
  | 'SSN'
  | 'API_KEY'
  | 'IP_ADDRESS'
  | 'CUSTOM_REGEX';

export type Action = 'REDACT' | 'MASK' | 'BLOCK' | 'WARN' | 'ALLOW';

export interface AuditLog {
  id: string;
  userId: string;
  firewallId: string | null;
  inputText: string;
  sanitizedText: string;
  detectedIssues: DetectedIssue[];
  action: string;
  aiProvider: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  firewall?: {
    id: string;
    name: string;
  };
  user?: {
    id: string;
    name: string | null;
    email: string;
  };
}

export interface DetectedIssue {
  type: RuleType;
  value: string;
  startIndex: number;
  endIndex: number;
  confidence: number;
}

export interface ApiKey {
  id: string;
  name: string;
  isActive: boolean;
  lastUsed: string | null;
  createdAt: string;
  apiKey?: string; // Only returned on creation
  key: string; // The actual API key
  expiresAt?: string;
}

export interface DashboardStats {
  overview: {
    totalFirewalls: number;
    activeFirewalls: number;
    totalRules: number;
    totalRequests: number;
  };
  requests: {
    blocked: number;
    sanitized: number;
    allowed: number;
    total: number;
  };
  detectionTypes: { [key: string]: number };
}

export interface TimelineData {
  date: string;
  blocked: number;
  sanitized: number;
  allowed: number;
  total: number;
}

export interface Pattern {
  type: string;
  count: number;
}

export interface FirewallPerformance {
  firewallId: string;
  firewallName: string;
  isActive: boolean;
  rulesCount: number;
  totalRequests: number;
  blockedRequests: number;
  totalDetections: number;
  blockRate: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    logs: T[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: string[];
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'MANAGER' | 'MEMBER';
  isActive: boolean;
  lastActive: string | null;
  createdAt: string;
}

export interface TeamInvite {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN';
  expiresAt: string;
  createdAt: string;
  inviter?: {
    name: string;
    email: string;
  };
}

export interface Notification {
  id: string;
  userId: string;
  type: 'THREAT' | 'SECURITY' | 'TEAM' | 'BILLING' | 'SYSTEM';
  title: string;
  message: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  read: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface NotificationPreference {
  id: string;
  userId: string;
  category: string;
  name: string;
  description: string;
  email: boolean;
  push: boolean;
  slack: boolean;
  createdAt: string;
  updatedAt: string;
}
