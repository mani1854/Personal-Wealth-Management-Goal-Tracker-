"""Tax calculator tool — Indian STCG / LTCG capital gains tax."""
import json


# Indian capital gains tax rules (FY 2024-25)
STCG_RATE = 0.20       # Short-term: 20% (equity, held < 12 months)
LTCG_RATE = 0.125      # Long-term: 12.5% (equity, held >= 12 months)
LTCG_EXEMPTION = 125000  # ₹1.25 lakh LTCG exemption per year


def calculate_tax_tool(gain: float, holding_period_days: int, investment_type: str = "equity") -> str:
    if gain <= 0:
        return json.dumps({"message": "No capital gain to tax (gain ≤ 0).", "tax_payable": 0})

    is_long_term = holding_period_days >= 365
    investment_type = investment_type.lower()

    if investment_type in ("equity", "stock", "etf", "mutual fund"):
        if is_long_term:
            taxable_gain = max(0, gain - LTCG_EXEMPTION)
            tax = taxable_gain * LTCG_RATE
            tax_type = "LTCG (Long-Term Capital Gains)"
            rate_pct = LTCG_RATE * 100
            note = f"₹{LTCG_EXEMPTION:,.0f} LTCG exemption applied."
        else:
            tax = gain * STCG_RATE
            taxable_gain = gain
            tax_type = "STCG (Short-Term Capital Gains)"
            rate_pct = STCG_RATE * 100
            note = "STCG has no exemption — full gain is taxable."
    else:
        # Debt/other: slab rate, estimate 30%
        tax = gain * 0.30
        taxable_gain = gain
        tax_type = "Debt/Other (Income Tax Slab)"
        rate_pct = 30.0
        note = "Estimated at highest slab rate (30%). Consult a CA for exact amount."

    result = {
        "capital_gain": gain,
        "holding_period_days": holding_period_days,
        "holding_type": "Long-Term (LTCG)" if is_long_term else "Short-Term (STCG)",
        "tax_type": tax_type,
        "tax_rate_pct": rate_pct,
        "taxable_gain": round(taxable_gain, 2),
        "estimated_tax": round(tax, 2),
        "effective_rate_pct": round((tax / gain) * 100, 2) if gain > 0 else 0,
        "note": note,
        "disclaimer": "This is an estimate. Consult a tax professional for precise calculations.",
    }
    return json.dumps(result, indent=2)


SCHEMA = {
    "type": "function",
    "function": {
        "name": "calculate_tax",
        "description": (
            "Calculate Indian capital gains tax (STCG/LTCG) on investment profits. "
            "Use when user asks about tax on selling stocks, funds, or ETFs."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "gain": {
                    "type": "number",
                    "description": "The capital gain amount in ₹ (selling price minus purchase price).",
                },
                "holding_period_days": {
                    "type": "integer",
                    "description": "Number of days the investment was held. < 365 = STCG, >= 365 = LTCG.",
                },
                "investment_type": {
                    "type": "string",
                    "description": "Type of investment: 'equity', 'stock', 'etf', 'mutual fund', or 'debt'.",
                    "enum": ["equity", "stock", "etf", "mutual fund", "debt"],
                },
            },
            "required": ["gain", "holding_period_days"],
        },
    },
}
