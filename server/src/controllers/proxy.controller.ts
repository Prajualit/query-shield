import { Request, Response, NextFunction } from 'express';
import { OpenAIProxyService } from '../services/ai-proxy/openai-proxy.service';
import { AnthropicProxyService } from '../services/ai-proxy/anthropic-proxy.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/apiError';
import { ApiResponse } from '../utils/apiResponse';
import { prisma } from '../db';
import { AuthRequest } from '../types';

const openAIProxy = new OpenAIProxyService();
const anthropicProxy = new AnthropicProxyService();

/**
 * Proxy request to OpenAI
 * POST /api/v1/proxy/openai
 */
export const proxyOpenAI = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const userId = authReq.user?.id;

  if (!userId) {
    throw new ApiError(401, 'Authentication required');
  }

  const { firewallId, apiKey, ...requestData } = req.body;

  // Validate required fields
  if (!firewallId) {
    throw new ApiError(400, 'Firewall ID is required');
  }

  if (!apiKey) {
    throw new ApiError(400, 'OpenAI API key is required');
  }

  if (!requestData.messages || !Array.isArray(requestData.messages)) {
    throw new ApiError(400, 'Messages array is required');
  }

  if (!requestData.model) {
    throw new ApiError(400, 'Model is required');
  }

  // Verify firewall exists and user has access
  const firewall = await prisma.firewall.findFirst({
    where: {
      id: firewallId,
      userId,
    },
  });

  if (!firewall) {
    throw new ApiError(404, 'Firewall not found or access denied');
  }

  if (!firewall.isActive) {
    throw new ApiError(400, 'Firewall is not active');
  }

  // Proxy the request
  const result = await openAIProxy.proxyRequest(
    {
      userId,
      firewallId,
      ...requestData,
    },
    apiKey
  );

  // Return appropriate status based on result
  if (result.blocked) {
    return res
      .status(403)
      .json(
        new ApiResponse(403, result, 'Request blocked due to sensitive data detection')
      );
  }

  if (!result.success) {
    return res
      .status(500)
      .json(new ApiResponse(500, result, result.error || 'Proxy request failed'));
  }

  res.status(200).json(
    new ApiResponse(
      200,
      result,
      result.sanitized
        ? 'Request processed with sensitive data sanitization'
        : 'Request processed successfully'
    )
  );
});

/**
 * Proxy request to Anthropic
 * POST /api/v1/proxy/anthropic
 */
export const proxyAnthropic = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const userId = authReq.user?.id;

  if (!userId) {
    throw new ApiError(401, 'Authentication required');
  }

  const { firewallId, apiKey, ...requestData } = req.body;

  // Validate required fields
  if (!firewallId) {
    throw new ApiError(400, 'Firewall ID is required');
  }

  if (!apiKey) {
    throw new ApiError(400, 'Anthropic API key is required');
  }

  if (!requestData.messages || !Array.isArray(requestData.messages)) {
    throw new ApiError(400, 'Messages array is required');
  }

  if (!requestData.model) {
    throw new ApiError(400, 'Model is required');
  }

  if (!requestData.max_tokens) {
    throw new ApiError(400, 'max_tokens is required for Anthropic API');
  }

  // Verify firewall exists and user has access
  const firewall = await prisma.firewall.findFirst({
    where: {
      id: firewallId,
      userId,
    },
  });

  if (!firewall) {
    throw new ApiError(404, 'Firewall not found or access denied');
  }

  if (!firewall.isActive) {
    throw new ApiError(400, 'Firewall is not active');
  }

  // Proxy the request
  const result = await anthropicProxy.proxyRequest(
    {
      userId,
      firewallId,
      ...requestData,
    },
    apiKey
  );

  // Return appropriate status based on result
  if (result.blocked) {
    return res
      .status(403)
      .json(
        new ApiResponse(403, result, 'Request blocked due to sensitive data detection')
      );
  }

  if (!result.success) {
    return res
      .status(500)
      .json(new ApiResponse(500, result, result.error || 'Proxy request failed'));
  }

  res.status(200).json(
    new ApiResponse(
      200,
      result,
      result.sanitized
        ? 'Request processed with sensitive data sanitization'
        : 'Request processed successfully'
    )
  );
});

/**
 * Test OpenAI connection
 * POST /api/v1/proxy/openai/test
 */
