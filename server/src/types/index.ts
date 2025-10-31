import { Request } from 'express';

export interface UserPayload {
  id: string;
  email: string;
  role: string;
}

export interface AuthRequest extends Request {
  user?: UserPayload;
}

export interface RegisterDTO {
  email: string;
  password: string;
  name?: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}