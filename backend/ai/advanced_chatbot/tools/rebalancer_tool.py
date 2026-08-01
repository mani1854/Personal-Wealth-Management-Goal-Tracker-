"""Portfolio rebalancer tool — suggests buy/sell to reach target allocation."""
import json
from services.portfolio_engine import get_portfolio_summary, compute_sector_allocation

TARGET_ALLOCATIONS = {
    "conservative": {"Banking": 35, "IT": 15, "FMCG": 25, "Pharma": 15, "Other": 10},
    "moderate":     {"Banking": 25, "IT": 25, "FMCG": 15, "Pharma": 10, "Other": 25},
    "aggressive":   {"Banking": 15, "IT": 40, "FMCG": 10, "Pharma": 10, "Other": 25},
}


def get_rebalancing_plan_tool(ctx: dict) -> str:
    summary = get_portfolio_summary(ctx)
    holdings = summary["holdings"]
    net_worth = summary["net_worth"]
    risk_profile = ctx["user"].get("risk_profile", "moderate")

    if net_worth <= 0 or not holdings:
        return json.dumps({"message": "No portfolio data available for rebalancing."})

    sectors = compute_sector_allocation(holdings)
    target = TARGET_ALLOCATIONS.get(risk_profile, TARGET_ALLOCATIONS["moderate"])
    total_sector_val = sum(sectors.values()) or 1

    actions = []
    for sector, target_pct in target.items():
        current_pct = (sectors.get(sector, 0) / total_sector_val) * 100
        diff_pct = target_pct - current_pct
        diff_value = (diff_pct / 100) * net_worth
        if abs(diff_pct) > 5:
            actions.append({
                "sector": sector,
                "current_allocation_pct": round(current_pct, 1),
                "target_allocation_pct": target_pct,
                "action": "BUY" if diff_pct > 0 else "SELL",
                "amount_to_move": f"₹{abs(diff_value):,.0f}",
                "urgency": "High" if abs(diff_pct) > 15 else "Medium",
            })

    result = {
        "risk_profile": risk_profile,
        "net_worth": net_worth,
        "current_sector_allocation": {k: round((v / total_sector_val) * 100, 1) for k, v in sectors.items()},
        "target_allocation": target,
        "rebalancing_actions": sorted(actions, key=lambda x: -abs(float(x["amount_to_move"].replace("₹", "").replace(",", "")))),
        "summary": f"{len(actions)} sector(s) need rebalancing for a {risk_profile} portfolio." if actions else "Portfolio is well-balanced for your risk profile!",
    }
    return json.dumps(result, indent=2)


SCHEMA = {
    "type": "function",
    "function": {
        "name": "get_rebalancing_plan",
        "description": (
            "Generate a portfolio rebalancing plan based on the user's risk profile. "
            "Returns which sectors to buy/sell and by how much to reach the ideal allocation."
        ),
        "parameters": {"type": "object", "properties": {}, "required": []},
    },
}
