"""
Django management command to demonstrate forecast service functionality.
"""

from decimal import Decimal
from django.core.management.base import BaseCommand

from forecasting.models import Site, Portfolio
from forecasting.services import ForecastService


class Command(BaseCommand):
    help = 'Demonstrate the forecast service functionality'
    
    def handle(self, *args, **options):
        """Run the forecast service demonstration."""
        self.stdout.write("=== Renewable Energy Forecasting Service Demo ===\n")
        
        # Clear existing data for clean demo
        Site.objects.all().delete()
        Portfolio.objects.all().delete()
        
        # Initialize the forecast service
        service = ForecastService(forecast_horizon=12)
        
        # Step 1: Create example sites
        self.stdout.write("1. Creating renewable energy sites...")
        
        solar_site = Site.objects.create(
            name="Demo Solar Farm",
            site_type="solar",
            latitude=Decimal('36.7783'),
            longitude=Decimal('-119.4179'),
            capacity_mw=Decimal('100.0')
        )
        
        wind_site = Site.objects.create(
            name="Demo Wind Farm",
            site_type="wind",
            latitude=Decimal('32.7767'),
            longitude=Decimal('-96.7970'),
            capacity_mw=Decimal('150.0')
        )
        
        self.stdout.write(f"   ✓ Created {Site.objects.count()} sites:")
        for site in Site.objects.all():
            self.stdout.write(f"     - {site.name}: {site.capacity_mw}MW {site.site_type}")
        
        # Step 2: Create portfolio
        self.stdout.write("\n2. Creating portfolio...")
        
        portfolio = Portfolio.objects.create(
            name="Demo Portfolio",
            description="Portfolio for demonstration"
        )
        portfolio.sites.add(solar_site, wind_site)
        
        self.stdout.write(f"   ✓ Created portfolio: {portfolio.name}")
        self.stdout.write(f"     - Sites: {portfolio.get_site_count()}")
        self.stdout.write(f"     - Total capacity: {portfolio.get_total_capacity()}MW")
        
        # Step 3: Trigger forecast
        self.stdout.write("\n3. Triggering forecast...")
        
        job = service.trigger_portfolio_forecast(portfolio.id, forecast_horizon=6)
        
        self.stdout.write(f"   ✓ Created forecast job: {job.id}")
        
        # Step 4: Check job status
        self.stdout.write("\n4. Checking job status...")
        
        status = service.get_forecast_status(job.id)
        self.stdout.write(f"   Status: {status['status']}")
        self.stdout.write(f"   Sites: {status['site_count']}")
        self.stdout.write(f"   Results: {status['result_count']}/{status['expected_results']}")
        self.stdout.write(f"   Horizon: {status['forecast_horizon']} hours")
        
        # Step 5: Get results
        self.stdout.write("\n5. Retrieving forecast results...")
        
        results = service.get_portfolio_forecast_results(portfolio.id)
        
        self.stdout.write(f"   Portfolio: {results['portfolio_name']}")
        self.stdout.write(f"   Total capacity: {results['total_capacity_mw']}MW")
        self.stdout.write(f"   Sites forecasted: {results['site_count']}")
        
        # Show first 3 hours of totals
        self.stdout.write("   First 3 hours of portfolio totals:")
        for i, total in enumerate(results['portfolio_totals'][:3]):
            dt = total['datetime']
            predicted = total['total_predicted_mwh']
            self.stdout.write(f"     Hour {i+1} ({dt.strftime('%H:%M')}): {predicted:.2f} MWh")
        
        # Show individual site forecasts for first hour
        self.stdout.write("   Individual site forecasts for first hour:")
        for site_forecast in results['site_forecasts']:
            site_name = site_forecast['site_name']
            first_hour = site_forecast['forecasts'][0]
            predicted = first_hour['predicted_generation_mwh']
            
            self.stdout.write(f"     {site_name}: {predicted:.2f} MWh")
        
        self.stdout.write("\n=== Demo Complete ===")
        self.stdout.write(self.style.SUCCESS("Forecast service demonstration completed successfully!"))