"""Gather user financial context for AI/ML services."""
from sqlalchemy.orm import Session
import models


def get_user_context(db: Session, user: models.User) -> dict:
    goals = db.query(models.Goal).filter(models.Goal.user_id == user.id).all()
    investments = db.query(models.Investment).filter(models.Investment.user_id == user.id).all()
    transactions = (
        db.query(models.Transaction)
        .filter(models.Transaction.user_id == user.id)
        .order_by(models.Transaction.executed_at.desc())
        .all()
    )

    total_value = sum(float(i.current_value or 0) for i in investments)
    total_cost = sum(float(i.cost_basis or 0) for i in investments)

    allocation = []
    for inv in investments:
        val = float(inv.current_value or 0)
        allocation.append({
            "symbol": inv.symbol,
            "asset_type": inv.asset_type.value if hasattr(inv.asset_type, "value") else str(inv.asset_type),
            "units": float(inv.units or 0),
            "avg_buy_price": float(inv.avg_buy_price or 0),
            "current_value": val,
            "last_price": float(inv.last_price or 0),
            "pct": (val / total_value * 100) if total_value > 0 else 0,
            "return_pct": ((val - float(inv.cost_basis or 0)) / float(inv.cost_basis) * 100)
            if inv.cost_basis and float(inv.cost_basis) > 0 else 0,
        })

    return {
        "user": {
            "id": user.id,
            "name": user.name,
            "risk_profile": user.risk_profile.value if hasattr(user.risk_profile, "value") else str(user.risk_profile),
        },
        "portfolio": {
            "net_worth": total_value,
            "total_cost": total_cost,
            "total_return": total_value - total_cost,
            "return_pct": ((total_value - total_cost) / total_cost * 100) if total_cost > 0 else 0,
            "holdings": allocation,
            "num_holdings": len(investments),
        },
        "goals": [
            {
                "id": g.id,
                "type": g.goal_type.value if hasattr(g.goal_type, "value") else str(g.goal_type),
                "target_amount": float(g.target_amount or 0),
                "target_date": g.target_date.isoformat() if g.target_date else None,
                "monthly_contribution": float(g.monthly_contribution or 0),
                "status": g.status.value if hasattr(g.status, "value") else str(g.status),
            }
            for g in goals
        ],
        "transactions": [
            {
                "symbol": t.symbol,
                "type": t.type.value if hasattr(t.type, "value") else str(t.type),
                "quantity": float(t.quantity or 0),
                "price": float(t.price or 0),
                "fees": float(t.fees or 0),
                "executed_at": t.executed_at.isoformat() if t.executed_at else None,
            }
            for t in transactions[:50]
        ],
    }
