"""
Unit tests for the ForecastService class.

Tests forecast service functionality including job creation, processing,
status tracking, and error handling.
"""

import uuid
from datetime import datetime, timedelta
from decimal import Decimal
from unittest.mock import Mock, patch, MagicMock

from django.test import TestCase
from django.utils import timezone
from django.db import transaction

from .models import Site, Portfolio, ForecastJob, ForecastResult
from .services import (
    ForecastService,
    ForecastServiceError,
    PortfolioNotFoundError,
    EmptyPortfolioError,
    JobNotFoundError
)
from .forecast_engine import RandomForecastModel, ForecastPoint


class ForecastServiceTest(TestCase):
    """Test the ForecastService class."""
    
    def setUp(self):
        """Set up test fixtures."""
        # Create test sites
        self.solar_site = Site.objects.create(
            name="Test Solar Site",
            site_type="solar",
            latitude=Decimal('40.7128'),
            longitude=Decimal('-74.0060'),
            capacity_mw=Decimal('50.0')
        )
        
        self.wind_site = Site.objects.create(
            name="Test Wind Site",
            site_type="wind",
            latitude=Decimal('41.8781'),
            longitude=Decimal('-87.6298'),
            capacity_mw=Decimal('100.0')
        )
        
        # Create test portfolios
        self.portfolio_with_sites = Portfolio.objects.create(
            name="Test Portfolio",
            description="Portfolio with sites for testing"
        )
        self.portfolio_with_sites.sites.add(self.solar_site, self.wind_site)
        
        self.empty_portfolio = Portfolio.objects.create(
            name="Empty Portfolio",
            description="Portfolio without sites"
        )
        
        # Create forecast service
        self.service = ForecastService(forecast_horizon=6)  # Short horizon for testing
    
    def test_service_initialization(self):
        """Test ForecastService initialization."""
        # Test with default horizon
        service1 = ForecastService()
        self.assertEqual(service1.forecast_horizon, 24)
        
        # Test with custom horizon
        service2 = ForecastService(forecast_horizon=12)
        self.assertEqual(service2.forecast_horizon, 12)
    
    def test_trigger_portfolio_forecast_success(self):
        """Test successful portfolio forecast triggering."""
        job = self.service.trigger_portfolio_forecast(self.portfolio_with_sites.id)
        
        # Check job was created
        self.assertIsInstance(job, ForecastJob)
        self.assertEqual(job.portfolio, self.portfolio_with_sites)
        self.assertEqual(job.status, 'completed')  # Should be completed after processing
        self.assertIsNotNone(job.completed_at)
        
        # Check results were created
        results = ForecastResult.objects.filter(job=job)
        expected_results = 2 * 6  # 2 sites * 6 hours
        self.assertEqual(results.count(), expected_results)
        
        # Check results for each site
        solar_results = results.filter(site=self.solar_site)
        wind_results = results.filter(site=self.wind_site)
        
        self.assertEqual(solar_results.count(), 6)
        self.assertEqual(wind_results.count(), 6)
        
        # Verify result data structure
        for result in results:
            self.assertIsInstance(result.predicted_generation_mwh, Decimal)
            self.assertGreaterEqual(result.predicted_generation_mwh, Decimal('0'))
            self.assertIsNotNone(result.forecast_datetime)
            self.assertIsNotNone(result.confidence_interval_lower)
            self.assertIsNotNone(result.confidence_interval_upper)
    
    def test_trigger_portfolio_forecast_custom_horizon(self):
        """Test portfolio forecast with custom horizon."""
        custom_horizon = 12
        job = self.service.trigger_portfolio_forecast(
            self.portfolio_with_sites.id, 
            forecast_horizon=custom_horizon
        )
        
        # Check correct number of results
        results = ForecastResult.objects.filter(job=job)
        expected_results = 2 * custom_horizon  # 2 sites * 12 hours
        self.assertEqual(results.count(), expected_results)
    
    def test_trigger_portfolio_forecast_nonexistent_portfolio(self):
        """Test triggering forecast for non-existent portfolio."""
        with self.assertRaises(PortfolioNotFoundError):
            self.service.trigger_portfolio_forecast(99999)
    
    def test_trigger_portfolio_forecast_empty_portfolio(self):
        """Test triggering forecast for empty portfolio."""
        with self.assertRaises(ForecastServiceError):
            self.service.trigger_portfolio_forecast(self.empty_portfolio.id)
    
    @patch('forecasting.services.model_registry.get_model')
    def test_trigger_portfolio_forecast_model_error(self, mock_get_model):
        """Test handling of model errors during forecast processing."""
        # Mock model to raise an exception
        mock_model = Mock()
        mock_model.predict.side_effect = Exception("Model error")
        mock_get_model.return_value = mock_model
        
        with self.assertRaises(ForecastServiceError):
            self.service.trigger_portfolio_forecast(self.portfolio_with_sites.id)
        
        # Check that job was marked as failed
        job = ForecastJob.objects.filter(portfolio=self.portfolio_with_sites).first()
        self.assertIsNotNone(job)
        self.assertEqual(job.status, 'failed')
        self.assertIsNotNone(job.error_message)
        self.assertIn("Model error", job.error_message)
    
    def test_get_forecast_status_success(self):
        """Test getting forecast job status."""
        # Create a completed job
        job = self.service.trigger_portfolio_forecast(self.portfolio_with_sites.id)
        
        status = self.service.get_forecast_status(job.id)
        
        # Check status structure
        expected_keys = [
            'job_id', 'portfolio_id', 'portfolio_name', 'status',
            'created_at', 'completed_at', 'error_message', 'is_complete',
            'is_successful', 'result_count', 'site_count', 'expected_results',
            'results_complete'
        ]
        
        for key in expected_keys:
            self.assertIn(key, status)
        
        # Check status values
        self.assertEqual(status['job_id'], str(job.id))
        self.assertEqual(status['portfolio_id'], self.portfolio_with_sites.id)
        self.assertEqual(status['portfolio_name'], self.portfolio_with_sites.name)
        self.assertEqual(status['status'], 'completed')
        self.assertTrue(status['is_complete'])
        self.assertTrue(status['is_successful'])
        self.assertEqual(status['site_count'], 2)
        self.assertEqual(status['result_count'], 12)  # 2 sites * 6 hours
        self.assertEqual(status['expected_results'], 12)
        self.assertTrue(status['results_complete'])
    
    def test_get_forecast_status_nonexistent_job(self):
        """Test getting status for non-existent job."""
        fake_job_id = uuid.uuid4()
        
        with self.assertRaises(JobNotFoundError):
            self.service.get_forecast_status(fake_job_id)
    
    def test_get_portfolio_forecast_results_success(self):
        """Test getting portfolio forecast results."""
        # Create forecast job and results
        job = self.service.trigger_portfolio_forecast(self.portfolio_with_sites.id)
        
        results = self.service.get_portfolio_forecast_results(self.portfolio_with_sites.id)
        
        # Check result structure
        expected_keys = [
            'job_id', 'portfolio_id', 'portfolio_name', 'forecast_generated_at',
            'site_count', 'total_capacity_mw', 'site_forecasts', 'portfolio_totals'
        ]
        
        for key in expected_keys:
            self.assertIn(key, results)
        
        # Check values
        self.assertEqual(results['job_id'], str(job.id))
        self.assertEqual(results['portfolio_id'], self.portfolio_with_sites.id)
        self.assertEqual(results['portfolio_name'], self.portfolio_with_sites.name)
        self.assertEqual(results['site_count'], 2)
        self.assertEqual(results['total_capacity_mw'], 150.0)  # 50 + 100
        
        # Check site forecasts
        self.assertEqual(len(results['site_forecasts']), 2)
        
        for site_forecast in results['site_forecasts']:
            self.assertIn('site_id', site_forecast)
            self.assertIn('site_name', site_forecast)
            self.assertIn('site_type', site_forecast)
            self.assertIn('capacity_mw', site_forecast)
            self.assertIn('forecasts', site_forecast)
            self.assertEqual(len(site_forecast['forecasts']), 6)  # 6 hour horizon
        
        # Check portfolio totals
        self.assertEqual(len(results['portfolio_totals']), 6)  # 6 hour horizon
        
        for total in results['portfolio_totals']:
            self.assertIn('datetime', total)
            self.assertIn('total_predicted_mwh', total)
            self.assertIn('total_confidence_lower', total)
            self.assertIn('total_confidence_upper', total)
    
    def test_get_portfolio_forecast_results_specific_job(self):
        """Test getting results for a specific job ID."""
        # Create two jobs
        job1 = self.service.trigger_portfolio_forecast(self.portfolio_with_sites.id)
        job2 = self.service.trigger_portfolio_forecast(self.portfolio_with_sites.id)
        
        # Get results for specific job
        results = self.service.get_portfolio_forecast_results(
            self.portfolio_with_sites.id, 
            job_id=job1.id
        )
        
        self.assertEqual(results['job_id'], str(job1.id))
    
    def test_get_portfolio_forecast_results_nonexistent_portfolio(self):
        """Test getting results for non-existent portfolio."""
        with self.assertRaises(PortfolioNotFoundError):
            self.service.get_portfolio_forecast_results(99999)
    
    def test_get_portfolio_forecast_results_no_jobs(self):
        """Test getting results when no forecast jobs exist."""
        with self.assertRaises(JobNotFoundError):
            self.service.get_portfolio_forecast_results(self.portfolio_with_sites.id)
    
    def test_get_site_forecast_results_success(self):
        """Test getting forecast results for a specific site."""
        # Create forecast job
        job = self.service.trigger_portfolio_forecast(self.portfolio_with_sites.id)
        
        results = self.service.get_site_forecast_results(self.solar_site.id)
        
        # Check result structure
        expected_keys = [
            'site_id', 'site_name', 'site_type', 'capacity_mw',
            'forecast_count', 'forecasts'
        ]
        
        for key in expected_keys:
            self.assertIn(key, results)
        
        # Check values
        self.assertEqual(results['site_id'], self.solar_site.id)
        self.assertEqual(results['site_name'], self.solar_site.name)
        self.assertEqual(results['site_type'], self.solar_site.site_type)
        self.assertEqual(results['capacity_mw'], 50.0)
        self.assertEqual(results['forecast_count'], 6)
        self.assertEqual(len(results['forecasts']), 6)
        
        # Check forecast data structure
        for forecast in results['forecasts']:
            self.assertIn('datetime', forecast)
            self.assertIn('predicted_generation_mwh', forecast)
            self.assertIn('confidence_interval_lower', forecast)
            self.assertIn('confidence_interval_upper', forecast)
    
    def test_get_site_forecast_results_nonexistent_site(self):
        """Test getting results for non-existent site."""
        with self.assertRaises(Site.DoesNotExist):
            self.service.get_site_forecast_results(99999)
    
    def test_get_site_forecast_results_no_jobs(self):
        """Test getting site results when no forecast jobs exist."""
        with self.assertRaises(JobNotFoundError):
            self.service.get_site_forecast_results(self.solar_site.id)
    
    def test_cancel_forecast_job_success(self):
        """Test cancelling a forecast job."""
        # Create a job but don't process it (mock the processing)
        with patch.object(self.service, '_process_forecast_job'):
            job = ForecastJob.objects.create(
                portfolio=self.portfolio_with_sites,
                status='pending',
                forecast_horizon=24
            )
        
        # Cancel the job
        result = self.service.cancel_forecast_job(job.id)
        
        self.assertTrue(result)
        
        # Check job was marked as failed
        job.refresh_from_db()
        self.assertEqual(job.status, 'failed')
        self.assertIsNotNone(job.completed_at)
        self.assertEqual(job.error_message, 'Job cancelled by user')
    
    def test_cancel_forecast_job_already_completed(self):
        """Test cancelling an already completed job."""
        job = self.service.trigger_portfolio_forecast(self.portfolio_with_sites.id)
        
        # Try to cancel completed job
        result = self.service.cancel_forecast_job(job.id)
        
        self.assertFalse(result)
        
        # Job should still be completed
        job.refresh_from_db()
        self.assertEqual(job.status, 'completed')
    
    def test_cancel_forecast_job_nonexistent(self):
        """Test cancelling non-existent job."""
        fake_job_id = uuid.uuid4()
        
        with self.assertRaises(JobNotFoundError):
            self.service.cancel_forecast_job(fake_job_id)
    
    def test_cleanup_old_jobs(self):
        """Test cleaning up old forecast jobs."""
        # Create some old jobs
        old_time = timezone.now() - timedelta(days=35)
        
        with patch('django.utils.timezone.now', return_value=old_time):
            old_job1 = self.service.trigger_portfolio_forecast(self.portfolio_with_sites.id)
            old_job2 = self.service.trigger_portfolio_forecast(self.portfolio_with_sites.id)
        
        # Create a recent job
        recent_job = self.service.trigger_portfolio_forecast(self.portfolio_with_sites.id)
        
        # Cleanup jobs older than 30 days
        cleaned_count = self.service.cleanup_old_jobs(days_old=30)
        
        self.assertEqual(cleaned_count, 2)
        
        # Check that old jobs are gone
        self.assertFalse(ForecastJob.objects.filter(id=old_job1.id).exists())
        self.assertFalse(ForecastJob.objects.filter(id=old_job2.id).exists())
        
        # Check that recent job still exists
        self.assertTrue(ForecastJob.objects.filter(id=recent_job.id).exists())
    
    def test_process_forecast_job_error_handling(self):
        """Test error handling in forecast job processing."""
        # Create a job
        job = ForecastJob.objects.create(
            portfolio=self.portfolio_with_sites,
            status='pending',
            forecast_horizon=6
        )
        
        # Mock model to raise an exception
        with patch('forecasting.services.model_registry.get_model') as mock_get_model:
            mock_model = Mock()
            mock_model.predict.side_effect = Exception("Prediction failed")
            mock_get_model.return_value = mock_model
            
            with self.assertRaises(ForecastServiceError):
                self.service._process_forecast_job(job, 6)
        
        # Check job was marked as failed
        job.refresh_from_db()
        self.assertEqual(job.status, 'failed')
        self.assertIsNotNone(job.completed_at)
        self.assertIn("Prediction failed", job.error_message)
    
    def test_process_forecast_job_empty_portfolio(self):
        """Test processing job for empty portfolio."""
        job = ForecastJob.objects.create(
            portfolio=self.empty_portfolio,
            status='pending',
            forecast_horizon=6
        )
        
        with self.assertRaises(ForecastServiceError):
            self.service._process_forecast_job(job, 6)
        
        # Check job was marked as failed
        job.refresh_from_db()
        self.assertEqual(job.status, 'failed')
        self.assertIn("Portfolio has no sites", job.error_message)


