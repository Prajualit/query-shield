/**
 * Rule Routes
 * Nested under firewall routes
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  createRule,
  getRules,
  getRuleById,
  updateRule,
  deleteRule,
  testRule,
  updateRulePriorities,
} from '../controllers/rule.controller';

const router = Router({ mergeParams: true }); // mergeParams to access :firewallId

// All rule routes require authentication
router.use(authenticate);

// CRUD operations
router.post('/', createRule);
router.get('/', getRules);
router.get('/:id', getRuleById);
router.put('/:id', updateRule);
router.delete('/:id', deleteRule);

// Special operations
router.post('/:id/test', testRule);
router.patch('/priorities', updateRulePriorities);

export default router;
