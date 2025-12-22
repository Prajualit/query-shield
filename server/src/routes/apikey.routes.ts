/**
 * API Key Routes
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getApiKeys,
  createApiKey,
  updateApiKey,
  deleteApiKey,
} from '../controllers/apikey.controller';

const router = Router();

// All API key routes require authentication
router.use(authenticate);

router.get('/', getApiKeys);
router.post('/', createApiKey);
router.put('/:id', updateApiKey);
router.delete('/:id', deleteApiKey);

export default router;
