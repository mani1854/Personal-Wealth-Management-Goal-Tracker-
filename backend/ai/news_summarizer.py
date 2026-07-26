"""Financial news summarizer with portfolio impact analysis."""
import os
import json
import yfinance as yf
from openai import OpenAI


def fetch_market_news(symbols: list[str] | None = None) -> list[dict]:
    headlines = []
    seen = set()

    # General market news via Nifty proxy
    fetch_symbols = list(symbols or []) + ["^NSEI", "RELIANCE.NS"]
    for sym in fetch_symbols[:8]:
        try:
            ticker = yf.Ticker(sym)
            for item in (ticker.news or [])[:5]:
                title = item.get("title", "")
                if title and title not in seen:
                    seen.add(title)
                    headlines.append({
                        "title": title,
                        "symbol": sym.replace("^", "").replace(".NS", ""),
                        "publisher": item.get("publisher", "Unknown"),
                    })
        except Exception:
            continue
    return headlines[:15]


def summarize_news(ctx: dict, symbols: list[str] | None = None) -> dict:
    user_symbols = symbols or [h["symbol"] for h in ctx["portfolio"]["holdings"]]
    headlines = fetch_market_news(user_symbols)

    if not headlines:
        return {
            "summary": "No recent market news available.",
            "headlines": [],
            "portfolio_impact": "Unable to assess impact without news data.",
        }

    headline_text = "\n".join(f"- {h['title']} ({h['symbol']})" for h in headlines)
    holdings = [h["symbol"] for h in ctx["portfolio"]["holdings"]]

    api_key = os.getenv("OPENAI_API_KEY")
    if api_key:
        try:
            client = OpenAI(api_key=api_key)
            prompt = f"""Summarize today's market news in 4-5 bullet points. Then explain impact on user's holdings: {holdings}.

News:
{headline_text}

Format:
## Today's Market Summary
(bullets)

## Impact on Your Portfolio
(2-3 sentences)"""
            resp = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=400,
            )
            summary = resp.choices[0].message.content
            return {"summary": summary, "headlines": headlines, "portfolio_impact": "See summary above"}
        except Exception:
            pass

    # Fallback summary
    summary = "## Today's Market Summary\n\n"
    for h in headlines[:5]:
        summary += f"• {h['title']}\n"
    impact = f"These developments may affect your holdings in {', '.join(holdings) if holdings else 'your portfolio'}. Monitor IT and banking sectors closely."
    return {"summary": summary, "headlines": headlines, "portfolio_impact": impact}
