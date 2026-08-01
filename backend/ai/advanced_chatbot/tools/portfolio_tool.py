"""Portfolio tool — returns net worth, holdings, P&L, diversification."""
import json
from services.portfolio_engine import get_portfolio_summary, compute_sector_allocation


def get_portfolio_summary_tool(ctx: dict) -> str:
    summary = get_portfolio_summary(ctx)
    sectors = compute_sector_allocation(summary["holdings"])
    top_holdings = sorted(summary["holdings"], key=lambda h: h["current_value"], reverse=True)[:5]
    result = {
        "net_worth": summary["net_worth"],
        "total_cost": summary.get("total_cost", 0),
        "total_return_pct": round(summary.get("return_pct", 0), 2),
        "diversification_score": summary["diversification_score"],
        "num_holdings": len(summary["holdings"]),
        "sector_allocation": sectors,
        "top_holdings": [
            {
                "symbol": h["symbol"],
                "value": h["current_value"],
                "return_pct": round(h.get("return_pct", 0), 2),
                "portfolio_pct": round(h.get("pct", 0), 2),
            }
            for h in top_holdings
        ],
    }
    return json.dumps(result, indent=2)


SCHEMA = {
    "type": "function",
    "function": {
        "name": "get_portfolio_summary",
        "description": (
            "Get the user's complete portfolio summary: net worth, total P&L, "
            "diversification score, sector allocation, and top holdings with returns."
        ),
        "parameters": {"type": "object", "properties": {}, "required": []},
    },
}
