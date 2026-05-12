import { Router, Request, Response } from 'express';

const router = Router();

// POST /api/auth/register
router.post('/register', async (_req: Request, res: Response) => {
  // TODO: бэкенд разработчик реализует логику
  res.json({ message: 'register endpoint — TODO' });
});

// POST /api/auth/login
router.post('/login', async (_req: Request, res: Response) => {
  // TODO: бэкенд разработчик реализует логику
  res.json({ message: 'login endpoint — TODO', token: 'mock-token' });
});

// GET /api/auth/me
router.get('/me', async (_req: Request, res: Response) => {
  // TODO: добавить middleware authGuard
  res.json({ message: 'me endpoint — TODO' });
});

export default router;
