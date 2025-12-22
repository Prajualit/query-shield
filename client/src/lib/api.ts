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
  async register(email: string, password: string, name?: string): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/auth/register', {
      email,
      password,
      name,
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
  async getRules(firewallId: string): Promise<ApiResponse<Rule[]>> {
    const response = await this.client.get(`/firewalls/${firewallId}/rules`);
    return response.data;
  }

  async createRule(
    firewallId: string,
    data: {
      name: string;
      type: string;
      pattern: string;
      action: string;
      priority?: number;
      isActive?: boolean;
    }
  ): Promise<ApiResponse<Rule>> {
    const response = await this.client.post(`/firewalls/${firewallId}/rules`, data);
    return response.data;
  }

  async updateRule(
    id: string,
    data: {
      name?: string;
      pattern?: string;
      action?: string;
      priority?: number;
      isActive?: boolean;
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
  }): Promise<ApiResponse<DashboardStats>> {
    const response = await this.client.get('/analytics/dashboard', { params });
    return response.data;
  }

  async getTimeline(params?: {
    days?: number;
    firewallId?: string;
  }): Promise<ApiResponse<TimelineData[]>> {
    const response = await this.client.get('/analytics/timeline', { params });
    return response.data;
  }

  async getTopPatterns(params?: {
    limit?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<Pattern[]>> {
    const response = await this.client.get('/analytics/patterns', { params });
    return response.data;
  }

  async getFirewallPerformance(params?: {
    startDate?: string;
    endDate?: string;
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
}

export const api = new ApiClient();
export default api;
