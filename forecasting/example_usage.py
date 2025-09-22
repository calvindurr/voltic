#!/usr/bin/env python
"""
Example usage of the forecasting engine.

This script demonstrates how to use the modular forecasting engine
with different site types and models.
"""

import os
import sys
import django
from decimal import Decimal

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'renewable_forecasting.settings')
django.setup()

from forecasting.models import Site
from forecasting.forecast_engine import (
    RandomForecastModel, 
    ModelRegistry, 
    ForecastModel,
    model_registry
)


class ExampleAdvancedModel(ForecastModel):
    """Example of a more advanced forecasting model."""
    
    def predict(self, site, forecast_horizon: int = 24):
        """Generate predictions using a more sophisticated approach."""
        from forecasting.forecast_engine import ForecastPoint
        from django.utils import timezone
        from datetime import timedelta
        
        # This is just an example - in reality this might use weather data,
        # machine learning models, etc.
        base_capacity = site.capacity_mw or Decimal('10.0')
        start_time = timezone.now().replace(minute=0, second=0, microsecond=0)
        
        predictions = []
        for hour in range(forecast_horizon):
            forecast_datetime = start_time + timedelta(hours=hour)
            
            # Example: Use a simple pattern based on hour of day
            hour_of_day = forecast_datetime.hour
            if site.site_type == 'solar':
                # Solar follows daylight pattern
                if 6 <= hour_of_day <= 18:
                    # Simplified sine wave for solar generation
                    import math
                    daylight_hour = hour_of_day - 6
                    pattern = math.sin(math.pi * daylight_hour / 12)
                    generation = base_capacity * Decimal(str(pattern)) * Decimal('0.4')
                else:
                    generation = Decimal('0.0')
            else:
                # Wind is more constant but variable
                generation = base_capacity * Decimal('0.3')
            
            predictions.append(ForecastPoint(
                datetime=forecast_datetime,
                predicted_generation_mwh=generation.quantize(Decimal('0.001')),
                confidence_interval_lower=generation * Decimal('0.8'),
                confidence_interval_upper=generation * Decimal('1.2')
            ))
        
        return predictions
    
    def get_model_name(self):
        return "Example Advanced Model v1.0"


def main():
    """Demonstrate forecasting engine usage."""
    print("=== Renewable Energy Forecasting Engine Demo ===\n")
    
    # Create example sites
    solar_site = Site(
        name="Demo Solar Farm",
        site_type="solar", 
        latitude=Decimal('37.7749'),
        longitude=Decimal('-122.4194'),
        capacity_mw=Decimal('100.0')
    )
    
    wind_site = Site(
        name="Demo Wind Farm",
        site_type="wind",
        latitude=Decimal('41.8781'), 
        longitude=Decimal('-87.6298'),
        capacity_mw=Decimal('150.0')
    )
    
    print("Created example sites:")
    print(f"  - {solar_site.name}: {solar_site.capacity_mw}MW {solar_site.site_type}")
    print(f"  - {wind_site.name}: {wind_site.capacity_mw}MW {wind_site.site_type}")
    print()
    
    # Demonstrate using the global model registry
    print("=== Using Global Model Registry ===")
    
    # Get models for different site types
    solar_model = model_registry.get_model('solar')
    wind_model = model_registry.get_model('wind')
    
    print(f"Solar model: {solar_model.get_model_name()}")
    print(f"Wind model: {wind_model.get_model_name()}")
    print()
    
    # Generate predictions
    print("=== Generating Predictions (6 hours) ===")
    
    solar_predictions = solar_model.predict(solar_site, forecast_horizon=6)
    wind_predictions = wind_model.predict(wind_site, forecast_horizon=6)
    
    print("Solar predictions:")
    for i, pred in enumerate(solar_predictions):
        print(f"  Hour {i+1}: {pred.predicted_generation_mwh} MWh "
              f"(CI: {pred.confidence_interval_lower}-{pred.confidence_interval_upper})")
    
    print("\nWind predictions:")
    for i, pred in enumerate(wind_predictions):
        print(f"  Hour {i+1}: {pred.predicted_generation_mwh} MWh "
              f"(CI: {pred.confidence_interval_lower}-{pred.confidence_interval_upper})")
    print()
    
    # Demonstrate custom model registration
    print("=== Registering Custom Model ===")
    
    # Create a custom registry for this demo
    custom_registry = ModelRegistry()
    advanced_model = ExampleAdvancedModel()
    
    # Register the advanced model for solar sites
    custom_registry.register_model('solar', advanced_model)
    
    print(f"Registered custom model: {advanced_model.get_model_name()}")
    
    # Use the custom model
    custom_solar_model = custom_registry.get_model('solar')
    custom_predictions = custom_solar_model.predict(solar_site, forecast_horizon=4)
    
    print("Custom model predictions:")
    for i, pred in enumerate(custom_predictions):
        print(f"  Hour {i+1}: {pred.predicted_generation_mwh} MWh")
    print()
    
    # Show registered site types
    print("=== Registry Information ===")
    print(f"Global registry site types: {model_registry.get_registered_site_types()}")
    print(f"Custom registry site types: {custom_registry.get_registered_site_types()}")
    print()
    
    print("=== Demo Complete ===")
    print("The forecasting engine is ready for integration with the forecast service!")


if __name__ == '__main__':
    main()