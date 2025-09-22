"""
Forecasting app for renewable energy generation prediction.

This app provides models, APIs, and forecasting capabilities for
renewable energy sites and portfolios.
"""

# Make key forecasting engine components easily importable
from .forecast_engine import (
    ForecastModel,
    RandomForecastModel, 
    ModelRegistry,
    ForecastPoint,
    model_registry
)

__all__ = [
    'ForecastModel',
    'RandomForecastModel',
    'ModelRegistry', 
    'ForecastPoint',
    'model_registry'
]