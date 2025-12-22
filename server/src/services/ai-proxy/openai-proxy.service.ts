import { BaseProxyService, ProxyRequest, ProxyResponse } from './base-proxy.service';
import { Action } from '@prisma/client';

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIChatRequest extends ProxyRequest {
  messages: OpenAIMessage[];
  model: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stream?: boolean;
  [key: string]: any;
}

interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class OpenAIProxyService extends BaseProxyService {
  private baseUrl = 'https://api.openai.com/v1';

  constructor() {
    super('OpenAI');
  }

  /**
   * Proxy request to OpenAI Chat Completions API
   */
  async proxyRequest(request: ProxyRequest, apiKey: string): Promise<ProxyResponse> {
    const startTime = Date.now();

    try {
      // Validate API key
      if (!this.validateApiKey(apiKey, 'openai')) {
        throw new Error('Invalid OpenAI API key format. Must start with "sk-"');
      }

      // Validate request
      const chatRequest = request as OpenAIChatRequest;
      if (!chatRequest.messages || !Array.isArray(chatRequest.messages)) {
        throw new Error('Invalid request: messages array is required');
      }

      if (!chatRequest.model) {
        throw new Error('Invalid request: model is required');
      }

      // Process request through detection pipeline
      const { sanitizedRequest, detections, actions, shouldBlock } = await this.processRequest(
        chatRequest
      );

      // If request should be blocked, return immediately
      if (shouldBlock) {
        await this.logAuditTrail(
          chatRequest.userId,
          chatRequest.firewallId,
          chatRequest,
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
          originalRequest: this.stripInternalFields(chatRequest),
          sanitizedRequest: this.stripInternalFields(sanitizedRequest as OpenAIChatRequest),
          error: 'Request blocked due to sensitive data detection',
          metadata: {
            provider: this.provider,
            model: chatRequest.model,
            detectionTime: Date.now() - startTime,
            proxyTime: 0,
          },
        };
      }

      // Make request to OpenAI API
      const proxyStartTime = Date.now();
      const response = await this.client.post<OpenAIResponse>(
        `${this.baseUrl}/chat/completions`,
        this.stripInternalFields(sanitizedRequest as OpenAIChatRequest),
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const proxyTime = Date.now() - proxyStartTime;

      // Log audit trail
      await this.logAuditTrail(
        chatRequest.userId,
        chatRequest.firewallId,
        chatRequest,
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
        originalRequest: this.stripInternalFields(chatRequest),
        sanitizedRequest: this.stripInternalFields(sanitizedRequest as OpenAIChatRequest),
        aiResponse: response.data,
        metadata: {
          provider: this.provider,
          model: chatRequest.model,
          tokensUsed: response.data.usage.total_tokens,
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
   * Extract message content for detection
   */
  protected extractContent(request: ProxyRequest): string[] {
    const chatRequest = request as OpenAIChatRequest;
    if (!chatRequest.messages || !Array.isArray(chatRequest.messages)) {
      return [];
    }

    return chatRequest.messages
      .filter(msg => msg.content && typeof msg.content === 'string')
      .map(msg => msg.content);
  }

  /**
   * Reconstruct request with sanitized content
   */
  protected reconstructRequest(
    originalRequest: ProxyRequest,
    sanitizedContents: string[]
  ): ProxyRequest {
    const chatRequest = { ...originalRequest } as OpenAIChatRequest;
    
    // Replace message contents with sanitized versions
    let contentIndex = 0;
    chatRequest.messages = chatRequest.messages.map(msg => {
      if (msg.content && typeof msg.content === 'string') {
        return {
          ...msg,
          content: sanitizedContents[contentIndex++] || msg.content,
        };
      }
      return msg;
    });

    return chatRequest;
  }

  /**
   * Remove internal fields before sending to OpenAI
   */
  private stripInternalFields(request: OpenAIChatRequest): Partial<OpenAIChatRequest> {
    const { userId, firewallId, ...cleanRequest } = request;
    return cleanRequest;
  }

  /**
   * Test endpoint - Send a simple test message
   */
  async testConnection(apiKey: string, model: string = 'gpt-3.5-turbo'): Promise<boolean> {
    try {
      const response = await this.client.post(
        `${this.baseUrl}/chat/completions`,
        {
          model,
          messages: [{ role: 'user', content: 'Say "connection successful" if you can read this.' }],
          max_tokens: 10,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.status === 200;
    } catch (error) {
      console.error('OpenAI connection test failed:', error);
      return false;
    }
  }

  /**
   * Get available models
   */
  async getModels(apiKey: string): Promise<string[]> {
    try {
      const response = await this.client.get(`${this.baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      return response.data.data
        .filter((model: any) => model.id.includes('gpt'))
        .map((model: any) => model.id);
    } catch (error) {
      console.error('Failed to fetch OpenAI models:', error);
      return [];
    }
  }
}
