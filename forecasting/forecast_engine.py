"""
Modular forecasting engine for renewable energy generation prediction.

This module provides a pluggable architecture for different forecasting models
that can be easily integrated for different site types.
"""

import random
from abc import ABC, abstractmethod
from datetime import datetime, timedelta
from decimal import Decimal
from typing import List, NamedTuple, Optional
try:
    from django.utils import timezone
except ImportError:
    # Fallback for testing without Django
    import datetime
    class timezone:
        @staticmethod
        def now():
            return datetime.datetime.now()


class ForecastPoint(NamedTuple):
    """Represents a single forecast data point."""
    datetime: datetime
    predicted_generation_mwh: Decimal
    confidence_interval_lower: Optional[Decimal] = None
    confidence_interval_upper: Optional[Decimal] = None


class ForecastModel(ABC):
    """Abstract base class for all forecasting models."""
    
    @abstractmethod
    def predict(self, site, forecast_horizon: int = 24) -> List[ForecastPoint]:
        """
        Generate forecast predictions for a given site.
        
        Args:
            site: Site model instance to forecast for
            forecast_horizon: Number of hours to forecast (default: 24)
            
        Returns:
            List of ForecastPoint objects containing predictions
        """
        pass
    
    @abstractmethod
    def get_model_name(self) -> str:
        """Return the name/version of this forecasting model."""
        pass
    
    def get_model_description(self) -> str:
        """Return a description of this forecasting model."""
        return f"Forecasting model: {self.get_model_name()}"


class RandomForecastModel(ForecastModel):
    """
    MVP implementation using random number generation for forecasts.
    
    This model generates realistic random forecasts based on site type and capacity,
    with appropriate diurnal patterns for solar and seasonal variations.
    """
    
    def __init__(self, seed: Optional[int] = None):
        """
        Initialize the random forecast model.
        
        Args:
            seed: Optional seed for reproducible random generation
        """
        self._random = random.Random(seed)
    
    def predict(self, site, forecast_horizon: int = 24) -> List[ForecastPoint]:
        """
        Generate random forecast predictions with realistic patterns.
        
        Args:
            site: Site model instance to forecast for
            forecast_horizon: Number of hours to forecast (default: 24)
            
        Returns:
            List of ForecastPoint objects with random but realistic predictions
        """
        if not site:
            raise ValueError("Site cannot be None")
        
        if forecast_horizon <= 0:
            raise ValueError("Forecast horizon must be positive")
        
        # Get base capacity for the site
        base_capacity = site.capacity_mw or Decimal('10.0')  # Default 10MW if not specified
        
        # Generate forecast points
        forecast_points = []
        start_time = timezone.now().replace(minute=0, second=0, microsecond=0)
        
        for hour in range(forecast_horizon):
            forecast_datetime = start_time + timedelta(hours=hour)
            
            # Generate prediction based on site type
            if site.site_type == 'solar':
                predicted_mwh = self._generate_solar_prediction(
                    base_capacity, forecast_datetime, hour
                )
            elif site.site_type == 'wind':
                predicted_mwh = self._generate_wind_prediction(
                    base_capacity, forecast_datetime, hour
                )
            else:
                # Fallback for unknown site types
                predicted_mwh = self._generate_generic_prediction(base_capacity)
            
            # Generate confidence intervals (±20% of prediction)
            confidence_range = predicted_mwh * Decimal('0.2')
            lower_bound = max(Decimal('0.0'), predicted_mwh - confidence_range)
            upper_bound = predicted_mwh + confidence_range
            
            forecast_points.append(ForecastPoint(
                datetime=forecast_datetime,
                predicted_generation_mwh=predicted_mwh,
                confidence_interval_lower=lower_bound,
                confidence_interval_upper=upper_bound
            ))
        
        return forecast_points
    
    def _generate_solar_prediction(self, base_capacity: Decimal, 
                                 forecast_datetime: datetime, hour: int) -> Decimal:
        """Generate solar-specific prediction with diurnal pattern."""
        # Solar generation follows a bell curve during daylight hours
        hour_of_day = forecast_datetime.hour
        
        # No generation during night hours (roughly 6 PM to 6 AM)
        if hour_of_day < 6 or hour_of_day > 18:
            return Decimal('0.0')
        
        # Peak generation around noon (12 PM)
        # Use a simplified sine wave for diurnal pattern
        import math
        
        # Normalize hour to 0-12 range for daylight hours
        daylight_hour = hour_of_day - 6  # 0-12 range
        
        # Generate base pattern (0 to 1)
        base_pattern = math.sin(math.pi * daylight_hour / 12)
        
        # Add some randomness (±30%)
        random_factor = 1 + (self._random.random() - 0.5) * 0.6
        
        # Calculate generation (assume capacity factor of ~25% on average)
        generation = base_capacity * Decimal(str(base_pattern)) * Decimal('0.25') * Decimal(str(random_factor))
        
        return max(Decimal('0.0'), generation.quantize(Decimal('0.001')))
    
    def _generate_wind_prediction(self, base_capacity: Decimal, 
                                forecast_datetime: datetime, hour: int) -> Decimal:
        """Generate wind-specific prediction with more variable pattern."""
        # Wind generation is more variable and can occur at any time
        
        # Base capacity factor for wind (typically 25-35%)
        base_factor = Decimal('0.30')
        
        # Add significant randomness for wind variability (±50%)
        random_factor = 1 + (self._random.random() - 0.5) * 1.0
        
        # Slight seasonal adjustment (higher in winter months)
        month = forecast_datetime.month
        seasonal_factor = 1.2 if month in [11, 12, 1, 2, 3] else 1.0
        
        generation = (base_capacity * base_factor * 
                     Decimal(str(random_factor)) * 
                     Decimal(str(seasonal_factor)))
        
        return max(Decimal('0.0'), generation.quantize(Decimal('0.001')))
    
    def _generate_generic_prediction(self, base_capacity: Decimal) -> Decimal:
        """Generate generic prediction for unknown site types."""
        # Simple random generation with 20% average capacity factor
        random_factor = self._random.random()
        generation = base_capacity * Decimal('0.20') * Decimal(str(random_factor))
        
        return max(Decimal('0.0'), generation.quantize(Decimal('0.001')))
    
    def get_model_name(self) -> str:
        """Return the name of this model."""
        return "Random Generator v1.0"
    
    def get_model_description(self) -> str:
        """Return a description of this model."""
        return ("Random forecast model that generates realistic predictions "
                "with site-type specific patterns for MVP testing purposes.")


