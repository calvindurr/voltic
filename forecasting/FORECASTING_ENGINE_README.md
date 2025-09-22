# Forecasting Engine

This document describes the modular forecasting engine implemented for renewable energy generation prediction.

## Overview

The forecasting engine provides a pluggable architecture that allows different forecasting models to be easily integrated for different site types. The MVP implementation includes a random number generator model that produces realistic forecasts with site-type specific patterns.

## Components

### 1. ForecastModel (Abstract Base Class)

The `ForecastModel` class defines the interface that all forecasting models must implement:

```python
from forecasting.forecast_engine import ForecastModel

class MyCustomModel(ForecastModel):
    def predict(self, site, forecast_horizon: int = 24):
        # Return List[ForecastPoint]
        pass
    
    def get_model_name(self):
        return "My Custom Model v1.0"
```

### 2. RandomForecastModel

The MVP implementation that generates realistic random forecasts:

- **Solar sites**: Follows diurnal patterns with zero generation at night
- **Wind sites**: More variable generation that can occur at any time
- **Unknown types**: Generic random generation with 20% capacity factor

```python
from forecasting.forecast_engine import RandomForecastModel

model = RandomForecastModel(seed=42)  # Optional seed for reproducible results
predictions = model.predict(site, forecast_horizon=24)
```

### 3. ModelRegistry

Manages different forecast models by site type:

```python
from forecasting.forecast_engine import ModelRegistry, model_registry

# Use the global registry
solar_model = model_registry.get_model('solar')
wind_model = model_registry.get_model('wind')

# Or create a custom registry
custom_registry = ModelRegistry()
custom_registry.register_model('hydro', MyHydroModel())
```

### 4. ForecastPoint

Data structure for individual forecast predictions:

```python
from forecasting.forecast_engine import ForecastPoint

point = ForecastPoint(
    datetime=forecast_datetime,
    predicted_generation_mwh=Decimal('15.5'),
    confidence_interval_lower=Decimal('12.0'),
    confidence_interval_upper=Decimal('19.0')
)
```

## Usage Examples

### Basic Usage

```python
from forecasting.models import Site
from forecasting.forecast_engine import model_registry

# Create a site
site = Site(
    name="Solar Farm 1",
    site_type="solar",
    latitude=40.7128,
    longitude=-74.0060,
    capacity_mw=100.0
)

# Get the appropriate model
model = model_registry.get_model(site.site_type)

# Generate 24-hour forecast
predictions = model.predict(site, forecast_horizon=24)

# Process results
for i, pred in enumerate(predictions):
    print(f"Hour {i+1}: {pred.predicted_generation_mwh} MWh")
```

### Custom Model Registration

```python
from forecasting.forecast_engine import ModelRegistry, ForecastModel

class WeatherBasedModel(ForecastModel):
    def predict(self, site, forecast_horizon=24):
        # Implement weather-based forecasting
        # This could integrate with weather APIs, ML models, etc.
        pass
    
    def get_model_name(self):
        return "Weather-Based Model v2.0"

# Register the custom model
registry = ModelRegistry()
registry.register_model('solar', WeatherBasedModel())
```

## Features

### Site-Type Specific Patterns

- **Solar**: Diurnal generation pattern with peak around noon, zero at night
- **Wind**: Variable generation with seasonal adjustments (higher in winter)
- **Generic**: Fallback for unknown site types

### Confidence Intervals

All predictions include confidence intervals (±20% of predicted value by default) to indicate uncertainty.

### Reproducible Results

Use the `seed` parameter in `RandomForecastModel` for reproducible testing and debugging.

### Error Handling

- Validates input parameters (site cannot be None, forecast_horizon must be positive)
- Type checking for model registration
- Graceful fallback to default model for unknown site types

## Testing

The forecasting engine includes comprehensive unit tests:

```bash
# Run all forecasting engine tests
python manage.py test forecasting.test_forecast_engine

# Run specific test class
python manage.py test forecasting.test_forecast_engine.RandomForecastModelTest
```

## Integration with Forecast Service

The forecasting engine is designed to be used by the forecast service (Task 7) for generating portfolio forecasts:

```python
from forecasting.forecast_engine import model_registry

def generate_portfolio_forecast(portfolio):
    results = []
    for site in portfolio.sites.all():
        model = model_registry.get_model(site.site_type)
        predictions = model.predict(site, forecast_horizon=24)
        results.extend(predictions)
    return results
```

## Future Extensions

The modular design allows for easy integration of:

- Weather-based forecasting models
- Machine learning models
- Historical data analysis
- Real-time model switching
- Model performance tracking
- A/B testing of different models

## Requirements Satisfied

This implementation satisfies the following requirements:

- **6.1**: Pluggable model architecture for different site types ✓
- **6.2**: Random number generator as default forecasting model ✓  
- **6.3**: Easy integration of new models without modifying core logic ✓
- **6.4**: Model selection based on site type and configuration ✓
- **6.5**: Fallback to default model when no specific model is configured ✓