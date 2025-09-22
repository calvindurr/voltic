from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.exceptions import ValidationError
from django.db import transaction, IntegrityError
from django.core.exceptions import ValidationError as DjangoValidationError
from django.http import Http404
from .models import Site, Portfolio, PortfolioSite, ForecastJob, ForecastResult
from .serializers import (
    SiteSerializer, PortfolioSerializer, PortfolioSiteSerializer,
    ForecastJobSerializer, ForecastResultSerializer
)
from .services import (
    ForecastService,
    ForecastServiceError,
    PortfolioNotFoundError,
    EmptyPortfolioError,
    JobNotFoundError
)


class SiteViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing renewable energy sites.
    
    Provides CRUD operations for sites with proper validation
    and error handling.
    """
    queryset = Site.objects.all()
    serializer_class = SiteSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        """
        Optionally filter sites by site_type query parameter.
        """
        queryset = Site.objects.all()
        site_type = self.request.query_params.get('site_type', None)
        
        if site_type is not None:
            # Validate site_type parameter
            valid_types = [choice[0] for choice in Site.SITE_TYPE_CHOICES]
            if site_type not in valid_types:
                # This will be handled by the list method
                queryset = queryset.none()
            else:
                queryset = queryset.filter(site_type=site_type)
        
        return queryset
    
    def list(self, request, *args, **kwargs):
        """List sites with enhanced error handling for query parameters."""
        site_type = self.request.query_params.get('site_type', None)
        
        if site_type is not None:
            valid_types = [choice[0] for choice in Site.SITE_TYPE_CHOICES]
            if site_type not in valid_types:
                return Response(
                    {
                        'error': 'Invalid site_type parameter',
                        'details': f'site_type must be one of: {", ".join(valid_types)}',
                        'valid_types': valid_types
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return super().list(request, *args, **kwargs)
    
    def create(self, request, *args, **kwargs):
        """Create a new site with enhanced error handling."""
        serializer = self.get_serializer(data=request.data)
        
        try:
            serializer.is_valid(raise_exception=True)
            
            # Additional validation for coordinate precision
            latitude = serializer.validated_data.get('latitude')
            longitude = serializer.validated_data.get('longitude')
            
            if latitude and longitude:
                from decimal import Decimal
                # Check for sites within very close proximity (0.0001 degrees ≈ 11 meters)
                tolerance = Decimal('0.0001')
                close_sites = Site.objects.filter(
                    latitude__range=(latitude - tolerance, latitude + tolerance),
                    longitude__range=(longitude - tolerance, longitude + tolerance)
                )
                
                if close_sites.exists():
                    return Response(
                        {
                            'error': 'Site too close to existing site',
                            'details': 'A site already exists within 11 meters of these coordinates',
                            'conflicting_sites': [
                                {'id': site.id, 'name': site.name, 
                                 'latitude': str(site.latitude), 'longitude': str(site.longitude)}
                                for site in close_sites
                            ]
                        },
                        status=status.HTTP_409_CONFLICT
                    )
            
            try:
                self.perform_create(serializer)
            except IntegrityError as e:
                if 'unique' in str(e).lower() or 'duplicate' in str(e).lower():
                    return Response(
                        {
                            'error': 'Duplicate coordinates',
                            'details': 'A site already exists at these exact coordinates'
                        },
                        status=status.HTTP_409_CONFLICT
                    )
                raise
            
            headers = self.get_success_headers(serializer.data)
            return Response(
                serializer.data, 
                status=status.HTTP_201_CREATED, 
                headers=headers
            )

        except Exception as e:
            return Response(
                {'error': 'Failed to create site', 'details': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def retrieve(self, request, *args, **kwargs):
        """Retrieve a site with enhanced error handling."""
        try:
            return super().retrieve(request, *args, **kwargs)
        except Http404:
            return Response(
                {
                    'error': 'Site not found',
                    'details': f'No site found with ID {kwargs.get("pk")}'
                },
                status=status.HTTP_404_NOT_FOUND
            )
    
    def update(self, request, *args, **kwargs):
        """Update a site with enhanced error handling."""
        partial = kwargs.pop('partial', False)
        
        try:
            instance = self.get_object()
        except Http404:
            return Response(
                {
                    'error': 'Site not found',
                    'details': f'No site found with ID {kwargs.get("pk")}'
                },
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        
        try:
            serializer.is_valid(raise_exception=True)
        except ValidationError as e:
            # Check if this is a duplicate coordinates error
            if hasattr(e, 'duplicate_coordinates'):
                return Response(
                    {
                        'error': 'Duplicate coordinates',
                        'details': 'A site already exists at these exact coordinates'
                    },
                    status=status.HTTP_409_CONFLICT
                )
            # Re-raise other validation errors
            raise
        
        try:
            # Additional validation for coordinate updates
            latitude = serializer.validated_data.get('latitude')
            longitude = serializer.validated_data.get('longitude')
            
            if latitude and longitude:
                from decimal import Decimal
                # Check for sites within very close proximity (excluding current site)
                tolerance = Decimal('0.0001')
                close_sites = Site.objects.filter(
                    latitude__range=(latitude - tolerance, latitude + tolerance),
                    longitude__range=(longitude - tolerance, longitude + tolerance)
                ).exclude(pk=instance.pk)
                
                if close_sites.exists():
                    return Response(
                        {
                            'error': 'Site too close to existing site',
                            'details': 'A site already exists within 11 meters of these coordinates',
                            'conflicting_sites': [
                                {'id': site.id, 'name': site.name, 
                                 'latitude': str(site.latitude), 'longitude': str(site.longitude)}
                                for site in close_sites
                            ]
                        },
                        status=status.HTTP_409_CONFLICT
                    )
            
            self.perform_update(serializer)
            return Response(serializer.data)
            
        except IntegrityError as e:
            if 'unique constraint' in str(e).lower():
                return Response(
                    {
                        'error': 'Duplicate coordinates',
                        'details': 'A site already exists at these exact coordinates'
                    },
                    status=status.HTTP_409_CONFLICT
                )
            return Response(
                {'error': 'Failed to update site', 'details': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': 'Failed to update site', 'details': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def destroy(self, request, *args, **kwargs):
        """Delete a site with cascade handling."""
        try:
            instance = self.get_object()
        except Http404:
            return Response(
                {
                    'error': 'Site not found',
                    'details': f'No site found with ID {kwargs.get("pk")}'
                },
                status=status.HTTP_404_NOT_FOUND
            )
        
        try:
            # Check if site is part of any portfolios
            portfolio_count = instance.portfolio_set.count()
            if portfolio_count > 0:
                portfolios = list(instance.portfolio_set.values_list('name', flat=True))
                return Response(
                    {
                        'error': 'Cannot delete site',
                        'details': f'Site is part of {portfolio_count} portfolio(s). Remove from portfolios first.',
                        'portfolios': portfolios
                    },
                    status=status.HTTP_409_CONFLICT
                )
            
            # Check if site has any forecast results
            forecast_results_count = ForecastResult.objects.filter(site=instance).count()
            if forecast_results_count > 0:
                return Response(
                    {
                        'error': 'Cannot delete site with forecast result',
                        'details': f'Site has {forecast_results_count} forecast result(s). Delete forecast data first.',
                        'forecast_results_count': forecast_results_count
                    },
                    status=status.HTTP_409_CONFLICT
                )
            
            self.perform_destroy(instance)
            return Response(status=status.HTTP_204_NO_CONTENT)
            
        except Exception as e:
            return Response(
                {'error': 'Failed to delete site', 'details': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class PortfolioViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing portfolios of renewable energy sites.
    
    Provides CRUD operations for portfolios with nested site management.
    """
    queryset = Portfolio.objects.prefetch_related('sites').all()
    serializer_class = PortfolioSerializer
    permission_classes = [AllowAny]
    
    def create(self, request, *args, **kwargs):
        """Create a new portfolio with enhanced error handling."""
        serializer = self.get_serializer(data=request.data)
        
        try:
            serializer.is_valid(raise_exception=True)
            with transaction.atomic():
                self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(
                serializer.data, 
                status=status.HTTP_201_CREATED, 
                headers=headers
            )
        except Exception as e:
            return Response(
                {'error': 'Failed to create portfolio', 'details': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def update(self, request, *args, **kwargs):
        """Update a portfolio with enhanced error handling."""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        
        try:
            serializer.is_valid(raise_exception=True)
            with transaction.atomic():
                self.perform_update(serializer)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': 'Failed to update portfolio', 'details': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def destroy(self, request, *args, **kwargs):
        """Delete a portfolio with cascade handling."""
        instance = self.get_object()
        
        try:
            # Check if portfolio has any active forecast jobs
            active_jobs = ForecastJob.objects.filter(
                portfolio=instance,
                status__in=['pending', 'running']
            ).count()
            
            if active_jobs > 0:
                return Response(
                    {
                        'error': 'Cannot delete portfolio',
                        'details': f'Portfolio has {active_jobs} active forecast job(s). Wait for completion or cancel jobs first.'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            self.perform_destroy(instance)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response(
                {'error': 'Failed to delete portfolio', 'details': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def add_site(self, request, pk=None):
        """Add a site to the portfolio."""
        portfolio = self.get_object()
        site_id = request.data.get('site_id')
        
        if not site_id:
            return Response(
                {'error': 'site_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            site = Site.objects.get(id=site_id)
            
            # Check if site is already in portfolio
            if portfolio.sites.filter(id=site_id).exists():
                return Response(
                    {'error': 'Site is already in this portfolio'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            portfolio.sites.add(site)
            return Response(
                {'message': f'Site "{site.name}" added to portfolio "{portfolio.name}"'},
                status=status.HTTP_200_OK
            )
        except Site.DoesNotExist:
            return Response(
                {'error': 'Site not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': 'Failed to add site to portfolio', 'details': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['delete'])
    def remove_site(self, request, pk=None):
        """Remove a site from the portfolio."""
        portfolio = self.get_object()
        site_id = request.data.get('site_id')
        
        if not site_id:
            return Response(
                {'error': 'site_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            site = Site.objects.get(id=site_id)
            
            # Check if site is in portfolio
            if not portfolio.sites.filter(id=site_id).exists():
                return Response(
                    {'error': 'Site is not in this portfolio'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            portfolio.sites.remove(site)
            return Response(
                {'message': f'Site "{site.name}" removed from portfolio "{portfolio.name}"'},
                status=status.HTTP_200_OK
            )
        except Site.DoesNotExist:
            return Response(
                {'error': 'Site not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': 'Failed to remove site from portfolio', 'details': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['get'])
    def sites(self, request, pk=None):
        """Get all sites in the portfolio."""
        portfolio = self.get_object()
        sites = portfolio.sites.all()
        serializer = SiteSerializer(sites, many=True)
        return Response(serializer.data)


class ForecastViewSet(viewsets.ViewSet):
    """
    ViewSet for managing forecast operations.
    
    Provides endpoints for triggering forecasts, checking job status,
    and retrieving forecast results.
    """
    permission_classes = [AllowAny]
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.forecast_service = ForecastService()
    
    @action(detail=False, methods=['post'], url_path='portfolio/(?P<portfolio_id>[^/.]+)/trigger')
    def trigger_portfolio_forecast(self, request, portfolio_id=None):
        """
        Trigger a forecast for all sites in a portfolio.
        
        POST /api/forecasts/portfolio/{portfolio_id}/trigger/
        
        Optional body parameters:
        - forecast_horizon: Number of hours to forecast (default: 24)
        """
        try:
            # Get optional forecast horizon from request
            forecast_horizon = request.data.get('forecast_horizon')
            if forecast_horizon is not None:
                try:
                    forecast_horizon = int(forecast_horizon)
                    if forecast_horizon <= 0:
                        return Response(
                            {
                                'error': 'Invalid forecast horizon',
                                'details': 'Forecast horizon must be a positive integer'
                            },
                            status=status.HTTP_400_BAD_REQUEST
                        )
                except (ValueError, TypeError):
                    return Response(
                        {
                            'error': 'Invalid forecast horizon',
                            'details': 'Forecast horizon must be a valid integer'
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Trigger the forecast
            job = self.forecast_service.trigger_portfolio_forecast(
                int(portfolio_id), 
                forecast_horizon=forecast_horizon
            )
            
            # Return job information
            return Response(
                {
                    'job_id': str(job.id),
                    'portfolio_id': job.portfolio.id,
                    'portfolio_name': job.portfolio.name,
                    'status': job.status,
                    'created_at': job.created_at,
                    'message': f'Forecast job created for portfolio "{job.portfolio.name}"'
                },
                status=status.HTTP_201_CREATED
            )
            
        except ValueError:
            return Response(
                {'error': 'Invalid portfolio ID'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except PortfolioNotFoundError as e:
            return Response(
                {'error': 'Portfolio not found', 'details': str(e)},
                status=status.HTTP_404_NOT_FOUND
            )
        except EmptyPortfolioError as e:
            return Response(
                {'error': 'Empty portfolio', 'details': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except ForecastServiceError as e:
            return Response(
                {'error': 'Forecast service error', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        except Exception as e:
            return Response(
                {'error': 'Unexpected error', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'], url_path='jobs/(?P<job_id>[^/.]+)/status')
    def get_job_status(self, request, job_id=None):
        """
        Get the status of a forecast job.
        
        GET /api/forecasts/jobs/{job_id}/status/
        """
        try:
            import uuid
            job_uuid = uuid.UUID(job_id)
            
            status_info = self.forecast_service.get_forecast_status(job_uuid)
            
            return Response(status_info, status=status.HTTP_200_OK)
            
        except ValueError:
            return Response(
                {'error': 'Invalid job ID format'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except JobNotFoundError as e:
            return Response(
                {'error': 'Job not found', 'details': str(e)},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': 'Unexpected error', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'], url_path='portfolio/(?P<portfolio_id>[^/.]+)/results')
    def get_portfolio_results(self, request, portfolio_id=None):
        """
        Get forecast results for a portfolio.
        
        GET /api/forecasts/portfolio/{portfolio_id}/results/
        
        Optional query parameters:
        - job_id: Specific job ID to get results for (uses latest if not provided)
        """
        try:
            # Get optional job_id from query parameters
            job_id_str = request.query_params.get('job_id')
            job_id = None
            
            if job_id_str:
                try:
                    import uuid
                    job_id = uuid.UUID(job_id_str)
                except ValueError:
                    return Response(
                        {'error': 'Invalid job ID format'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            results = self.forecast_service.get_portfolio_forecast_results(
                int(portfolio_id), 
                job_id=job_id
            )
            
            return Response(results, status=status.HTTP_200_OK)
            
        except ValueError:
            return Response(
                {'error': 'Invalid portfolio ID'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except PortfolioNotFoundError as e:
            return Response(
                {'error': 'Portfolio not found', 'details': str(e)},
                status=status.HTTP_404_NOT_FOUND
            )
        except JobNotFoundError as e:
            return Response(
                {'error': 'No forecast results found', 'details': str(e)},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': 'Unexpected error', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'], url_path='site/(?P<site_id>[^/.]+)/results')
    def get_site_results(self, request, site_id=None):
        """
        Get forecast results for a specific site.
        
        GET /api/forecasts/site/{site_id}/results/
        
        Optional query parameters:
        - job_id: Specific job ID to get results for (uses latest if not provided)
        """
        try:
            # Get optional job_id from query parameters
            job_id_str = request.query_params.get('job_id')
            job_id = None
            
            if job_id_str:
                try:
                    import uuid
                    job_id = uuid.UUID(job_id_str)
                except ValueError:
                    return Response(
                        {'error': 'Invalid job ID format'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            results = self.forecast_service.get_site_forecast_results(
                int(site_id), 
                job_id=job_id
            )
            
            return Response(results, status=status.HTTP_200_OK)
            
        except ValueError:
            return Response(
                {'error': 'Invalid site ID'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Site.DoesNotExist:
            return Response(
                {'error': 'Site not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except JobNotFoundError as e:
            return Response(
                {'error': 'No forecast results found', 'details': str(e)},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': 'Unexpected error', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'], url_path='jobs/(?P<job_id>[^/.]+)/cancel')
    def cancel_job(self, request, job_id=None):
        """
        Cancel a pending or running forecast job.
        
        POST /api/forecasts/jobs/{job_id}/cancel/
        """
        try:
            import uuid
            job_uuid = uuid.UUID(job_id)
            
            cancelled = self.forecast_service.cancel_forecast_job(job_uuid)
            
            if cancelled:
                return Response(
                    {'message': f'Forecast job {job_id} has been cancelled'},
                    status=status.HTTP_200_OK
                )
            else:
                return Response(
                    {
                        'error': 'Cannot cancel job',
                        'details': 'Job is not in a cancellable state (pending or running)'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except ValueError:
            return Response(
                {'error': 'Invalid job ID format'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except JobNotFoundError as e:
            return Response(
                {'error': 'Job not found', 'details': str(e)},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': 'Unexpected error', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
