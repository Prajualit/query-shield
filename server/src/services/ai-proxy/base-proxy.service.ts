import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { DetectorService } from '../detection/detector.service';
import { SanitizerService } from '../detection/sanitizer.service';
import { RulesEngine } from '../detection/rules.engine';
import { prisma } from '../../db';
import { Action } from '@prisma/client';

export interface ProxyRequest {
  userId: string;
  firewallId: string;
  messages?: Array<{ role: string; content: string }>;
  prompt?: string;
  model?: string;
  [key: string]: any;
}

export interface ProxyResponse {
  success: boolean;
  blocked: boolean;
  sanitized: boolean;
  detections: Array<{
    type: string;
    value: string;
    action: Action;
    confidence: number;
  }>;
  originalRequest?: any;
  sanitizedRequest?: any;
  aiResponse?: any;
  error?: string;
  metadata?: {
    provider: string;
    model?: string;
    tokensUsed?: number;
    detectionTime: number;
    proxyTime: number;
  };
}

export abstract class BaseProxyService {
  protected client: AxiosInstance;
  protected detector: DetectorService;
  protected sanitizer: SanitizerService;
  protected rulesEngine: RulesEngine;
  protected provider: string;

  constructor(provider: string) {
    this.provider = provider;
    this.detector = new DetectorService();
    this.sanitizer = new SanitizerService();
    this.rulesEngine = new RulesEngine();
    
    // Initialize axios client with default config
    this.client = axios.create({
      timeout: 60000, // 60 seconds
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Main proxy method that all providers must implement
   */
  abstract proxyRequest(request: ProxyRequest, apiKey: string): Promise<ProxyResponse>;

  /**
   * Extract text content from request for detection
   */
  protected abstract extractContent(request: ProxyRequest): string[];

  /**
   * Reconstruct request with sanitized content
   */
  protected abstract reconstructRequest(
    originalRequest: ProxyRequest,
    sanitizedContents: string[]
  ): ProxyRequest;

  /**
   * Process request through detection and sanitization pipeline
   */
  protected async processRequest(request: ProxyRequest): Promise<{
    sanitizedRequest: ProxyRequest;
    detections: any[];
    actions: Action[];
    shouldBlock: boolean;
  }> {
    const startTime = Date.now();

    // Extract content to scan
    const contents = this.extractContent(request);
    const combinedContent = contents.join('\n');

    // Run detection through rules engine
    const result = await this.rulesEngine.evaluateRules(
      combinedContent,
      request.firewallId,
      request.userId
    );

    const detectionTime = Date.now() - startTime;

    // Check if request should be blocked
    const shouldBlock = result.blocked;

    // Use the sanitized text from rules engine
    const sanitizedContents = shouldBlock ? contents : [result.sanitizedText];

    // Reconstruct request with sanitized content
    const sanitizedRequest = this.reconstructRequest(request, sanitizedContents);

    return {
      sanitizedRequest,
      detections: result.detectedItems,
      actions: result.appliedRules.map(r => r.action),
      shouldBlock,
    };
  }

  /**
   * Create audit log entry
   */
  protected async logAuditTrail(
    userId: string,
    firewallId: string,
    originalRequest: any,
    sanitizedRequest: any,
    detections: any[],
    actions: Action[],
    blocked: boolean,
    aiResponse?: any,
    error?: string
  ): Promise<void> {
    try {
      const originalContents = this.extractContent(originalRequest);
      const sanitizedContents = this.extractContent(sanitizedRequest);

      await prisma.auditLog.create({
        data: {
          userId,
          firewallId,
          inputText: originalContents.join('\n'),
          sanitizedText: sanitizedContents.join('\n'),
          detectedIssues: detections,
          action: blocked ? 'BLOCKED' : detections.length > 0 ? 'SANITIZED' : 'ALLOWED',
          aiProvider: this.provider,
          metadata: {
            actions,
            model: originalRequest.model,
            blocked,
            hasResponse: !!aiResponse,
            error: error || null,
            timestamp: new Date().toISOString(),
          },
        },
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Don't throw - audit logging failure shouldn't break the request
    }
  }

  /**
   * Format detection results for response
   */
  protected formatDetections(detections: any[], actions: Action[]) {
    return detections.map((detection, index) => ({
      type: detection.type,
      value: detection.value,
      action: actions[index] || Action.WARN,
      confidence: detection.confidence,
    }));
  }

  /**
   * Validate API key format
   */
  protected validateApiKey(apiKey: string, provider: string): boolean {
    if (!apiKey) return false;

    switch (provider.toLowerCase()) {
      case 'openai':
        return apiKey.startsWith('sk-');
      case 'anthropic':
        return apiKey.startsWith('sk-ant-');
      default:
        return apiKey.length > 0;
    }
  }

  /**
   * Handle errors consistently
   */
  protected handleError(error: any): ProxyResponse {
    console.error(`${this.provider} Proxy Error:`, error.message);

    return {
      success: false,
      blocked: false,
      sanitized: false,
      detections: [],
      error: error.response?.data?.error?.message || error.message || 'Unknown error occurred',
      metadata: {
        provider: this.provider,
        detectionTime: 0,
        proxyTime: 0,
      },
    };
  }
}
