import os
import httpx
from typing import Dict, Any, Optional

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "openai/gpt-4o-mini")

def generate_fallback_reason(data: Dict[str, Any]) -> str:
    """
    Generates a deterministic, plain-English business reason when OpenRouter API is
    unavailable or unconfigured. Written to read naturally in one sentence, without
    supply-chain jargon, so any store owner can understand the recommendation at a glance.
    """
    category = data.get("category", "Jewelry")
    metal = data.get("metal", "")
    stone = data.get("stone_type", "")
    sales_90 = data.get("last_90_day_sales", 0)
    current_stock = data.get("current_stock", 0)
    available = data.get("available_inventory", 0)
    event = data.get("event", "the upcoming event")
    suggested_qty = data.get("suggested_order_qty", 0)
    priority = data.get("priority", "")

    # Format descriptors
    specs = f"{metal} {stone}".strip()
    desc = f"{specs} {category}".strip() if specs else category

    if priority == "Do Not Reorder":
        return f"You already have plenty of the {desc} on hand ({current_stock} units), and it's barely selling ({sales_90} sold in the last 90 days) — no need to reorder right now."

    if priority == "High":
        if suggested_qty >= 5:
            return f"The {desc} is selling fast ({sales_90} sold in the last 90 days), and {event} will push demand even higher — order {suggested_qty} more units so you don't run out."
        return f"You're down to just {current_stock} units of the {desc}, but it's still selling well ({sales_90} sold in 90 days) — restock soon to be ready for {event}."

    if priority == "Medium":
        return f"The {desc} has been selling steadily ({sales_90} sold in the last 90 days), and {event} is coming up — ordering {suggested_qty} more units should keep you well covered."

    # Low Priority
    if suggested_qty == 0:
        return f"You already have {available} units of the {desc} on hand, which is enough to cover what {event} is expected to bring — no reorder needed."

    return f"You have {available} units of the {desc}, which almost covers what {event} will need — just {suggested_qty} more unit would give you a safe cushion."

async def generate_ai_reason(data: Dict[str, Any]) -> str:
    """
    Queries OpenRouter API to generate a concise business reason in jewelry-retail language.
    Falls back gracefully to deterministic rule-based generator if API key is missing or call fails.
    """
    api_key = os.getenv("OPENROUTER_API_KEY", "").strip()
    
    if not api_key:
        return generate_fallback_reason(data)

    system_prompt = (
        "You explain jewelry inventory reorder recommendations to a busy store owner. "
        "Write exactly one short, simple, friendly sentence in plain everyday English — as if you're "
        "telling a colleague what's going on and what to do about it. "
        "Avoid supply-chain jargon like 'velocity', 'stockout risk', or 'safety stock'; just say what's "
        "happening in plain terms. "
        "Do NOT perform or alter any mathematical calculations — only explain the numbers you're given."
    )

    user_prompt = (
        f"Item: {data.get('metal')} {data.get('stone_type')} {data.get('category')} (Style #{data.get('style_number')})\n"
        f"Sales: {data.get('last_90_day_sales')} sold in the last 90 days, {data.get('last_30_day_sales')} in the last 30 days\n"
        f"Stock: {data.get('current_stock')} on hand, {data.get('on_order')} on order, {data.get('available_inventory')} available in total\n"
        f"Event: {data.get('event')} in {data.get('days_until_event')} days (expected to multiply demand by {data.get('event_multiplier')}x)\n"
        f"Recommendation: {data.get('recommendation')} — suggested order quantity is {data.get('suggested_order_qty')} units, priority is {data.get('priority')}\n"
        f"Write one simple, friendly sentence explaining this recommendation so anyone can understand it in one read."
    )

    headers = {
        "Authorization": f"Bearer {api_key}",
        "HTTP-Referer": "https://github.com/RishiGoswami-code/Amipi-Inventory_recommandation_system",
        "X-Title": "AMIPI Jewelry Inventory Recommendation Tool",
        "Content-Type": "application/json"
    }

    payload = {
        "model": OPENROUTER_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "max_tokens": 120,
        "temperature": 0.5
    }

    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            response = await client.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload)
            if response.status_code == 200:
                res_data = response.json()
                reason = res_data["choices"][0]["message"]["content"].strip()
                # Clean up quotes if returned
                if reason.startswith('"') and reason.endswith('"'):
                    reason = reason[1:-1].strip()
                return reason
            else:
                return generate_fallback_reason(data)
    except Exception:
        # Fall back gracefully on network or timeout errors
        return generate_fallback_reason(data)
