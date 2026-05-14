import bcrypt from 'bcryptjs';
import { pool } from './pool';

const DEMO_PASSWORD = 'demo12345';

type DemoDoctor = {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  specialization: string;
  bio: string;
  experienceYears: number;
};

const demoDoctors: DemoDoctor[] = [
  {
    email: 'therapist@clinic.local',
    firstName: 'Ирина',
    lastName: 'Соколова',
    phone: '+7 900 100-10-10',
    specialization: 'Терапевт',
    bio: 'Принимает взрослых пациентов, ведет первичные осмотры и профилактику.',
    experienceYears: 12,
  },
  {
    email: 'cardio@clinic.local',
    firstName: 'Алексей',
    lastName: 'Воронцов',
    phone: '+7 900 100-20-20',
    specialization: 'Кардиолог',
    bio: 'Специализируется на диагностике и сопровождении пациентов с заболеваниями сердца.',
    experienceYears: 15,
  },
  {
    email: 'neuro@clinic.local',
    firstName: 'Марина',
    lastName: 'Орлова',
    phone: '+7 900 100-30-30',
    specialization: 'Невролог',
    bio: 'Работает с хроническими болевыми синдромами и нарушениями сна.',
    experienceYears: 9,
  },
];

export const demoCredentials = {
  email: 'patient@clinic.local',
  password: DEMO_PASSWORD,
};

const upsertUserQuery = `
  INSERT INTO users (email, password, role, first_name, last_name, phone)
  VALUES ($1, $2, $3, $4, $5, $6)
  ON CONFLICT (email) DO UPDATE SET
    password = EXCLUDED.password,
    role = EXCLUDED.role,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    phone = EXCLUDED.phone,
    updated_at = NOW()
  RETURNING id
`;

async function ensurePatient(passwordHash: string) {
  await pool.query(upsertUserQuery, [
    demoCredentials.email,
    passwordHash,
    'patient',
    'Тест',
    'Пациент',
    '+7 900 000-00-00',
  ]);
}

async function ensureDoctor(doctor: DemoDoctor, passwordHash: string) {
  const userResult = await pool.query<{ id: string }>(upsertUserQuery, [
    doctor.email,
    passwordHash,
    'doctor',
    doctor.firstName,
    doctor.lastName,
    doctor.phone,
  ]);

  const specializationResult = await pool.query<{ id: number }>(
    `
      INSERT INTO specializations (name)
      VALUES ($1)
      ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `,
    [doctor.specialization]
  );

  await pool.query(
    `
      INSERT INTO doctors (id, specialization_id, bio, experience_years)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id) DO UPDATE SET
        specialization_id = EXCLUDED.specialization_id,
        bio = EXCLUDED.bio,
        experience_years = EXCLUDED.experience_years
    `,
    [
      userResult.rows[0].id,
      specializationResult.rows[0].id,
      doctor.bio,
      doctor.experienceYears,
    ]
  );
}

export async function seedDemoData() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  await pool.query('BEGIN');
  try {
    await ensurePatient(passwordHash);

    for (const doctor of demoDoctors) {
      await ensureDoctor(doctor, passwordHash);
    }

    await pool.query('COMMIT');
  } catch (error) {
    await pool.query('ROLLBACK');
    throw error;
  }
}
