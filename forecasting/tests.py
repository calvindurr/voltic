from django.test import TestCase
from django.core.exceptions import ValidationError
from decimal import Decimal
from .models import Site, Portfolio, PortfolioSite, ForecastJob, ForecastResult


class SiteModelTest(TestCase):
    def test_create_valid_site(self):
        """Test creating a valid site."""
        site = Site.objects.create(
            name="Test Solar Farm",
            site_type="solar",
            latitude=Decimal('37.7749'),
            longitude=Decimal('-122.4194'),
            capacity_mw=Decimal('100.50')
        )
        self.assertEqual(site.name, "Test Solar Farm")
        self.assertEqual(site.site_type, "solar")
        self.assertEqual(str(site), "Test Solar Farm (solar)")
    
    def test_site_coordinate_validation(self):
        """Test that site coordinates are validated properly."""
        # Test invalid latitude (too high)
        with self.assertRaises(ValidationError):
            site = Site(
                name="Invalid Site",
                site_type="wind",
                latitude=Decimal('91.0'),  # Invalid: > 90
                longitude=Decimal('0.0')
            )
            site.full_clean()
        
        # Test invalid longitude (too low)
        with self.assertRaises(ValidationError):
            site = Site(
                name="Invalid Site",
                site_type="wind",
                latitude=Decimal('0.0'),
                longitude=Decimal('-181.0')  # Invalid: < -180
            )
            site.full_clean()
    
    def test_unique_coordinates(self):
        """Test that sites cannot have duplicate coordinates."""
        Site.objects.create(
            name="Site 1",
            site_type="solar",
            latitude=Decimal('37.7749'),
            longitude=Decimal('-122.4194')
        )
        
        # Try to create another site with same coordinates
        with self.assertRaises(Exception):  # IntegrityError
            Site.objects.create(
                name="Site 2",
                site_type="wind",
                latitude=Decimal('37.7749'),
                longitude=Decimal('-122.4194')
            )


class PortfolioModelTest(TestCase):
    def setUp(self):
        self.site1 = Site.objects.create(
            name="Solar Farm 1",
            site_type="solar",
            latitude=Decimal('37.7749'),
            longitude=Decimal('-122.4194'),
            capacity_mw=Decimal('100.0')
        )
        self.site2 = Site.objects.create(
            name="Wind Farm 1",
            site_type="wind",
            latitude=Decimal('40.7128'),
            longitude=Decimal('-74.0060'),
            capacity_mw=Decimal('150.0')
        )
    
    def test_create_portfolio(self):
        """Test creating a portfolio."""
        portfolio = Portfolio.objects.create(
            name="Test Portfolio",
            description="A test portfolio"
        )
        self.assertEqual(portfolio.name, "Test Portfolio")
        self.assertEqual(str(portfolio), "Test Portfolio")
    
    def test_portfolio_site_relationship(self):
        """Test adding sites to a portfolio."""
        portfolio = Portfolio.objects.create(name="Test Portfolio")
        
        # Add sites to portfolio
        PortfolioSite.objects.create(portfolio=portfolio, site=self.site1)
        PortfolioSite.objects.create(portfolio=portfolio, site=self.site2)
        
        self.assertEqual(portfolio.get_site_count(), 2)
        self.assertEqual(portfolio.get_total_capacity(), Decimal('250.0'))
    
    def test_unique_portfolio_site(self):
        """Test that a site can't be added to the same portfolio twice."""
        portfolio = Portfolio.objects.create(name="Test Portfolio")
        PortfolioSite.objects.create(portfolio=portfolio, site=self.site1)
        
        # Try to add the same site again
        with self.assertRaises(Exception):  # IntegrityError
            PortfolioSite.objects.create(portfolio=portfolio, site=self.site1)


class ForecastJobModelTest(TestCase):
    def setUp(self):
        self.portfolio = Portfolio.objects.create(name="Test Portfolio")
    
    def test_create_forecast_job(self):
        """Test creating a forecast job."""
        job = ForecastJob.objects.create(portfolio=self.portfolio)
        
        self.assertEqual(job.status, 'pending')
        self.assertEqual(job.portfolio, self.portfolio)
        self.assertTrue(job.id)  # UUID should be generated
        self.assertFalse(job.is_complete())
        self.assertFalse(job.is_successful())
    
    def test_job_status_methods(self):
        """Test job status helper methods."""
        job = ForecastJob.objects.create(portfolio=self.portfolio)
        
        # Test completed job
        job.status = 'completed'
        job.save()
        self.assertTrue(job.is_complete())
        self.assertTrue(job.is_successful())
        
        # Test failed job
        job.status = 'failed'
        job.save()
        self.assertTrue(job.is_complete())
        self.assertFalse(job.is_successful())


