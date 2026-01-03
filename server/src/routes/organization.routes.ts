import { Router } from 'express';
import {
  getMyOrganizations,
  getOrganization,
  updateOrganization,
  deleteOrganization,
  getOrganizationMembers,
  inviteMember,
  removeMember,
  updateMemberRole,
} from '../controllers/organization.controller';
import { authenticate, requireOrgAdmin, requireOrgMember } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get user's organizations
router.get('/my', getMyOrganizations);

// Organization management
router.get('/:organizationId', requireOrgMember, getOrganization);
router.patch('/:organizationId', requireOrgAdmin, updateOrganization);
router.delete('/:organizationId', authenticate, deleteOrganization);

// Member management
router.get('/:organizationId/members', requireOrgMember, getOrganizationMembers);
router.post('/:organizationId/members/invite', requireOrgAdmin, inviteMember);
router.delete('/:organizationId/members/:memberId', requireOrgAdmin, removeMember);
router.patch('/:organizationId/members/:memberId/role', requireOrgAdmin, updateMemberRole);

export default router;
