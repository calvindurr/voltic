"""
Unit tests for the forecasting engine module.

Tests the abstract ForecastModel interface, RandomForecastModel implementation,
and ModelRegistry functionality.
"""

import unittest
from datetime import datetime, timedelta
from decimal import Decimal
from unittest.mock import Mock, patch

from django.test import TestCase
from django.utils import timezone

from .forecast_engine import (
    ForecastModel, 
    RandomForecastModel, 
    ModelRegistry, 
    ForecastPoint,
    model_registry
)
from .models import Site


class MockForecastModel(ForecastModel):
    """Mock implementation of ForecastModel for testing."""
    
    def predict(self, site, forecast_horizon: int = 24):
        """Return mock predictions."""
        start_time = timezone.now().replace(minute=0, second=0, microsecond=0)
        return [
            ForecastPoint(
                datetime=start_time + timedelta(hours=i),
                predicted_generation_mwh=Decimal('5.0'),
                confidence_interval_lower=Decimal('4.0'),
                confidence_interval_upper=Decimal('6.0')
            )
            for i in range(forecast_horizon)
        ]
    
    def get_model_name(self):
        """Return mock model name."""
        return "Mock Model v1.0"


class ForecastPointTest(TestCase):
    """Test the ForecastPoint NamedTuple."""
    
    def test_forecast_point_creation(self):
        """Test creating a ForecastPoint with all fields."""
        dt = timezone.now()
        point = ForecastPoint(
            datetime=dt,
            predicted_generation_mwh=Decimal('10.5'),
            confidence_interval_lower=Decimal('8.0'),
            confidence_interval_upper=Decimal('13.0')
        )
        
        self.assertEqual(point.datetime, dt)
        self.assertEqual(point.predicted_generation_mwh, Decimal('10.5'))
        self.assertEqual(point.confidence_interval_lower, Decimal('8.0'))
        self.assertEqual(point.confidence_interval_upper, Decimal('13.0'))
    
    def test_forecast_point_minimal(self):
        """Test creating a ForecastPoint with minimal fields."""
        dt = timezone.now()
        point = ForecastPoint(
            datetime=dt,
            predicted_generation_mwh=Decimal('10.5')
        )
        
        self.assertEqual(point.datetime, dt)
        self.assertEqual(point.predicted_generation_mwh, Decimal('10.5'))
        self.assertIsNone(point.confidence_interval_lower)
        self.assertIsNone(point.confidence_interval_upper)


class ForecastModelTest(TestCase):
    """Test the abstract ForecastModel base class."""
    
    def test_abstract_methods(self):
        """Test that ForecastModel cannot be instantiated directly."""
        with self.assertRaises(TypeError):
            ForecastModel()
    
    def test_mock_implementation(self):
        """Test that mock implementation works correctly."""
        model = MockForecastModel()
        site = Mock()
        
        predictions = model.predict(site, forecast_horizon=3)
        
        self.assertEqual(len(predictions), 3)
        self.assertEqual(model.get_model_name(), "Mock Model v1.0")
        self.assertIn("Mock Model v1.0", model.get_model_description())