class ForecastResultModelTest(TestCase):
    def setUp(self):
        self.site = Site.objects.create(
            name="Test Site",
            site_type="solar",
            latitude=Decimal('37.7749'),
            longitude=Decimal('-122.4194')
        )
        self.portfolio = Portfolio.objects.create(name="Test Portfolio")
        self.job = ForecastJob.objects.create(portfolio=self.portfolio)
    
    def test_create_forecast_result(self):
        """Test creating a forecast result."""
        from django.utils import timezone
        
        result = ForecastResult.objects.create(
            job=self.job,
            site=self.site,
            forecast_datetime=timezone.now(),
            predicted_generation_mwh=Decimal('50.123'),
            confidence_interval_lower=Decimal('45.000'),
            confidence_interval_upper=Decimal('55.000')
        )
        
        self.assertEqual(result.job, self.job)
        self.assertEqual(result.site, self.site)
        self.assertEqual(result.predicted_generation_mwh, Decimal('50.123'))
    
    def test_confidence_interval_validation(self):
        """Test that confidence intervals are validated."""
        from django.utils import timezone
        
        # Test invalid confidence interval (lower > upper)
        with self.assertRaises(ValidationError):
            result = ForecastResult(
                job=self.job,
                site=self.site,
                forecast_datetime=timezone.now(),
                predicted_generation_mwh=Decimal('50.0'),
                confidence_interval_lower=Decimal('60.0'),  # Invalid: > upper
                confidence_interval_upper=Decimal('55.0')
            )
            result.full_clean()

from rest_framework.test import APITestCase
from rest_framework import status
from .serializers import SiteSerializer, PortfolioSerializer


class SiteSerializerTestCase(TestCase):
    """Test cases for Site serializer validation and functionality."""
    
    def setUp(self):
        """Set up test data."""
        self.valid_site_data = {
            'name': 'Test Solar Farm',
            'site_type': 'solar',
            'latitude': Decimal('40.7128'),
            'longitude': Decimal('-74.0060'),
            'capacity_mw': Decimal('100.50')
        }
    
    def test_valid_site_serialization(self):
        """Test serialization of valid site data."""
        serializer = SiteSerializer(data=self.valid_site_data)
        self.assertTrue(serializer.is_valid())
        
        site = serializer.save()
        self.assertEqual(site.name, 'Test Solar Farm')
        self.assertEqual(site.site_type, 'solar')
        self.assertEqual(site.latitude, Decimal('40.7128'))
        self.assertEqual(site.longitude, Decimal('-74.0060'))
        self.assertEqual(site.capacity_mw, Decimal('100.50'))
    
    def test_empty_name_validation(self):
        """Test validation fails for empty site name."""
        data = self.valid_site_data.copy()
        data['name'] = ''
        
        serializer = SiteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)
    
    def test_short_name_validation(self):
        """Test validation fails for too short site name."""
        data = self.valid_site_data.copy()
        data['name'] = 'A'
        
        serializer = SiteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)
    
    def test_invalid_site_type_validation(self):
        """Test validation fails for invalid site type."""
        data = self.valid_site_data.copy()
        data['site_type'] = 'nuclear'
        
        serializer = SiteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('site_type', serializer.errors)
    
    def test_invalid_latitude_validation(self):
        """Test validation fails for invalid latitude."""
        data = self.valid_site_data.copy()
        data['latitude'] = Decimal('91.0')  # Invalid latitude
        
        serializer = SiteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('latitude', serializer.errors)
    
    def test_invalid_longitude_validation(self):
        """Test validation fails for invalid longitude."""
        data = self.valid_site_data.copy()
        data['longitude'] = Decimal('181.0')  # Invalid longitude
        
        serializer = SiteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('longitude', serializer.errors)
    
    def test_negative_capacity_validation(self):
        """Test validation fails for negative capacity."""
        data = self.valid_site_data.copy()
        data['capacity_mw'] = Decimal('-10.0')
        
        serializer = SiteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('capacity_mw', serializer.errors)
    
    def test_duplicate_coordinates_validation(self):
        """Test validation fails for duplicate coordinates."""
        # Create first site
        Site.objects.create(**self.valid_site_data)
        
        # Try to create second site with same coordinates
        data = self.valid_site_data.copy()
        data['name'] = 'Another Site'
        
        serializer = SiteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('non_field_errors', serializer.errors)
    
    def test_optional_capacity_field(self):
        """Test that capacity field is optional."""
        data = self.valid_site_data.copy()
        del data['capacity_mw']
        
        serializer = SiteSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        
        site = serializer.save()
        self.assertIsNone(site.capacity_mw)


