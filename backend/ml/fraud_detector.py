"""Transaction fraud detection using Isolation Forest."""
import numpy as np
from sklearn.ensemble import IsolationForest
from datetime import datetime


def detect_fraud(transactions: list) -> dict:
    if len(transactions) < 3:
        return {
            "alerts": [],
            "risk_level": "low",
            "message": "Not enough transactions for fraud analysis",
            "anomalies_detected": 0,
        }

    alerts = []
    features_list = []
    tx_refs = []

    for i, tx in enumerate(transactions):
        total = tx["quantity"] * tx["price"]
        features_list.append([total, tx["quantity"], tx["price"], tx.get("fees", 0)])
        tx_refs.append(tx)

    X = np.array(features_list)
    clf = IsolationForest(contamination=0.15, random_state=42)
    preds = clf.fit_predict(X)
    scores = clf.decision_function(X)

    for i, (pred, score) in enumerate(zip(preds, scores)):
        if pred == -1:
            tx = tx_refs[i]
            alerts.append({
                "type": "unusual_transaction",
                "symbol": tx["symbol"],
                "transaction_type": tx["type"],
                "amount": round(tx["quantity"] * tx["price"], 2),
                "anomaly_score": round(float(score), 3),
                "executed_at": tx.get("executed_at"),
                "reason": "Transaction pattern deviates from your normal behavior",
            })

    # Duplicate detection
    seen = {}
    for tx in transactions:
        key = (tx["symbol"], tx["type"], tx["quantity"], tx["price"])
        if key in seen:
            alerts.append({
                "type": "duplicate_trade",
                "symbol": tx["symbol"],
                "transaction_type": tx["type"],
                "amount": round(tx["quantity"] * tx["price"], 2),
                "reason": "Possible duplicate trade detected",
                "executed_at": tx.get("executed_at"),
            })
        seen[key] = True

    # Large trade detection
    amounts = [t["quantity"] * t["price"] for t in transactions]
    if amounts:
        threshold = np.percentile(amounts, 95) * 1.5
        for tx in transactions[:10]:
            amt = tx["quantity"] * tx["price"]
            if amt > threshold and threshold > 0:
                alerts.append({
                    "type": "unusual_spending",
                    "symbol": tx["symbol"],
                    "amount": round(amt, 2),
                    "reason": f"Trade amount significantly above your 95th percentile (₹{threshold:,.0f})",
                    "executed_at": tx.get("executed_at"),
                })

    risk_level = "low"
    if len(alerts) >= 3:
        risk_level = "high"
    elif len(alerts) >= 1:
        risk_level = "medium"

    return {
        "alerts": alerts[:10],
        "risk_level": risk_level,
        "anomalies_detected": len(alerts),
        "model": "IsolationForest",
        "transactions_analyzed": len(transactions),
    }
