import { Router } from 'express';
import {
  proxyOpenAI,
  proxyAnthropic,
  testOpenAI,
  testAnthropic,
  getOpenAIModels,
  getAnthropicModels,
  getProxyStats,
} from '../controllers/proxy.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * @route   POST /api/v1/proxy/openai
 * @desc    Proxy request to OpenAI with data protection
 * @access  Private
 * @body    {
 *   firewallId: string,
 *   apiKey: string,
 *   model: string,
 *   messages: Array<{ role: string, content: string }>,
 *   temperature?: number,
 *   max_tokens?: number,
 *   ...otherOpenAIParams
 * }
 */
router.post('/openai', proxyOpenAI);

/**
 * @route   POST /api/v1/proxy/anthropic
 * @desc    Proxy request to Anthropic with data protection
 * @access  Private
 * @body    {
 *   firewallId: string,
 *   apiKey: string,
 *   model: string,
 *   messages: Array<{ role: string, content: string }>,
 *   max_tokens: number,
 *   temperature?: number,
 *   system?: string,
 *   ...otherAnthropicParams
 * }
 */
router.post('/anthropic', proxyAnthropic);

/**
 * @route   POST /api/v1/proxy/openai/test
 * @desc    Test OpenAI API connection
 * @access  Private
 * @body    { apiKey: string, model?: string }
 */
router.post('/openai/test', testOpenAI);

/**
 * @route   POST /api/v1/proxy/anthropic/test
 * @desc    Test Anthropic API connection
 * @access  Private
 * @body    { apiKey: string, model?: string }
 */
router.post('/anthropic/test', testAnthropic);

/**
 * @route   GET /api/v1/proxy/openai/models
 * @desc    Get available OpenAI models
 * @access  Private
 * @header  x-api-key: OpenAI API Key
 */
router.get('/openai/models', getOpenAIModels);

/**
 * @route   GET /api/v1/proxy/anthropic/models
 * @desc    Get available Anthropic models
 * @access  Private
 */
router.get('/anthropic/models', getAnthropicModels);

/**
 * @route   GET /api/v1/proxy/stats
 * @desc    Get proxy usage statistics
 * @access  Private
 * @query   firewallId?: string, startDate?: string, endDate?: string
 */
router.get('/stats', getProxyStats);

export default router;
