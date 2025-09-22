#!/usr/bin/env python
"""
Example usage of the ForecastService.

This script demonstrates how to use the forecast service to create
portfolios, trigger forecasts, and retrieve results.
"""

import os
import sys
import django
from decimal import Decimal

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'renewable_forecasting.settings')
django.setup()

from forecasting.models import Site, Portfolio
from forecasting.services import ForecastService


def main():
    """Demonstrate forecast service usage."""
    print("=== Renewable Energy Forecasting Service Demo ===\n")
    
    # Initialize the forecast service
    service = ForecastService(forecast_horizon=12)  # 12-hour forecasts
    
    # Step 1: Create some example sites
    print("1. Creating renewable energy sites...")
    
    # Create solar sites
    solar_site1 = Site.objects.create(
        name="California Solar Farm",
        site_type="solar",
        latitude=Decimal('36.7783'),
        longitude=Decimal('-119.4179'),
        capacity_mw=Decimal('100.0')
    )
    
    solar_site2 = Site.objects.create(
        name="Arizona Solar Plant",
        site_type="solar",
        latitude=Decimal('33.4484'),
        longitude=Decimal('-112.0740'),
        capacity_mw=Decimal('150.0')
    )
    
    # Create wind sites
    wind_site1 = Site.objects.create(
        name="Texas Wind Farm",
        site_type="wind",
        latitude=Decimal('32.7767'),
        longitude=Decimal('-96.7970'),
        capacity_mw=Decimal('200.0')
    )
    
    wind_site2 = Site.objects.create(
        name="Kansas Wind Plant",
        site_type="wind",
        latitude=Decimal('39.0119'),
        longitude=Decimal('-98.4842'),
        capacity_mw=Decimal('175.0')
    )
    
    print(f"   ✓ Created {Site.objects.count()} sites:")
    for site in Site.objects.all():
        print(f"     - {site.name}: {site.capacity_mw}MW {site.site_type}")
    
    # Step 2: Create portfolios
    print("\n2. Creating portfolios...")
    
    # Solar portfolio
    solar_portfolio = Portfolio.objects.create(
        name="Solar Portfolio",
        description="Portfolio of solar energy sites"
    )
    solar_portfolio.sites.add(solar_site1, solar_site2)
    
    # Wind portfolio
    wind_portfolio = Portfolio.objects.create(
        name="Wind Portfolio", 
        description="Portfolio of wind energy sites"
    )
    wind_portfolio.sites.add(wind_site1, wind_site2)
    
    # Mixed portfolio
    mixed_portfolio = Portfolio.objects.create(
        name="Mixed Renewable Portfolio",
        description="Portfolio with both solar and wind sites"
    )
    mixed_portfolio.sites.add(solar_site1, wind_site1)
    
    print(f"   ✓ Created {Portfolio.objects.count()} portfolios:")
    for portfolio in Portfolio.objects.all():
        print(f"     - {portfolio.name}: {portfolio.get_site_count()} sites, "
              f"{portfolio.get_total_capacity()}MW total capacity")
    
    # Step 3: Trigger forecasts
    print("\n3. Triggering forecasts...")
    
    jobs = []
    
    # Forecast for solar portfolio (6 hours)
    print("   Triggering 6-hour forecast for Solar Portfolio...")
    job1 = service.trigger_portfolio_forecast(solar_portfolio.id, forecast_horizon=6)
    jobs.append(('Solar Portfolio (6h)', job1))
    
    # Forecast for wind portfolio (12 hours)
    print("   Triggering 12-hour forecast for Wind Portfolio...")
    job2 = service.trigger_portfolio_forecast(wind_portfolio.id, forecast_horizon=12)
    jobs.append(('Wind Portfolio (12h)', job2))
    
    # Forecast for mixed portfolio (24 hours)
    print("   Triggering 24-hour forecast for Mixed Portfolio...")
    job3 = service.trigger_portfolio_forecast(mixed_portfolio.id, forecast_horizon=24)
    jobs.append(('Mixed Portfolio (24h)', job3))
    
    print(f"   ✓ Created {len(jobs)} forecast jobs")
    
    # Step 4: Check job statuses
    print("\n4. Checking job statuses...")
    
    for job_name, job in jobs:
        status = service.get_forecast_status(job.id)
        print(f"   {job_name}:")
        print(f"     - Status: {status['status']}")
        print(f"     - Job ID: {status['job_id']}")
        print(f"     - Sites: {status['site_count']}")
        if status['is_successful']:
            print(f"     - Results: {status['result_count']}/{status['expected_results']}")
            print(f"     - Horizon: {status['forecast_horizon']} hours")
    
    # Step 5: Get detailed results
    print("\n5. Retrieving forecast results...")
    
    # Get results for mixed portfolio (most interesting)
    print("   Mixed Portfolio forecast results:")
    results = service.get_portfolio_forecast_results(mixed_portfolio.id)
    
    print(f"     - Portfolio: {results['portfolio_name']}")
    print(f"     - Total capacity: {results['total_capacity_mw']}MW")
    print(f"     - Forecast generated: {results['forecast_generated_at']}")
    print(f"     - Sites forecasted: {results['site_count']}")
    
    # Show first few hours of portfolio totals
    print("     - First 6 hours of portfolio totals:")
    for i, total in enumerate(results['portfolio_totals'][:6]):
        dt = total['datetime']
        predicted = total['total_predicted_mwh']
        print(f"       Hour {i+1} ({dt.strftime('%H:%M')}): {predicted:.2f} MWh")
    
    # Show individual site forecasts for first hour
    print("     - Individual site forecasts for first hour:")
    for site_forecast in results['site_forecasts']:
        site_name = site_forecast['site_name']
        first_hour = site_forecast['forecasts'][0]
        predicted = first_hour['predicted_generation_mwh']
        confidence_lower = first_hour['confidence_interval_lower']
        confidence_upper = first_hour['confidence_interval_upper']
        
        print(f"       {site_name}: {predicted:.2f} MWh "
              f"(confidence: {confidence_lower:.2f} - {confidence_upper:.2f})")
    
    # Step 6: Get individual site results
    print("\n6. Individual site forecast example...")
    
    site_results = service.get_site_forecast_results(solar_site1.id)
    print(f"   {site_results['site_name']} ({site_results['site_type']}):")
    print(f"     - Capacity: {site_results['capacity_mw']}MW")
    print(f"     - Forecast points: {site_results['forecast_count']}")
    
    # Show first 3 forecast points
    print("     - First 3 forecast points:")
    for i, forecast in enumerate(site_results['forecasts'][:3]):
        dt = forecast['datetime']
        predicted = forecast['predicted_generation_mwh']
        print(f"       {i+1}. {dt.strftime('%Y-%m-%d %H:%M')}: {predicted:.2f} MWh")
    
    # Step 7: Demonstrate cleanup
    print("\n7. Cleanup capabilities...")
    
    # Show cleanup function (but don't actually clean up recent jobs)
    print("   Cleanup function available for old jobs:")
    print(f"   - service.cleanup_old_jobs(days_old=30)")
    print("   - This would remove jobs older than 30 days")
    
    # Show cancellation capability
    print("   Job cancellation available for pending/running jobs:")
    print(f"   - service.cancel_forecast_job(job_id)")
    
    print("\n=== Demo Complete ===")
    print(f"Successfully demonstrated forecast service with:")
    print(f"  - {Site.objects.count()} renewable energy sites")
    print(f"  - {Portfolio.objects.count()} portfolios")
    print(f"  - {len(jobs)} forecast jobs")
    print(f"  - Multiple forecast horizons (6, 12, 24 hours)")
    print(f"  - Portfolio and individual site result retrieval")


if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print(f"Error running demo: {e}")
        sys.exit(1)