export const testOpenAI = asyncHandler(async (req: Request, res: Response) => {
  const { apiKey, model } = req.body;

  if (!apiKey) {
    throw new ApiError(400, 'OpenAI API key is required');
  }

  const isConnected = await openAIProxy.testConnection(apiKey, model);

  if (!isConnected) {
    throw new ApiError(400, 'Failed to connect to OpenAI API. Please check your API key.');
  }

  res.status(200).json(
    new ApiResponse(200, { connected: true }, 'OpenAI connection successful')
  );
});

/**
 * Test Anthropic connection
 * POST /api/v1/proxy/anthropic/test
 */
export const testAnthropic = asyncHandler(async (req: Request, res: Response) => {
  const { apiKey, model } = req.body;

  if (!apiKey) {
    throw new ApiError(400, 'Anthropic API key is required');
  }

  const isConnected = await anthropicProxy.testConnection(apiKey, model);

  if (!isConnected) {
    throw new ApiError(400, 'Failed to connect to Anthropic API. Please check your API key.');
  }

  res.status(200).json(
    new ApiResponse(200, { connected: true }, 'Anthropic connection successful')
  );
});

/**
 * Get available OpenAI models
 * GET /api/v1/proxy/openai/models
 */
export const getOpenAIModels = asyncHandler(async (req: Request, res: Response) => {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    throw new ApiError(400, 'OpenAI API key is required in x-api-key header');
  }

  const models = await openAIProxy.getModels(apiKey);

  res.status(200).json(
    new ApiResponse(200, { models }, 'OpenAI models retrieved successfully')
  );
});

/**
 * Get available Anthropic models
 * GET /api/v1/proxy/anthropic/models
 */
export const getAnthropicModels = asyncHandler(async (req: Request, res: Response) => {
  const models = anthropicProxy.getAvailableModels();

  res.status(200).json(
    new ApiResponse(200, { models }, 'Anthropic models retrieved successfully')
  );
});

/**
 * Get proxy statistics for a user
 * GET /api/v1/proxy/stats
 */
export const getProxyStats = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const userId = authReq.user?.id;

  if (!userId) {
    throw new ApiError(401, 'Authentication required');
  }

  const { firewallId, startDate, endDate } = req.query;

  // Build query filters
  const where: any = { userId };

  if (firewallId) {
    where.firewallId = firewallId as string;
  }

  if (startDate) {
    where.createdAt = { gte: new Date(startDate as string) };
  }

  if (endDate) {
    where.createdAt = { ...where.createdAt, lte: new Date(endDate as string) };
  }

  // Get audit logs with aggregation
  const [logs, totalCount, blockedCount, sanitizedCount] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        action: true,
        aiProvider: true,
        detectedIssues: true,
        createdAt: true,
        metadata: true,
      },
    }),
    prisma.auditLog.count({ where }),
    prisma.auditLog.count({ where: { ...where, action: 'BLOCKED' } }),
    prisma.auditLog.count({ where: { ...where, action: 'SANITIZED' } }),
  ]);

  // Calculate detection type distribution
  const detectionTypes: { [key: string]: number } = {};
  logs.forEach(log => {
    const issues = log.detectedIssues as any[];
    if (Array.isArray(issues)) {
      issues.forEach(issue => {
        const type = issue.type || 'UNKNOWN';
        detectionTypes[type] = (detectionTypes[type] || 0) + 1;
      });
    }
  });

  // Calculate provider distribution
  const providers: { [key: string]: number } = {};
  logs.forEach(log => {
    if (log.aiProvider) {
      providers[log.aiProvider] = (providers[log.aiProvider] || 0) + 1;
    }
  });

  const stats = {
    totalRequests: totalCount,
    blockedRequests: blockedCount,
    sanitizedRequests: sanitizedCount,
    allowedRequests: totalCount - blockedCount - sanitizedCount,
    blockRate: totalCount > 0 ? ((blockedCount / totalCount) * 100).toFixed(2) + '%' : '0%',
    sanitizationRate:
      totalCount > 0 ? ((sanitizedCount / totalCount) * 100).toFixed(2) + '%' : '0%',
    detectionTypes,
    providers,
    recentLogs: logs,
  };

  res.status(200).json(
    new ApiResponse(200, stats, 'Proxy statistics retrieved successfully')
  );
});
