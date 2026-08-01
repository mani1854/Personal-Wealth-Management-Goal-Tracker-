"""Risk predictor tool — runs RandomForest risk scorer on user portfolio."""
import json
from ml.risk_predictor import predict_portfolio_risk


def get_risk_analysis_tool(ctx: dict) -> str:
    risk = predict_portfolio_risk(ctx)
    result = {
        "risk_score": risk["risk_score"],
        "risk_label": risk["risk_label"],
        "top_reasons": risk["top_reasons"],
        "top_contributing_factors": [
            {"factor": c["feature"], "impact_pct": c["impact"]}
            for c in risk["feature_contributions"][:3]
        ],
        "model_used": risk["model"],
    }
    return json.dumps(result, indent=2)


SCHEMA = {
    "type": "function",
    "function": {
        "name": "get_risk_analysis",
        "description": (
            "Analyze the user's portfolio risk using a RandomForest ML model. "
            "Returns a risk score (0-100), risk label (Low/Medium/High), and the top reasons for the score."
        ),
        "parameters": {"type": "object", "properties": {}, "required": []},
    },
}
