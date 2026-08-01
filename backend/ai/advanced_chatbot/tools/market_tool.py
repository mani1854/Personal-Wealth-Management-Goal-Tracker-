"""Market data tool — live price + 7-day ML prediction."""
import json
from ml.price_predictor import predict_stock_price


def get_market_data_tool(symbol: str) -> str:
    if not symbol:
        return json.dumps({"error": "Please provide a stock symbol, e.g. AAPL, TCS, RELIANCE"})
    result = predict_stock_price(symbol.strip().upper(), horizon_days=7)
    if "error" in result:
        return json.dumps({"error": result["error"], "symbol": symbol})
    return json.dumps({
        "symbol": result["symbol"],
        "current_price": result["current_price"],
        "predicted_7day_price": result["predicted_price"],
        "trend": result["trend"],
        "expected_change_pct": result["change_pct"],
        "model_confidence_pct": result["confidence"],
        "model": result["model"],
    }, indent=2)


SCHEMA = {
    "type": "function",
    "function": {
        "name": "get_market_data",
        "description": (
            "Get the current live market price of a stock and a 7-day ML-predicted price forecast. "
            "Use this when the user asks about the price, trend, or prediction for a specific stock symbol."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "symbol": {
                    "type": "string",
                    "description": "The stock ticker symbol, e.g. 'AAPL', 'TCS', 'RELIANCE', 'INFY'.",
                }
            },
            "required": ["symbol"],
        },
    },
}
