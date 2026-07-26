"""Portfolio recommendation engine (hybrid: rules + LLM)."""
import os
import json
from openai import OpenAI
from services.portfolio_engine import compute_sector_allocation, SECTOR_MAP, get_sector


RECOMMENDATIONS_DB = {
    "IT": [
        {"symbol": "HDFCBANK", "name": "HDFC Bank", "type": "stock", "reason": "Diversify from IT into banking"},
        {"symbol": "NIFTYBEES", "name": "Nifty Bees ETF", "type": "etf", "reason": "Broad market index exposure"},
    ],
    "Banking": [
        {"symbol": "ITC", "name": "ITC Ltd", "type": "stock", "reason": "Add FMCG stability"},
        {"symbol": "NIFTYBEES", "name": "Nifty Bees ETF", "type": "etf", "reason": "Index diversification"},
    ],
    "Other": [
        {"symbol": "NIFTYBEES", "name": "Nifty Bees ETF", "type": "etf", "reason": "Core index holding"},
        {"symbol": "HDFCBANK", "name": "HDFC Bank", "type": "stock", "reason": "Large-cap stability"},
        {"symbol": "ITC", "name": "ITC Ltd", "type": "stock", "reason": "FMCG diversification"},
    ],
}

RISK_ASSETS = {
    "conservative": ["NIFTYBEES", "HDFCBANK", "ITC"],
    "moderate": ["NIFTYBEES", "HDFCBANK", "INFY", "ITC"],
    "aggressive": ["TCS", "RELIANCE", "NIFTYBEES"],
}


def recommend_portfolio(ctx: dict) -> dict:
    holdings = ctx["portfolio"]["holdings"]
    owned_symbols = {h["symbol"].upper() for h in holdings}
    sectors = compute_sector_allocation(holdings)
    risk_profile = ctx["user"]["risk_profile"]

    # Rule-based recommendations
    suggestions = []
    if sectors:
        dominant_sector = max(sectors, key=sectors.get)
        pool = RECOMMENDATIONS_DB.get(dominant_sector, RECOMMENDATIONS_DB["Other"])
    else:
        pool = RECOMMENDATIONS_DB["Other"]

    for rec in pool:
        if rec["symbol"] not in owned_symbols:
            suggestions.append(rec)

    # Risk-based additions
    for sym in RISK_ASSETS.get(risk_profile, RISK_ASSETS["moderate"]):
        if sym not in owned_symbols and not any(s["symbol"] == sym for s in suggestions):
            suggestions.append({
                "symbol": sym,
                "name": sym,
                "type": "stock",
                "reason": f"Aligned with {risk_profile} risk profile",
            })

    suggestions = suggestions[:5]

    explanation = None
    api_key = os.getenv("OPENAI_API_KEY")
    if api_key:
        try:
            owned = [h["symbol"] for h in holdings]
            client = OpenAI(api_key=api_key)
            prompt = f"""User owns: {owned}. Sectors: {sectors}. Risk: {risk_profile}.
Suggested: {json.dumps(suggestions)}
Write 2 sentences explaining why diversification matters for this portfolio."""
            resp = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=150,
            )
            explanation = resp.choices[0].message.content
        except Exception:
            pass

    if not explanation:
        owned = ", ".join(h["symbol"] for h in holdings) or "no holdings"
        explanation = f"You own {owned}. Your portfolio lacks diversification across sectors. Consider adding banking, FMCG, or index funds."

    return {
        "current_holdings": [h["symbol"] for h in holdings],
        "sector_allocation": sectors,
        "recommendations": suggestions,
        "explanation": explanation,
        "method": "Hybrid (content-based filtering + risk-based rules)",
    }
