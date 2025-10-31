import jwt from 'jsonwebtoken';
import { UserPayload } from '../types';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const JWT_EXPIRE = (process.env.JWT_EXPIRE || '7d') as string;
const JWT_REFRESH_EXPIRE = (process.env.JWT_REFRESH_EXPIRE || '30d') as string;

export const generateAccessToken = (payload: UserPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRE as any });
};

export const generateRefreshToken = (payload: UserPayload): string => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRE as any });
};

export const verifyAccessToken = (token: string): UserPayload => {
  return jwt.verify(token, JWT_SECRET) as UserPayload;
};

export const verifyRefreshToken = (token: string): UserPayload => {
  return jwt.verify(token, JWT_REFRESH_SECRET) as UserPayload;
};