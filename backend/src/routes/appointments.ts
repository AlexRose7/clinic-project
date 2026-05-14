import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { pool } from '../db/pool';
import { authGuard, AuthRequest } from '../middleware/auth';

const router = Router();

const appointmentValidators = [
  body('doctorId').isUUID().withMessage('doctorId должен быть UUID'),
  body('scheduledAt').isISO8601().withMessage('scheduledAt должен быть в ISO формате'),
  body('notes').optional().isString().trim(),
];

function validationErrorResponse(req: AuthRequest, res: Response) {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return null;
  }

  return res.status(400).json({
    error: 'Validation failed',
    details: errors.array().map((item) => ({
      field: item.type === 'field' ? item.path : 'unknown',
      message: item.msg,
    })),
  });
}

// GET /api/appointments — список записей текущего пользователя
router.get('/', authGuard, async (req: AuthRequest, res: Response) => {
  if (!req.userId || !req.userRole) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    let query = `
      SELECT a.id,
             a.doctor_id AS "doctorId",
             a.patient_id AS "patientId",
             a.scheduled_at AS "scheduledAt",
             a.status,
             a.notes,
             doctor_user.first_name AS "doctorFirstName",
             doctor_user.last_name AS "doctorLastName",
             spec.name AS "doctorSpecialization",
             patient_user.first_name AS "patientFirstName",
             patient_user.last_name AS "patientLastName"
      FROM appointments a
      JOIN users doctor_user ON doctor_user.id = a.doctor_id
      JOIN doctors doctor_profile ON doctor_profile.id = doctor_user.id
      LEFT JOIN specializations spec ON spec.id = doctor_profile.specialization_id
      JOIN users patient_user ON patient_user.id = a.patient_id
    `;

    const params: string[] = [];
    if (req.userRole === 'patient') {
      query += ' WHERE a.patient_id = $1';
      params.push(req.userId);
    } else if (req.userRole === 'doctor') {
      query += ' WHERE a.doctor_id = $1';
      params.push(req.userId);
    }

    query += ' ORDER BY a.scheduled_at ASC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/appointments — создать запись на приём
router.post('/', authGuard, appointmentValidators, async (req: AuthRequest, res: Response) => {
  if (!req.userId || !req.userRole) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const errorResponse = validationErrorResponse(req, res);
  if (errorResponse) {
    return;
  }

  if (req.userRole === 'doctor') {
    res.status(403).json({ error: 'Врач не может создавать запись от имени пациента' });
    return;
  }

  const { doctorId, scheduledAt, notes } = req.body as {
    doctorId: string;
    scheduledAt: string;
    notes?: string;
  };

  const appointmentDate = new Date(scheduledAt);
  if (Number.isNaN(appointmentDate.getTime())) {
    res.status(400).json({ error: 'Некорректная дата записи' });
    return;
  }

  if (appointmentDate.getTime() <= Date.now()) {
    res.status(400).json({ error: 'Запись должна быть назначена на будущее время' });
    return;
  }

  try {
    const doctorResult = await pool.query<{ id: string }>(
      `
        SELECT d.id
        FROM doctors d
        JOIN users u ON u.id = d.id
        WHERE d.id = $1 AND u.role = 'doctor'
      `,
      [doctorId]
    );

    if (doctorResult.rows.length === 0) {
      res.status(404).json({ error: 'Врач не найден' });
      return;
    }

    const existingAppointment = await pool.query<{ id: string }>(
      `
        SELECT id
        FROM appointments
        WHERE doctor_id = $1
          AND scheduled_at = $2
          AND status IN ('pending', 'confirmed')
      `,
      [doctorId, appointmentDate.toISOString()]
    );

    if (existingAppointment.rows.length > 0) {
      res.status(409).json({ error: 'Это время уже занято' });
      return;
    }

    const patientId = req.userRole === 'admin' && typeof req.body.patientId === 'string'
      ? req.body.patientId
      : req.userId;

    const result = await pool.query(
      `
        INSERT INTO appointments (patient_id, doctor_id, scheduled_at, notes)
        VALUES ($1, $2, $3, $4)
        RETURNING id,
                  patient_id AS "patientId",
                  doctor_id AS "doctorId",
                  scheduled_at AS "scheduledAt",
                  status,
                  notes
      `,
      [patientId, doctorId, appointmentDate.toISOString(), notes || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
