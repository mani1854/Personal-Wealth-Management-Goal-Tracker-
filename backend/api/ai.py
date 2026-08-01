"""Unified AI/ML API routes."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional

from database import get_db
from models import User
from auth import get_current_user
from services.user_context import get_user_context
from ai.advisor import generate_insights
from ai.goal_recommender import recommend_goals
from ai.portfolio_recommender import recommend_portfolio
from ai.rag_chatbot import chat, clear_history
from ai.advanced_chatbot.agent import agent_chat, clear_agent_memory
from ai.news_summarizer import summarize_news
from ai.nl_search import search_portfolio
from ml.risk_predictor import predict_portfolio_risk
from ml.price_predictor import predict_stock_price
from ml.fraud_detector import detect_fraud
from ml.sentiment_analyzer import analyze_sentiment
from ml.monte_carlo import run_monte_carlo
from services.goal_tracker import goal_achievement_probability
from services.portfolio_engine import get_portfolio_summary

router = APIRouter(prefix="/ai", tags=["ai"])


class InsightResponse(BaseModel):
    insights: str
    structured: dict


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    reply: str
    sources: list[str]
    model: str


class GoalRecommendRequest(BaseModel):
    income: float = Field(..., gt=0)
    expenses: float = Field(..., ge=0)


class MonteCarloRequest(BaseModel):
    initial_amount: float = 0
    monthly_contribution: float = 10000
    years: int = Field(10, ge=1, le=40)
    goal_amount: Optional[float] = None
    simulations: int = Field(2000, ge=100, le=10000)


class SearchRequest(BaseModel):
    query: str


@router.get("/insights", response_model=InsightResponse)
def get_insights(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ctx = get_user_context(db, current_user)
    result = generate_insights(ctx)
    return result


@router.get("/risk")
def get_risk_score(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ctx = get_user_context(db, current_user)
    return predict_portfolio_risk(ctx)


@router.get("/predict/{symbol}")
def get_price_prediction(symbol: str, days: int = 7, current_user: User = Depends(get_current_user)):
    result = predict_stock_price(symbol, horizon_days=min(days, 30))
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.post("/goals/recommend")
def get_goal_recommendations(
    body: GoalRecommendRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ctx = get_user_context(db, current_user)
    return recommend_goals(ctx, body.income, body.expenses)


@router.get("/recommendations/portfolio")
def get_portfolio_recommendations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ctx = get_user_context(db, current_user)
    return recommend_portfolio(ctx)


@router.post("/chat", response_model=ChatResponse)
def ai_chat(
    body: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ctx = get_user_context(db, current_user)
    result = chat(current_user.id, ctx, body.message)
    return result


@router.delete("/chat/history")
def clear_chat_history(current_user: User = Depends(get_current_user)):
    clear_history(current_user.id)
    clear_agent_memory(current_user.id)
    return {"status": "cleared"}


class AgentChatRequest(BaseModel):
    message: str


@router.post("/agent/chat")
def advanced_agent_chat(
    body: AgentChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Advanced tool-calling AI agent with intent classification and memory."""
    ctx = get_user_context(db, current_user)
    result = agent_chat(current_user.id, ctx, body.message)
    return result


@router.delete("/agent/memory")
def clear_agent_chat_memory(current_user: User = Depends(get_current_user)):
    clear_agent_memory(current_user.id)
    return {"status": "memory cleared"}


@router.get("/news")
def get_news_summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ctx = get_user_context(db, current_user)
    return summarize_news(ctx)


@router.get("/fraud")
def get_fraud_analysis(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ctx = get_user_context(db, current_user)
    return detect_fraud(ctx["transactions"])


@router.get("/sentiment/{symbol}")
def get_sentiment(symbol: str, current_user: User = Depends(get_current_user)):
    return analyze_sentiment(symbol)


@router.post("/search")
def nl_portfolio_search(
    body: SearchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ctx = get_user_context(db, current_user)
    return search_portfolio(ctx, body.query)


@router.post("/monte-carlo")
def monte_carlo_simulation(
    body: MonteCarloRequest,
    current_user: User = Depends(get_current_user),
):
    return run_monte_carlo(
        initial_amount=body.initial_amount,
        monthly_contribution=body.monthly_contribution,
        years=body.years,
        goal_amount=body.goal_amount,
        simulations=body.simulations,
    )


@router.get("/dashboard")
def get_ai_dashboard(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Aggregated AI dashboard widgets."""
    ctx = get_user_context(db, current_user)
    summary = get_portfolio_summary(ctx)
    risk = predict_portfolio_risk(ctx)
    fraud = detect_fraud(ctx["transactions"])
    portfolio_rec = recommend_portfolio(ctx)

    # Top holding sentiment
    sentiments = []
    for h in summary["holdings"][:3]:
        s = analyze_sentiment(h["symbol"])
        sentiments.append({"symbol": h["symbol"], "sentiment": s["sentiment"]})

    # Goal probabilities
    goal_probs = []
    for g in ctx["goals"]:
        if g["status"] == "active":
            prob = goal_achievement_probability(
                current=0, target=g["target_amount"],
                monthly=g["monthly_contribution"], years=10,
            )
            goal_probs.append({"type": g["type"], "probability": prob, "target": g["target_amount"]})

    # Health score composite
    health = round(
        (100 - risk["risk_score"]) * 0.4
        + summary["diversification_score"] * 0.3
        + min(100, summary["return_pct"] + 50) * 0.2
        + (100 if fraud["risk_level"] == "low" else 50) * 0.1,
        1,
    )

    return {
        "portfolio_health_score": health,
        "risk": {
            "score": risk["risk_score"],
            "label": risk["risk_label"],
            "top_reasons": risk["top_reasons"],
        },
        "portfolio_summary": {
            "net_worth": summary["net_worth"],
            "diversification_score": summary["diversification_score"],
            "sector_allocation": summary.get("sector_allocation", {}),
            "return_pct": summary["return_pct"],
        },
        "recommendations": portfolio_rec["recommendations"][:3],
        "goal_probabilities": goal_probs,
        "market_sentiment": sentiments,
        "fraud_status": {"level": fraud["risk_level"], "alerts": len(fraud["alerts"])},
    }
