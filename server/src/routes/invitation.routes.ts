import { Router } from 'express';
import {
  getInvitationByToken,
  acceptInvitation,
  cancelInvitation,
  getOrganizationInvitations,
  resendInvitation,
} from '../controllers/invitation.controller';
import { authenticate, requireOrgAdmin } from '../middleware/auth.middleware';

const router = Router();

// Public routes (no authentication required)
router.get('/token/:token', getInvitationByToken);
router.post('/accept', acceptInvitation);

// Protected routes - require admin access
router.use(authenticate);
router.get('/organization/:organizationId', requireOrgAdmin, getOrganizationInvitations);
router.post('/:invitationId/resend', requireOrgAdmin, resendInvitation);
router.delete('/:invitationId', requireOrgAdmin, cancelInvitation);

export default router;
