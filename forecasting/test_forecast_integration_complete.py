"""
Complete integration test for the forecast service and API.

Tests the entire workflow from creating sites and portfolios through
triggering forecasts and retrieving results.
"""

import json
from decimal import Decimal
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

from .models import Site, Portfolio, ForecastJob, ForecastResult


class CompleteForecastIntegrationTest(TestCase):
    """Test complete forecast workflow integration."""
    
    def setUp(self):
        """Set up test client."""
        self.client = APIClient()
    
    def test_complete_forecast_workflow(self):
        """Test the complete workflow from site creation to forecast results."""
        
        # Step 1: Create sites via API
        solar_site_data = {
            'name': 'Integration Solar Site',
            'site_type': 'solar',
            'latitude': '40.7128',
            'longitude': '-74.0060',
            'capacity_mw': '75.5'
        }
        
        wind_site_data = {
            'name': 'Integration Wind Site',
            'site_type': 'wind',
            'latitude': '41.8781',
            'longitude': '-87.6298',
            'capacity_mw': '120.0'
        }
        
        # Create solar site
        response = self.client.post('/api/sites/', solar_site_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        solar_site_id = response.json()['id']
        
        # Create wind site
        response = self.client.post('/api/sites/', wind_site_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        wind_site_id = response.json()['id']
        
        # Step 2: Create portfolio via API
        portfolio_data = {
            'name': 'Integration Test Portfolio',
            'description': 'Portfolio for complete integration testing'
        }
        
        response = self.client.post('/api/portfolios/', portfolio_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        portfolio_id = response.json()['id']
        
        # Step 3: Add sites to portfolio
        response = self.client.post(
            f'/api/portfolios/{portfolio_id}/add_site/',
            {'site_id': solar_site_id}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        response = self.client.post(
            f'/api/portfolios/{portfolio_id}/add_site/',
            {'site_id': wind_site_id}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Step 4: Verify portfolio has sites
        response = self.client.get(f'/api/portfolios/{portfolio_id}/sites/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        sites_in_portfolio = response.json()
        self.assertEqual(len(sites_in_portfolio), 2)
        
        # Step 5: Trigger forecast with custom horizon
        forecast_data = {'forecast_horizon': 8}
        response = self.client.post(
            f'/api/forecasts/portfolio/{portfolio_id}/trigger/',
            forecast_data
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        job_data = response.json()
        job_id = job_data['job_id']
        self.assertEqual(job_data['portfolio_id'], portfolio_id)
        self.assertIn('message', job_data)
        
        # Step 6: Check job status
        response = self.client.get(f'/api/forecasts/jobs/{job_id}/status/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        status_data = response.json()
        self.assertEqual(status_data['job_id'], job_id)
        self.assertEqual(status_data['portfolio_id'], portfolio_id)
        self.assertEqual(status_data['status'], 'completed')
        self.assertTrue(status_data['is_successful'])
        self.assertEqual(status_data['site_count'], 2)
        self.assertEqual(status_data['expected_results'], 16)  # 2 sites * 8 hours
        self.assertEqual(status_data['result_count'], 16)
        
        # Step 7: Get portfolio forecast results
        response = self.client.get(f'/api/forecasts/portfolio/{portfolio_id}/results/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        portfolio_results = response.json()
        self.assertEqual(portfolio_results['job_id'], job_id)
        self.assertEqual(portfolio_results['portfolio_id'], portfolio_id)
        self.assertEqual(portfolio_results['site_count'], 2)
        self.assertEqual(portfolio_results['total_capacity_mw'], 195.5)  # 75.5 + 120.0
        
        # Verify site forecasts structure
        site_forecasts = portfolio_results['site_forecasts']
        self.assertEqual(len(site_forecasts), 2)
        
        for site_forecast in site_forecasts:
            self.assertIn('site_id', site_forecast)
            self.assertIn('site_name', site_forecast)
            self.assertIn('site_type', site_forecast)
            self.assertIn('capacity_mw', site_forecast)
            self.assertIn('forecasts', site_forecast)
            self.assertEqual(len(site_forecast['forecasts']), 8)  # 8 hour horizon
            
            # Verify forecast data structure
            for forecast in site_forecast['forecasts']:
                self.assertIn('datetime', forecast)
                self.assertIn('predicted_generation_mwh', forecast)
                self.assertIn('confidence_interval_lower', forecast)
                self.assertIn('confidence_interval_upper', forecast)
                
                # Verify data types and ranges
                self.assertIsInstance(forecast['predicted_generation_mwh'], float)
                self.assertGreaterEqual(forecast['predicted_generation_mwh'], 0.0)
                self.assertGreaterEqual(forecast['confidence_interval_lower'], 0.0)
                self.assertGreaterEqual(forecast['confidence_interval_upper'], forecast['predicted_generation_mwh'])
        
        # Verify portfolio totals
        portfolio_totals = portfolio_results['portfolio_totals']
        self.assertEqual(len(portfolio_totals), 8)  # 8 hour horizon
        
        for total in portfolio_totals:
            self.assertIn('datetime', total)
            self.assertIn('total_predicted_mwh', total)
            self.assertIn('total_confidence_lower', total)
            self.assertIn('total_confidence_upper', total)
            
            self.assertGreaterEqual(total['total_predicted_mwh'], 0.0)
            self.assertGreaterEqual(total['total_confidence_lower'], 0.0)
            self.assertGreaterEqual(total['total_confidence_upper'], total['total_predicted_mwh'])
        
        # Step 8: Get individual site results
        response = self.client.get(f'/api/forecasts/site/{solar_site_id}/results/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        solar_results = response.json()
        self.assertEqual(solar_results['site_id'], solar_site_id)
        self.assertEqual(solar_results['site_name'], 'Integration Solar Site')
        self.assertEqual(solar_results['site_type'], 'solar')
        self.assertEqual(solar_results['capacity_mw'], 75.5)
        self.assertEqual(solar_results['forecast_count'], 8)
        
        response = self.client.get(f'/api/forecasts/site/{wind_site_id}/results/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        wind_results = response.json()
        self.assertEqual(wind_results['site_id'], wind_site_id)
        self.assertEqual(wind_results['site_name'], 'Integration Wind Site')
        self.assertEqual(wind_results['site_type'], 'wind')
        self.assertEqual(wind_results['capacity_mw'], 120.0)
        self.assertEqual(wind_results['forecast_count'], 8)
        
        # Step 9: Verify data consistency between portfolio and site results
        # The sum of individual site forecasts should equal portfolio totals
        for i in range(8):
            solar_prediction = solar_results['forecasts'][i]['predicted_generation_mwh']
            wind_prediction = wind_results['forecasts'][i]['predicted_generation_mwh']
            expected_total = solar_prediction + wind_prediction
            
            actual_total = portfolio_totals[i]['total_predicted_mwh']
            
            self.assertAlmostEqual(expected_total, actual_total, places=3)
        
        # Step 10: Verify database state
        # Check that all expected records were created
        self.assertEqual(Site.objects.count(), 2)
        self.assertEqual(Portfolio.objects.count(), 1)
        self.assertEqual(ForecastJob.objects.count(), 1)
        self.assertEqual(ForecastResult.objects.count(), 16)  # 2 sites * 8 hours
        
        # Verify job record
        job = ForecastJob.objects.get(id=job_id)
        self.assertEqual(job.status, 'completed')
        self.assertIsNotNone(job.completed_at)
        self.assertEqual(job.error_message, '')
        
        # Verify results are properly linked
        results = ForecastResult.objects.filter(job=job)
        solar_results_count = results.filter(site_id=solar_site_id).count()
        wind_results_count = results.filter(site_id=wind_site_id).count()
        
        self.assertEqual(solar_results_count, 8)
        self.assertEqual(wind_results_count, 8)
        
        print("✓ Complete forecast workflow integration test passed!")
        print(f"  - Created 2 sites and 1 portfolio")
        print(f"  - Generated forecast job {job_id}")
        print(f"  - Created {results.count()} forecast results")
        print(f"  - Verified API endpoints and data consistency")
    
    def test_multiple_forecast_jobs_workflow(self):
        """Test workflow with multiple forecast jobs for the same portfolio."""
        
        # Create a site and portfolio
        site = Site.objects.create(
            name='Multi-Job Test Site',
            site_type='solar',
            latitude=Decimal('40.0'),
            longitude=Decimal('-74.0'),
            capacity_mw=Decimal('50.0')
        )
        
        portfolio = Portfolio.objects.create(
            name='Multi-Job Portfolio',
            description='Portfolio for testing multiple jobs'
        )
        portfolio.sites.add(site)
        
        # Trigger multiple forecasts with different horizons
        job_ids = []
        horizons = [6, 12, 24]
        
        for horizon in horizons:
            response = self.client.post(
                f'/api/forecasts/portfolio/{portfolio.id}/trigger/',
                {'forecast_horizon': horizon}
            )
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
            job_ids.append(response.json()['job_id'])
        
        # Verify all jobs completed successfully
        for job_id in job_ids:
            response = self.client.get(f'/api/forecasts/jobs/{job_id}/status/')
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            
            status_data = response.json()
            self.assertEqual(status_data['status'], 'completed')
            self.assertTrue(status_data['is_successful'])
        
        # Verify getting results without job_id returns latest job
        response = self.client.get(f'/api/forecasts/portfolio/{portfolio.id}/results/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        latest_results = response.json()
        self.assertEqual(latest_results['job_id'], job_ids[-1])  # Should be the last job
        
        # Verify getting results with specific job_id works
        for i, job_id in enumerate(job_ids):
            response = self.client.get(
                f'/api/forecasts/portfolio/{portfolio.id}/results/?job_id={job_id}'
            )
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            
            results = response.json()
            self.assertEqual(results['job_id'], job_id)
            
            # Verify correct number of forecasts for each horizon
            expected_forecasts = horizons[i]
            for site_forecast in results['site_forecasts']:
                self.assertEqual(len(site_forecast['forecasts']), expected_forecasts)
        
        print("✓ Multiple forecast jobs workflow test passed!")
        print(f"  - Created {len(job_ids)} jobs with different horizons: {horizons}")
        print(f"  - Verified job-specific result retrieval")
    
    def test_error_scenarios_workflow(self):
        """Test error handling scenarios in the complete workflow."""
        
        # Test triggering forecast for non-existent portfolio
        response = self.client.post('/api/forecasts/portfolio/99999/trigger/', {})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        # Create empty portfolio and test empty portfolio error
        empty_portfolio = Portfolio.objects.create(
            name='Empty Portfolio',
            description='Portfolio with no sites'
        )
        
        response = self.client.post(
            f'/api/forecasts/portfolio/{empty_portfolio.id}/trigger/', 
            {}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        data = response.json()
        self.assertEqual(data['error'], 'Empty portfolio')
        
        # Test getting results when no jobs exist
        response = self.client.get(f'/api/forecasts/portfolio/{empty_portfolio.id}/results/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        # Test getting site results when no jobs exist
        site = Site.objects.create(
            name='Orphan Site',
            site_type='wind',
            latitude=Decimal('42.0'),
            longitude=Decimal('-75.0'),
            capacity_mw=Decimal('30.0')
        )
        
        response = self.client.get(f'/api/forecasts/site/{site.id}/results/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        print("✓ Error scenarios workflow test passed!")
        print(f"  - Verified proper error handling for various scenarios")