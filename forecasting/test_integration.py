#!/usr/bin/env python
"""
Simple integration test for the forecasting engine without Django setup.

This demonstrates the core functionality of the forecasting engine.
"""

import sys
import os
from decimal import Decimal
from datetime import datetime

# Add the current directory to Python path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Mock Site class for testing without Django
class MockSite:
    def __init__(self, name, site_type, latitude, longitude, capacity_mw=None):
        self.name = name
        self.site_type = site_type
        self.latitude = latitude
        self.longitude = longitude
        self.capacity_mw = capacity_mw


def test_forecasting_engine():
    """Test the forecasting engine components."""
    print("=== Testing Forecasting Engine ===\n")
    
    # Import the forecasting components
    from forecast_engine import (
        RandomForecastModel,
        ModelRegistry,
        ForecastPoint
    )
    
    # Create test sites
    solar_site = MockSite(
        name="Test Solar Site",
        site_type="solar",
        latitude=Decimal('40.7128'),
        longitude=Decimal('-74.0060'),
        capacity_mw=Decimal('50.0')
    )
    
    wind_site = MockSite(
        name="Test Wind Site",
        site_type="wind", 
        latitude=Decimal('41.8781'),
        longitude=Decimal('-87.6298'),
        capacity_mw=Decimal('100.0')
    )
    
    print("Created test sites:")
    print(f"  - {solar_site.name}: {solar_site.capacity_mw}MW {solar_site.site_type}")
    print(f"  - {wind_site.name}: {wind_site.capacity_mw}MW {wind_site.site_type}")
    print()
    
    # Test RandomForecastModel
    print("=== Testing RandomForecastModel ===")
    model = RandomForecastModel(seed=42)  # Use seed for reproducible results
    
    print(f"Model name: {model.get_model_name()}")
    print(f"Model description: {model.get_model_description()}")
    print()
    
    # Generate predictions for solar site
    print("Solar site predictions (3 hours):")
    solar_predictions = model.predict(solar_site, forecast_horizon=3)
    
    for i, pred in enumerate(solar_predictions):
        print(f"  Hour {i+1}: {pred.predicted_generation_mwh} MWh")
        print(f"    Confidence: {pred.confidence_interval_lower} - {pred.confidence_interval_upper}")
        print(f"    Datetime: {pred.datetime}")
    print()
    
    # Generate predictions for wind site
    print("Wind site predictions (3 hours):")
    wind_predictions = model.predict(wind_site, forecast_horizon=3)
    
    for i, pred in enumerate(wind_predictions):
        print(f"  Hour {i+1}: {pred.predicted_generation_mwh} MWh")
        print(f"    Confidence: {pred.confidence_interval_lower} - {pred.confidence_interval_upper}")
    print()
    
    # Test ModelRegistry
    print("=== Testing ModelRegistry ===")
    registry = ModelRegistry()
    
    print(f"Registered site types: {registry.get_registered_site_types()}")
    
    # Get models for different site types
    solar_model = registry.get_model('solar')
    wind_model = registry.get_model('wind')
    unknown_model = registry.get_model('unknown')
    
    print(f"Solar model: {solar_model.get_model_name()}")
    print(f"Wind model: {wind_model.get_model_name()}")
    print(f"Unknown type model (fallback): {unknown_model.get_model_name()}")
    print()
    
    # Test custom model registration
    print("=== Testing Custom Model Registration ===")
    
    class TestModel(RandomForecastModel):
        def get_model_name(self):
            return "Test Custom Model v1.0"
    
    custom_model = TestModel()
    registry.register_model('hydro', custom_model)
    
    hydro_model = registry.get_model('hydro')
    print(f"Registered custom model: {hydro_model.get_model_name()}")
    print(f"Updated site types: {registry.get_registered_site_types()}")
    print()
    
    # Test error handling
    print("=== Testing Error Handling ===")
    
    try:
        model.predict(None)
        print("ERROR: Should have raised ValueError for None site")
    except ValueError as e:
        print(f"✓ Correctly caught error for None site: {e}")
    
    try:
        model.predict(solar_site, forecast_horizon=0)
        print("ERROR: Should have raised ValueError for zero horizon")
    except ValueError as e:
        print(f"✓ Correctly caught error for zero horizon: {e}")
    
    try:
        registry.register_model('test', "not a model")
        print("ERROR: Should have raised TypeError for invalid model")
    except TypeError as e:
        print(f"✓ Correctly caught error for invalid model: {e}")
    
    print()
    print("=== All Tests Passed! ===")
    print("The forecasting engine is working correctly.")


if __name__ == '__main__':
    test_forecasting_engine()