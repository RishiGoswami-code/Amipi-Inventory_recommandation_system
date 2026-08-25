from pydantic import BaseModel, Field
from typing import Optional, List

class InventoryItemInput(BaseModel):
    style_number: str
    category: Optional[str] = "Jewelry"
    metal: Optional[str] = ""
    stone_type: Optional[str] = ""
    last_30_day_sales: int = 0
    last_90_day_sales: int = 0
    current_stock: int = 0
    on_order: int = 0
    event: str
    days_until_event: int = 0
    season: Optional[str] = ""

class EventMultiplierInput(BaseModel):
    event: str
    event_multiplier: float

class RecommendationOutput(BaseModel):
    style_number: str
    category: str
    metal: str
    stone_type: str
    current_stock: int
    on_order: int
    last_90_day_sales: int
    event: str
    days_until_event: int
    available_inventory: int
    monthly_sales_rate: float
    projected_demand_until_event: float
    event_multiplier: float
    recommended_stock_needed: float
    suggested_order_qty: int
    priority: str
    recommendation: str
    reason: str

class RecommendationResponse(BaseModel):
    items: List[RecommendationOutput]
    total_items: int
    high_priority_count: int
    medium_priority_count: int
    low_priority_count: int
    do_not_reorder_count: int
    total_suggested_reorder_units: int
