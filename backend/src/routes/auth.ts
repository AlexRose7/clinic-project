import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { pool } from '../db/pool';
import { authGuard, AuthRequest } from '../middleware/auth';

const router = Router();
const jwtSecret = process.env.JWT_SECRET || 'change_me_in_production_please';

const authValidators = {
  register: [
    body('email').isEmail().withMessage('Введите корректный email').normalizeEmail(),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Пароль должен содержать минимум 6 символов'),
    body('firstName').trim().notEmpty().withMessage('Имя обязательно'),
    body('lastName').trim().notEmpty().withMessage('Фамилия обязательна'),
    body('phone').optional().isString().trim(),
  ],
  login: [
    body('email').isEmail().withMessage('Введите корректный email').normalizeEmail(),
    body('password').notEmpty().withMessage('Пароль обязателен'),
  ],
};

type UserRow = {
  id: string;
  email: string;
  role: 'patient' | 'doctor' | 'admin';
  firstName: string;
  lastName: string;
  phone: string | null;
  password?: string;
};

function validationErrorResponse(req: Request, res: Response) {
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

function signToken(user: Pick<UserRow, 'id' | 'role'>) {
  return jwt.sign({ id: user.id, role: user.role }, jwtSecret, { expiresIn: '7d' });
}

function toUserResponse(row: UserRow) {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    firstName: row.firstName,
    lastName: row.lastName,
    phone: row.phone,
  };
}

async function findUserByEmail(email: string) {
  const result = await pool.query<UserRow>(
    `
      SELECT id,
             email,
             password,
             role,
             first_name AS "firstName",
             last_name AS "lastName",
             phone
      FROM users
      WHERE email = $1
    `,
    [email]
  );

  return result.rows[0] || null;
}

async function findUserById(id: string) {
  const result = await pool.query<UserRow>(
    `
      SELECT id,
             email,
             role,
             first_name AS "firstName",
             last_name AS "lastName",
             phone
      FROM users
      WHERE id = $1
    `,
    [id]
  );

  return result.rows[0] || null;
}

// POST /api/auth/register
router.post('/register', authValidators.register, async (req: Request, res: Response) => {
  const errorResponse = validationErrorResponse(req, res);
  if (errorResponse) {
    return;
  }

  const { email, password, firstName, lastName, phone } = req.body as {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };

  try {
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      res.status(409).json({ error: 'Пользователь с таким email уже существует' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query<UserRow>(
      `
        INSERT INTO users (email, password, role, first_name, last_name, phone)
        VALUES ($1, $2, 'patient', $3, $4, $5)
        RETURNING id,
                  email,
                  role,
                  first_name AS "firstName",
                  last_name AS "lastName",
                  phone
      `,
      [email, passwordHash, firstName, lastName, phone || null]
    );

    const user = result.rows[0];
    const token = signToken(user);

    res.status(201).json({ token, user: toUserResponse(user) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login
router.post('/login', authValidators.login, async (req: Request, res: Response) => {
  const errorResponse = validationErrorResponse(req, res);
  if (errorResponse) {
    return;
  }

  const { email, password } = req.body as { email: string; password: string };

  try {
    const user = await findUserByEmail(email);
    if (!user?.password) {
      res.status(401).json({ error: 'Неверный email или пароль' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Неверный email или пароль' });
      return;
    }

    const token = signToken(user);
    res.json({ token, user: toUserResponse(user) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me
router.get('/me', authGuard, async (req: AuthRequest, res: Response) => {
  if (!req.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const user = await findUserById(req.userId);
    if (!user) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }

    res.json({ user: toUserResponse(user) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
