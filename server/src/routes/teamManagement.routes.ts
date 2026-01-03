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
} from '../controllers/teamManagement.controller';
import { authenticate, requireOrgAdmin, requireOrgMember } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Team management
router.get('/organization/:organizationId', requireOrgMember, getOrganizationTeams);
router.post('/', requireOrgAdmin, createTeam);
router.get('/:teamId', requireOrgMember, getTeam);
router.patch('/:teamId', requireOrgAdmin, updateTeam);
router.delete('/:teamId', requireOrgAdmin, deleteTeam);

// Team member management
router.get('/:teamId/members', requireOrgMember, getTeamMembers);
router.post('/:teamId/members', requireOrgAdmin, addTeamMember);
router.delete('/:teamId/members/:memberId', requireOrgAdmin, removeTeamMember);

export default router;
