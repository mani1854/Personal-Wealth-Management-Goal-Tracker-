from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
import models, auth
from database import get_db

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/summary")
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    uid = current_user.id

    # Portfolio stats
    investments = db.query(models.Investment).filter(models.Investment.user_id == uid).all()
    total_value = sum(float(inv.current_value or 0) for inv in investments)
    total_cost  = sum(float(inv.cost_basis or 0)  for inv in investments)
    total_return = total_value - total_cost
    return_pct   = (total_return / total_cost * 100) if total_cost > 0 else 0

    # Goals stats
    goals = db.query(models.Goal).filter(models.Goal.user_id == uid).all()
    active_goals = [g for g in goals if g.status == "active"]
    total_goal_target = sum(float(g.target_amount or 0) for g in active_goals)
    total_monthly_contrib = sum(float(g.monthly_contribution or 0) for g in active_goals)

    # Recent transactions
    recent_txns = (
        db.query(models.Transaction)
        .filter(models.Transaction.user_id == uid)
        .order_by(models.Transaction.executed_at.desc())
        .limit(5)
        .all()
    )
    recent = [
        {
            "id": t.id,
            "symbol": t.symbol,
            "type": t.type.value if hasattr(t.type, "value") else str(t.type),
            "quantity": float(t.quantity or 0),
            "price": float(t.price or 0),
            "total": float(t.quantity or 0) * float(t.price or 0),
            "executed_at": t.executed_at.isoformat() if t.executed_at else None,
        }
        for t in recent_txns
    ]

    # Asset allocation breakdown
    allocation = [
        {
            "symbol": inv.symbol,
            "value": float(inv.current_value or 0),
            "pct": (float(inv.current_value or 0) / total_value * 100) if total_value > 0 else 0,
        }
        for inv in investments
    ]

    return {
        "net_worth": total_value,
        "total_cost": total_cost,
        "total_return": total_return,
        "return_pct": return_pct,
        "num_holdings": len(investments),
        "num_active_goals": len(active_goals),
        "total_goal_target": total_goal_target,
        "total_monthly_contrib": total_monthly_contrib,
        "allocation": allocation,
        "recent_transactions": recent,
    }
