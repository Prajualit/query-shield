import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from "@prisma/client";

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

export const prisma = new PrismaClient({
  log: ['error', 'warn'],
});
