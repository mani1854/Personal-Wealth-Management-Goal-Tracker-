# Personal Wealth Management & Goal Tracker

A full-stack implementation for **Module A: User Management & Risk Profiling** using:
- **Frontend:** React + TypeScript + Vite + Tailwind CSS + Framer Motion
- **Backend:** FastAPI + SQLAlchemy + JWT auth + SQLite

## Features Delivered

### Frontend
- React project skeleton with scalable folder structure
- Responsive Login page (animated)
- Responsive Register page (animated)
- Dashboard with modern cards and progress bars
- Profile & Risk section to manage `risk_profile` and `kyc_status`
- Tailwind base layout and sticky navigation
- Protected routes using JWT token state

### Backend
- FastAPI skeleton + database setup
- `users` table with required fields:
  - `id`, `name`, `email`, `password`, `risk_profile`, `kyc_status`, `created_at`
- Login and Registration APIs
- Auth guard for secure routing via bearer token
- Frontend integration-ready CORS and REST endpoints

## Project Structure

```
frontend/
backend/
```

## Run Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Run Frontend

```bash
cd frontend
npm install
npm run dev
```

Optional environment variable:

```bash
# frontend/.env
VITE_API_URL=http://localhost:8000
```

## Core API Endpoints

- `POST /auth/register`
- `POST /auth/login`
- `GET /users/me` (Protected)
- `PUT /users/me` (Protected)
- `GET /health`

