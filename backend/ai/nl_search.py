"""Natural language portfolio search - converts queries to filtered results."""
import re
from datetime import datetime, timedelta, timezone


QUERY_PATTERNS = [
    (r"profitable|gain|profit|positive return", "profitable"),
    (r"lost|loss|losing|negative return", "losing"),
    (r"last month|past month|recent", "recent"),
    (r"tech|it|information", "sector_it"),
    (r"bank|banking|finance", "sector_banking"),
    (r"biggest|largest|top holding", "top"),
    (r"all|everything|list", "all"),
]


def parse_intent(query: str) -> str:
    q = query.lower()
    for pattern, intent in QUERY_PATTERNS:
        if re.search(pattern, q):
            return intent
    return "all"


def search_portfolio(ctx: dict, query: str) -> dict:
    intent = parse_intent(query)
    holdings = ctx["portfolio"]["holdings"]
    transactions = ctx["transactions"]
    results = []

    if intent == "profitable":
        results = [{"type": "holding", **h} for h in holdings if h.get("return_pct", 0) > 0]
    elif intent == "losing":
        results = [{"type": "holding", **h} for h in holdings if h.get("return_pct", 0) < 0]
    elif intent == "top":
        if holdings:
            top = max(holdings, key=lambda h: h["current_value"])
            results = [{"type": "holding", **top}]
    elif intent == "sector_it":
        from services.portfolio_engine import get_sector
        results = [{"type": "holding", **h} for h in holdings if get_sector(h["symbol"]) == "IT"]
    elif intent == "sector_banking":
        from services.portfolio_engine import get_sector
        results = [{"type": "holding", **h} for h in holdings if get_sector(h["symbol"]) == "Banking"]
    elif intent == "recent":
        cutoff = datetime.now(timezone.utc) - timedelta(days=30)
        recent_tx = []
        for t in transactions:
            if t.get("executed_at"):
                try:
                    dt = datetime.fromisoformat(t["executed_at"].replace("Z", "+00:00"))
                    if dt >= cutoff:
                        recent_tx.append({"type": "transaction", **t})
                except Exception:
                    pass
        results = recent_tx
    else:
        results = [{"type": "holding", **h} for h in holdings]

    summary = f"Found {len(results)} result(s) for: \"{query}\""
    if intent == "profitable":
        summary = f"Your profitable investments ({len(results)}): " + ", ".join(r["symbol"] for r in results) or "None"
    elif intent == "losing":
        summary = f"Investments that lost money ({len(results)}): " + ", ".join(r["symbol"] for r in results) or "None"

    return {
        "query": query,
        "intent": intent,
        "summary": summary,
        "results": results,
        "count": len(results),
    }
