"""Goal tracking and projection engine."""
from datetime import datetime, timezone
from typing import Optional
import math


def months_to_goal(target_amount: float, current_amount: float, monthly_contribution: float, annual_return: float = 0.08) -> Optional[int]:
    if monthly_contribution <= 0 and current_amount < target_amount:
        return None
    monthly_rate = annual_return / 12
    balance = current_amount
    for month in range(1, 601):
        balance = balance * (1 + monthly_rate) + monthly_contribution
        if balance >= target_amount:
            return month
    return None


def project_goal_completion(goal: dict, current_savings: float = 0, annual_return: float = 0.08) -> dict:
    target = goal["target_amount"]
    monthly = goal["monthly_contribution"]
    months = months_to_goal(target, current_savings, monthly, annual_return)

    completion_date = None
    years_approx = None
    if months:
        from dateutil.relativedelta import relativedelta
        completion_date = (datetime.now(timezone.utc) + relativedelta(months=months)).strftime("%B %Y")
        years_approx = round(months / 12, 1)

    # Compare with target date
    on_track = True
    if goal.get("target_date") and months:
        try:
            target_dt = datetime.fromisoformat(goal["target_date"].replace("Z", "+00:00"))
            projected_dt = datetime.now(timezone.utc)
            from dateutil.relativedelta import relativedelta
            projected_dt = projected_dt + relativedelta(months=months)
            on_track = projected_dt <= target_dt
        except Exception:
            pass

    return {
        "goal_type": goal["type"],
        "target_amount": target,
        "monthly_contribution": monthly,
        "months_to_complete": months,
        "years_approx": years_approx,
        "completion_date": completion_date,
        "on_track": on_track,
    }


def recommend_monthly_savings(income: float, expenses: float, risk_profile: str) -> dict:
    disposable = max(0, income - expenses)
    ratios = {"conservative": 0.15, "moderate": 0.25, "aggressive": 0.35}
    ratio = ratios.get(risk_profile, 0.25)
    recommended = round(disposable * ratio, 0)
    safe_max = round(disposable * 0.5, 0)
    return {
        "disposable_income": disposable,
        "recommended_monthly_investment": recommended,
        "safe_max_monthly": safe_max,
        "savings_ratio": ratio,
    }


def goal_achievement_probability(current: float, target: float, monthly: float, years: int, simulations: int = 1000) -> float:
    """Quick Monte Carlo for single goal probability."""
    import numpy as np
    if target <= 0:
        return 100.0
    successes = 0
    for _ in range(simulations):
        balance = current
        for _ in range(years * 12):
            monthly_return = np.random.normal(0.006, 0.04)
            balance = balance * (1 + monthly_return) + monthly
        if balance >= target:
            successes += 1
    return round(successes / simulations * 100, 1)
