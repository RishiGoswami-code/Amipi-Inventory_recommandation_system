from typing import Tuple, Dict, Any

def calculate_inventory_metrics(
    current_stock: int,
    on_order: int,
    last_90_day_sales: int,
    days_until_event: int,
    event_multiplier: float
) -> Dict[str, Any]:
    """
    Calculates deterministic inventory metrics based on assignment rules.
    
    Formulas:
    available_inventory = current_stock + on_order
    monthly_sales_rate = last_90_day_sales / 3
    projected_demand_until_event = monthly_sales_rate * (days_until_event / 30)
    recommended_stock_needed = projected_demand_until_event * event_multiplier
    suggested_order_qty = max(0, round(recommended_stock_needed - available_inventory))
    """
    available_inventory = current_stock + on_order
    
    # Exact float math for precision
    raw_monthly_sales = last_90_day_sales / 3.0
    raw_projected_demand = raw_monthly_sales * (days_until_event / 30.0)
    raw_recommended_stock = raw_projected_demand * event_multiplier
    
    # Rounded values for display and integer calculation for order quantity
    monthly_sales_rate = round(raw_monthly_sales, 2)
    projected_demand_until_event = round(raw_projected_demand, 2)
    recommended_stock_needed = round(raw_recommended_stock, 2)
    
    suggested_order_qty = max(0, int(round(raw_recommended_stock - available_inventory)))

    return {
        "available_inventory": available_inventory,
        "monthly_sales_rate": monthly_sales_rate,
        "projected_demand_until_event": projected_demand_until_event,
        "recommended_stock_needed": recommended_stock_needed,
        "suggested_order_qty": suggested_order_qty,
    }

def determine_priority_and_recommendation(
    suggested_order_qty: int,
    current_stock: int,
    last_90_day_sales: int
) -> Tuple[str, str]:
    """
    Determines priority level and recommendation label according to assignment priority rules:
    
    Override Rule:
    - Do Not Reorder: last_90_day_sales <= 3 and current_stock >= 8. Overrides normal priority.
    
    Priority Rules:
    - High Priority: suggested_order_qty >= 5, or current_stock <= 2 and last_90_day_sales >= 10.
    - Medium Priority: suggested_order_qty between 2 and 4, or current_stock <= 3 and last_90_day_sales >= 6.
    - Low Priority: suggested_order_qty is 0 or 1.
    """
    # 1. Check override rule first
    if last_90_day_sales <= 3 and current_stock >= 8:
        return "Do Not Reorder", "Do Not Reorder"

    # 2. Check High Priority
    if suggested_order_qty >= 5 or (current_stock <= 2 and last_90_day_sales >= 10):
        return "High", "Reorder"

    # 3. Check Medium Priority
    if (2 <= suggested_order_qty <= 4) or (current_stock <= 3 and last_90_day_sales >= 6):
        return "Medium", "Reorder"

    # 4. Check Low Priority
    if suggested_order_qty == 0:
        return "Low", "Sufficient Stock"
    else:
        return "Low", "Reorder (Low)"
