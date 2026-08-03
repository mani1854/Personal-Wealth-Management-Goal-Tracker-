"""Stock price prediction using historical Yahoo Finance data."""
import yfinance as yf
import numpy as np
from sklearn.linear_model import Ridge
from services.market_utils import normalize_symbol


def predict_stock_price(symbol: str, horizon_days: int = 7) -> dict:
    raw_symbol = symbol.strip().upper()
    symbol = normalize_symbol(raw_symbol)
    try:
        ticker = yf.Ticker(symbol)
        try:
            company_name = ticker.info.get("longName", ticker.info.get("shortName", raw_symbol))
        except Exception:
            company_name = raw_symbol
        hist = ticker.history(period="6mo")
        if hist.empty or len(hist) < 20:
            return {"symbol": symbol, "error": "Insufficient historical data"}

        closes = hist["Close"].values
        dates = hist.index

        # Feature: lagged returns + moving averages
        window = 5
        X, y = [], []
        for i in range(window, len(closes) - 1):
            features = list(closes[i - window:i])
            features.append(float(np.mean(closes[i - window:i])))
            features.append(float(np.std(closes[i - window:i])))
            X.append(features)
            y.append(closes[i + 1])
        X, y = np.array(X), np.array(y)

        model = Ridge(alpha=1.0)
        model.fit(X, y)

        # Predict next day iteratively
        last_window = list(closes[-window:])
        predictions = []
        current = closes[-1]
        for day in range(1, horizon_days + 1):
            features = last_window[-window:] + [float(np.mean(last_window[-window:])), float(np.std(last_window[-window:]))]
            pred = float(model.predict([features])[0])
            predictions.append({"day": day, "price": round(pred, 2)})
            last_window.append(pred)
            current = pred

        # Confidence from recent prediction error
        train_pred = model.predict(X)
        mape = float(np.mean(np.abs((y - train_pred) / y)) * 100)
        confidence = round(max(50, min(95, 100 - mape * 2)), 1)

        trend = "bullish" if predictions[-1]["price"] > closes[-1] else "bearish"
        change_pct = round((predictions[-1]["price"] - closes[-1]) / closes[-1] * 100, 2)

        return {
            "symbol": raw_symbol,
            "company_name": company_name,
            "current_price": round(float(closes[-1]), 2),
            "predicted_price": predictions[-1]["price"],
            "horizon_days": horizon_days,
            "trend": trend,
            "change_pct": change_pct,
            "confidence": confidence,
            "daily_predictions": predictions,
            "model": "Ridge Regression (6mo history)",
            "last_updated": dates[-1].isoformat() if hasattr(dates[-1], "isoformat") else str(dates[-1]),
        }
    except Exception as e:
        return {"symbol": symbol, "error": str(e)}
