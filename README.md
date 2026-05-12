# Медицинская поликлиника — Дипломный проект

## Команда и зоны ответственности

| Роль | Зона ответственности |
|------|----------------------|
| DevOps | `docker-compose.yml`, `.github/workflows/`, `nginx/`, `.env.example` |
| Frontend | `frontend/` — React + TypeScript |
| Backend | `backend/` — Node.js + Express + TypeScript |

---

## Быстрый старт

> Требования: [Docker Desktop](https://www.docker.com/products/docker-desktop/) (включает docker compose)

```bash
# 1. Клонировать репозиторий
git clone https://github.com/<ваш-username>/clinic-project.git
cd clinic-project

# 2. Создать файл с переменными окружения
cp .env.example .env

# 3. Запустить все сервисы
docker compose up --build
```

Первый запуск занимает 5–10 минут — скачиваются образы и устанавливаются зависимости.

После запуска доступны:

| Сервис | URL | Описание |
|--------|-----|----------|
| Frontend | http://localhost:5173 | React приложение |
| Backend | http://localhost:3000 | REST API |
| Backend health | http://localhost:3000/health | Проверка состояния |
| pgAdmin | http://localhost:5050 | UI для базы данных |

---

## Структура проекта

```
clinic-project/
├── frontend/                  # React + TypeScript (Фронтенд)
│   ├── src/
│   │   ├── api/
│   │   │   └── client.ts      # axios-клиент с JWT интерцептором
│   │   ├── pages/
│   │   │   ├── HomePage.tsx       # Главная страница
│   │   │   ├── DoctorsPage.tsx    # Список врачей (GET /api/doctors)
│   │   │   ├── AppointmentsPage.tsx # Запись на приём
│   │   │   └── LoginPage.tsx      # Форма входа (POST /api/auth/login)
│   │   ├── types/
│   │   │   └── index.ts       # TypeScript типы: User, Doctor, Appointment
│   │   ├── App.tsx            # Роутер (react-router-dom)
│   │   └── main.tsx           # Точка входа
│   ├── vite.config.ts         # Vite + прокси /api → backend:3000
│   └── Dockerfile
│
├── backend/                   # Node.js + Express (Бэкенд)
│   ├── src/
│   │   ├── db/
│   │   │   ├── pool.ts        # Подключение к PostgreSQL
│   │   │   └── init.sql       # Схема БД (создаётся автоматически)
│   │   ├── middleware/
│   │   │   └── auth.ts        # JWT guard — authGuard()
│   │   ├── routes/
│   │   │   ├── auth.ts        # POST /api/auth/register, /login, GET /me
│   │   │   ├── doctors.ts     # GET /api/doctors, /specializations
│   │   │   └── appointments.ts # GET/POST /api/appointments
│   │   └── index.ts           # Точка входа, подключение роутов
│   └── Dockerfile
│
├── nginx/
│   └── nginx.conf             # Конфиг для продакшна
├── .github/
│   └── workflows/
│       └── ci.yml             # CI/CD pipeline
├── docker-compose.yml         # Оркестрация всех сервисов
└── .env.example               # Шаблон переменных окружения
```

---

## Переменные окружения

Файл `.env` создаётся из `.env.example` командой `cp .env.example .env`.
Файл `.env` никогда не коммитится в git (он в `.gitignore`).

```env
# База данных
POSTGRES_USER=clinic_user
POSTGRES_PASSWORD=clinic_pass
POSTGRES_DB=clinic_db
POSTGRES_HOST=postgres
POSTGRES_PORT=5432

# Backend
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://clinic_user:clinic_pass@postgres:5432/clinic_db
JWT_SECRET=change_me_in_production_please

# Frontend (Vite — переменные должны начинаться с VITE_)
VITE_API_URL=http://localhost:3000

# pgAdmin
PGADMIN_EMAIL=admin@clinic.com
PGADMIN_PASSWORD=admin123
```

> Для продакшна значения `JWT_SECRET` и пароли нужно заменить на надёжные.

---

## Работа с git

### Первоначальная настройка

DevOps создаёт репозиторий на GitHub и добавляет всех как **Collaborators**:
`Settings → Collaborators → Add people`

Каждый клонирует репозиторий:
```bash
git clone https://github.com/<username>/clinic-project.git
cd clinic-project
```

### Модель веток

```
main          — стабильная версия, только через PR
develop       — основная ветка разработки
feature/xxx   — ветки для фич
```

### Workflow для каждого разработчика

```bash
# 1. Перейти в develop и обновиться
git checkout develop
git pull origin develop

# 2. Создать ветку для своей задачи
git checkout -b feature/название-задачи

# Примеры:
# git checkout -b feature/auth-login
# git checkout -b feature/doctors-list
# git checkout -b feature/appointment-form

# 3. Работы коммитить
git add .
git commit -m "feat: добавил форму входа"

# 4. Запушить ветку
git push origin feature/название-задачи

# 5. Открыть Pull Request на GitHub: feature/xxx → develop
```

### Соглашение по коммитам

```
feat: новая функциональность
fix: исправление бага
chore: обслуживание (зависимости, конфиги)
docs: документация
style: форматирование
refactor: рефакторинг без изменения логики
```

### Как смержить чужие изменения

```bash
git checkout develop
git pull origin develop
git checkout feature/моя-ветка
git merge develop        # влить свежий develop в свою ветку
# решить конфликты если есть
git push origin feature/моя-ветка
```

---

## Для фронтенд разработчика

### Что уже сделано

В `frontend/src/` есть готовый каркас:

**`api/client.ts`** — настроенный axios. Просто импортируй и используй:
```typescript
import { api } from '../api/client';

// GET запрос
const res = await api.get('/api/doctors');

// POST запрос
const res = await api.post('/api/auth/login', { email, password });
```
JWT токен из `localStorage` подставляется автоматически. При 401 — редирект на `/login`.

**`types/index.ts`** — TypeScript типы для основных сущностей:
```typescript
import { User, Doctor, Appointment } from '../types';
```

**`pages/`** — шаблонные страницы с роутингом. Роутер уже настроен в `App.tsx`:
```
/              → HomePage
/doctors       → DoctorsPage       (уже подключён GET /api/doctors)
/appointments  → AppointmentsPage
/login         → LoginPage         (уже подключён POST /api/auth/login)
```

**`vite.config.ts`** — прокси настроен: все запросы `/api/*` автоматически идут на бэкенд. Не нужно думать о CORS при локальной разработке.

### Запуск без Docker

```bash
cd frontend
npm install
npm run dev
# http://localhost:5173
```

> Бэкенд при этом должен быть запущен (либо через Docker, либо отдельно).

### Добавление новой страницы

```typescript
// 1. Создать frontend/src/pages/NewPage.tsx
export default function NewPage() {
  return <div>Новая страница</div>;
}

// 2. Добавить роут в App.tsx
import NewPage from './pages/NewPage';
// ...
<Route path="/new" element={<NewPage />} />
```

---

## Для бэкенд разработчика

### Что уже сделано

В `backend/src/` есть готовый каркас:

**`db/pool.ts`** — подключение к PostgreSQL. Импортируй `pool` в любом роуте:
```typescript
import { pool } from '../db/pool';

const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
```

**`db/init.sql`** — схема БД создаётся автоматически при первом запуске Docker. Таблицы: `users`, `doctors`, `specializations`, `schedules`, `appointments`.

**`middleware/auth.ts`** — готовый JWT guard:
```typescript
import { authGuard, AuthRequest } from '../middleware/auth';

// Защитить роут:
router.get('/profile', authGuard, (req: AuthRequest, res) => {
  res.json({ userId: req.userId, role: req.userRole });
});
```

**`routes/`** — заглушки роутов ждут реализации:

| Файл | Роуты | Статус |
|------|-------|--------|
| `auth.ts` | POST `/api/auth/register`, `/login`, GET `/me` | TODO |
| `doctors.ts` | GET `/api/doctors`, `/specializations` | Работает (читает из БД) |
| `appointments.ts` | GET/POST `/api/appointments` | TODO |

### Запуск без Docker

```bash
cd backend
npm install
npm run dev
# http://localhost:3000
```

> PostgreSQL при этом нужен. Проще всего поднять только БД через Docker:
> ```bash
> docker compose up postgres
> ```

### Добавление нового роута

```typescript
// 1. Создать backend/src/routes/patients.ts
import { Router } from 'express';
import { pool } from '../db/pool';

const router = Router();

router.get('/', async (_req, res) => {
  const result = await pool.query('SELECT * FROM users WHERE role = $1', ['patient']);
  res.json(result.rows);
});

export default router;

// 2. Подключить в backend/src/index.ts
import patientsRouter from './routes/patients';
app.use('/api/patients', patientsRouter);
```

### Проверка API

```bash
# Health check
curl http://localhost:3000/health

# Список специализаций
curl http://localhost:3000/api/doctors/specializations

# Список врачей
curl http://localhost:3000/api/doctors
```

---

## База данных

### Схема

```
users (id, email, password, role, first_name, last_name, phone)
  └── doctors (id → users.id, specialization_id, bio, experience_years)
        └── schedules (id, doctor_id, day_of_week, start_time, end_time)

specializations (id, name)

appointments (id, patient_id → users.id, doctor_id → doctors.id,
              scheduled_at, status, notes)
```

### Подключение через pgAdmin

1. Открыть http://localhost:5050
2. Логин: `admin@clinic.com` / `admin123`
3. Servers → Register → Server → вкладка Connection:
   - Host: `postgres`
   - Port: `5432`
   - Database: `clinic_db`
   - Username: `clinic_user`
   - Password: `clinic_pass`

### Полный сброс базы

```bash
docker compose down -v   # удаляет volumes с данными
docker compose up        # БД создаётся заново из init.sql
```

---

## Полезные команды

```bash
# Запустить всё
docker compose up

# Запустить в фоне
docker compose up -d

# Остановить
docker compose down

# Пересобрать после изменений в Dockerfile или package.json
docker compose up --build

# Посмотреть логи конкретного сервиса
docker compose logs backend
docker compose logs frontend
docker compose logs postgres

# Статус контейнеров
docker compose ps
```
