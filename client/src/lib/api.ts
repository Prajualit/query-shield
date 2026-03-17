/**
 * API Client for QueryShield
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
  ApiResponse,
  ApiError,
  AuthResponse,
  User,
  Firewall,
  Rule,
  AuditLog,
  ApiKey,
  DashboardStats,
  TimelineData,
  Pattern,
  FirewallPerformance,
  PaginatedResponse,
  TeamMember,
  TeamInvite,
  Notification,
  NotificationPreference,
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiError>) => {
        if (error.response?.status === 401) {
          // Token expired, clear auth and redirect to login
          this.clearAuth();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth token management
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  }

  private setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', token);
    }
  }

  private clearAuth(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  }

  // Authentication
  async register(
    email: string, 
    password: string, 
    name?: string,
    accountType?: 'INDIVIDUAL' | 'ORGANIZATION',
    organizationName?: string
  ): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/auth/register', {
      email,
      password,
      name,
      accountType,
      organizationName,
    });
    if (response.data.data) {
      this.setToken(response.data.data.accessToken);
      if (typeof window !== 'undefined') {
        localStorage.setItem('refreshToken', response.data.data.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
      }
    }
    return response.data;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/auth/login', {
      email,
      password,
    });
    if (response.data.data) {
      this.setToken(response.data.data.accessToken);
      if (typeof window !== 'undefined') {
        localStorage.setItem('refreshToken', response.data.data.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
      }
    }
    return response.data;
  }

  async getCurrentUser(): Promise<ApiResponse<{ user: User }>> {
    const response = await this.client.get('/auth/me');
    return response.data;
  }

  logout(): void {
    this.clearAuth();
  }

  // Firewalls
  async getFirewalls(): Promise<ApiResponse<Firewall[]>> {
    const response = await this.client.get('/firewalls');
    return response.data;
  }

  async getFirewall(id: string): Promise<ApiResponse<Firewall>> {
    const response = await this.client.get(`/firewalls/${id}`);
    return response.data;
  }

  async createFirewall(data: {
    name: string;
    description?: string;
    isActive?: boolean;
  }): Promise<ApiResponse<Firewall>> {
    const response = await this.client.post('/firewalls', data);
    return response.data;
  }

  async updateFirewall(
    id: string,
    data: { name?: string; description?: string; isActive?: boolean }
  ): Promise<ApiResponse<Firewall>> {
    const response = await this.client.put(`/firewalls/${id}`, data);
    return response.data;
  }

  async deleteFirewall(id: string): Promise<ApiResponse<null>> {
    const response = await this.client.delete(`/firewalls/${id}`);
    return response.data;
  }

  async testFirewall(id: string, text: string): Promise<ApiResponse<unknown>> {
    const response = await this.client.post(`/firewalls/${id}/test`, { text });
    return response.data;
  }

  // Rules
  async getRules(firewallId?: string): Promise<ApiResponse<Rule[]>> {
    const url = firewallId ? `/firewalls/${firewallId}/rules` : '/rules';
    const response = await this.client.get(url);
    return response.data;
  }

  async createRule(
    data: {
      name: string;
      type: string;
      pattern: string;
      severity?: string;
      enabled?: boolean;
    }
  ): Promise<ApiResponse<Rule>> {
    const response = await this.client.post('/rules', data);
    return response.data;
  }

  async updateRule(
    id: string,
    data: {
      name?: string;
      pattern?: string;
      enabled?: boolean;
    }
  ): Promise<ApiResponse<Rule>> {
    const response = await this.client.put(`/rules/${id}`, data);
    return response.data;
  }

  async deleteRule(id: string): Promise<ApiResponse<null>> {
    const response = await this.client.delete(`/rules/${id}`);
    return response.data;
  }

  // Audit Logs
  async getAuditLogs(params?: {
    page?: number;
    limit?: number;
    firewallId?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    organizationId?: string;
    teamId?: string;
  }): Promise<PaginatedResponse<AuditLog>> {
    const response = await this.client.get('/audit-logs', { params });
    return response.data;
  }

  async getAuditLog(id: string): Promise<ApiResponse<AuditLog>> {
    const response = await this.client.get(`/audit-logs/${id}`);
    return response.data;
  }

  async exportAuditLogs(params?: {
    firewallId?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
    organizationId?: string;
    teamId?: string;
  }): Promise<Blob> {
    const response = await this.client.get('/audit-logs/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  }

  // Analytics
  async getDashboardStats(params?: {
    startDate?: string;
    endDate?: string;
    organizationId?: string;
    teamId?: string;
  }): Promise<ApiResponse<DashboardStats>> {
    const response = await this.client.get('/analytics/dashboard', { params });
    return response.data;
  }

  async getTimeline(params?: {
    days?: number;
    firewallId?: string;
    organizationId?: string;
    teamId?: string;
  }): Promise<ApiResponse<TimelineData[]>> {
    const response = await this.client.get('/analytics/timeline', { params });
    return response.data;
  }

  async getTopPatterns(params?: {
    limit?: number;
    startDate?: string;
    endDate?: string;
    organizationId?: string;
    teamId?: string;
  }): Promise<ApiResponse<Pattern[]>> {
    const response = await this.client.get('/analytics/patterns', { params });
    return response.data;
  }

  async getFirewallPerformance(params?: {
    startDate?: string;
    endDate?: string;
    organizationId?: string;
    teamId?: string;
  }): Promise<ApiResponse<FirewallPerformance[]>> {
    const response = await this.client.get('/analytics/firewall-performance', { params });
    return response.data;
  }

  // API Keys
  async getApiKeys(): Promise<ApiResponse<ApiKey[]>> {
    const response = await this.client.get('/api-keys');
    return response.data;
  }

  async createApiKey(data: { name: string }): Promise<ApiResponse<ApiKey>> {
    const response = await this.client.post('/api-keys', data);
    return response.data;
  }

  async updateApiKey(
    id: string,
    data: { name?: string; isActive?: boolean }
  ): Promise<ApiResponse<ApiKey>> {
    const response = await this.client.put(`/api-keys/${id}`, data);
    return response.data;
  }

  async deleteApiKey(id: string): Promise<ApiResponse<null>> {
    const response = await this.client.delete(`/api-keys/${id}`);
    return response.data;
  }

  // Settings
  async updateProfile(data: {
    name?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
  }): Promise<ApiResponse<User>> {
    const response = await this.client.put('/auth/profile', data);
    return response.data;
  }

  async updateFirewallDefaults(data: {
    defaultRateLimit?: string;
    defaultSqlInjectionProtection?: boolean;
    defaultXssProtection?: boolean;
    defaultPathTraversalProtection?: boolean;
    defaultAiValidation?: boolean;
  }): Promise<ApiResponse<unknown>> {
    const response = await this.client.put('/settings/firewall-defaults', data);
    return response.data;
  }

  async updateNotificationSettings(data: {
    emailAlerts?: boolean;
    threatDetections?: boolean;
    systemUpdates?: boolean;
    weeklyReports?: boolean;
    criticalOnly?: boolean;
  }): Promise<ApiResponse<unknown>> {
    const response = await this.client.put('/settings/notifications', data);
    return response.data;
  }

  // Real-time Monitoring
  async getRealtimeMonitoring(): Promise<ApiResponse<{
    requestsPerSecond: number;
    threatsDetected: number;
    requestsBlocked: number;
    activeConnections: number;
  }>> {
    const response = await this.client.get('/monitoring/realtime');
    return response.data;
  }

  // Team Management (B2B Organization-based)
  async getMyOrganizations(): Promise<ApiResponse<Array<{
    id: string;
    name: string;
    uniqueId: string;
    role: 'ADMIN' | 'MEMBER';
  }>>> {
    const response = await this.client.get('/organizations/my');
    return response.data;
  }

  async getOrganization(id: string): Promise<ApiResponse<{
    id: string;
    name: string;
    uniqueId: string;
    createdAt: string;
    _count: { members: number; teams: number };
  }>> {
    const response = await this.client.get(`/organizations/${id}`);
    return response.data;
  }

  async getOrganizationMembers(orgId: string): Promise<ApiResponse<Array<{
    id: string;
    role: 'ADMIN' | 'MEMBER';
    joinedAt: string;
    user: { id: string; email: string; name: string; lastActive: string };
  }>>> {
    const response = await this.client.get(`/organizations/${orgId}/members`);
    return response.data;
  }

  async inviteOrganizationMember(orgId: string, data: { email: string; role: 'ADMIN' | 'MEMBER' }): Promise<ApiResponse<{ id: string; email: string; token: string }>> {
    const response = await this.client.post(`/organizations/${orgId}/members/invite`, data);
    return response.data;
  }

  async removeOrganizationMember(orgId: string, memberId: string): Promise<ApiResponse<null>> {
    const response = await this.client.delete(`/organizations/${orgId}/members/${memberId}`);
    return response.data;
  }

  async updateOrganizationMemberRole(orgId: string, memberId: string, role: 'ADMIN' | 'MEMBER'): Promise<ApiResponse<unknown>> {
    const response = await this.client.patch(`/organizations/${orgId}/members/${memberId}/role`, { role });
    return response.data;
  }

  // Teams within Organization
  async getOrganizationTeams(orgId: string): Promise<ApiResponse<Array<{
    id: string;
    name: string;
    description: string;
    _count: { members: number };
  }>>> {
    const response = await this.client.get(`/teams/organization/${orgId}`);
    return response.data;
  }

  async createTeam(data: { name: string; description?: string; organizationId: string }): Promise<ApiResponse<{ id: string; name: string }>> {
    const response = await this.client.post('/teams', data);
    return response.data;
  }

  async deleteTeam(teamId: string): Promise<ApiResponse<null>> {
    const response = await this.client.delete(`/teams/${teamId}`);
    return response.data;
  }

  async addTeamMember(teamId: string, userId: string): Promise<ApiResponse<unknown>> {
    const response = await this.client.post(`/teams/${teamId}/members`, { userId });
    return response.data;
  }

  async getTeamMembersById(teamId: string): Promise<ApiResponse<Array<{
    id: string;
    role: 'MANAGER' | 'MEMBER';
    user: {
      id: string;
      email: string;
      name: string | null;
    };
    joinedAt: string;
  }>>> {
    const response = await this.client.get(`/teams/${teamId}/members`);
    return response.data;
  }

  async updateTeamMemberRole(teamId: string, memberId: string, role: 'MANAGER' | 'MEMBER'): Promise<ApiResponse<unknown>> {
    const response = await this.client.patch(`/teams/${teamId}/members/${memberId}/role`, { role });
    return response.data;
  }

  async removeTeamMember(teamId: string, userId: string): Promise<ApiResponse<null>> {
    const response = await this.client.delete(`/teams/${teamId}/members/${userId}`);
    return response.data;
  }

  // Invitations
  async getOrganizationInvitations(orgId: string): Promise<ApiResponse<Array<{
    id: string;
    email: string;
    role: 'ADMIN' | 'MEMBER';
    status: string;
    expiresAt: string;
    createdAt: string;
  }>>> {
    const response = await this.client.get(`/invitations/organization/${orgId}`);
    return response.data;
  }

  async cancelInvitation(invitationId: string): Promise<ApiResponse<null>> {
    const response = await this.client.delete(`/invitations/${invitationId}`);
    return response.data;
  }

  async resendInvitation(invitationId: string): Promise<ApiResponse<unknown>> {
    const response = await this.client.post(`/invitations/${invitationId}/resend`);
    return response.data;
  }
  async acceptInvitationByToken(token: string): Promise<ApiResponse<any>> {
    const response = await this.client.post('/invitations/accept', { token });
    return response.data;
  }
  async getInvitationByToken(token: string): Promise<ApiResponse<{
    id: string;
    email: string;
    role: 'ADMIN' | 'MEMBER';
    organization: { id: string; name: string };
  }>> {
    const response = await this.client.get(`/invitations/token/${token}`);
    return response.data;
  }

  async acceptInvitation(token: string, data?: { password?: string; name?: string }): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/invitations/accept', { token, ...data });
    if (response.data.data) {
      this.setToken(response.data.data.accessToken);
      if (typeof window !== 'undefined') {
        localStorage.setItem('refreshToken', response.data.data.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
      }
    }
    return response.data;
  }

  // Legacy Team Management (for backwards compatibility)
  async getTeamInfo(): Promise<ApiResponse<{ id: string; name: string; plan: string } | null>> {
    const response = await this.client.get('/team');
    return response.data;
  }

  async getTeamMembers(): Promise<ApiResponse<TeamMember[]>> {
    const response = await this.client.get('/team/members');
    return response.data;
  }

  async getPendingInvites(): Promise<ApiResponse<TeamInvite[]>> {
    const response = await this.client.get('/team/invites');
    return response.data;
  }

  async inviteTeamMember(data: { email: string; role: string }): Promise<ApiResponse<TeamInvite>> {
    const response = await this.client.post('/team/invites', data);
    return response.data;
  }

  async resendInvite(inviteId: string): Promise<ApiResponse<TeamInvite>> {
    const response = await this.client.post(`/team/invites/${inviteId}/resend`);
    return response.data;
  }

  async cancelInvite(inviteId: string): Promise<ApiResponse<null>> {
    const response = await this.client.delete(`/team/invites/${inviteId}`);
    return response.data;
  }

  async updateMemberRole(memberId: string, role: string): Promise<ApiResponse<TeamMember>> {
    const response = await this.client.patch(`/team/members/${memberId}/role`, { role });
    return response.data;
  }

  async removeMember(memberId: string): Promise<ApiResponse<null>> {
    const response = await this.client.delete(`/team/members/${memberId}`);
    return response.data;
  }

  // Notifications
  async getNotifications(unreadOnly?: boolean): Promise<ApiResponse<Notification[]>> {
    const response = await this.client.get('/notifications', {
      params: { unreadOnly }
    });
    return response.data;
  }

  async getUnreadCount(): Promise<ApiResponse<{ count: number }>> {
    const response = await this.client.get('/notifications/unread-count');
    return response.data;
  }

  async markNotificationAsRead(notificationId: string): Promise<ApiResponse<Notification>> {
    const response = await this.client.patch(`/notifications/${notificationId}/read`);
    return response.data;
  }

  async markAllNotificationsAsRead(): Promise<ApiResponse<null>> {
    const response = await this.client.patch('/notifications/mark-all-read');
    return response.data;
  }

  async deleteNotification(notificationId: string): Promise<ApiResponse<null>> {
    const response = await this.client.delete(`/notifications/${notificationId}`);
    return response.data;
  }

  async clearAllNotifications(): Promise<ApiResponse<null>> {
    const response = await this.client.delete('/notifications');
    return response.data;
  }

  async getNotificationPreferences(): Promise<ApiResponse<NotificationPreference[]>> {
    const response = await this.client.get('/notifications/preferences');
    return response.data;
  }

  async updateNotificationPreference(
    preferenceId: string, 
    data: { email?: boolean; push?: boolean; slack?: boolean }
  ): Promise<ApiResponse<NotificationPreference>> {
    const response = await this.client.patch(`/notifications/preferences/${preferenceId}`, data);
    return response.data;
  }

  async bulkUpdateNotificationPreferences(preferences: Partial<NotificationPreference>[]): Promise<ApiResponse<NotificationPreference[]>> {
    const response = await this.client.patch('/notifications/preferences', { preferences });
    return response.data;
  }

  // Organization Firewalls (org-level - applies to all teams)
  async getOrgFirewalls(organizationId: string): Promise<ApiResponse<Firewall[]>> {
    const response = await this.client.get(`/org-firewalls/${organizationId}/firewalls`);
    return response.data;
  }

  async createOrgFirewall(organizationId: string, data: {
    name: string;
    description?: string;
    isActive?: boolean;
  }): Promise<ApiResponse<Firewall>> {
    const response = await this.client.post(`/org-firewalls/${organizationId}/firewalls`, data);
    return response.data;
  }

  async updateOrgFirewall(organizationId: string, firewallId: string, data: {
    name?: string;
    description?: string;
    isActive?: boolean;
  }): Promise<ApiResponse<Firewall>> {
    const response = await this.client.put(`/org-firewalls/${organizationId}/firewalls/${firewallId}`, data);
    return response.data;
  }

  async deleteOrgFirewall(organizationId: string, firewallId: string): Promise<ApiResponse<null>> {
    const response = await this.client.delete(`/org-firewalls/${organizationId}/firewalls/${firewallId}`);
    return response.data;
  }

  async getOrgFirewall(organizationId: string, firewallId: string): Promise<ApiResponse<Firewall>> {
    const response = await this.client.get(`/org-firewalls/${organizationId}/firewalls/${firewallId}`);
    return response.data;
  }

  // Organization Firewall Rules
  async getOrgFirewallRules(organizationId: string, firewallId: string): Promise<ApiResponse<Rule[]>> {
    const response = await this.client.get(`/org-firewalls/${organizationId}/firewalls/${firewallId}/rules`);
    return response.data;
  }

  async createOrgFirewallRule(organizationId: string, firewallId: string, data: {
    name: string;
    type: string;
    pattern: string;
    action?: string;
    priority?: number;
    isActive?: boolean;
  }): Promise<ApiResponse<Rule>> {
    const response = await this.client.post(`/org-firewalls/${organizationId}/firewalls/${firewallId}/rules`, data);
    return response.data;
  }

  async updateOrgFirewallRule(organizationId: string, firewallId: string, ruleId: string, data: {
    name?: string;
    type?: string;
    pattern?: string;
    action?: string;
    priority?: number;
    isActive?: boolean;
  }): Promise<ApiResponse<Rule>> {
    const response = await this.client.put(`/org-firewalls/${organizationId}/firewalls/${firewallId}/rules/${ruleId}`, data);
    return response.data;
  }

  async deleteOrgFirewallRule(organizationId: string, firewallId: string, ruleId: string): Promise<ApiResponse<null>> {
    const response = await this.client.delete(`/org-firewalls/${organizationId}/firewalls/${firewallId}/rules/${ruleId}`);
    return response.data;
  }

  // Team Firewalls (team-level - applies to specific team)
  async getTeamFirewalls(teamId: string): Promise<ApiResponse<Firewall[]>> {
    const response = await this.client.get(`/team-firewalls/${teamId}/firewalls`);
    return response.data;
  }

  async createTeamFirewall(teamId: string, data: {
    name: string;
    description?: string;
    isActive?: boolean;
  }): Promise<ApiResponse<Firewall>> {
    const response = await this.client.post(`/team-firewalls/${teamId}/firewalls`, data);
    return response.data;
  }

  async updateTeamFirewall(teamId: string, firewallId: string, data: {
    name?: string;
    description?: string;
    isActive?: boolean;
  }): Promise<ApiResponse<Firewall>> {
    const response = await this.client.put(`/team-firewalls/${teamId}/firewalls/${firewallId}`, data);
    return response.data;
  }

  async deleteTeamFirewall(teamId: string, firewallId: string): Promise<ApiResponse<null>> {
    const response = await this.client.delete(`/team-firewalls/${teamId}/firewalls/${firewallId}`);
    return response.data;
  }

  async getTeamFirewall(teamId: string, firewallId: string): Promise<ApiResponse<Firewall>> {
    const response = await this.client.get(`/team-firewalls/${teamId}/firewalls/${firewallId}`);
    return response.data;
  }

  // Team Firewall Rules
  async getTeamFirewallRules(teamId: string, firewallId: string): Promise<ApiResponse<Rule[]>> {
    const response = await this.client.get(`/team-firewalls/${teamId}/firewalls/${firewallId}/rules`);
    return response.data;
  }

  async createTeamFirewallRule(teamId: string, firewallId: string, data: {
    name: string;
    type: string;
    pattern: string;
    action?: string;
    priority?: number;
    isActive?: boolean;
  }): Promise<ApiResponse<Rule>> {
    const response = await this.client.post(`/team-firewalls/${teamId}/firewalls/${firewallId}/rules`, data);
    return response.data;
  }

  async updateTeamFirewallRule(teamId: string, firewallId: string, ruleId: string, data: {
    name?: string;
    type?: string;
    pattern?: string;
    action?: string;
    priority?: number;
    isActive?: boolean;
  }): Promise<ApiResponse<Rule>> {
    const response = await this.client.put(`/team-firewalls/${teamId}/firewalls/${firewallId}/rules/${ruleId}`, data);
    return response.data;
  }

  async deleteTeamFirewallRule(teamId: string, firewallId: string, ruleId: string): Promise<ApiResponse<null>> {
    const response = await this.client.delete(`/team-firewalls/${teamId}/firewalls/${firewallId}/rules/${ruleId}`);
    return response.data;
  }

  // Get all applicable firewalls for user (personal + org + team)
  async getApplicableFirewalls(): Promise<ApiResponse<Firewall[]>> {
    const response = await this.client.get('/org-firewalls/applicable');
    return response.data;
  }
}

export const api = new ApiClient();
export default api;
