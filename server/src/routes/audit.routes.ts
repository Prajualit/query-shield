/**
 * Audit Log Routes
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getAuditLogs,
  getAuditLogById,
  cleanupOldLogs,
  exportAuditLogs,
} from '../controllers/audit.controller';

const router = Router();

// All audit log routes require authentication
router.use(authenticate);

router.get('/', getAuditLogs);
router.get('/export', exportAuditLogs);
router.get('/:id', getAuditLogById);
router.delete('/cleanup', cleanupOldLogs);

export default router;
