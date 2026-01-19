import { Router } from 'express';
import {
  getOrganizationTeams,
  getTeam,
  createTeam,
  updateTeam,
  deleteTeam,
  getTeamMembers,
  addTeamMember,
  removeTeamMember,
  updateTeamMemberRole,
} from '../controllers/teamManagement.controller';
import { authenticate, requireOrgAdmin, requireOrgMember } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Team management
router.get('/organization/:organizationId', requireOrgMember, getOrganizationTeams);
router.post('/', requireOrgAdmin, createTeam);
router.get('/:teamId', authenticate, getTeam);
router.patch('/:teamId', requireOrgAdmin, updateTeam);
router.delete('/:teamId', requireOrgAdmin, deleteTeam);

// Team member management
router.get('/:teamId/members', authenticate, getTeamMembers);
router.post('/:teamId/members', requireOrgAdmin, addTeamMember);
router.patch('/:teamId/members/:memberId/role', authenticate, updateTeamMemberRole);
router.delete('/:teamId/members/:memberId', authenticate, removeTeamMember);

export default router;
