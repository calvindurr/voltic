"""
Service layer for handling forecast operations.

This module provides the ForecastService class that manages portfolio forecast
requests, async job processing, and forecast result generation.
"""

import logging
from datetime import datetime, timedelta
from decimal import Decimal
from typing import List, Optional, Dict, Any
from uuid import UUID

from django.db import transaction
from django.utils import timezone
from django.core.exceptions import ValidationError

from .models import Portfolio, Site, ForecastJob, ForecastResult
from .forecast_engine import model_registry, ForecastPoint


logger = logging.getLogger(__name__)


class ForecastServiceError(Exception):
    """Base exception for forecast service errors."""
    pass


class PortfolioNotFoundError(ForecastServiceError):
    """Raised when a portfolio is not found."""
    pass


class EmptyPortfolioError(ForecastServiceError):
    """Raised when trying to forecast an empty portfolio."""
    pass


class JobNotFoundError(ForecastServiceError):
    """Raised when a forecast job is not found."""
    pass


class ForecastService:
    """
    Service class for managing forecast operations.
    
    Handles portfolio forecast requests, async job creation and processing,
    and forecast result generation with proper error handling.
    """
    
    def __init__(self, forecast_horizon: int = 24):
        """
        Initialize the forecast service.
        
        Args:
            forecast_horizon: Default number of hours to forecast (default: 24)
        """
        self.forecast_horizon = forecast_horizon
        self.logger = logging.getLogger(f"{__name__}.{self.__class__.__name__}")
    
    def trigger_portfolio_forecast(self, portfolio_id: int, 
                                 forecast_horizon: Optional[int] = None) -> ForecastJob:
        """
        Trigger a forecast for all sites in a portfolio.
        
        Creates a new forecast job and initiates the forecasting process.
        
        Args:
            portfolio_id: ID of the portfolio to forecast
            forecast_horizon: Number of hours to forecast (uses default if None)
            
        Returns:
            ForecastJob instance representing the created job
            
        Raises:
            PortfolioNotFoundError: If portfolio doesn't exist
            EmptyPortfolioError: If portfolio has no sites
            ForecastServiceError: For other forecast-related errors
        """
        try:
            # Validate portfolio exists and has sites
            portfolio = self._get_portfolio_with_sites(portfolio_id)
            
            if portfolio.get_site_count() == 0:
                raise EmptyPortfolioError(
                    f"Portfolio '{portfolio.name}' (ID: {portfolio_id}) has no sites"
                )
            
            # Use provided horizon or default
            horizon = forecast_horizon or self.forecast_horizon
            
            # Create forecast job
            with transaction.atomic():
                job = ForecastJob.objects.create(
                    portfolio=portfolio,
                    status='pending',
                    forecast_horizon=horizon
                )
                
                self.logger.info(
                    f"Created forecast job {job.id} for portfolio '{portfolio.name}' "
                    f"with {portfolio.get_site_count()} sites"
                )
            
            # Process the forecast (in a real system, this would be async)
            self._process_forecast_job(job, horizon)
            
            return job
            
        except Portfolio.DoesNotExist:
            raise PortfolioNotFoundError(f"Portfolio with ID {portfolio_id} not found")
        except (EmptyPortfolioError, PortfolioNotFoundError):
            # Re-raise these specific errors without wrapping
            raise
        except Exception as e:
            self.logger.error(f"Failed to trigger forecast for portfolio {portfolio_id}: {e}")
            raise ForecastServiceError(f"Failed to trigger forecast: {str(e)}")
    
    def get_forecast_status(self, job_id: UUID) -> Dict[str, Any]:
        """
        Get the status of a forecast job.
        
        Args:
            job_id: UUID of the forecast job
            
        Returns:
            Dictionary containing job status information
            
        Raises:
            JobNotFoundError: If job doesn't exist
        """
        try:
            job = ForecastJob.objects.select_related('portfolio').get(id=job_id)
            
            status_info = {
                'job_id': str(job.id),
                'portfolio_id': job.portfolio.id,
                'portfolio_name': job.portfolio.name,
                'status': job.status,
                'created_at': job.created_at,
                'completed_at': job.completed_at,
                'error_message': job.error_message,
                'is_complete': job.is_complete(),
                'is_successful': job.is_successful()
            }
            
            # Add result count if completed successfully
            if job.is_successful():
                result_count = job.results.count()
                status_info['result_count'] = result_count
                
                # Add site count for validation
                site_count = job.portfolio.get_site_count()
                status_info['site_count'] = site_count
                
                # Calculate expected vs actual results
                expected_results = site_count * job.forecast_horizon
                status_info['expected_results'] = expected_results
                status_info['results_complete'] = result_count >= expected_results
                status_info['forecast_horizon'] = job.forecast_horizon
            
            return status_info
            
        except ForecastJob.DoesNotExist:
            raise JobNotFoundError(f"Forecast job with ID {job_id} not found")
    
    def get_portfolio_forecast_results(self, portfolio_id: int, 
                                     job_id: Optional[UUID] = None) -> Dict[str, Any]:
        """
        Get forecast results for a portfolio.
        
        Args:
            portfolio_id: ID of the portfolio
            job_id: Optional specific job ID (uses latest successful job if None)
            
        Returns:
            Dictionary containing forecast results and metadata
            
        Raises:
            PortfolioNotFoundError: If portfolio doesn't exist
            JobNotFoundError: If no forecast results are available
        """
        try:
            portfolio = Portfolio.objects.get(id=portfolio_id)
            
            # Get the forecast job
            if job_id:
                job = ForecastJob.objects.get(id=job_id, portfolio=portfolio)
            else:
                # Get the latest successful job for this portfolio
                job = ForecastJob.objects.filter(
                    portfolio=portfolio,
                    status='completed'
                ).order_by('-completed_at').first()
                
                if not job:
                    raise JobNotFoundError(
                        f"No completed forecast jobs found for portfolio {portfolio_id}"
                    )
            
            # Get all results for this job
            results = ForecastResult.objects.filter(job=job).select_related('site').order_by(
                'site__name', 'forecast_datetime'
            )
            
            if not results.exists():
                raise JobNotFoundError(f"No forecast results found for job {job.id}")
            
            # Organize results by site
            site_forecasts = {}
            total_by_datetime = {}
            
            for result in results:
                site_name = result.site.name
                site_id = result.site.id
                
                if site_name not in site_forecasts:
                    site_forecasts[site_name] = {
                        'site_id': site_id,
                        'site_name': site_name,
                        'site_type': result.site.site_type,
                        'capacity_mw': float(result.site.capacity_mw or 0),
                        'forecasts': []
                    }
                
                forecast_data = {
                    'datetime': result.forecast_datetime,
                    'predicted_generation_mwh': float(result.predicted_generation_mwh),
                    'confidence_interval_lower': float(result.confidence_interval_lower or 0),
                    'confidence_interval_upper': float(result.confidence_interval_upper or 0)
                }
                
                site_forecasts[site_name]['forecasts'].append(forecast_data)
                
                # Aggregate for portfolio total
                dt_key = result.forecast_datetime
                if dt_key not in total_by_datetime:
                    total_by_datetime[dt_key] = {
                        'datetime': dt_key,
                        'total_predicted_mwh': 0,
                        'total_confidence_lower': 0,
                        'total_confidence_upper': 0
                    }
                
                total_by_datetime[dt_key]['total_predicted_mwh'] += float(result.predicted_generation_mwh)
                total_by_datetime[dt_key]['total_confidence_lower'] += float(result.confidence_interval_lower or 0)
                total_by_datetime[dt_key]['total_confidence_upper'] += float(result.confidence_interval_upper or 0)
            
            # Convert aggregated totals to list
            portfolio_totals = sorted(total_by_datetime.values(), key=lambda x: x['datetime'])
            
            return {
                'job_id': str(job.id),
                'portfolio_id': portfolio.id,
                'portfolio_name': portfolio.name,
                'forecast_generated_at': job.completed_at,
                'site_count': len(site_forecasts),
                'total_capacity_mw': float(portfolio.get_total_capacity()),
                'site_forecasts': list(site_forecasts.values()),
                'portfolio_totals': portfolio_totals
            }
            
        except Portfolio.DoesNotExist:
            raise PortfolioNotFoundError(f"Portfolio with ID {portfolio_id} not found")
        except ForecastJob.DoesNotExist:
            raise JobNotFoundError(f"Forecast job not found")
    
    def get_site_forecast_results(self, site_id: int, 
                                job_id: Optional[UUID] = None) -> Dict[str, Any]:
        """
        Get forecast results for a specific site.
        
        Args:
            site_id: ID of the site
            job_id: Optional specific job ID (uses latest if None)
            
        Returns:
            Dictionary containing site forecast results
            
        Raises:
            Site.DoesNotExist: If site doesn't exist
            JobNotFoundError: If no forecast results are available
        """
        try:
            site = Site.objects.get(id=site_id)
            
            # Build query for forecast results
            results_query = ForecastResult.objects.filter(site=site)
            
            if job_id:
                results_query = results_query.filter(job_id=job_id)
            else:
                # Get results from the latest completed job for this site
                latest_job = ForecastJob.objects.filter(
                    portfolio__sites=site,
                    status='completed'
                ).order_by('-completed_at').first()
                
                if not latest_job:
                    raise JobNotFoundError(f"No completed forecast jobs found for site {site_id}")
                
                results_query = results_query.filter(job=latest_job)
            
            results = results_query.order_by('forecast_datetime')
            
            if not results.exists():
                raise JobNotFoundError(f"No forecast results found for site {site_id}")
            
            # Format results
            forecasts = []
            for result in results:
                forecasts.append({
                    'datetime': result.forecast_datetime,
                    'predicted_generation_mwh': float(result.predicted_generation_mwh),
                    'confidence_interval_lower': float(result.confidence_interval_lower or 0),
                    'confidence_interval_upper': float(result.confidence_interval_upper or 0)
                })
            
            return {
                'site_id': site.id,
                'site_name': site.name,
                'site_type': site.site_type,
                'capacity_mw': float(site.capacity_mw or 0),
                'forecast_count': len(forecasts),
                'forecasts': forecasts
            }
            
        except Site.DoesNotExist:
            raise Site.DoesNotExist(f"Site with ID {site_id} not found")
    
    def _get_portfolio_with_sites(self, portfolio_id: int) -> Portfolio:
        """
        Get portfolio with prefetched sites.
        
        Args:
            portfolio_id: ID of the portfolio
            
        Returns:
            Portfolio instance with sites prefetched
            
        Raises:
            Portfolio.DoesNotExist: If portfolio doesn't exist
        """
        return Portfolio.objects.prefetch_related('sites').get(id=portfolio_id)
    
    def _process_forecast_job(self, job: ForecastJob, forecast_horizon: int) -> None:
        """
        Process a forecast job by generating predictions for all sites.
        
        This method updates the job status and creates forecast results.
        In a production system, this would typically run asynchronously.
        
        Args:
            job: The ForecastJob to process
            forecast_horizon: Number of hours to forecast
        """
        try:
            # Update job status to running
            job.status = 'running'
            job.save(update_fields=['status'])
            
            self.logger.info(f"Processing forecast job {job.id}")
            
            # Get all sites in the portfolio
            sites = job.portfolio.sites.all()
            
            if not sites.exists():
                raise EmptyPortfolioError("Portfolio has no sites")
            
            # Generate forecasts for each site
            total_results_created = 0
            
            with transaction.atomic():
                for site in sites:
                    try:
                        # Get the appropriate model for this site type
                        model = model_registry.get_model(site.site_type)
                        
                        # Generate predictions
                        predictions = model.predict(site, forecast_horizon)
                        
                        # Create forecast results
                        for prediction in predictions:
                            ForecastResult.objects.create(
                                job=job,
                                site=site,
                                forecast_datetime=prediction.datetime,
                                predicted_generation_mwh=prediction.predicted_generation_mwh,
                                confidence_interval_lower=prediction.confidence_interval_lower,
                                confidence_interval_upper=prediction.confidence_interval_upper
                            )
                            total_results_created += 1
                        
                        self.logger.debug(
                            f"Generated {len(predictions)} predictions for site '{site.name}'"
                        )
                        
                    except Exception as e:
                        self.logger.error(f"Failed to generate forecast for site '{site.name}': {e}")
                        raise
                
                # Update job status to completed
                job.status = 'completed'
                job.completed_at = timezone.now()
                job.save(update_fields=['status', 'completed_at'])
                
                self.logger.info(
                    f"Completed forecast job {job.id}. Created {total_results_created} results "
                    f"for {sites.count()} sites"
                )
        
        except Exception as e:
            # Update job status to failed
            error_message = str(e)
            job.status = 'failed'
            job.completed_at = timezone.now()
            job.error_message = error_message
            job.save(update_fields=['status', 'completed_at', 'error_message'])
            
            self.logger.error(f"Forecast job {job.id} failed: {error_message}")
            raise ForecastServiceError(f"Forecast processing failed: {error_message}")
    
    def cancel_forecast_job(self, job_id: UUID) -> bool:
        """
        Cancel a pending or running forecast job.
        
        Args:
            job_id: UUID of the job to cancel
            
        Returns:
            True if job was cancelled, False if it couldn't be cancelled
            
        Raises:
            JobNotFoundError: If job doesn't exist
        """
        try:
            job = ForecastJob.objects.get(id=job_id)
            
            if job.status in ['pending', 'running']:
                job.status = 'failed'
                job.completed_at = timezone.now()
                job.error_message = 'Job cancelled by user'
                job.save(update_fields=['status', 'completed_at', 'error_message'])
                
                self.logger.info(f"Cancelled forecast job {job_id}")
                return True
            else:
                self.logger.warning(
                    f"Cannot cancel job {job_id} with status '{job.status}'"
                )
                return False
                
        except ForecastJob.DoesNotExist:
            raise JobNotFoundError(f"Forecast job with ID {job_id} not found")
    
    def cleanup_old_jobs(self, days_old: int = 30) -> int:
        """
        Clean up old completed or failed forecast jobs and their results.
        
        Args:
            days_old: Number of days old jobs should be to be cleaned up
            
        Returns:
            Number of jobs cleaned up
        """
        cutoff_date = timezone.now() - timedelta(days=days_old)
        
        old_jobs = ForecastJob.objects.filter(
            status__in=['completed', 'failed'],
            completed_at__lt=cutoff_date
        )
        
        job_count = old_jobs.count()
        
        if job_count > 0:
            # Delete jobs (results will be cascade deleted)
            old_jobs.delete()
            self.logger.info(f"Cleaned up {job_count} old forecast jobs")
        
        return job_count