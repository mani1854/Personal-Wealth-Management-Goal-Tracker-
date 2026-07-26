"""Portfolio analytics engine."""
from typing import Optional
import numpy as np
from services.user_context import get_user_context


SECTOR_MAP = {
    "TCS": "IT", "INFY": "IT", "WIPRO": "IT", "TECHM": "IT", "HCLTECH": "IT",
    "HDFCBANK": "Banking", "ICICIBANK": "Banking", "SBIN": "Banking", "KOTAKBANK": "Banking", "AXISBANK": "Banking",
    "ITC": "FMCG", "HINDUNILVR": "FMCG", "NESTLEIND": "FMCG", "BRITANNIA": "FMCG",
    "RELIANCE": "Energy", "ONGC": "Energy", "BPCL": "Energy",
    "TATASTEEL": "Metals", "JSWSTEEL": "Metals",
    "SUNPHARMA": "Pharma", "DRREDDY": "Pharma", "CIPLA": "Pharma",
    "NIFTYBEES": "Index", "SETFNIF50": "Index",
}


def get_sector(symbol: str) -> str:
    return SECTOR_MAP.get(symbol.upper(), "Other")


def compute_diversification_score(holdings: list) -> float:
    if not holdings:
        return 0.0
    weights = [h["pct"] / 100 for h in holdings if h["pct"] > 0]
    if not weights:
        return 0.0
    hhi = sum(w ** 2 for w in weights)
    return round(max(0, (1 - hhi) * 100), 1)


def compute_sector_allocation(holdings: list) -> dict:
    sectors: dict[str, float] = {}
    for h in holdings:
        sector = get_sector(h["symbol"])
        sectors[sector] = sectors.get(sector, 0) + h["pct"]
    return {k: round(v, 1) for k, v in sorted(sectors.items(), key=lambda x: -x[1])}


def compute_volatility_proxy(holdings: list) -> float:
    """Proxy volatility from return dispersion across holdings."""
    if len(holdings) < 2:
        return 15.0
    returns = [abs(h.get("return_pct", 0)) for h in holdings]
    return round(float(np.std(returns)) + 10, 1)


def extract_risk_features(ctx: dict) -> dict:
    holdings = ctx["portfolio"]["holdings"]
    sectors = compute_sector_allocation(holdings)
    max_sector_pct = max(sectors.values()) if sectors else 0
    div_score = compute_diversification_score(holdings)
    volatility = compute_volatility_proxy(holdings)

    risk_map = {"conservative": 0, "moderate": 1, "aggressive": 2}
    risk_profile_num = risk_map.get(ctx["user"]["risk_profile"], 1)

    active_goals = [g for g in ctx["goals"] if g["status"] == "active"]
    avg_horizon = 10.0
    if active_goals:
        from datetime import datetime
        horizons = []
        for g in active_goals:
            if g["target_date"]:
                try:
                    td = datetime.fromisoformat(g["target_date"].replace("Z", "+00:00"))
                    years = max(0.5, (td - datetime.now(td.tzinfo)).days / 365)
                    horizons.append(years)
                except Exception:
                    horizons.append(5)
        if horizons:
            avg_horizon = float(np.mean(horizons))

    return {
        "num_holdings": ctx["portfolio"]["num_holdings"],
        "max_sector_pct": max_sector_pct,
        "diversification_score": div_score,
        "volatility_proxy": volatility,
        "risk_profile_num": risk_profile_num,
        "investment_duration_years": avg_horizon,
        "concentration_top_holding": max((h["pct"] for h in holdings), default=0),
        "portfolio_return_pct": ctx["portfolio"]["return_pct"],
    }


def get_portfolio_summary(ctx: dict) -> dict:
    holdings = ctx["portfolio"]["holdings"]
    sectors = compute_sector_allocation(holdings)
    return {
        **ctx["portfolio"],
        "sector_allocation": sectors,
        "diversification_score": compute_diversification_score(holdings),
        "top_holding": holdings[0]["symbol"] if holdings else None,
        "max_sector": max(sectors, key=sectors.get) if sectors else None,
        "max_sector_pct": max(sectors.values()) if sectors else 0,
    }