class PortfolioSerializerTestCase(TestCase):
    """Test cases for Portfolio serializer validation and functionality."""
    
    def setUp(self):
        """Set up test data."""
        self.site1 = Site.objects.create(
            name='Solar Farm 1',
            site_type='solar',
            latitude=Decimal('40.7128'),
            longitude=Decimal('-74.0060'),
            capacity_mw=Decimal('100.0')
        )
        self.site2 = Site.objects.create(
            name='Wind Farm 1',
            site_type='wind',
            latitude=Decimal('41.8781'),
            longitude=Decimal('-87.6298'),
            capacity_mw=Decimal('150.0')
        )
        
        self.valid_portfolio_data = {
            'name': 'Test Portfolio',
            'description': 'A test portfolio for renewable energy sites',
            'site_ids': [self.site1.id, self.site2.id]
        }
    
    def test_valid_portfolio_serialization(self):
        """Test serialization of valid portfolio data."""
        serializer = PortfolioSerializer(data=self.valid_portfolio_data)
        self.assertTrue(serializer.is_valid())
        
        portfolio = serializer.save()
        self.assertEqual(portfolio.name, 'Test Portfolio')
        self.assertEqual(portfolio.description, 'A test portfolio for renewable energy sites')
        self.assertEqual(portfolio.sites.count(), 2)
        self.assertIn(self.site1, portfolio.sites.all())
        self.assertIn(self.site2, portfolio.sites.all())
    
    def test_empty_name_validation(self):
        """Test validation fails for empty portfolio name."""
        data = self.valid_portfolio_data.copy()
        data['name'] = ''
        
        serializer = PortfolioSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)
    
    def test_short_name_validation(self):
        """Test validation fails for too short portfolio name."""
        data = self.valid_portfolio_data.copy()
        data['name'] = 'A'
        
        serializer = PortfolioSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)
    
    def test_invalid_site_ids_validation(self):
        """Test validation fails for non-existent site IDs."""
        data = self.valid_portfolio_data.copy()
        data['site_ids'] = [999, 1000]  # Non-existent IDs
        
        serializer = PortfolioSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('site_ids', serializer.errors)
    
    def test_duplicate_site_ids_validation(self):
        """Test validation fails for duplicate site IDs."""
        data = self.valid_portfolio_data.copy()
        data['site_ids'] = [self.site1.id, self.site1.id]  # Duplicate ID
        
        serializer = PortfolioSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('site_ids', serializer.errors)
    
    def test_portfolio_without_sites(self):
        """Test creating portfolio without sites."""
        data = {
            'name': 'Empty Portfolio',
            'description': 'Portfolio with no sites'
        }
        
        serializer = PortfolioSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        
        portfolio = serializer.save()
        self.assertEqual(portfolio.sites.count(), 0)
    
    def test_portfolio_update_with_site_changes(self):
        """Test updating portfolio with site changes."""
        # Create initial portfolio
        portfolio = Portfolio.objects.create(
            name='Initial Portfolio',
            description='Initial description'
        )
        portfolio.sites.add(self.site1)
        
        # Update with new site configuration
        update_data = {
            'name': 'Updated Portfolio',
            'description': 'Updated description',
            'site_ids': [self.site2.id]  # Replace site1 with site2
        }
        
        serializer = PortfolioSerializer(portfolio, data=update_data)
        self.assertTrue(serializer.is_valid())
        
        updated_portfolio = serializer.save()
        self.assertEqual(updated_portfolio.name, 'Updated Portfolio')
        self.assertEqual(updated_portfolio.sites.count(), 1)
        self.assertIn(self.site2, updated_portfolio.sites.all())
        self.assertNotIn(self.site1, updated_portfolio.sites.all())
    
    def test_total_capacity_calculation(self):
        """Test that total capacity is calculated correctly."""
        serializer = PortfolioSerializer(data=self.valid_portfolio_data)
        self.assertTrue(serializer.is_valid())
        
        portfolio = serializer.save()
        serialized_data = PortfolioSerializer(portfolio).data
        
        expected_capacity = self.site1.capacity_mw + self.site2.capacity_mw
        self.assertEqual(Decimal(str(serialized_data['total_capacity'])), expected_capacity)
    
    def test_site_count_calculation(self):
        """Test that site count is calculated correctly."""
        serializer = PortfolioSerializer(data=self.valid_portfolio_data)
        self.assertTrue(serializer.is_valid())
        
        portfolio = serializer.save()
        serialized_data = PortfolioSerializer(portfolio).data
        
        self.assertEqual(serialized_data['site_count'], 2)


