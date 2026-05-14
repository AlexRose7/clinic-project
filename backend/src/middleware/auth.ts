import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

const jwtSecret = process.env.JWT_SECRET || 'change_me_in_production_please';

export const authGuard = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const payload = jwt.verify(token, jwtSecret) as { id: string; role: string };
    req.userId = payload.id;
    req.userRole = payload.role;
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
