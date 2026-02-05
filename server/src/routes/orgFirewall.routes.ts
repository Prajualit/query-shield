/**
 * Organization Firewall Routes
 * Routes for organization-level firewall management
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  createOrgFirewall,
  getOrgFirewalls,
  getOrgFirewallById,
  updateOrgFirewall,
  deleteOrgFirewall,
  getApplicableFirewalls,
} from '../controllers/orgFirewall.controller';
import {
  createOrgFirewallRule,
  getOrgFirewallRules,
  updateOrgFirewallRule,
  deleteOrgFirewallRule,
} from '../controllers/orgRule.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all applicable firewalls for current user (personal + org + team)
router.get('/applicable', getApplicableFirewalls);

// Organization firewall routes
router.post('/:organizationId/firewalls', createOrgFirewall);
router.get('/:organizationId/firewalls', getOrgFirewalls);
router.get('/:organizationId/firewalls/:firewallId', getOrgFirewallById);
router.put('/:organizationId/firewalls/:firewallId', updateOrgFirewall);
router.delete('/:organizationId/firewalls/:firewallId', deleteOrgFirewall);

// Organization firewall rule routes
router.post('/:organizationId/firewalls/:firewallId/rules', createOrgFirewallRule);
router.get('/:organizationId/firewalls/:firewallId/rules', getOrgFirewallRules);
router.put('/:organizationId/firewalls/:firewallId/rules/:ruleId', updateOrgFirewallRule);
router.delete('/:organizationId/firewalls/:firewallId/rules/:ruleId', deleteOrgFirewallRule);

export default router;
