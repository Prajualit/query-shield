import { BaseProxyService, ProxyRequest, ProxyResponse } from './base-proxy.service';
import { Action } from '@prisma/client';

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AnthropicRequest extends ProxyRequest {
  model: string;
  messages: AnthropicMessage[];
  max_tokens: number;
  temperature?: number;
  top_p?: number;
  top_k?: number;
  system?: string;
  stream?: boolean;
  [key: string]: any;
}

interface AnthropicResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{
    type: string;
    text: string;
  }>;
  model: string;
  stop_reason: string;
  stop_sequence: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export class AnthropicProxyService extends BaseProxyService {
  private baseUrl = 'https://api.anthropic.com/v1';
  private apiVersion = '2023-06-01';

  constructor() {
    super('Anthropic');
  }

  /**
   * Proxy request to Anthropic Messages API
   */
  async proxyRequest(request: ProxyRequest, apiKey: string): Promise<ProxyResponse> {
    const startTime = Date.now();

    try {
      // Validate API key
      if (!this.validateApiKey(apiKey, 'anthropic')) {
        throw new Error('Invalid Anthropic API key format. Must start with "sk-ant-"');
      }

      // Validate request
      const anthropicRequest = request as AnthropicRequest;
      if (!anthropicRequest.messages || !Array.isArray(anthropicRequest.messages)) {
        throw new Error('Invalid request: messages array is required');
      }

      if (!anthropicRequest.model) {
        throw new Error('Invalid request: model is required');
      }

      if (!anthropicRequest.max_tokens) {
        throw new Error('Invalid request: max_tokens is required for Anthropic API');
      }

      // Process request through detection pipeline
      const { sanitizedRequest, detections, actions, shouldBlock } = await this.processRequest(
        anthropicRequest
      );

      // If request should be blocked, return immediately
      if (shouldBlock) {
        await this.logAuditTrail(
          anthropicRequest.userId,
          anthropicRequest.firewallId,
          anthropicRequest,
          sanitizedRequest,
          detections,
          actions,
          true
        );

        return {
          success: false,
          blocked: true,
          sanitized: detections.length > 0,
          detections: this.formatDetections(detections, actions),
          originalRequest: this.stripInternalFields(anthropicRequest),
          sanitizedRequest: this.stripInternalFields(sanitizedRequest as AnthropicRequest),
          error: 'Request blocked due to sensitive data detection',
          metadata: {
            provider: this.provider,
            model: anthropicRequest.model,
            detectionTime: Date.now() - startTime,
            proxyTime: 0,
          },
        };
      }

      // Make request to Anthropic API
      const proxyStartTime = Date.now();
      const response = await this.client.post<AnthropicResponse>(
        `${this.baseUrl}/messages`,
        this.stripInternalFields(sanitizedRequest as AnthropicRequest),
        {
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': this.apiVersion,
            'Content-Type': 'application/json',
          },
        }
      );

      const proxyTime = Date.now() - proxyStartTime;

      // Log audit trail
      await this.logAuditTrail(
        anthropicRequest.userId,
        anthropicRequest.firewallId,
        anthropicRequest,
        sanitizedRequest,
        detections,
        actions,
        false,
        response.data
      );

      return {
        success: true,
        blocked: false,
        sanitized: detections.length > 0,
        detections: this.formatDetections(detections, actions),
        originalRequest: this.stripInternalFields(anthropicRequest),
        sanitizedRequest: this.stripInternalFields(sanitizedRequest as AnthropicRequest),
        aiResponse: response.data,
        metadata: {
          provider: this.provider,
          model: anthropicRequest.model,
          tokensUsed: response.data.usage.input_tokens + response.data.usage.output_tokens,
          detectionTime: Date.now() - startTime - proxyTime,
          proxyTime,
        },
      };
    } catch (error: any) {
      // Log failed request
      if (request.userId && request.firewallId) {
        await this.logAuditTrail(
          request.userId,
          request.firewallId,
          request,
          request,
          [],
          [],
          false,
          undefined,
          error.message
        );
      }

      return this.handleError(error);
    }
  }

  /**
   * Extract message content for detection (including system prompt if present)
   */
  protected extractContent(request: ProxyRequest): string[] {
    const anthropicRequest = request as AnthropicRequest;
    const contents: string[] = [];

    // Add system prompt if present
    if (anthropicRequest.system && typeof anthropicRequest.system === 'string') {
      contents.push(anthropicRequest.system);
    }

    // Add message contents
    if (anthropicRequest.messages && Array.isArray(anthropicRequest.messages)) {
      anthropicRequest.messages
        .filter(msg => msg.content && typeof msg.content === 'string')
        .forEach(msg => contents.push(msg.content));
    }

    return contents;
  }

  /**
   * Reconstruct request with sanitized content
   */
  protected reconstructRequest(
    originalRequest: ProxyRequest,
    sanitizedContents: string[]
  ): ProxyRequest {
    const anthropicRequest = { ...originalRequest } as AnthropicRequest;
    let contentIndex = 0;

    // Replace system prompt if it exists
    if (anthropicRequest.system && typeof anthropicRequest.system === 'string') {
      anthropicRequest.system = sanitizedContents[contentIndex++] || anthropicRequest.system;
    }

    // Replace message contents with sanitized versions
    if (anthropicRequest.messages && Array.isArray(anthropicRequest.messages)) {
      anthropicRequest.messages = anthropicRequest.messages.map(msg => {
        if (msg.content && typeof msg.content === 'string') {
          return {
            ...msg,
            content: sanitizedContents[contentIndex++] || msg.content,
          };
        }
        return msg;
      });
    }

    return anthropicRequest;
  }

  /**
   * Remove internal fields before sending to Anthropic
   */
  private stripInternalFields(request: AnthropicRequest): Partial<AnthropicRequest> {
    const { userId, firewallId, ...cleanRequest } = request;
    return cleanRequest;
  }

  /**
   * Test endpoint - Send a simple test message
   */
  async testConnection(
    apiKey: string,
    model: string = 'claude-3-haiku-20240307'
  ): Promise<boolean> {
    try {
      const response = await this.client.post(
        `${this.baseUrl}/messages`,
        {
          model,
          max_tokens: 10,
          messages: [
            {
              role: 'user',
              content: 'Say "connection successful" if you can read this.',
            },
          ],
        },
        {
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': this.apiVersion,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.status === 200;
    } catch (error) {
      console.error('Anthropic connection test failed:', error);
      return false;
    }
  }

  /**
   * Get available Claude models (static list as Anthropic doesn't provide a models endpoint)
   */
  getAvailableModels(): string[] {
    return [
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
      'claude-2.1',
      'claude-2.0',
      'claude-instant-1.2',
    ];
  }
}
