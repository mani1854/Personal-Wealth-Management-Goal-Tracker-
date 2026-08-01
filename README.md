# 💰 WealthTracker — Personal Wealth Management & Goal Tracker

> A full-stack AI-powered personal finance platform built with **FastAPI**, **React**, and **PostgreSQL** — featuring a Groq-powered financial AI agent, ML stock predictions, Monte Carlo simulations, and more.

---

## 🚀 Live Features

| Module | Description |
|---|---|
| 🔐 Auth | JWT-based login/register with bcrypt password hashing |
| 📊 Dashboard | Real-time portfolio overview with P&L, risk score, fraud alerts |
| 🎯 Goals | Create and track financial goals (retirement, house, education) |
| 💼 Portfolio | Buy/sell stocks with live prices via Yahoo Finance |
| 🧮 Simulations | Monte Carlo retirement projections (10,000 scenarios) |
| 📈 Predictions | 7-day ML stock price forecasting (Ridge Regression) |
| 🤖 AI Chatbot | **Advanced Groq agent with 6 financial tools + memory** |
| 📰 Market News | AI-summarized news with portfolio impact analysis |
| 🎯 Goal Recommender | AI-optimized SIP recommendations based on income/expenses |
| 💼 Portfolio Recommender | Content-based stock/ETF suggestions |

---

## 🧠 AI / ML Architecture

### Advanced Financial AI Agent
```
User Message
     │
     ▼
Intent Classification (7 intents: portfolio/risk/goal/market/tax/rebalancing/general)
     │
     ▼
Conversation Memory (rolling window + AI-generated summary)
     │
     ▼
Groq LLM — llama-3.3-70b-versatile (Tool Calling)
     ├── 📊 Portfolio Tool     → net worth, holdings, P&L, sector allocation
     ├── ⚠️ Risk Predictor     → RandomForest risk score (0–100) + reasons
     ├── 🎯 Goal Tracker       → achievement probability, SIP, completion date
     ├── 📈 Market API         → live price + 7-day Ridge Regression forecast
     ├── 🧾 Tax Calculator     → Indian STCG (20%) / LTCG (12.5%) computation
     └── ⚖️ Rebalancer         → sector buy/sell plan for target allocation
     │
     ▼
Final Answer + Tools Used + Recommendations
     │
     ▼
Save to Memory + Auto-summarize older history
```

### ML Models Used

| Model | Algorithm | Purpose |
|---|---|---|
| Price Predictor | Ridge Regression (scikit-learn) | 7-day stock price forecast |
| Monte Carlo | Geometric Brownian Motion (NumPy) | Retirement goal probability |
| Risk Scorer | Random Forest Regressor | Portfolio risk score 0–100 |
| Fraud Detector | Isolation Forest | Anomalous transaction detection |
| Sentiment Analyzer | VADER / Keyword-based | Stock news sentiment |

---

## 🛠 Tech Stack

### Backend
- **FastAPI** — REST API framework
- **PostgreSQL** + SQLAlchemy — Database & ORM
- **scikit-learn** — ML models (Ridge, RandomForest, IsolationForest)
- **NumPy / Pandas** — Data processing & Monte Carlo engine
- **Groq API** (llama-3.3-70b) — LLM tool-calling agent
- **Yahoo Finance (yfinance)** — Live market data
- **JWT + bcrypt** — Authentication & security
- **Docker** — Containerized deployment

### Frontend
- **React 18** + TypeScript + Vite
- **Recharts** — Interactive financial charts
- **Axios** — API client
- **Lucide React** — Icons
- **React Markdown** — AI response rendering

---

## 📁 Project Structure

```
goal-tracker-project/
├── backend/
│   ├── ai/
│   │   ├── advanced_chatbot/          # Groq agent system
│   │   │   ├── agent.py               # Main tool-calling agent
│   │   │   ├── intent_classifier.py   # 7-intent NLP classifier
│   │   │   ├── memory_store.py        # Rolling conversation memory
│   │   │   └── tools/
│   │   │       ├── portfolio_tool.py  # Portfolio summary tool
│   │   │       ├── risk_tool.py       # Risk analysis tool
│   │   │       ├── goal_tool.py       # Goal tracker tool
│   │   │       ├── market_tool.py     # Live price + ML forecast tool
│   │   │       ├── tax_tool.py        # STCG/LTCG calculator tool
│   │   │       └── rebalancer_tool.py # Portfolio rebalancer tool
│   │   ├── goal_recommender.py        # AI goal recommendations
│   │   ├── news_summarizer.py         # Market news + AI summary
│   │   └── portfolio_recommender.py   # Stock/ETF suggestions
│   ├── ml/
│   │   ├── price_predictor.py         # Ridge Regression forecaster
│   │   ├── monte_carlo.py             # Retirement simulator
│   │   ├── risk_predictor.py          # RandomForest risk scorer
│   │   ├── fraud_detector.py          # IsolationForest anomaly detection
│   │   └── sentiment_analyzer.py      # VADER sentiment analysis
│   ├── api/                           # FastAPI route handlers
│   ├── services/                      # Portfolio engine, goal tracker
│   ├── models.py                      # SQLAlchemy models
│   └── main.py                        # App entrypoint
├── frontend/
│   └── src/
│       └── pages/
│           ├── Dashboard.tsx          # Portfolio overview
│           ├── Goals.tsx              # Goal management
│           ├── Portfolio.tsx          # Investment tracking
│           ├── Simulations.tsx        # Monte Carlo UI
│           ├── Predictions.tsx        # ML price forecast UI
│           ├── Chatbot.tsx            # Advanced AI agent chat
│           ├── News.tsx               # Market news
│           ├── GoalRecommender.tsx    # SIP recommendations
│           └── PortfolioRecommender.tsx # Stock suggestions
└── docker-compose.yml
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL (or Docker)

### 1. Clone the Repository
```bash
git clone https://github.com/mani1854/Personal-Wealth-Management-Goal-Tracker-.git
cd Personal-Wealth-Management-Goal-Tracker-
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/Mac

pip install -r requirements.txt
```

### 3. Configure Environment Variables
Create `backend/.env`:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/wealthtracker
SECRET_KEY=your-secret-key-here
GROQ_API_KEY=your-groq-api-key-here        # Free at console.groq.com
OPENAI_API_KEY=your-openai-key-here        # Optional
```

### 4. Run the Backend
```bash
uvicorn main:app --reload --port 8000
```

### 5. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 6. Open the App
- **Frontend:** http://localhost:5173
- **API Docs:** http://localhost:8000/docs

---

## 🐳 Docker Setup
```bash
docker-compose up --build
```

---

## 📡 Key API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/token` | Login & get JWT |
| GET | `/dashboard/summary` | Full dashboard data |
| GET/POST | `/goals/` | Manage financial goals |
| GET/POST | `/investments` | Portfolio holdings |
| POST | `/transactions` | Buy/sell stocks |
| POST | `/market/sync` | Sync live prices |
| POST | `/ai/agent/chat` | **Advanced Groq agent** |
| GET | `/ai/predict/{symbol}` | ML price prediction |
| POST | `/simulations/` | Monte Carlo simulation |
| GET | `/ai/news` | AI market news summary |
| POST | `/ai/goals/recommend` | Goal recommendations |
| GET | `/ai/recommendations/portfolio` | Portfolio suggestions |
| GET | `/ai/dashboard` | Risk + fraud + sentiment |

---


