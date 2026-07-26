"""AI goal recommendation system."""
import os
import json
from openai import OpenAI
from services.goal_tracker import recommend_monthly_savings, project_goal_completion, goal_achievement_probability


def recommend_goals(ctx: dict, income: float, expenses: float) -> dict:
    risk_profile = ctx["user"]["risk_profile"]
    savings = recommend_monthly_savings(income, expenses, risk_profile)

    recommendations = []
    for goal in ctx["goals"]:
        if goal["status"] != "active":
            continue
        projection = project_goal_completion(goal)
        prob = goal_achievement_probability(
            current=0,
            target=goal["target_amount"],
            monthly=goal["monthly_contribution"],
            years=max(1, int(projection.get("years_approx") or 10)),
        )
        recommendations.append({**projection, "achievement_probability": prob, "goal_id": goal.get("id")})

    # Suggest optimal monthly for each goal
    suggested_monthly = savings["recommended_monthly_investment"]
    if ctx["goals"]:
        per_goal = round(suggested_monthly / len([g for g in ctx["goals"] if g["status"] == "active"]), 0)
    else:
        per_goal = suggested_monthly

    explanation = None
    api_key = os.getenv("OPENAI_API_KEY")
    if api_key:
        try:
            client = OpenAI(api_key=api_key)
            prompt = f"""Based on income ₹{income:,.0f}, expenses ₹{expenses:,.0f}, risk profile {risk_profile}:
Recommended monthly investment: ₹{suggested_monthly:,.0f}
Goals: {json.dumps(recommendations)}

Write 2-3 sentences explaining the recommendation in plain language."""
            resp = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.5,
                max_tokens=200,
            )
            explanation = resp.choices[0].message.content
        except Exception:
            pass

    if not explanation:
        explanation = (
            f"Based on your salary of ₹{income:,.0f} and expenses of ₹{expenses:,.0f}, "
            f"you can safely invest **₹{suggested_monthly:,.0f}/month** "
            f"({savings['savings_ratio']*100:.0f}% of disposable income)."
        )

    return {
        "income": income,
        "expenses": expenses,
        "disposable_income": savings["disposable_income"],
        "recommended_monthly_investment": savings["recommended_monthly_investment"],
        "safe_max_monthly": savings["safe_max_monthly"],
        "suggested_per_goal": per_goal,
        "goal_projections": recommendations,
        "explanation": explanation,
    }
