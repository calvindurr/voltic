"""
API tests for forecast endpoints.

Tests the REST API endpoints for forecast operations.
"""

import json
from decimal import Decimal
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status

from .models import Site, Portfolio, ForecastJob


class ForecastAPITest(TestCase):
    """Test forecast API endpoints."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.client = APIClient()
        
        # Create test sites
        self.solar_site = Site.objects.create(
            name="API Test Solar Site",
            site_type="solar",
            latitude=Decimal('40.7128'),
            longitude=Decimal('-74.0060'),
            capacity_mw=Decimal('50.0')
        )
        
        self.wind_site = Site.objects.create(
            name="API Test Wind Site",
            site_type="wind",
            latitude=Decimal('41.8781'),
            longitude=Decimal('-87.6298'),
            capacity_mw=Decimal('100.0')
        )
        
        # Create test portfolio
        self.portfolio = Portfolio.objects.create(
            name="API Test Portfolio",
            description="Portfolio for API testing"
        )
        self.portfolio.sites.add(self.solar_site, self.wind_site)
        
        # Create empty portfolio
        self.empty_portfolio = Portfolio.objects.create(
            name="Empty API Portfolio",
            description="Empty portfolio for testing"
        )
    
    def test_trigger_portfolio_forecast_success(self):
        """Test successful portfolio forecast triggering via API."""
        url = f'/api/forecasts/portfolio/{self.portfolio.id}/trigger/'
        
        response = self.client.post(url, {})
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        data = response.json()
        self.assertIn('job_id', data)
        self.assertIn('portfolio_id', data)
        self.assertIn('portfolio_name', data)
        self.assertIn('status', data)
        self.assertIn('created_at', data)
        self.assertIn('message', data)
        
        self.assertEqual(data['portfolio_id'], self.portfolio.id)
        self.assertEqual(data['portfolio_name'], self.portfolio.name)
    
    def test_trigger_portfolio_forecast_with_horizon(self):
        """Test triggering forecast with custom horizon."""
        url = f'/api/forecasts/portfolio/{self.portfolio.id}/trigger/'
        
        response = self.client.post(url, {'forecast_horizon': 12})
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify job was created with correct number of results
        data = response.json()
        job_id = data['job_id']
        
        job = ForecastJob.objects.get(id=job_id)
        results_count = job.results.count()
        expected_count = 2 * 12  # 2 sites * 12 hours
        self.assertEqual(results_count, expected_count)
    
    def test_trigger_portfolio_forecast_invalid_horizon(self):
        """Test triggering forecast with invalid horizon."""
        url = f'/api/forecasts/portfolio/{self.portfolio.id}/trigger/'
        
        # Test negative horizon
        response = self.client.post(url, {'forecast_horizon': -1})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Test zero horizon
        response = self.client.post(url, {'forecast_horizon': 0})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Test non-integer horizon
        response = self.client.post(url, {'forecast_horizon': 'invalid'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_trigger_portfolio_forecast_nonexistent_portfolio(self):
        """Test triggering forecast for non-existent portfolio."""
        url = '/api/forecasts/portfolio/99999/trigger/'
        
        response = self.client.post(url, {})
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        data = response.json()
        self.assertIn('error', data)
        self.assertEqual(data['error'], 'Portfolio not found')
    
    def test_trigger_portfolio_forecast_empty_portfolio(self):
        """Test triggering forecast for empty portfolio."""
        url = f'/api/forecasts/portfolio/{self.empty_portfolio.id}/trigger/'
        
        response = self.client.post(url, {})
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        data = response.json()
        self.assertIn('error', data)
        self.assertEqual(data['error'], 'Empty portfolio')
    
    def test_get_job_status_success(self):
        """Test getting job status via API."""
        # First create a job
        trigger_url = f'/api/forecasts/portfolio/{self.portfolio.id}/trigger/'
        trigger_response = self.client.post(trigger_url, {})
        job_id = trigger_response.json()['job_id']
        
        # Get job status
        status_url = f'/api/forecasts/jobs/{job_id}/status/'
        response = self.client.get(status_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.json()
        expected_keys = [
            'job_id', 'portfolio_id', 'portfolio_name', 'status',
            'created_at', 'completed_at', 'error_message', 'is_complete',
            'is_successful'
        ]
        
        for key in expected_keys:
            self.assertIn(key, data)
        
        self.assertEqual(data['job_id'], job_id)
        self.assertEqual(data['portfolio_id'], self.portfolio.id)
    
    def test_get_job_status_invalid_job_id(self):
        """Test getting status for invalid job ID."""
        url = '/api/forecasts/jobs/invalid-uuid/status/'
        
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        data = response.json()
        self.assertIn('error', data)
        self.assertEqual(data['error'], 'Invalid job ID format')
    
    def test_get_job_status_nonexistent_job(self):
        """Test getting status for non-existent job."""
        import uuid
        fake_job_id = str(uuid.uuid4())
        url = f'/api/forecasts/jobs/{fake_job_id}/status/'
        
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        data = response.json()
        self.assertIn('error', data)
        self.assertEqual(data['error'], 'Job not found')
    
    def test_get_portfolio_results_success(self):
        """Test getting portfolio forecast results via API."""
        # First create a job
        trigger_url = f'/api/forecasts/portfolio/{self.portfolio.id}/trigger/'
        trigger_response = self.client.post(trigger_url, {})
        
        # Get portfolio results
        results_url = f'/api/forecasts/portfolio/{self.portfolio.id}/results/'
        response = self.client.get(results_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.json()
        expected_keys = [
            'job_id', 'portfolio_id', 'portfolio_name', 'forecast_generated_at',
            'site_count', 'total_capacity_mw', 'site_forecasts', 'portfolio_totals'
        ]
        
        for key in expected_keys:
            self.assertIn(key, data)
        
        self.assertEqual(data['portfolio_id'], self.portfolio.id)
        self.assertEqual(data['site_count'], 2)
        self.assertEqual(data['total_capacity_mw'], 150.0)  # 50 + 100
        self.assertEqual(len(data['site_forecasts']), 2)
    
    def test_get_portfolio_results_with_job_id(self):
        """Test getting portfolio results for specific job ID."""
        # Create two jobs
        trigger_url = f'/api/forecasts/portfolio/{self.portfolio.id}/trigger/'
        
        response1 = self.client.post(trigger_url, {})
        job_id1 = response1.json()['job_id']
        
        response2 = self.client.post(trigger_url, {})
        job_id2 = response2.json()['job_id']
        
        # Get results for specific job
        results_url = f'/api/forecasts/portfolio/{self.portfolio.id}/results/?job_id={job_id1}'
        response = self.client.get(results_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.json()
        self.assertEqual(data['job_id'], job_id1)
    
    def test_get_portfolio_results_no_jobs(self):
        """Test getting results when no jobs exist."""
        url = f'/api/forecasts/portfolio/{self.portfolio.id}/results/'
        
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        data = response.json()
        self.assertIn('error', data)
        self.assertEqual(data['error'], 'No forecast results found')
    
    def test_get_site_results_success(self):
        """Test getting site forecast results via API."""
        # First create a job
        trigger_url = f'/api/forecasts/portfolio/{self.portfolio.id}/trigger/'
        self.client.post(trigger_url, {})
        
        # Get site results
        results_url = f'/api/forecasts/site/{self.solar_site.id}/results/'
        response = self.client.get(results_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.json()
        expected_keys = [
            'site_id', 'site_name', 'site_type', 'capacity_mw',
            'forecast_count', 'forecasts'
        ]
        
        for key in expected_keys:
            self.assertIn(key, data)
        
        self.assertEqual(data['site_id'], self.solar_site.id)
        self.assertEqual(data['site_name'], self.solar_site.name)
        self.assertEqual(data['site_type'], self.solar_site.site_type)
        self.assertEqual(data['capacity_mw'], 50.0)
    
    def test_get_site_results_nonexistent_site(self):
        """Test getting results for non-existent site."""
        url = '/api/forecasts/site/99999/results/'
        
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        data = response.json()
        self.assertIn('error', data)
        self.assertEqual(data['error'], 'Site not found')
    
    def test_cancel_job_success(self):
        """Test cancelling a forecast job via API."""
        # Create a job but don't let it complete by mocking the service
        from unittest.mock import patch
        
        with patch('forecasting.views.ForecastService.trigger_portfolio_forecast') as mock_trigger:
            # Create a pending job
            job = ForecastJob.objects.create(
                portfolio=self.portfolio,
                status='pending',
                forecast_horizon=24
            )
            mock_trigger.return_value = job
            
            # Cancel the job
            cancel_url = f'/api/forecasts/jobs/{job.id}/cancel/'
            response = self.client.post(cancel_url, {})
            
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            
            data = response.json()
            self.assertIn('message', data)
            self.assertIn('cancelled', data['message'])
    
    def test_cancel_job_invalid_id(self):
        """Test cancelling job with invalid ID."""
        url = '/api/forecasts/jobs/invalid-uuid/cancel/'
        
        response = self.client.post(url, {})
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        data = response.json()
        self.assertIn('error', data)
        self.assertEqual(data['error'], 'Invalid job ID format')
    
    def test_api_error_handling(self):
        """Test API error handling for various scenarios."""
        # Test invalid portfolio ID format
        url = '/api/forecasts/portfolio/invalid/trigger/'
        response = self.client.post(url, {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Test invalid site ID format
        url = '/api/forecasts/site/invalid/results/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Test invalid job ID in query parameter
        url = f'/api/forecasts/portfolio/{self.portfolio.id}/results/?job_id=invalid'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)