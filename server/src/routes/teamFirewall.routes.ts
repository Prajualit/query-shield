/**
 * Team Firewall Routes
 * Routes for team-level firewall management
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  createTeamFirewall,
  getTeamFirewalls,
  getTeamFirewallById,
  updateTeamFirewall,
  deleteTeamFirewall,
} from '../controllers/orgFirewall.controller';
import {
  createTeamFirewallRule,
  getTeamFirewallRules,
  updateTeamFirewallRule,
  deleteTeamFirewallRule,
} from '../controllers/orgRule.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Team firewall routes
router.post('/:teamId/firewalls', createTeamFirewall);
router.get('/:teamId/firewalls', getTeamFirewalls);
router.get('/:teamId/firewalls/:firewallId', getTeamFirewallById);
router.put('/:teamId/firewalls/:firewallId', updateTeamFirewall);
router.delete('/:teamId/firewalls/:firewallId', deleteTeamFirewall);

// Team firewall rule routes
router.post('/:teamId/firewalls/:firewallId/rules', createTeamFirewallRule);
router.get('/:teamId/firewalls/:firewallId/rules', getTeamFirewallRules);
router.put('/:teamId/firewalls/:firewallId/rules/:ruleId', updateTeamFirewallRule);
router.delete('/:teamId/firewalls/:firewallId/rules/:ruleId', deleteTeamFirewallRule);

export default router;
