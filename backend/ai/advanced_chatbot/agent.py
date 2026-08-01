"""
Advanced Financial AI Agent using Groq + Tool Calling.

Architecture:
  User Message
       │
       ▼
  Intent Classification
       │
       ▼
  Build Context (portfolio, goals, transactions)
       │
       ▼
  Retrieve Conversation Memory
       │
       ▼
  Groq LLM (llama-3.3-70b) with 6 Tools attached
  ┌────────────┬──────────────┬──────────────┐
  │ Portfolio  │ Risk         │ Goal Tracker │
  │ Market API │ Tax Calc     │ Rebalancer   │
  └────────────┴──────────────┴──────────────┘
       │
       ▼
  Execute Tool Calls → Feed results back to LLM
       │
       ▼
  Final Answer + Sources + Recommendations
       │
       ▼
  Save to Memory Store
"""
import os
import json

from ai.advanced_chatbot.intent_classifier import classify_intent, INTENT_LABELS
from ai.advanced_chatbot import memory_store
from ai.advanced_chatbot.tools import (
    portfolio_tool, risk_tool, goal_tool,
    market_tool, tax_tool, rebalancer_tool,
)

# ── Tool Registry ────────────────────────────────────────────────────────────
ALL_TOOL_SCHEMAS = [
    portfolio_tool.SCHEMA,
    risk_tool.SCHEMA,
    goal_tool.SCHEMA,
    market_tool.SCHEMA,
    tax_tool.SCHEMA,
    rebalancer_tool.SCHEMA,
]

TOOL_LABEL_MAP = {
    "get_portfolio_summary":  "📊 Portfolio Tool",
    "get_risk_analysis":      "⚠️ Risk Predictor",
    "get_goal_status":        "🎯 Goal Tracker",
    "get_market_data":        "📈 Market API",
    "calculate_tax":          "🧾 Tax Calculator",
    "get_rebalancing_plan":   "⚖️ Rebalancer",
}

MODEL = "llama-3.3-70b-versatile"
MAX_TOOL_ROUNDS = 4  # prevent infinite loops


def _get_client():
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY environment variable not set.")
    from groq import Groq
    return Groq(api_key=api_key)


def _execute_tool(name: str, args: dict, ctx: dict) -> str:
    """Dispatch tool call to the correct function."""
    try:
        if name == "get_portfolio_summary":
            return portfolio_tool.get_portfolio_summary_tool(ctx)
        elif name == "get_risk_analysis":
            return risk_tool.get_risk_analysis_tool(ctx)
        elif name == "get_goal_status":
            return goal_tool.get_goal_status_tool(ctx, args.get("goal_type", ""))
        elif name == "get_market_data":
            return market_tool.get_market_data_tool(args.get("symbol", ""))
        elif name == "calculate_tax":
            return tax_tool.calculate_tax_tool(
                gain=float(args.get("gain", 0)),
                holding_period_days=int(args.get("holding_period_days", 0)),
                investment_type=args.get("investment_type", "equity"),
            )
        elif name == "get_rebalancing_plan":
            return rebalancer_tool.get_rebalancing_plan_tool(ctx)
        else:
            return json.dumps({"error": f"Unknown tool: {name}"})
    except Exception as e:
        return json.dumps({"error": str(e)})


def _fallback_reply(ctx: dict, message: str, intent: str) -> dict:
    """Rule-based fallback when Groq is not configured."""
    net_worth = ctx["portfolio"]["net_worth"]
    holdings_count = ctx["portfolio"]["num_holdings"]
    goals = ctx.get("goals", [])

    if intent == "portfolio_query":
        reply = (
            f"Your portfolio is currently worth **₹{net_worth:,.0f}** "
            f"across **{holdings_count} holdings**. "
            f"Your overall return is **{ctx['portfolio'].get('return_pct', 0):.1f}%**."
        )
        tools_used = ["📊 Portfolio Tool"]
    elif intent == "risk_analysis":
        from ml.risk_predictor import predict_portfolio_risk
        risk = predict_portfolio_risk(ctx)
        reply = (
            f"Your portfolio risk score is **{risk['risk_score']}/100** ({risk['risk_label']}). "
            f"Top factors: {', '.join(risk['top_reasons'][:2])}."
        )
        tools_used = ["⚠️ Risk Predictor"]
    elif intent == "goal_tracking":
        active = [g for g in goals if g["status"] == "active"]
        if active:
            g = active[0]
            reply = (
                f"You have **{len(active)} active goal(s)**. "
                f"Your {g['type']} goal targets ₹{g['target_amount']:,.0f} "
                f"with a monthly SIP of ₹{g['monthly_contribution']:,.0f}."
            )
        else:
            reply = "You have no active financial goals set. Add a goal to get started!"
        tools_used = ["🎯 Goal Tracker"]
    elif intent == "tax_query":
        reply = (
            "Indian capital gains tax: **STCG** (held < 1 year) = **20%**, "
            "**LTCG** (held >= 1 year) = **12.5%** with ₹1.25L exemption. "
            "Ask me to calculate tax on a specific gain!"
        )
        tools_used = ["🧾 Tax Calculator"]
    elif intent == "rebalancing":
        reply = (
            f"Based on your **{ctx['user']['risk_profile']}** risk profile, "
            "I can generate a rebalancing plan. "
            f"Currently you have {holdings_count} holdings. "
            "Set up your Groq API key for detailed buy/sell suggestions."
        )
        tools_used = ["⚖️ Rebalancer"]
    else:
        reply = (
            f"Hi **{ctx['user']['name']}**! I'm your AI financial advisor. "
            f"Your portfolio is worth ₹{net_worth:,.0f}. "
            "Ask me about your risk, goals, taxes, or any stock price!"
        )
        tools_used = []

    return {
        "reply": reply,
        "intent": INTENT_LABELS.get(intent, intent),
        "tools_used": tools_used,
        "sources": ["portfolio", "goals"],
        "recommendations": [],
        "model": "rule-based fallback (set GROQ_API_KEY for full AI)",
    }


