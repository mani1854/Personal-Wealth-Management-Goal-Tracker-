"""Monte Carlo investment simulator."""
import numpy as np
from typing import Optional


def run_monte_carlo(
    initial_amount: float,
    monthly_contribution: float,
    years: int,
    goal_amount: Optional[float] = None,
    simulations: int = 2000,
    mean_annual_return: float = 0.10,
    volatility: float = 0.15,
) -> dict:
    monthly_mean = mean_annual_return / 12
    monthly_vol = volatility / np.sqrt(12)
    final_values = []

    yearly_paths = {y: [] for y in range(1, years + 1)}

    for _ in range(simulations):
        balance = initial_amount
        for month in range(1, years * 12 + 1):
            ret = np.random.normal(monthly_mean, monthly_vol)
            balance = balance * (1 + ret) + monthly_contribution
            if month % 12 == 0:
                yearly_paths[month // 12].append(balance)
        final_values.append(balance)

    final_values = np.array(final_values)
    goal_prob = None
    if goal_amount:
        goal_prob = round(float(np.mean(final_values >= goal_amount) * 100), 1)

    yearly_stats = []
    for y in range(1, years + 1):
        vals = np.array(yearly_paths[y])
        yearly_stats.append({
            "year": y,
            "median": round(float(np.median(vals)), 2),
            "p10": round(float(np.percentile(vals, 10)), 2),
            "p90": round(float(np.percentile(vals, 90)), 2),
        })

    return {
        "simulations": simulations,
        "years": years,
        "initial_amount": initial_amount,
        "monthly_contribution": monthly_contribution,
        "results": {
            "median_final": round(float(np.median(final_values)), 2),
            "best_case": round(float(np.percentile(final_values, 90)), 2),
            "worst_case": round(float(np.percentile(final_values, 10)), 2),
            "mean_final": round(float(np.mean(final_values)), 2),
            "goal_probability": goal_prob,
        },
        "yearly_projections": yearly_stats,
        "model": "Monte Carlo (Geometric Brownian Motion)",
    }
