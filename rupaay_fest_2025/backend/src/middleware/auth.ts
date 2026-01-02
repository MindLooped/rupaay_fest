import { Request, Response, NextFunction } from 'express';

export function adminAuth(req: Request, res: Response, next: NextFunction) {
  const password = req.headers.authorization?.replace('Bearer ', '');
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  if (password !== adminPassword) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  next();
}
