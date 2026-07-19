# 💰 Wealth Management & Goal Tracker

A full-stack personal finance platform for tracking financial goals, managing investment portfolios, running wealth simulations, and syncing live market data.

---

## 🚀 Features

- **Authentication** — JWT-based login & registration with protected routes
- **Financial Goals** — Set retirement, home, education, or custom goals with target amounts and dates
- **Investment Portfolio** — Track buy/sell transactions; automatic average cost basis calculation
- **Live Market Sync** — Fetch real-time stock prices via Yahoo Finance (`yfinance`)
- **What-If Simulations** — Compound interest projection engine with interactive charts
- **Rich Dashboard** — Net worth overview, asset allocation pie chart, recent transactions, stat cards

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React + Vite + TypeScript + Tailwind CSS |
| **Backend** | FastAPI (Python) |
| **Database** | SQLite (via SQLAlchemy ORM) |
| **Auth** | JWT (python-jose + passlib) |
| **Charts** | Recharts |
| **Market Data** | yfinance (Yahoo Finance) |
| **Scheduler** | APScheduler (daily price sync) |

---

## 📂 Project Structure

```
goal tracker project/
├── backend/
│   ├── api/
│   │   ├── goals.py          # Goals CRUD
│   │   ├── investments.py    # Portfolio & transactions
│   │   ├── market.py         # Live market sync
│   │   ├── simulations.py    # Compound interest engine
│   │   └── dashboard.py      # Aggregated summary endpoint
│   ├── auth.py               # JWT auth helpers
│   ├── database.py           # SQLAlchemy engine & session
│   ├── models.py             # ORM models
│   ├── schemas.py            # Pydantic schemas
│   ├── main.py               # FastAPI app entry point
│   └── requirements.txt
│
└── frontend/
    └── src/
        ├── pages/
        │   ├── Dashboard.tsx
        │   ├── Goals.tsx
        │   ├── Portfolio.tsx
        │   ├── Simulations.tsx
        │   ├── Login.tsx
        │   └── Register.tsx
        ├── components/
        │   ├── Layout.tsx
        │   └── ProtectedRoute.tsx
        └── context/
            └── AuthContext.tsx
```

---

## ⚡ Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+

### Backend Setup

```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\activate

# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API docs available at: **http://localhost:8000/docs**

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

App runs at: **http://localhost:5173**

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/register` | Create account |
| `POST` | `/token` | Login (get JWT) |
| `GET` | `/users/me` | Current user profile |
| `GET/POST` | `/goals/` | List / Create goals |
| `GET` | `/investments` | Portfolio holdings |
| `POST` | `/transactions` | Log buy/sell |
| `POST` | `/market/sync` | Sync live prices |
| `GET/POST` | `/simulations/` | Wealth projections |
| `GET` | `/dashboard/summary` | Aggregated dashboard data |

---

## 📸 Pages

- **Dashboard** — Net worth hero, allocation pie chart, recent transactions, quick actions
- **Goals** — Goal cards with progress bars, target amounts, monthly contributions
- **Portfolio** — Holdings table with live prices, buy/sell modal, market sync button
- **Simulations** — Multi-year compound interest projector with recharts line graph

---

## 🤝 License

MIT
