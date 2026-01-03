import { Router } from 'express';
import {
  getInvitationByToken,
  acceptInvitation,
  cancelInvitation,
  getOrganizationInvitations,
  resendInvitation,
} from '../controllers/invitation.controller';
import { authenticate, requireOrgMember } from '../middleware/auth.middleware';

const router = Router();

// Public routes (no authentication required)
router.get('/token/:token', getInvitationByToken);
router.post('/accept', acceptInvitation);

// Protected routes
router.use(authenticate);
router.get('/organization/:organizationId', requireOrgMember, getOrganizationInvitations);
router.post('/:invitationId/resend', resendInvitation);
router.delete('/:invitationId', cancelInvitation);

export default router;
