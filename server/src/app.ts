import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import firewallRoutes from './routes/firewall.routes';
import ruleRoutes from './routes/rule.routes';
import proxyRoutes from './routes/proxy.routes';
import auditRoutes from './routes/audit.routes';
import analyticsRoutes from './routes/analytics.routes';
import apikeyRoutes from './routes/apikey.routes';
// import teamRoutes from './routes/team.routes'; // OLD - Replaced by B2B teamManagement
import notificationRoutes from './routes/notification.routes';
import organizationRoutes from './routes/organization.routes';
import teamManagementRoutes from './routes/teamManagement.routes';
import invitationRoutes from './routes/invitation.routes';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/firewalls', firewallRoutes);
app.use('/api/rules', ruleRoutes);
app.use('/api/firewalls/:firewallId/rules', ruleRoutes);
app.use('/api/proxy', proxyRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/api-keys', apikeyRoutes);
// app.use('/api/team', teamRoutes); // OLD - Replaced by B2B organizations/teams
app.use('/api/notifications', notificationRoutes);
// B2B Organization routes
app.use('/api/organizations', organizationRoutes);
app.use('/api/teams', teamManagementRoutes);
app.use('/api/invitations', invitationRoutes);

app.use((err: any, req: any, res: any, next: any) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    errors: err.errors || [],
  });
});

export { app };