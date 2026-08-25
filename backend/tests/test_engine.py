import pytest
from app.engine import calculate_inventory_metrics, determine_priority_and_recommendation
from app.validator import parse_inventory_sales_csv, parse_event_multipliers_csv, ValidationException

def test_calculate_inventory_metrics_example():
    # Example style B401400-14WVS from documentation
    res = calculate_inventory_metrics(
        current_stock=3,
        on_order=4,
        last_90_day_sales=14,
        days_until_event=35,
        event_multiplier=2.0
    )
    assert res["available_inventory"] == 7
    assert res["monthly_sales_rate"] == 4.67
    assert res["projected_demand_until_event"] == 5.44
    assert res["recommended_stock_needed"] == 10.89
    assert res["suggested_order_qty"] == 4

def test_override_rule_do_not_reorder():
    # Override rule: last_90_day_sales <= 3 and current_stock >= 8
    priority, rec = determine_priority_and_recommendation(
        suggested_order_qty=5, # Suggested order would normally be High
        current_stock=15,
        last_90_day_sales=1
    )
    assert priority == "Do Not Reorder"
    assert rec == "Do Not Reorder"

def test_high_priority_classification():
    # High Priority: suggested_order_qty >= 5
    priority, rec = determine_priority_and_recommendation(
        suggested_order_qty=6,
        current_stock=2,
        last_90_day_sales=12
    )
    assert priority == "High"
    assert rec == "Reorder"

def test_medium_priority_classification():
    # Medium Priority: suggested_order_qty between 2 and 4
    priority, rec = determine_priority_and_recommendation(
        suggested_order_qty=3,
        current_stock=4,
        last_90_day_sales=10
    )
    assert priority == "Medium"
    assert rec == "Reorder"

def test_low_priority_classification():
    # Low Priority: suggested_order_qty == 0
    priority, rec = determine_priority_and_recommendation(
        suggested_order_qty=0,
        current_stock=5,
        last_90_day_sales=5
    )
    assert priority == "Low"
    assert rec == "Sufficient Stock"

def test_csv_validation_missing_headers():
    invalid_csv = "style_number,category\nB101,Band"
    with pytest.raises(ValidationException) as exc_info:
        parse_inventory_sales_csv(invalid_csv)
    assert "Missing required CSV columns" in str(exc_info.value)

def test_csv_validation_negative_values():
    invalid_csv = "style_number,last_90_day_sales,current_stock,on_order,event,days_until_event\nB101,-5,2,1,JCK Vegas,35"
    with pytest.raises(ValidationException) as exc_info:
        parse_inventory_sales_csv(invalid_csv)
    assert "must be a non-negative integer" in str(exc_info.value.details[0])

def test_event_multipliers_parser():
    mult_csv = "event,event_multiplier\nJCK Vegas,2.0\nCustom Event,1.7"
    mapping = parse_event_multipliers_csv(mult_csv)
    assert mapping["JCK Vegas"] == 2.0
    assert mapping["Custom Event"] == 1.7
    assert mapping["JIS Miami"] == 1.5 # Default kept
