import { Router, Request, Response } from 'express';

const router = Router();

// GET /api/appointments — TODO: реализовать бэкенду
router.get('/', async (_req: Request, res: Response) => {
  res.json({ message: 'appointments list — TODO', data: [] });
});

// POST /api/appointments — создать запись на приём
router.post('/', async (_req: Request, res: Response) => {
  res.json({ message: 'create appointment — TODO' });
});

export default router;
