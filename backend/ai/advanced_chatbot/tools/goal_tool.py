"""Goal tracker tool — returns goal progress, SIP needed, achievement probability."""
import json
from services.goal_tracker import project_goal_completion, goal_achievement_probability


def get_goal_status_tool(ctx: dict, goal_type: str = "") -> str:
    goals = ctx.get("goals", [])
    if goal_type:
        goals = [g for g in goals if goal_type.lower() in g.get("type", "").lower()]

    if not goals:
        return json.dumps({"message": "No active goals found.", "goals": []})

    results = []
    for g in goals:
        if g["status"] != "active":
            continue
        proj = project_goal_completion(g)
        prob = goal_achievement_probability(
            current=0,
            target=g["target_amount"],
            monthly=g["monthly_contribution"],
            years=max(1, int(proj.get("years_approx") or 10)),
        )
        results.append({
            "goal_type": g["type"],
            "target_amount": g["target_amount"],
            "monthly_sip": g["monthly_contribution"],
            "estimated_completion": proj.get("completion_date", "Unknown"),
            "years_remaining": proj.get("years_approx", "Unknown"),
            "achievement_probability_pct": prob,
            "status": "on track" if prob >= 70 else "needs attention",
        })

    return json.dumps({"goals": results}, indent=2)


SCHEMA = {
    "type": "function",
    "function": {
        "name": "get_goal_status",
        "description": (
            "Get the status of the user's financial goals (retirement, house, education, etc.). "
            "Returns SIP amount, estimated completion date, and achievement probability."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "goal_type": {
                    "type": "string",
                    "description": "Optional: filter by goal type, e.g. 'retirement', 'house', 'education'. Leave empty for all goals.",
                }
            },
            "required": [],
        },
    },
}
