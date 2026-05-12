import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';

const router = Router();

// GET /api/doctors — список всех врачей
router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.first_name, u.last_name, u.email,
             s.name AS specialization, d.experience_years
      FROM users u
      JOIN doctors d ON d.id = u.id
      LEFT JOIN specializations s ON s.id = d.specialization_id
      WHERE u.role = 'doctor'
      ORDER BY u.last_name
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/doctors/specializations — список специализаций
router.get('/specializations', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM specializations ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