def agent_chat(user_id: int, ctx: dict, message: str) -> dict:
    """Main agent entry point."""
    # 1. Classify intent
    intent = classify_intent(message)
    intent_label = INTENT_LABELS.get(intent, "💬 General")

    # 2. Save user message to memory
    memory_store.add_message(user_id, "user", message)
    memory_context = memory_store.build_memory_context(user_id)

    # 3. Try Groq API
    try:
        client = _get_client()
    except ValueError:
        # No API key — use fallback
        result = _fallback_reply(ctx, message, intent)
        memory_store.add_message(user_id, "assistant", result["reply"])
        return result

    # 4. Build system prompt with user context
    system_prompt = f"""You are an expert AI financial advisor for {ctx['user']['name']}.
You have access to the user's real financial data via tools.
Always call the appropriate tool(s) before answering financial questions.
Use ₹ for currency. Be concise, specific, and use actual numbers from tool results.
Risk profile: {ctx['user']['risk_profile']}.

Conversation memory:
{memory_context or 'This is the start of the conversation.'}

Intent detected: {intent_label}
"""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": message},
    ]

    tools_used_names = []
    tool_results_for_sources = {}

    # 5. Agentic loop — let LLM call tools until it has enough info
    for _ in range(MAX_TOOL_ROUNDS):
        response = client.chat.completions.create(
            model=MODEL,
            messages=messages,
            tools=ALL_TOOL_SCHEMAS,
            tool_choice="auto",
            temperature=0.4,
            max_tokens=1024,
        )

        msg = response.choices[0].message

        # No more tool calls — LLM is ready to answer
        if not msg.tool_calls:
            break

        # Execute each tool call
        messages.append({"role": "assistant", "content": msg.content or "", "tool_calls": [
            {"id": tc.id, "type": "function", "function": {"name": tc.function.name, "arguments": tc.function.arguments}}
            for tc in msg.tool_calls
        ]})

        for tc in msg.tool_calls:
            fn_name = tc.function.name
            fn_args = json.loads(tc.function.arguments or "{}")
            result_str = _execute_tool(fn_name, fn_args, ctx)

            tools_used_names.append(fn_name)
            tool_results_for_sources[fn_name] = json.loads(result_str)

            messages.append({
                "role": "tool",
                "tool_call_id": tc.id,
                "content": result_str,
            })

    # 6. Extract final reply
    final_reply = msg.content or "I couldn't generate a response. Please try again."

    # 7. Extract recommendations from tool results
    recommendations = _extract_recommendations(tool_results_for_sources, intent)

    # 8. Save assistant reply to memory
    memory_store.add_message(user_id, "assistant", final_reply)

    # 9. Optionally summarise older history
    history = memory_store.get_history(user_id)
    if len(history) >= 8:
        _summarise_memory(client, user_id, history)

    return {
        "reply": final_reply,
        "intent": intent_label,
        "tools_used": [TOOL_LABEL_MAP.get(t, t) for t in tools_used_names],
        "sources": list(tool_results_for_sources.keys()),
        "recommendations": recommendations,
        "model": MODEL,
    }


def _extract_recommendations(tool_results: dict, intent: str) -> list[str]:
    recs = []
    if "get_risk_analysis" in tool_results:
        risk = tool_results["get_risk_analysis"]
        for reason in risk.get("top_reasons", [])[:2]:
            recs.append(f"⚠️ {reason}")
    if "get_rebalancing_plan" in tool_results:
        actions = tool_results["get_rebalancing_plan"].get("rebalancing_actions", [])
        for a in actions[:2]:
            recs.append(f"⚖️ {a['action']} {a['sector']} ({a['amount_to_move']})")
    if "get_goal_status" in tool_results:
        for g in tool_results["get_goal_status"].get("goals", [])[:1]:
            if g.get("status") == "needs attention":
                recs.append(f"🎯 {g['goal_type'].title()} goal needs attention — only {g['achievement_probability_pct']}% likely")
    return recs[:4]


def _summarise_memory(client, user_id: int, history: list):
    try:
        conv = "\n".join(f"{m['role']}: {m['content'][:100]}" for m in history[-10:])
        resp = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": f"Summarise this financial chat in 1-2 sentences:\n{conv}"}],
            max_tokens=100,
        )
        memory_store.save_summary(user_id, resp.choices[0].message.content)
    except Exception:
        pass


def clear_agent_memory(user_id: int):
    memory_store.clear_memory(user_id)
