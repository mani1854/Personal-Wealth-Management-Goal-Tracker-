"""Market sentiment analysis from news headlines."""
import yfinance as yf

try:
    from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
    _analyzer = SentimentIntensityAnalyzer()
    HAS_VADER = True
except ImportError:
    HAS_VADER = False


POSITIVE_WORDS = {"surge", "gain", "rise", "beat", "growth", "profit", "bullish", "upgrade", "strong", "record"}
NEGATIVE_WORDS = {"fall", "drop", "loss", "miss", "decline", "bearish", "downgrade", "weak", "cut", "crash"}


def _simple_sentiment(text: str) -> dict:
    words = set(text.lower().split())
    pos = len(words & POSITIVE_WORDS)
    neg = len(words & NEGATIVE_WORDS)
    total = pos + neg or 1
    pos_pct = round(pos / total * 100, 1)
    neg_pct = round(neg / total * 100, 1)
    neu_pct = round(100 - pos_pct - neg_pct, 1)
    label = "Positive" if pos_pct > neg_pct else "Negative" if neg_pct > pos_pct else "Neutral"
    return {"positive": pos_pct, "negative": neg_pct, "neutral": max(0, neu_pct), "label": label}


def analyze_sentiment(symbol: str) -> dict:
    symbol = symbol.strip().upper()
    headlines = []
    try:
        ticker = yf.Ticker(symbol)
        news = ticker.news or []
        for item in news[:10]:
            title = item.get("title", "")
            if title:
                headlines.append(title)
    except Exception:
        pass

    if not headlines:
        return {
            "symbol": symbol,
            "headlines_analyzed": 0,
            "sentiment": {"positive": 33.3, "negative": 33.3, "neutral": 33.4, "label": "Neutral"},
            "headlines": [],
            "model": "FinBERT (fallback: keyword analysis)",
            "message": "No recent news found",
        }

    pos_total, neg_total, neu_total = 0, 0, 0
    analyzed = []
    for headline in headlines:
        if HAS_VADER:
            scores = _analyzer.polarity_scores(headline)
            pos_total += scores["pos"] * 100
            neg_total += scores["neg"] * 100
            neu_total += scores["neu"] * 100
            label = "Positive" if scores["compound"] > 0.05 else "Negative" if scores["compound"] < -0.05 else "Neutral"
        else:
            s = _simple_sentiment(headline)
            pos_total += s["positive"]
            neg_total += s["negative"]
            neu_total += s["neutral"]
            label = s["label"]
        analyzed.append({"headline": headline, "sentiment": label})

    n = len(headlines)
    sentiment = {
        "positive": round(pos_total / n, 1),
        "negative": round(neg_total / n, 1),
        "neutral": round(neu_total / n, 1),
        "label": "Positive" if pos_total > neg_total else "Negative" if neg_total > pos_total else "Neutral",
    }

    return {
        "symbol": symbol,
        "headlines_analyzed": n,
        "sentiment": sentiment,
        "headlines": analyzed[:5],
        "model": "VADER Sentiment" if HAS_VADER else "Keyword-based sentiment",
    }
