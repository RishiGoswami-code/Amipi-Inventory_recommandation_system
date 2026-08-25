import csv
import io
from typing import List, Dict, Tuple, Any

DEFAULT_EVENT_MULTIPLIERS = {
    "JCK Vegas": 2.0,
    "JIS Miami": 1.5,
    "Mother's Day": 1.8,
    "Valentine's Day": 1.7,
    "Holiday Season": 2.2
}

class ValidationException(Exception):
    def __init__(self, message: str, details: List[str] = None):
        super().__init__(message)
        self.message = message
        self.details = details or []

def parse_event_multipliers_csv(csv_content: str) -> Dict[str, float]:
    """
    Parses event multipliers CSV content. Returns mapping of event name -> multiplier float.
    """
    multipliers = dict(DEFAULT_EVENT_MULTIPLIERS)
    if not csv_content or not csv_content.strip():
        return multipliers

    reader = csv.DictReader(io.StringIO(csv_content.strip()))
    if not reader.fieldnames or "event" not in reader.fieldnames or "event_multiplier" not in reader.fieldnames:
        raise ValidationException("Event Multipliers CSV must contain 'event' and 'event_multiplier' headers.")

    for idx, row in enumerate(reader, start=2):
        event = row.get("event", "").strip()
        mult_str = row.get("event_multiplier", "").strip()
        if not event or not mult_str:
            continue
        try:
            mult_val = float(mult_str)
            if mult_val <= 0:
                raise ValueError()
            multipliers[event] = mult_val
        except ValueError:
            raise ValidationException(f"Line {idx}: Invalid event_multiplier '{mult_str}' for event '{event}'. Must be a positive number.")

    return multipliers

def parse_inventory_sales_csv(csv_content: str) -> List[Dict[str, Any]]:
    """
    Parses inventory sales CSV content, validating required headers and row data types.
    """
    if not csv_content or not csv_content.strip():
        raise ValidationException("Inventory sales CSV file is empty.")

    reader = csv.DictReader(io.StringIO(csv_content.strip()))
    required_fields = ["style_number", "last_90_day_sales", "current_stock", "on_order", "event", "days_until_event"]
    
    if not reader.fieldnames:
        raise ValidationException("CSV file contains no headers.")

    missing_fields = [field for field in required_fields if field not in reader.fieldnames]
    if missing_fields:
        raise ValidationException(
            f"Missing required CSV columns: {', '.join(missing_fields)}.",
            details=[f"Required fields are: {', '.join(required_fields)}"]
        )

    parsed_rows = []
    errors = []

    for line_idx, row in enumerate(reader, start=2):
        style_number = row.get("style_number", "").strip()
        if not style_number:
            errors.append(f"Row {line_idx}: Missing 'style_number'.")
            continue

        try:
            last_90_day_sales = int(row.get("last_90_day_sales", 0))
            if last_90_day_sales < 0:
                raise ValueError("sales cannot be negative")
        except ValueError:
            errors.append(f"Row {line_idx} ({style_number}): 'last_90_day_sales' must be a non-negative integer.")

        try:
            current_stock = int(row.get("current_stock", 0))
            if current_stock < 0:
                raise ValueError("stock cannot be negative")
        except ValueError:
            errors.append(f"Row {line_idx} ({style_number}): 'current_stock' must be a non-negative integer.")

        try:
            on_order = int(row.get("on_order", 0))
            if on_order < 0:
                raise ValueError("on_order cannot be negative")
        except ValueError:
            errors.append(f"Row {line_idx} ({style_number}): 'on_order' must be a non-negative integer.")

        event = row.get("event", "").strip()
        if not event:
            errors.append(f"Row {line_idx} ({style_number}): Missing 'event'.")

        try:
            days_until_event = int(row.get("days_until_event", 0))
            if days_until_event < 0:
                raise ValueError("days_until_event cannot be negative")
        except ValueError:
            errors.append(f"Row {line_idx} ({style_number}): 'days_until_event' must be a non-negative integer.")

        try:
            last_30_day_sales = int(row.get("last_30_day_sales", 0)) if row.get("last_30_day_sales") else 0
        except ValueError:
            last_30_day_sales = 0

        parsed_rows.append({
            "style_number": style_number,
            "category": row.get("category", "Jewelry").strip(),
            "metal": row.get("metal", "").strip(),
            "stone_type": row.get("stone_type", "").strip(),
            "last_30_day_sales": last_30_day_sales,
            "last_90_day_sales": int(row.get("last_90_day_sales", 0)) if "last_90_day_sales" in row else 0,
            "current_stock": int(row.get("current_stock", 0)) if "current_stock" in row else 0,
            "on_order": int(row.get("on_order", 0)) if "on_order" in row else 0,
            "event": event,
            "days_until_event": int(row.get("days_until_event", 0)) if "days_until_event" in row else 0,
            "season": row.get("season", "").strip()
        })

    if errors:
        raise ValidationException("CSV data validation errors encountered.", details=errors)

    return parsed_rows
