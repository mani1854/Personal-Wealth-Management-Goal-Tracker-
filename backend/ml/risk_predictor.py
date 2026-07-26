"""Portfolio risk prediction using Random Forest + SHAP explainability."""
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from services.portfolio_engine import extract_risk_features


def _generate_training_data(n: int = 500):
    rng = np.random.RandomState(42)
    X, y = [], []
    for _ in range(n):
        features = {
            "num_holdings": rng.randint(1, 20),
            "max_sector_pct": rng.uniform(10, 90),
            "diversification_score": rng.uniform(10, 90),
            "volatility_proxy": rng.uniform(5, 40),
            "risk_profile_num": rng.randint(0, 3),
            "investment_duration_years": rng.uniform(1, 30),
            "concentration_top_holding": rng.uniform(5, 80),
            "portfolio_return_pct": rng.uniform(-30, 50),
        }
        risk = (
            features["max_sector_pct"] * 0.3
            + features["concentration_top_holding"] * 0.25
            + features["volatility_proxy"] * 0.2
            + (100 - features["diversification_score"]) * 0.15
            + features["risk_profile_num"] * 8
            + max(0, 10 - features["investment_duration_years"]) * 2
        )
        risk = min(100, max(0, risk + rng.normal(0, 3)))
        X.append(list(features.values()))
        y.append(risk)
    return np.array(X), np.array(y), list(features.keys())


FEATURE_NAMES = [
    "num_holdings", "max_sector_pct", "diversification_score", "volatility_proxy",
    "risk_profile_num", "investment_duration_years", "concentration_top_holding", "portfolio_return_pct"
]

_model = None


def _get_model():
    global _model
    if _model is None:
        X, y, _ = _generate_training_data()
        _model = RandomForestRegressor(n_estimators=100, random_state=42)
        _model.fit(X, y)
    return _model


def predict_portfolio_risk(ctx: dict) -> dict:
    features = extract_risk_features(ctx)
    X = np.array([[features[k] for k in FEATURE_NAMES]])
    model = _get_model()
    score = float(model.predict(X)[0])
    score = round(min(100, max(0, score)), 1)

    if score < 35:
        label = "Low Risk"
    elif score < 65:
        label = "Medium Risk"
    else:
        label = "High Risk"

    # SHAP-like feature importance from Random Forest
    importances = model.feature_importances_
    feature_vals = [features[k] for k in FEATURE_NAMES]
    contributions = []
    readable = {
        "num_holdings": "Number of holdings",
        "max_sector_pct": "Sector concentration",
        "diversification_score": "Diversification score",
        "volatility_proxy": "Portfolio volatility",
        "risk_profile_num": "Risk profile alignment",
        "investment_duration_years": "Investment horizon",
        "concentration_top_holding": "Top holding concentration",
        "portfolio_return_pct": "Portfolio return volatility",
    }
    for name, imp, val in zip(FEATURE_NAMES, importances, feature_vals):
        contributions.append({
            "feature": readable.get(name, name),
            "value": round(val, 2),
            "impact": round(float(imp) * 100, 1),
        })
    contributions.sort(key=lambda x: -x["impact"])

    reasons = []
    if features["max_sector_pct"] > 50:
        reasons.append(f"{features['max_sector_pct']:.0f}% invested in one sector")
    if features["concentration_top_holding"] > 40:
        reasons.append(f"Top holding is {features['concentration_top_holding']:.0f}% of portfolio")
    if features["volatility_proxy"] > 25:
        reasons.append("High volatility across holdings")
    if features["investment_duration_years"] < 3:
        reasons.append("Short investment horizon")
    if features["diversification_score"] < 40:
        reasons.append("Low diversification score")
    if not reasons:
        reasons.append("Portfolio appears well-balanced")

    return {
        "risk_score": score,
        "risk_label": label,
        "features": features,
        "top_reasons": reasons[:4],
        "feature_contributions": contributions[:5],
        "model": "RandomForest",
    }
