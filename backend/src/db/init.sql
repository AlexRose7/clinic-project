-- Схема базы данных медицинской поликлиники

CREATE TYPE user_role AS ENUM ('patient', 'doctor', 'admin');

CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       VARCHAR(255) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,
  role        user_role NOT NULL DEFAULT 'patient',
  first_name  VARCHAR(100) NOT NULL,
  last_name   VARCHAR(100) NOT NULL,
  phone       VARCHAR(20),
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS specializations (
  id    SERIAL PRIMARY KEY,
  name  VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS doctors (
  id                UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  specialization_id INTEGER REFERENCES specializations(id),
  bio               TEXT,
  experience_years  INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS schedules (
  id          SERIAL PRIMARY KEY,
  doctor_id   UUID REFERENCES doctors(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time  TIME NOT NULL,
  end_time    TIME NOT NULL
);

CREATE TABLE IF NOT EXISTS appointments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id   UUID REFERENCES users(id) ON DELETE CASCADE,
  doctor_id    UUID REFERENCES doctors(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status       VARCHAR(20) NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  notes        TEXT,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO specializations (name) VALUES
  ('Терапевт'), ('Кардиолог'), ('Невролог'), ('Хирург'), ('Педиатр')
ON CONFLICT DO NOTHING;