class ModelRegistry:
    """
    Registry for managing different forecast models by site type.
    
    This allows for easy integration of new forecasting models without
    modifying core system logic.
    """
    
    def __init__(self):
        """Initialize the model registry with default models."""
        self._models = {}
        self._default_model = RandomForecastModel()
        
        # Register default random model for all site types
        self.register_model('solar', RandomForecastModel())
        self.register_model('wind', RandomForecastModel())
    
    def register_model(self, site_type: str, model: ForecastModel) -> None:
        """
        Register a forecasting model for a specific site type.
        
        Args:
            site_type: The site type this model handles ('solar', 'wind', etc.)
            model: The ForecastModel instance to register
        """
        if not isinstance(model, ForecastModel):
            raise TypeError("Model must be an instance of ForecastModel")
        
        self._models[site_type.lower()] = model
    
    def get_model(self, site_type: str) -> ForecastModel:
        """
        Get the appropriate forecasting model for a site type.
        
        Args:
            site_type: The site type to get a model for
            
        Returns:
            ForecastModel instance for the site type, or default model if none registered
        """
        return self._models.get(site_type.lower(), self._default_model)
    
    def get_registered_site_types(self) -> List[str]:
        """Get a list of all registered site types."""
        return list(self._models.keys())
    
    def unregister_model(self, site_type: str) -> bool:
        """
        Unregister a model for a specific site type.
        
        Args:
            site_type: The site type to unregister
            
        Returns:
            True if model was unregistered, False if it wasn't registered
        """
        if site_type.lower() in self._models:
            del self._models[site_type.lower()]
            return True
        return False
    
    def set_default_model(self, model: ForecastModel) -> None:
        """
        Set the default model used when no specific model is registered.
        
        Args:
            model: The ForecastModel instance to use as default
        """
        if not isinstance(model, ForecastModel):
            raise TypeError("Model must be an instance of ForecastModel")
        
        self._default_model = model


# Global model registry instance
model_registry = ModelRegistry()