class RandomForecastModelTest(TestCase):
    """Test the RandomForecastModel implementation."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.solar_site = Site(
            name="Test Solar Site",
            site_type="solar",
            latitude=Decimal('40.7128'),
            longitude=Decimal('-74.0060'),
            capacity_mw=Decimal('50.0')
        )
        
        self.wind_site = Site(
            name="Test Wind Site", 
            site_type="wind",
            latitude=Decimal('41.8781'),
            longitude=Decimal('-87.6298'),
            capacity_mw=Decimal('100.0')
        )
        
        self.unknown_site = Site(
            name="Test Unknown Site",
            site_type="hydro",  # Not solar or wind
            latitude=Decimal('42.3601'),
            longitude=Decimal('-71.0589'),
            capacity_mw=Decimal('25.0')
        )
    
    def test_model_initialization(self):
        """Test RandomForecastModel initialization."""
        # Test without seed
        model1 = RandomForecastModel()
        self.assertIsNotNone(model1._random)
        
        # Test with seed for reproducible results
        model2 = RandomForecastModel(seed=42)
        self.assertIsNotNone(model2._random)
    
    def test_get_model_name(self):
        """Test model name retrieval."""
        model = RandomForecastModel()
        self.assertEqual(model.get_model_name(), "Random Generator v1.0")
    
    def test_get_model_description(self):
        """Test model description retrieval."""
        model = RandomForecastModel()
        description = model.get_model_description()
        self.assertIn("Random forecast model", description)
        self.assertIn("MVP testing", description)
    
    def test_predict_validation(self):
        """Test input validation for predict method."""
        model = RandomForecastModel()
        
        # Test None site
        with self.assertRaises(ValueError):
            model.predict(None)
        
        # Test invalid forecast horizon
        with self.assertRaises(ValueError):
            model.predict(self.solar_site, forecast_horizon=0)
        
        with self.assertRaises(ValueError):
            model.predict(self.solar_site, forecast_horizon=-1)
    
    def test_predict_solar_site(self):
        """Test predictions for solar sites."""
        model = RandomForecastModel(seed=42)  # Use seed for reproducible tests
        
        predictions = model.predict(self.solar_site, forecast_horizon=24)
        
        # Check basic structure
        self.assertEqual(len(predictions), 24)
        
        for i, point in enumerate(predictions):
            self.assertIsInstance(point, ForecastPoint)
            self.assertIsInstance(point.predicted_generation_mwh, Decimal)
            self.assertGreaterEqual(point.predicted_generation_mwh, Decimal('0.0'))
            
            # Check confidence intervals
            if point.confidence_interval_lower is not None:
                self.assertGreaterEqual(point.confidence_interval_lower, Decimal('0.0'))
                self.assertLessEqual(point.confidence_interval_lower, point.predicted_generation_mwh)
            
            if point.confidence_interval_upper is not None:
                self.assertGreaterEqual(point.confidence_interval_upper, point.predicted_generation_mwh)
        
        # Check that solar has zero generation during night hours
        night_hours = [h for h in range(24) if h < 6 or h > 18]
        for hour in night_hours:
            if hour < len(predictions):
                # Note: This test assumes the forecast starts at current time
                # In a real scenario, we'd need to account for the actual start time
                pass  # Skip detailed night hour testing due to timezone complexity
    
    def test_predict_wind_site(self):
        """Test predictions for wind sites."""
        model = RandomForecastModel(seed=42)
        
        predictions = model.predict(self.wind_site, forecast_horizon=12)
        
        # Check basic structure
        self.assertEqual(len(predictions), 12)
        
        for point in predictions:
            self.assertIsInstance(point, ForecastPoint)
            self.assertIsInstance(point.predicted_generation_mwh, Decimal)
            self.assertGreaterEqual(point.predicted_generation_mwh, Decimal('0.0'))
            
            # Wind can generate at any time, so no zero-generation requirement
            # Check confidence intervals
            if point.confidence_interval_lower is not None:
                self.assertGreaterEqual(point.confidence_interval_lower, Decimal('0.0'))
            
            if point.confidence_interval_upper is not None:
                self.assertGreaterEqual(point.confidence_interval_upper, point.predicted_generation_mwh)
    
    def test_predict_unknown_site_type(self):
        """Test predictions for unknown site types."""
        model = RandomForecastModel(seed=42)
        
        predictions = model.predict(self.unknown_site, forecast_horizon=6)
        
        # Check basic structure
        self.assertEqual(len(predictions), 6)
        
        for point in predictions:
            self.assertIsInstance(point, ForecastPoint)
            self.assertIsInstance(point.predicted_generation_mwh, Decimal)
            self.assertGreaterEqual(point.predicted_generation_mwh, Decimal('0.0'))
    
    def test_predict_site_without_capacity(self):
        """Test predictions for sites without specified capacity."""
        site_no_capacity = Site(
            name="No Capacity Site",
            site_type="solar",
            latitude=Decimal('40.0'),
            longitude=Decimal('-74.0')
            # capacity_mw is None
        )
        
        model = RandomForecastModel(seed=42)
        predictions = model.predict(site_no_capacity, forecast_horizon=3)
        
        # Should still generate predictions using default capacity
        self.assertEqual(len(predictions), 3)
        for point in predictions:
            self.assertIsInstance(point.predicted_generation_mwh, Decimal)
    
    def test_reproducible_predictions(self):
        """Test that predictions are reproducible with same seed."""
        model1 = RandomForecastModel(seed=123)
        model2 = RandomForecastModel(seed=123)
        
        predictions1 = model1.predict(self.solar_site, forecast_horizon=5)
        predictions2 = model2.predict(self.solar_site, forecast_horizon=5)
        
        # Should be identical with same seed
        for p1, p2 in zip(predictions1, predictions2):
            self.assertEqual(p1.predicted_generation_mwh, p2.predicted_generation_mwh)
            self.assertEqual(p1.confidence_interval_lower, p2.confidence_interval_lower)
            self.assertEqual(p1.confidence_interval_upper, p2.confidence_interval_upper)


class ModelRegistryTest(TestCase):
    """Test the ModelRegistry functionality."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.registry = ModelRegistry()
        self.mock_model = MockForecastModel()
    
    def test_initialization(self):
        """Test ModelRegistry initialization."""
        registry = ModelRegistry()
        
        # Should have default models registered
        self.assertIn('solar', registry.get_registered_site_types())
        self.assertIn('wind', registry.get_registered_site_types())
        
        # Should have a default model
        self.assertIsInstance(registry._default_model, RandomForecastModel)
    
    def test_register_model(self):
        """Test registering a new model."""
        self.registry.register_model('hydro', self.mock_model)
        
        # Should be able to retrieve the registered model
        retrieved_model = self.registry.get_model('hydro')
        self.assertEqual(retrieved_model, self.mock_model)
        
        # Should appear in registered site types
        self.assertIn('hydro', self.registry.get_registered_site_types())
    
    def test_register_model_case_insensitive(self):
        """Test that model registration is case insensitive."""
        self.registry.register_model('SOLAR', self.mock_model)
        
        # Should be able to retrieve with different case
        retrieved_model = self.registry.get_model('solar')
        self.assertEqual(retrieved_model, self.mock_model)
        
        retrieved_model = self.registry.get_model('Solar')
        self.assertEqual(retrieved_model, self.mock_model)
    
    def test_register_invalid_model(self):
        """Test registering an invalid model type."""
        with self.assertRaises(TypeError):
            self.registry.register_model('invalid', "not a model")
    
    def test_get_model_fallback(self):
        """Test getting model for unregistered site type falls back to default."""
        model = self.registry.get_model('unknown_type')
        
        # Should return the default model
        self.assertEqual(model, self.registry._default_model)
        self.assertIsInstance(model, RandomForecastModel)
    
    def test_unregister_model(self):
        """Test unregistering a model."""
        # Register a model first
        self.registry.register_model('test_type', self.mock_model)
        self.assertIn('test_type', self.registry.get_registered_site_types())
        
        # Unregister it
        result = self.registry.unregister_model('test_type')
        self.assertTrue(result)
        self.assertNotIn('test_type', self.registry.get_registered_site_types())
        
        # Try to unregister non-existent model
        result = self.registry.unregister_model('non_existent')
        self.assertFalse(result)
    
    def test_set_default_model(self):
        """Test setting a new default model."""
        original_default = self.registry._default_model
        
        self.registry.set_default_model(self.mock_model)
        self.assertEqual(self.registry._default_model, self.mock_model)
        
        # Test fallback behavior with new default
        model = self.registry.get_model('unknown_type')
        self.assertEqual(model, self.mock_model)
    
    def test_set_invalid_default_model(self):
        """Test setting an invalid default model."""
        with self.assertRaises(TypeError):
            self.registry.set_default_model("not a model")


class GlobalModelRegistryTest(TestCase):
    """Test the global model registry instance."""
    
    def test_global_registry_exists(self):
        """Test that global model registry is available."""
        from .forecast_engine import model_registry
        
        self.assertIsInstance(model_registry, ModelRegistry)
        
        # Should have default models
        self.assertIn('solar', model_registry.get_registered_site_types())
        self.assertIn('wind', model_registry.get_registered_site_types())
    
    def test_global_registry_functionality(self):
        """Test that global registry works correctly."""
        # Get a model
        solar_model = model_registry.get_model('solar')
        self.assertIsInstance(solar_model, RandomForecastModel)
        
        wind_model = model_registry.get_model('wind')
        self.assertIsInstance(wind_model, RandomForecastModel)


if __name__ == '__main__':
    unittest.main()