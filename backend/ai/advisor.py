"""OpenAI-powered financial advisor."""
import os
import json
from openai import OpenAI
from services.portfolio_engine import get_portfolio_summary, compute_sector_allocation
from ml.risk_predictor import predict_portfolio_risk
from services.goal_tracker import project_goal_completion


def _client():
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY environment variable not set")
    return OpenAI(api_key=api_key)


def generate_insights(ctx: dict) -> dict:
    summary = get_portfolio_summary(ctx)
    risk = predict_portfolio_risk(ctx)
    sectors = compute_sector_allocation(summary["holdings"])
    goal_projections = [project_goal_completion(g) for g in ctx["goals"] if g["status"] == "active"]

    structured = {
        "portfolio_value": summary["net_worth"],
        "risk_score": risk["risk_score"],
        "risk_label": risk["risk_label"],
        "diversification_score": summary["diversification_score"],
        "sector_allocation": sectors,
        "top_reasons": risk["top_reasons"],
        "goal_projections": goal_projections,
    }

    prompt = f"""You are an expert financial advisor. Based on this user data, provide concise, actionable insights in Markdown (max 4 paragraphs).

User: {ctx['user']['name']}
Risk Profile: {ctx['user']['risk_profile']}

Portfolio Summary:
{json.dumps(structured, indent=2)}

Holdings:
{json.dumps(summary['holdings'], indent=2)}

Include:
1. Portfolio concentration analysis (mention specific sectors/percentages)
2. Diversification recommendations aligned with their risk profile
3. Goal progress assessment with specific SIP/monthly amounts and timelines
4. One actionable next step

Use ₹ for currency. Be specific with numbers from the data."""

    try:
        client = _client()
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful, professional financial advisor."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
        )
        insights = response.choices[0].message.content
    except Exception:
        # Fallback without LLM
        max_sector = summary.get("max_sector", "Unknown")
        max_pct = summary.get("max_sector_pct", 0)
        insights = f"""## Portfolio Analysis

Your portfolio is worth **₹{summary['net_worth']:,.0f}** with a risk score of **{risk['risk_score']}/100** ({risk['risk_label']}).

### Concentration
Your portfolio is **{max_pct:.0f}%** concentrated in **{max_sector}** stocks. Diversifying into banking or FMCG could reduce overall risk.

### Diversification Score
Your diversification score is **{summary['diversification_score']}/100**. Consider adding index funds or sector ETFs.

### Goals
"""
        for gp in goal_projections:
            if gp.get("completion_date"):
                insights += f"- **{gp['goal_type'].title()}**: SIP of ₹{gp['monthly_contribution']:,.0f}/month could reach your goal by **{gp['completion_date']}** (~{gp['years_approx']} years).\n"
        insights += f"\n### Top Risk Factors\n" + "\n".join(f"- {r}" for r in risk["top_reasons"])

    return {"insights": insights, "structured": structured}
