/**
 * Analytics Routes
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getDashboardStats,
  getTimeline,
  getTopPatterns,
  getFirewallPerformance,
} from '../controllers/analytics.controller';

const router = Router();

// All analytics routes require authentication
router.use(authenticate);

router.get('/dashboard', getDashboardStats);
router.get('/timeline', getTimeline);
router.get('/patterns', getTopPatterns);
router.get('/firewall-performance', getFirewallPerformance);

export default router;
