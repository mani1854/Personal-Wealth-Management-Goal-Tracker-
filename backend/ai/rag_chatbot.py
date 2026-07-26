"""RAG chatbot - grounds responses in user portfolio data."""
import os
import json
from openai import OpenAI
from services.portfolio_engine import get_portfolio_summary
from ml.risk_predictor import predict_portfolio_risk
from services.goal_tracker import project_goal_completion


# In-memory conversation store (per user)
_conversations: dict[int, list] = {}


def _build_context_docs(ctx: dict) -> str:
    summary = get_portfolio_summary(ctx)
    risk = predict_portfolio_risk(ctx)
    goals = [project_goal_completion(g) for g in ctx["goals"] if g["status"] == "active"]

    docs = f"""
USER PROFILE:
Name: {ctx['user']['name']}
Risk Profile: {ctx['user']['risk_profile']}

PORTFOLIO (Net Worth: ₹{summary['net_worth']:,.0f}):
{json.dumps(summary['holdings'], indent=2)}

SECTOR ALLOCATION: {json.dumps(summary.get('sector_allocation', {}))}
RISK SCORE: {risk['risk_score']}/100 ({risk['risk_label']})

GOALS:
{json.dumps(goals, indent=2)}

RECENT TRANSACTIONS:
{json.dumps(ctx['transactions'][:10], indent=2)}
"""
    return docs


def chat(user_id: int, ctx: dict, message: str) -> dict:
    context_docs = _build_context_docs(ctx)

    if user_id not in _conversations:
        _conversations[user_id] = []

    history = _conversations[user_id]
    history.append({"role": "user", "content": message})
    if len(history) > 20:
        history = history[-20:]
        _conversations[user_id] = history

    system_prompt = f"""You are a personal financial advisor chatbot. Answer ONLY based on the user's actual data below.
If you don't have enough data, say so. Use ₹ for currency. Be concise and helpful.

USER DATA (RAG Context):
{context_docs}
"""

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        # Rule-based fallback
        reply = _fallback_reply(ctx, message)
        history.append({"role": "assistant", "content": reply})
        return {"reply": reply, "sources": ["portfolio", "goals", "transactions"], "model": "rule-based fallback"}

    try:
        client = OpenAI(api_key=api_key)
        messages = [{"role": "system", "content": system_prompt}] + history
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=messages,
            temperature=0.5,
            max_tokens=500,
        )
        reply = response.choices[0].message.content
        history.append({"role": "assistant", "content": reply})
        return {
            "reply": reply,
            "sources": ["portfolio", "goals", "transactions", "risk_analysis"],
            "model": "gpt-3.5-turbo + RAG",
        }
    except Exception as e:
        reply = _fallback_reply(ctx, message)
        history.append({"role": "assistant", "content": reply})
        return {"reply": reply, "sources": ["portfolio", "goals"], "model": "fallback", "error": str(e)}


def _fallback_reply(ctx: dict, message: str) -> str:
    msg = message.lower()
    net_worth = ctx["portfolio"]["net_worth"]
    if "retire" in msg or "retirement" in msg:
        ret_goals = [g for g in ctx["goals"] if g["type"] == "retirement"]
        if ret_goals:
            g = ret_goals[0]
            proj = project_goal_completion(g)
            return f"Your retirement goal target is ₹{g['target_amount']:,.0f}. At ₹{g['monthly_contribution']:,.0f}/month SIP, you could reach it by {proj.get('completion_date', 'unknown')}."
        return f"Your current net worth is ₹{net_worth:,.0f}. Set a retirement goal to get a personalized projection."
    if "portfolio" in msg or "worth" in msg:
        return f"Your portfolio is worth ₹{net_worth:,.0f} across {ctx['portfolio']['num_holdings']} holdings."
    if "risk" in msg:
        risk = predict_portfolio_risk(ctx)
        return f"Your portfolio risk score is {risk['risk_score']}/100 ({risk['risk_label']}). Top factors: {', '.join(risk['top_reasons'][:2])}."
    return f"I can help with questions about your ₹{net_worth:,.0f} portfolio, goals, and risk. Try asking about retirement or diversification."


def clear_history(user_id: int):
    _conversations.pop(user_id, None)
