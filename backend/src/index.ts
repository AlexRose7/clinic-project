import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './db/pool';
import authRouter from './routes/auth';
import appointmentsRouter from './routes/appointments';
import doctorsRouter from './routes/doctors';
import { demoCredentials, seedDemoData } from './db/seed';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'error', db: 'disconnected' });
  }
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/appointments', appointmentsRouter);
app.use('/api/doctors', doctorsRouter);

// 404
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

async function start() {
  try {
    await pool.query('SELECT 1');
    await seedDemoData();

    app.listen(PORT, () => {
      console.log(`🚀 Backend запущен на http://localhost:${PORT}`);
      console.log(`🧪 Demo patient: ${demoCredentials.email} / ${demoCredentials.password}`);
    });
  } catch (error) {
    console.error('Не удалось запустить backend:', error);
    process.exit(1);
  }
}

void start();
