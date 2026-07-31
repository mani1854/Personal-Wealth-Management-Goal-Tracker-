# 💰 WealthTracker — AI-Powered Wealth Management Platform

> A full-stack personal finance platform that combines real-time market data, machine learning predictions, and generative AI to give users intelligent, data-driven control over their financial future.

---

## ✨ Features

| Category | Feature |
|---|---|
| 🔐 **Auth** | JWT-based registration & login with bcrypt password hashing |
| 🎯 **Goals** | Set and track retirement, home, education, or custom savings goals |
| 📈 **Portfolio** | Log buy/sell transactions with automatic average cost basis calculation |
| 📡 **Live Market Data** | Real-time stock prices synced via Yahoo Finance API |
| 🤖 **AI Financial Advisor** | OpenAI-powered robo-advisor giving personalized financial insights |
| 🔮 **Stock Predictions** | Scikit-Learn Ridge Regression model forecasting 7-day stock price trajectories |
| 🎲 **Monte Carlo Engine** | Runs 10,000+ randomized simulations to calculate retirement goal probability |
| ⚡ **Background Sync** | APScheduler daemon auto-updates portfolio valuations every midnight |
| 📊 **Rich Dashboard** | Net worth overview, asset allocation charts, goal progress, and stat cards |
| 🐳 **Docker Ready** | Fully containerized — one command to spin up the entire stack |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 + TypeScript + Vite + Tailwind CSS |
| **Backend** | FastAPI (Python 3.11) |
| **Database** | PostgreSQL (Production) / SQLite (Local Dev) |
| **ORM** | SQLAlchemy |
| **Auth** | JWT (python-jose) + bcrypt (passlib) |
| **AI / LLM** | OpenAI GPT API |
| **Machine Learning** | Scikit-Learn (Ridge Regression), NumPy |
| **Market Data** | yfinance (Yahoo Finance) |
| **Charts** | Recharts |
| **Scheduler** | APScheduler |
| **Containerization** | Docker + Docker Compose + Nginx |
| **CI/CD** | GitHub Actions |

---

## 📂 Project Structure

```
goal-tracker-project/
├── docker-compose.yml          # Orchestrates all services
├── .github/workflows/
│   └── ci.yml                  # CI/CD pipeline
│
├── backend/
│   ├── main.py                 # FastAPI entry point, routers, background jobs
│   ├── database.py             # SQLAlchemy engine (Postgres/SQLite dynamic)
│   ├── models.py               # DB table definitions (User, Goal, Investment)
│   ├── schemas.py              # Pydantic request/response validation
│   ├── auth.py                 # JWT generation, bcrypt hashing
│   ├── requirements.txt
│   ├── Dockerfile
│   │
│   ├── api/
│   │   ├── ai.py               # Unified AI/ML router (predictions, insights, etc.)
│   │   ├── goals.py            # Goals CRUD
│   │   ├── investments.py      # Portfolio & transactions
│   │   ├── market.py           # Live market sync
│   │   ├── simulations.py      # Compound interest engine
│   │   └── dashboard.py        # Aggregated summary endpoint
│   │
│   ├── ai/
│   │   ├── advisor.py          # OpenAI financial advice generator
│   │   ├── rag_chatbot.py      # Conversational AI chatbot
│   │   ├── goal_recommender.py # AI-based goal suggestions
│   │   └── portfolio_recommender.py
│   │
│   ├── ml/
│   │   ├── price_predictor.py  # Ridge Regression stock price forecaster
│   │   ├── monte_carlo.py      # Monte Carlo retirement simulation engine
│   │   ├── risk_predictor.py   # Portfolio risk scorer
│   │   └── fraud_detector.py   # Anomaly detection on transactions
│   │
│   └── services/
│       ├── user_context.py     # Aggregates user data for AI prompts
│       └── market_utils.py     # Stock ticker normalization helpers
│
└── frontend/
    ├── Dockerfile
    ├── nginx.conf              # Nginx config for React Router SPA routing
    └── src/
        ├── App.tsx             # React Router setup
        ├── main.tsx            # React DOM entry point
        ├── pages/
        │   ├── Dashboard.tsx   # Net worth overview & charts
        │   ├── Goals.tsx       # Goal tracking interface
        │   ├── Portfolio.tsx   # Investment holdings & transactions
        │   ├── Simulations.tsx # Compound interest projector
        │   ├── Predictions.tsx # ML stock price forecast UI
        │   ├── Advisor.tsx     # AI financial advisor interface
        │   ├── Login.tsx
        │   └── Register.tsx
        ├── components/
        │   ├── Layout.tsx      # Sidebar navigation shell
        │   └── ProtectedRoute.tsx
        ├── context/
        │   └── AuthContext.tsx # Global JWT auth state
        └── lib/
            └── api.ts          # Axios instance with auto JWT headers
```

---

## ⚡ Getting Started (Local)

### Prerequisites
- Python 3.11+
- Node.js 18+

### 1. Backend Setup

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

> API docs auto-generated at: **http://localhost:8000/docs**

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

> App runs at: **http://localhost:5173**

### 3. Environment Variables (Optional)

Create a `backend/.env` file to enable AI features:

```env
OPENAI_API_KEY=your_openai_api_key_here
DATABASE_URL=postgresql://user:password@localhost/wealthdb
```

---

## 🐳 Running with Docker

Spin up the entire stack (Backend + Frontend + PostgreSQL + Redis) with one command:

```bash
docker-compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:80 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |

---

## 📡 Key API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/register` | Create account |
| `POST` | `/token` | Login (returns JWT) |
| `GET` | `/dashboard/summary` | Aggregated net worth data |
| `GET/POST` | `/goals/` | List / Create goals |
| `GET` | `/investments` | Portfolio holdings |
| `POST` | `/transactions` | Log buy/sell transaction |
| `POST` | `/market/sync` | Sync live stock prices |
| `GET` | `/ai/insights` | OpenAI financial advice |
| `GET` | `/ai/predict/{symbol}` | ML 7-day price prediction |
| `POST` | `/ai/monte-carlo` | Run retirement simulations |
| `GET` | `/ai/risk` | Portfolio risk score |
| `GET` | `/ai/dashboard` | Full AI analytics dashboard |

---

## 🧠 How the AI/ML Works

### Stock Price Predictions
The `/ai/predict/{symbol}` endpoint:
1. Fetches **6 months** of historical OHLCV data from Yahoo Finance
2. Engineers features: Moving Averages (7d, 21d), Rolling Volatility, Momentum
3. Trains a **Ridge Regression** model on that data
4. Predicts the next **7 days** of closing prices
5. Returns trend (Bullish/Bearish), predicted price, and confidence score

### Monte Carlo Simulations
The `/ai/monte-carlo` endpoint runs **10,000 randomized market scenarios** using historical return distributions to calculate the exact statistical probability of a user reaching their retirement target by a given date.

### AI Financial Advisor
Compiles the user's goals, portfolio, and transactions into a structured context prompt and sends it to **OpenAI GPT** to generate personalized, actionable financial advice.

---

## 📸 Pages Overview

- **Dashboard** — Net worth hero card, asset allocation pie chart, recent transactions
- **Goals** — Goal cards with progress bars, target amounts, monthly contributions
- **Portfolio** — Holdings table with live prices, P&L, buy/sell modal
- **Predictions** — ML price forecast chart with trend signal and confidence score
- **AI Advisor** — Personalized OpenAI-generated financial health report
- **Simulations** — Multi-year compound interest projector with Recharts line graph

---


