"""Intent classifier — maps user messages to one of 7 financial intents."""
import re

INTENT_PATTERNS = {
    "portfolio_query": [
        r"portfolio", r"net worth", r"holdings", r"how much.*worth",
        r"total.*value", r"investment.*value", r"assets", r"returns?",
        r"profit", r"loss", r"gain", r"p&l", r"performance",
    ],
    "risk_analysis": [
        r"risk", r"volatile", r"volatility", r"safe", r"dangerous",
        r"risky", r"diversif", r"concentrated", r"exposure",
    ],
    "goal_tracking": [
        r"goal", r"retire", r"retirement", r"target", r"saving",
        r"sip", r"monthly.*contribution", r"on track", r"achieve",
        r"when.*reach", r"how long", r"house", r"education",
    ],
    "market_data": [
        r"price", r"stock", r"share", r"market", r"nifty", r"sensex",
        r"predict", r"forecast", r"trend", r"bullish", r"bearish",
        r"current.*value", r"trading", r"symbol",
    ],
    "tax_query": [
        r"tax", r"stcg", r"ltcg", r"capital gain", r"80c", r"deduction",
        r"itr", r"income tax", r"how much.*tax", r"tax.*sell",
    ],
    "rebalancing": [
        r"rebalanc", r"realloc", r"should.*buy", r"should.*sell",
        r"what.*add", r"diversif.*suggest", r"portfolio.*fix",
        r"over.*weight", r"under.*weight", r"allocation",
    ],
    "general": [],
}


def classify_intent(message: str) -> str:
    """Returns the best-matching intent string."""
    msg = message.lower()
    scores = {intent: 0 for intent in INTENT_PATTERNS}
    for intent, patterns in INTENT_PATTERNS.items():
        for pat in patterns:
            if re.search(pat, msg):
                scores[intent] += 1
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else "general"


INTENT_LABELS = {
    "portfolio_query": "📊 Portfolio Query",
    "risk_analysis": "⚠️ Risk Analysis",
    "goal_tracking": "🎯 Goal Tracking",
    "market_data": "📈 Market Data",
    "tax_query": "🧾 Tax Query",
    "rebalancing": "⚖️ Rebalancing",
    "general": "💬 General",
}