class ForecastServiceIntegrationTest(TestCase):
    """Integration tests for ForecastService with real models."""
    
    def setUp(self):
        """Set up integration test fixtures."""
        # Create multiple sites of different types
        self.sites = []
        
        for i in range(3):
            solar_site = Site.objects.create(
                name=f"Solar Site {i+1}",
                site_type="solar",
                latitude=Decimal(f'40.{i}'),
                longitude=Decimal(f'-74.{i}'),
                capacity_mw=Decimal(f'{(i+1)*10}.0')
            )
            self.sites.append(solar_site)
            
            wind_site = Site.objects.create(
                name=f"Wind Site {i+1}",
                site_type="wind",
                latitude=Decimal(f'41.{i}'),
                longitude=Decimal(f'-75.{i}'),
                capacity_mw=Decimal(f'{(i+1)*20}.0')
            )
            self.sites.append(wind_site)
        
        # Create portfolio with all sites
        self.large_portfolio = Portfolio.objects.create(
            name="Large Test Portfolio",
            description="Portfolio with multiple sites for integration testing"
        )
        
        for site in self.sites:
            self.large_portfolio.sites.add(site)
        
        self.service = ForecastService(forecast_horizon=12)
    
    def test_full_forecast_workflow(self):
        """Test complete forecast workflow from trigger to results."""
        # Step 1: Trigger forecast
        job = self.service.trigger_portfolio_forecast(self.large_portfolio.id)
        
        # Step 2: Check job status
        status = self.service.get_forecast_status(job.id)
        self.assertEqual(status['status'], 'completed')
        self.assertTrue(status['is_successful'])
        self.assertEqual(status['site_count'], 6)  # 3 solar + 3 wind
        
        # Step 3: Get portfolio results
        portfolio_results = self.service.get_portfolio_forecast_results(self.large_portfolio.id)
        self.assertEqual(portfolio_results['site_count'], 6)
        self.assertEqual(len(portfolio_results['site_forecasts']), 6)
        self.assertEqual(len(portfolio_results['portfolio_totals']), 12)  # 12 hour horizon
        
        # Step 4: Get individual site results
        for site in self.sites:
            site_results = self.service.get_site_forecast_results(site.id)
            self.assertEqual(site_results['site_id'], site.id)
            self.assertEqual(site_results['forecast_count'], 12)
        
        # Step 5: Verify data consistency
        total_capacity = sum(float(site.capacity_mw or 0) for site in self.sites)
        self.assertEqual(portfolio_results['total_capacity_mw'], total_capacity)
        
        # Verify that portfolio totals equal sum of individual site forecasts
        for i, total in enumerate(portfolio_results['portfolio_totals']):
            expected_total = 0
            for site_forecast in portfolio_results['site_forecasts']:
                expected_total += site_forecast['forecasts'][i]['predicted_generation_mwh']
            
            self.assertAlmostEqual(
                total['total_predicted_mwh'], 
                expected_total, 
                places=3
            )
    
    def test_multiple_jobs_same_portfolio(self):
        """Test handling multiple forecast jobs for the same portfolio."""
        # Create multiple jobs
        job1 = self.service.trigger_portfolio_forecast(self.large_portfolio.id)
        job2 = self.service.trigger_portfolio_forecast(self.large_portfolio.id)
        job3 = self.service.trigger_portfolio_forecast(self.large_portfolio.id)
        
        # All jobs should be successful
        for job in [job1, job2, job3]:
            status = self.service.get_forecast_status(job.id)
            self.assertEqual(status['status'], 'completed')
        
        # Getting results without job_id should return latest job
        results_latest = self.service.get_portfolio_forecast_results(self.large_portfolio.id)
        self.assertEqual(results_latest['job_id'], str(job3.id))
        
        # Getting results with specific job_id should return that job
        results_specific = self.service.get_portfolio_forecast_results(
            self.large_portfolio.id, 
            job_id=job1.id
        )
        self.assertEqual(results_specific['job_id'], str(job1.id))
    
    def test_forecast_data_quality(self):
        """Test the quality and consistency of forecast data."""
        job = self.service.trigger_portfolio_forecast(self.large_portfolio.id)
        
        # Get all results
        results = ForecastResult.objects.filter(job=job)
        
        # Check data quality
        for result in results:
            # All predictions should be non-negative
            self.assertGreaterEqual(result.predicted_generation_mwh, Decimal('0'))
            
            # Confidence intervals should be valid
            if result.confidence_interval_lower and result.confidence_interval_upper:
                self.assertLessEqual(
                    result.confidence_interval_lower, 
                    result.predicted_generation_mwh
                )
                self.assertGreaterEqual(
                    result.confidence_interval_upper, 
                    result.predicted_generation_mwh
                )
            
            # Forecast datetime should be reasonable (within a day of job creation)
            time_diff = abs((result.forecast_datetime - job.created_at).total_seconds())
            self.assertLess(time_diff, 24 * 3600)  # Within 24 hours
        
        # Check that we have results for all sites and all time periods
        site_count = self.large_portfolio.sites.count()
        expected_results = site_count * 12  # 12 hour horizon
        self.assertEqual(results.count(), expected_results)
        
        # Check that each site has the correct number of results
        for site in self.large_portfolio.sites.all():
            site_results = results.filter(site=site)
            self.assertEqual(site_results.count(), 12)
            
            # Check that forecast times are sequential
            forecast_times = list(site_results.values_list('forecast_datetime', flat=True))
            forecast_times.sort()
            
            for i in range(1, len(forecast_times)):
                time_diff = forecast_times[i] - forecast_times[i-1]
                self.assertEqual(time_diff, timedelta(hours=1))