class SiteAPITestCase(APITestCase):
    """Test cases for Site API endpoints."""
    
    def setUp(self):
        """Set up test data."""
        self.site_data = {
            'name': 'API Test Site',
            'site_type': 'solar',
            'latitude': '40.7128',
            'longitude': '-74.0060',
            'capacity_mw': '100.50'
        }
        
        self.site = Site.objects.create(
            name='Existing Site',
            site_type='wind',
            latitude=Decimal('41.8781'),
            longitude=Decimal('-87.6298'),
            capacity_mw=Decimal('150.0')
        )
    
    def test_create_site_api(self):
        """Test creating a site via API."""
        url = '/api/sites/'
        response = self.client.post(url, self.site_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Site.objects.count(), 2)
        
        created_site = Site.objects.get(name='API Test Site')
        self.assertEqual(created_site.site_type, 'solar')
    
    def test_create_site_with_duplicate_coordinates(self):
        """Test creating a site with duplicate coordinates returns 409."""
        url = '/api/sites/'
        duplicate_data = {
            'name': 'Duplicate Site',
            'site_type': 'solar',
            'latitude': str(self.site.latitude),
            'longitude': str(self.site.longitude),
            'capacity_mw': '50.0'
        }
        
        response = self.client.post(url, duplicate_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertIn('error', response.data)
        self.assertIn('Duplicate coordinates', response.data['error'])
    
    def test_create_site_with_close_coordinates(self):
        """Test creating a site too close to existing site returns 409."""
        url = '/api/sites/'
        close_data = {
            'name': 'Close Site',
            'site_type': 'solar',
            'latitude': str(self.site.latitude + Decimal('0.00005')),  # Very close
            'longitude': str(self.site.longitude + Decimal('0.00005')),
            'capacity_mw': '50.0'
        }
        
        response = self.client.post(url, close_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertIn('error', response.data)
        self.assertIn('Site too close to existing site', response.data['error'])
        self.assertIn('conflicting_sites', response.data)
    
    def test_create_site_with_invalid_data(self):
        """Test creating a site with invalid data returns 400."""
        url = '/api/sites/'
        invalid_data = {
            'name': '',  # Empty name
            'site_type': 'invalid_type',
            'latitude': '91.0',  # Invalid latitude
            'longitude': '181.0'  # Invalid longitude
        }
        
        response = self.client.post(url, invalid_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_list_sites_api(self):
        """Test listing sites via API."""
        url = '/api/sites/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Check if response is paginated
        if 'results' in response.data:
            self.assertEqual(len(response.data['results']), 1)
            self.assertEqual(response.data['results'][0]['name'], 'Existing Site')
        else:
            self.assertEqual(len(response.data), 1)
            self.assertEqual(response.data[0]['name'], 'Existing Site')
    
    def test_list_sites_with_invalid_filter(self):
        """Test listing sites with invalid site_type filter returns 400."""
        url = '/api/sites/?site_type=invalid_type'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertIn('Invalid site_type parameter', response.data['error'])
        self.assertIn('valid_types', response.data)
    
    def test_retrieve_site_api(self):
        """Test retrieving a specific site via API."""
        url = f'/api/sites/{self.site.id}/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Existing Site')
        self.assertEqual(response.data['site_type'], 'wind')
    
    def test_retrieve_nonexistent_site(self):
        """Test retrieving a non-existent site returns 404."""
        url = '/api/sites/99999/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn('error', response.data)
        self.assertIn('Site not found', response.data['error'])
    
    def test_update_site_api(self):
        """Test updating a site via API."""
        url = f'/api/sites/{self.site.id}/'
        update_data = {'name': 'Updated Site Name'}
        
        response = self.client.patch(url, update_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        updated_site = Site.objects.get(id=self.site.id)
        self.assertEqual(updated_site.name, 'Updated Site Name')
    
    def test_update_site_with_duplicate_coordinates(self):
        """Test updating a site with coordinates of another site returns 409."""
        # Create another site
        other_site = Site.objects.create(
            name='Other Site',
            site_type='solar',
            latitude=Decimal('42.3601'),
            longitude=Decimal('-71.0589')
        )
        
        url = f'/api/sites/{self.site.id}/'
        update_data = {
            'latitude': str(other_site.latitude),
            'longitude': str(other_site.longitude)
        }
        
        response = self.client.patch(url, update_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertIn('error', response.data)
        self.assertIn('Site too close to existing site', response.data['error'])
    
    def test_update_nonexistent_site(self):
        """Test updating a non-existent site returns 404."""
        url = '/api/sites/99999/'
        update_data = {'name': 'Updated Name'}
        
        response = self.client.patch(url, update_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn('error', response.data)
        self.assertIn('Site not found', response.data['error'])
    
    def test_delete_site_api(self):
        """Test deleting a site via API."""
        url = f'/api/sites/{self.site.id}/'
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Site.objects.count(), 0)
    
    def test_delete_site_in_portfolio(self):
        """Test deleting a site that's in a portfolio returns 409."""
        # Create portfolio and add site
        portfolio = Portfolio.objects.create(name='Test Portfolio')
        portfolio.sites.add(self.site)
        
        url = f'/api/sites/{self.site.id}/'
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertIn('error', response.data)
        self.assertIn('Cannot delete site', response.data['error'])
        self.assertIn('portfolios', response.data)
    
    def test_delete_site_with_forecast_results(self):
        """Test deleting a site with forecast results returns 409."""
        # Create portfolio and forecast job
        portfolio = Portfolio.objects.create(name='Test Portfolio')
        portfolio.sites.add(self.site)
        job = ForecastJob.objects.create(portfolio=portfolio)
        
        # Create forecast result
        from django.utils import timezone
        ForecastResult.objects.create(
            job=job,
            site=self.site,
            forecast_datetime=timezone.now(),
            predicted_generation_mwh=Decimal('50.0')
        )
        
        # Remove site from portfolio first
        portfolio.sites.remove(self.site)
        
        url = f'/api/sites/{self.site.id}/'
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertIn('error', response.data)
        self.assertIn('forecast result', response.data['error'])
        self.assertIn('forecast_results_count', response.data)
    
    def test_delete_nonexistent_site(self):
        """Test deleting a non-existent site returns 404."""
        url = '/api/sites/99999/'
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn('error', response.data)
        self.assertIn('Site not found', response.data['error'])
    
    def test_filter_sites_by_type(self):
        """Test filtering sites by type via API."""
        # Create additional site
        Site.objects.create(
            name='Solar Site',
            site_type='solar',
            latitude=Decimal('42.3601'),
            longitude=Decimal('-71.0589'),
            capacity_mw=Decimal('75.0')
        )
        
        url = '/api/sites/?site_type=solar'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Check if response is paginated
        if 'results' in response.data:
            self.assertEqual(len(response.data['results']), 1)
            self.assertEqual(response.data['results'][0]['site_type'], 'solar')
        else:
            self.assertEqual(len(response.data), 1)
            self.assertEqual(response.data[0]['site_type'], 'solar')
    
    def test_create_site_missing_required_fields(self):
        """Test creating a site with missing required fields returns 400."""
        url = '/api/sites/'
        incomplete_data = {
            'name': 'Incomplete Site'
            # Missing site_type, latitude, longitude
        }
        
        response = self.client.post(url, incomplete_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_create_site_with_invalid_capacity(self):
        """Test creating a site with invalid capacity returns 400."""
        url = '/api/sites/'
        invalid_data = self.site_data.copy()
        invalid_data['capacity_mw'] = '-10.0'  # Negative capacity
        
        response = self.client.post(url, invalid_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class PortfolioAPITestCase(APITestCase):
    """Test cases for Portfolio API endpoints."""
    
    def setUp(self):
        """Set up test data."""
        self.site1 = Site.objects.create(
            name='Solar Farm 1',
            site_type='solar',
            latitude=Decimal('40.7128'),
            longitude=Decimal('-74.0060'),
            capacity_mw=Decimal('100.0')
        )
        self.site2 = Site.objects.create(
            name='Wind Farm 1',
            site_type='wind',
            latitude=Decimal('41.8781'),
            longitude=Decimal('-87.6298'),
            capacity_mw=Decimal('150.0')
        )
        
        self.portfolio_data = {
            'name': 'API Test Portfolio',
            'description': 'Portfolio created via API',
            'site_ids': [self.site1.id, self.site2.id]
        }
        
        self.portfolio = Portfolio.objects.create(
            name='Existing Portfolio',
            description='An existing portfolio'
        )
        self.portfolio.sites.add(self.site1)
    
    def test_create_portfolio_api(self):
        """Test creating a portfolio via API."""
        url = '/api/portfolios/'
        response = self.client.post(url, self.portfolio_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Portfolio.objects.count(), 2)
        
        created_portfolio = Portfolio.objects.get(name='API Test Portfolio')
        self.assertEqual(created_portfolio.sites.count(), 2)
    
    def test_list_portfolios_api(self):
        """Test listing portfolios via API."""
        url = '/api/portfolios/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Check if response is paginated
        if 'results' in response.data:
            self.assertEqual(len(response.data['results']), 1)
            self.assertEqual(response.data['results'][0]['name'], 'Existing Portfolio')
        else:
            self.assertEqual(len(response.data), 1)
            self.assertEqual(response.data[0]['name'], 'Existing Portfolio')
    
    def test_retrieve_portfolio_api(self):
        """Test retrieving a specific portfolio via API."""
        url = f'/api/portfolios/{self.portfolio.id}/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Existing Portfolio')
        self.assertEqual(len(response.data['sites']), 1)
    
    def test_update_portfolio_api(self):
        """Test updating a portfolio via API."""
        url = f'/api/portfolios/{self.portfolio.id}/'
        update_data = {
            'name': 'Updated Portfolio Name',
            'site_ids': [self.site2.id]  # Change sites
        }
        
        response = self.client.patch(url, update_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        updated_portfolio = Portfolio.objects.get(id=self.portfolio.id)
        self.assertEqual(updated_portfolio.name, 'Updated Portfolio Name')
        self.assertEqual(updated_portfolio.sites.count(), 1)
        self.assertIn(self.site2, updated_portfolio.sites.all())
    
    def test_delete_portfolio_api(self):
        """Test deleting a portfolio via API."""
        url = f'/api/portfolios/{self.portfolio.id}/'
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Portfolio.objects.count(), 0)
    
    def test_add_site_to_portfolio_api(self):
        """Test adding a site to portfolio via custom action."""
        url = f'/api/portfolios/{self.portfolio.id}/add_site/'
        data = {'site_id': self.site2.id}
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(self.portfolio.sites.count(), 2)
        self.assertIn(self.site2, self.portfolio.sites.all())
    
    def test_remove_site_from_portfolio_api(self):
        """Test removing a site from portfolio via custom action."""
        url = f'/api/portfolios/{self.portfolio.id}/remove_site/'
        data = {'site_id': self.site1.id}
        
        response = self.client.delete(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(self.portfolio.sites.count(), 0)
    
    def test_get_portfolio_sites_api(self):
        """Test getting sites in a portfolio via custom action."""
        url = f'/api/portfolios/{self.portfolio.id}/sites/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Solar Farm 1')
    
    def test_add_site_to_portfolio_missing_site_id(self):
        """Test adding site to portfolio without site_id returns 400."""
        url = f'/api/portfolios/{self.portfolio.id}/add_site/'
        data = {}  # Missing site_id
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertIn('site_id is required', response.data['error'])
    
    def test_add_nonexistent_site_to_portfolio(self):
        """Test adding non-existent site to portfolio returns 404."""
        url = f'/api/portfolios/{self.portfolio.id}/add_site/'
        data = {'site_id': 99999}  # Non-existent site
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn('error', response.data)
        self.assertIn('Site not found', response.data['error'])
    
    def test_add_duplicate_site_to_portfolio(self):
        """Test adding site that's already in portfolio returns 400."""
        url = f'/api/portfolios/{self.portfolio.id}/add_site/'
        data = {'site_id': self.site1.id}  # Site1 is already in portfolio
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertIn('Site is already in this portfolio', response.data['error'])
    
    def test_remove_site_from_portfolio_missing_site_id(self):
        """Test removing site from portfolio without site_id returns 400."""
        url = f'/api/portfolios/{self.portfolio.id}/remove_site/'
        data = {}  # Missing site_id
        
        response = self.client.delete(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertIn('site_id is required', response.data['error'])
    
    def test_remove_nonexistent_site_from_portfolio(self):
        """Test removing non-existent site from portfolio returns 404."""
        url = f'/api/portfolios/{self.portfolio.id}/remove_site/'
        data = {'site_id': 99999}  # Non-existent site
        
        response = self.client.delete(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn('error', response.data)
        self.assertIn('Site not found', response.data['error'])
    
    def test_remove_site_not_in_portfolio(self):
        """Test removing site that's not in portfolio returns 400."""
        url = f'/api/portfolios/{self.portfolio.id}/remove_site/'
        data = {'site_id': self.site2.id}  # Site2 is not in portfolio
        
        response = self.client.delete(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertIn('Site is not in this portfolio', response.data['error'])
    
    def test_create_portfolio_with_invalid_site_ids(self):
        """Test creating portfolio with invalid site IDs returns 400."""
        url = '/api/portfolios/'
        invalid_data = {
            'name': 'Invalid Portfolio',
            'description': 'Portfolio with invalid sites',
            'site_ids': [99999, 88888]  # Non-existent site IDs
        }
        
        response = self.client.post(url, invalid_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_create_portfolio_with_duplicate_site_ids(self):
        """Test creating portfolio with duplicate site IDs returns 400."""
        url = '/api/portfolios/'
        invalid_data = {
            'name': 'Duplicate Portfolio',
            'description': 'Portfolio with duplicate sites',
            'site_ids': [self.site1.id, self.site1.id]  # Duplicate site ID
        }
        
        response = self.client.post(url, invalid_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_create_portfolio_without_sites(self):
        """Test creating portfolio without sites is allowed."""
        url = '/api/portfolios/'
        data = {
            'name': 'Empty Portfolio',
            'description': 'Portfolio with no sites'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        created_portfolio = Portfolio.objects.get(name='Empty Portfolio')
        self.assertEqual(created_portfolio.sites.count(), 0)
    
    def test_create_portfolio_with_empty_name(self):
        """Test creating portfolio with empty name returns 400."""
        url = '/api/portfolios/'
        invalid_data = {
            'name': '',  # Empty name
            'description': 'Portfolio with empty name'
        }
        
        response = self.client.post(url, invalid_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_delete_portfolio_with_active_forecast_jobs(self):
        """Test deleting portfolio with active forecast jobs returns 400."""
        # Create an active forecast job
        ForecastJob.objects.create(
            portfolio=self.portfolio,
            status='running'
        )
        
        url = f'/api/portfolios/{self.portfolio.id}/'
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertIn('Cannot delete portfolio', response.data['error'])
        self.assertIn('active forecast job', response.data['details'])
    
    def test_portfolio_total_capacity_calculation(self):
        """Test that portfolio total capacity is calculated correctly."""
        # Add second site to portfolio
        self.portfolio.sites.add(self.site2)
        
        url = f'/api/portfolios/{self.portfolio.id}/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        expected_capacity = self.site1.capacity_mw + self.site2.capacity_mw
        self.assertEqual(Decimal(str(response.data['total_capacity'])), expected_capacity)
        self.assertEqual(response.data['site_count'], 2)
    
    def test_portfolio_with_sites_without_capacity(self):
        """Test portfolio calculations with sites that have no capacity."""
        # Create site without capacity
        site_no_capacity = Site.objects.create(
            name='No Capacity Site',
            site_type='solar',
            latitude=Decimal('42.3601'),
            longitude=Decimal('-71.0589')
            # No capacity_mw specified
        )
        
        portfolio = Portfolio.objects.create(name='Mixed Capacity Portfolio')
        portfolio.sites.add(self.site1, site_no_capacity)
        
        url = f'/api/portfolios/{portfolio.id}/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should only count site1's capacity
        self.assertEqual(Decimal(str(response.data['total_capacity'])), self.site1.capacity_mw)
        self.assertEqual(response.data['site_count'], 2)