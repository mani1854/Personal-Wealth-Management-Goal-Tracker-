"""In-memory conversation memory store with rolling summary."""
from datetime import datetime
from collections import deque

# Per-user: {"messages": deque, "summary": str}
_store: dict[int, dict] = {}

MAX_FULL_HISTORY = 10  # Keep last 10 exchanges in full
MAX_SUMMARY_LEN = 500


def get_memory(user_id: int) -> dict:
    if user_id not in _store:
        _store[user_id] = {"messages": deque(maxlen=MAX_FULL_HISTORY * 2), "summary": ""}
    return _store[user_id]


def add_message(user_id: int, role: str, content: str):
    mem = get_memory(user_id)
    mem["messages"].append({
        "role": role,
        "content": content,
        "timestamp": datetime.utcnow().isoformat(),
    })


def get_history(user_id: int) -> list[dict]:
    """Returns last N messages as OpenAI-compatible list."""
    mem = get_memory(user_id)
    return [{"role": m["role"], "content": m["content"]} for m in mem["messages"]]


def get_summary(user_id: int) -> str:
    return get_memory(user_id).get("summary", "")


def save_summary(user_id: int, summary: str):
    mem = get_memory(user_id)
    mem["summary"] = summary[:MAX_SUMMARY_LEN]


def clear_memory(user_id: int):
    _store.pop(user_id, None)


def build_memory_context(user_id: int) -> str:
    summary = get_summary(user_id)
    history = get_history(user_id)
    parts = []
    if summary:
        parts.append(f"[Conversation so far]: {summary}")
    if history:
        recent = history[-6:]  # last 3 exchanges
        for m in recent:
            parts.append(f"{m['role'].upper()}: {m['content'][:200]}")
    return "\n".join(parts)
