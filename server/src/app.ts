import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import firewallRoutes from './routes/firewall.routes';
import ruleRoutes from './routes/rule.routes';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/firewalls', firewallRoutes);
app.use('/api/firewalls/:firewallId/rules', ruleRoutes);

app.use((err: any, req: any, res: any, next: any) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    errors: err.errors || [],
  });
});

export { app };