/**
 * Firewall Routes
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  createFirewall,
  getFirewalls,
  getFirewallById,
  updateFirewall,
  deleteFirewall,
  testFirewall,
  getFirewallStatistics,
  getFirewallLogs,
} from '../controllers/firewall.controller';

const router = Router();

// All firewall routes require authentication
router.use(authenticate);

// CRUD operations
router.post('/', createFirewall);
router.get('/', getFirewalls);
router.get('/:id', getFirewallById);
router.put('/:id', updateFirewall);
router.delete('/:id', deleteFirewall);

// Special operations
router.post('/:id/test', testFirewall);
router.get('/:id/statistics', getFirewallStatistics);
router.get('/:id/logs', getFirewallLogs);

export default router;
