import os
from pathlib import Path
from typing import List, Optional
from fastapi import FastAPI, File, UploadFile, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.models import RecommendationOutput, RecommendationResponse
from app.engine import calculate_inventory_metrics, determine_priority_and_recommendation
from app.ai_service import generate_ai_reason, generate_fallback_reason
from app.validator import (
    parse_inventory_sales_csv,
    parse_event_multipliers_csv,
    ValidationException,
    DEFAULT_EVENT_MULTIPLIERS
)

app = FastAPI(
    title="AMIPI Event-Aware Jewelry Inventory Recommendation API",
    version="1.0.0",
    description="Deterministic inventory restocking recommendation engine with OpenRouter AI reasoning."
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
if not DATA_DIR.exists():
    DATA_DIR = BASE_DIR.parent / "data"

def get_default_csv_paths() -> tuple[Path, Path]:
    inv_path = DATA_DIR / "inventory_sales.csv"
    mult_path = DATA_DIR / "event_multipliers.csv"
    return inv_path, mult_path

async def process_recommendations(
    inventory_csv_text: str,
    multipliers_csv_text: Optional[str] = None,
    use_ai: bool = True
) -> RecommendationResponse:
    # 1. Parse multipliers
    multipliers_map = parse_event_multipliers_csv(multipliers_csv_text or "")
    
    # 2. Parse inventory rows
    parsed_items = parse_inventory_sales_csv(inventory_csv_text)

    output_items: List[RecommendationOutput] = []
    high_count = 0
    medium_count = 0
    low_count = 0
    dnr_count = 0
    total_reorder_units = 0

    for item in parsed_items:
        event_name = item["event"]
        multiplier = multipliers_map.get(event_name, 1.0)
        
        # Deterministic calculations
        metrics = calculate_inventory_metrics(
            current_stock=item["current_stock"],
            on_order=item["on_order"],
            last_90_day_sales=item["last_90_day_sales"],
            days_until_event=item["days_until_event"],
            event_multiplier=multiplier
        )

        # Priority & Recommendation determination
        priority, recommendation = determine_priority_and_recommendation(
            suggested_order_qty=metrics["suggested_order_qty"],
            current_stock=item["current_stock"],
            last_90_day_sales=item["last_90_day_sales"]
        )

        item_data = {
            **item,
            **metrics,
            "event_multiplier": multiplier,
            "priority": priority,
            "recommendation": recommendation
        }

        # AI Reason generation
        if use_ai:
            reason = await generate_ai_reason(item_data)
        else:
            reason = generate_fallback_reason(item_data)

        item_data["reason"] = reason

        rec_output = RecommendationOutput(**item_data)
        output_items.append(rec_output)

        # Metrics aggregation
        if priority == "High":
            high_count += 1
        elif priority == "Medium":
            medium_count += 1
        elif priority == "Low":
            low_count += 1
        elif priority == "Do Not Reorder":
            dnr_count += 1

        total_reorder_units += metrics["suggested_order_qty"]

    return RecommendationResponse(
        items=output_items,
        total_items=len(output_items),
        high_priority_count=high_count,
        medium_priority_count=medium_count,
        low_priority_count=low_count,
        do_not_reorder_count=dnr_count,
        total_suggested_reorder_units=total_reorder_units
    )

@app.get("/api/health")
def health_check():
    api_key_set = bool(os.getenv("OPENROUTER_API_KEY", "").strip())
    return {
        "status": "online",
        "service": "AMIPI Inventory Recommendation Tool",
        "openrouter_configured": api_key_set
    }

@app.get("/api/recommendations/default", response_model=RecommendationResponse)
async def get_default_recommendations(use_ai: bool = Query(True, description="Whether to use OpenRouter AI for reasons")):
    inv_path, mult_path = get_default_csv_paths()
    if not inv_path.exists():
        raise HTTPException(status_code=444, detail=f"Default inventory CSV not found at {inv_path}")

    inv_text = inv_path.read_text(encoding="utf-8")
    mult_text = mult_path.read_text(encoding="utf-8") if mult_path.exists() else None

    try:
        return await process_recommendations(inv_text, mult_text, use_ai=use_ai)
    except ValidationException as e:
        raise HTTPException(status_code=400, detail={"message": e.message, "details": e.details})

@app.post("/api/recommendations/upload", response_model=RecommendationResponse)
async def upload_recommendations(
    inventory_file: UploadFile = File(...),
    multiplier_file: Optional[UploadFile] = File(None),
    use_ai: bool = Query(True)
):
    try:
        inv_bytes = await inventory_file.read()
        inv_text = inv_bytes.decode("utf-8")
        
        mult_text = None
        if multiplier_file:
            mult_bytes = await multiplier_file.read()
            mult_text = mult_bytes.decode("utf-8")

        return await process_recommendations(inv_text, mult_text, use_ai=use_ai)
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="Uploaded file must be a valid UTF-8 encoded CSV.")
    except ValidationException as e:
        raise HTTPException(status_code=400, detail={"message": e.message, "details": e.details})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/sample-outputs")
async def get_sample_outputs():
    inv_path, mult_path = get_default_csv_paths()
    if not inv_path.exists():
        return []
    
    res = await process_recommendations(inv_path.read_text(encoding="utf-8"), mult_path.read_text(encoding="utf-8") if mult_path.exists() else None, use_ai=False)
    # Pick 3 representative sample items (High, Medium, Do Not Reorder)
    samples = []
    for target in ["High", "Medium", "Do Not Reorder"]:
        match = next((item for item in res.items if item.priority == target), None)
        if match:
            samples.append(match.dict(include={
                "style_number", "available_inventory", "monthly_sales_rate",
                "projected_demand_until_event", "event_multiplier",
                "recommended_stock_needed", "suggested_order_qty",
                "priority", "recommendation", "reason"
            }))
    return samples
