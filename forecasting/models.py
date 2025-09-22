import uuid
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal


class Site(models.Model):
    """Model representing a renewable energy site (solar or wind)."""
    
    SITE_TYPE_CHOICES = [
        ('solar', 'Solar'),
        ('wind', 'Wind'),
        ('hydro', 'Hydro'),
    ]
    
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=200, help_text="Name of the renewable energy site")
    site_type = models.CharField(
        max_length=50, 
        choices=SITE_TYPE_CHOICES,
        help_text="Type of renewable energy site"
    )
    latitude = models.DecimalField(
        max_digits=9, 
        decimal_places=6,
        validators=[
            MinValueValidator(Decimal('-90.0')),
            MaxValueValidator(Decimal('90.0'))
        ],
        help_text="Latitude coordinate (-90 to 90)"
    )
    longitude = models.DecimalField(
        max_digits=9, 
        decimal_places=6,
        validators=[
            MinValueValidator(Decimal('-180.0')),
            MaxValueValidator(Decimal('180.0'))
        ],
        help_text="Longitude coordinate (-180 to 180)"
    )
    capacity_mw = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True,
        validators=[MinValueValidator(Decimal('0.01'))],
        help_text="Capacity in megawatts"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['latitude', 'longitude']
        ordering = ['name']
        
    def __str__(self):
        return f"{self.name} ({self.site_type})"
    
    def clean(self):
        """Custom validation for the Site model."""
        from django.core.exceptions import ValidationError
        
        # Ensure site type is valid
        if self.site_type not in dict(self.SITE_TYPE_CHOICES):
            raise ValidationError({'site_type': 'Invalid site type'})


class Portfolio(models.Model):
    """Model representing a portfolio of renewable energy sites."""
    
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=200, help_text="Name of the portfolio")
    description = models.TextField(blank=True, help_text="Description of the portfolio")
    sites = models.ManyToManyField(Site, through='PortfolioSite', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        
    def __str__(self):
        return self.name
    
    def get_total_capacity(self):
        """Calculate total capacity of all sites in the portfolio."""
        return self.sites.aggregate(
            total=models.Sum('capacity_mw')
        )['total'] or Decimal('0.00')
    
    def get_site_count(self):
        """Get the number of sites in this portfolio."""
        return self.sites.count()


class PortfolioSite(models.Model):
    """Through model for Portfolio-Site many-to-many relationship."""
    
    portfolio = models.ForeignKey(Portfolio, on_delete=models.CASCADE)
    site = models.ForeignKey(Site, on_delete=models.CASCADE)
    added_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['portfolio', 'site']
        ordering = ['added_at']
        
    def __str__(self):
        return f"{self.portfolio.name} - {self.site.name}"


class ForecastJob(models.Model):
    """Model representing an asynchronous forecasting job."""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('running', 'Running'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    portfolio = models.ForeignKey(Portfolio, on_delete=models.CASCADE)
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='pending',
        help_text="Current status of the forecast job"
    )
    forecast_horizon = models.PositiveIntegerField(
        default=24,
        help_text="Number of hours forecasted in this job"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(
        blank=True, 
        help_text="Error message if job failed"
    )
    
    class Meta:
        ordering = ['-created_at']
        
    def __str__(self):
        return f"Forecast Job {self.id} - {self.portfolio.name} ({self.status})"
    
    def is_complete(self):
        """Check if the job is in a completed state (success or failure)."""
        return self.status in ['completed', 'failed']
    
    def is_successful(self):
        """Check if the job completed successfully."""
        return self.status == 'completed'


class ForecastResult(models.Model):
    """Model representing forecast results for individual sites."""
    
    id = models.AutoField(primary_key=True)
    job = models.ForeignKey(
        ForecastJob, 
        on_delete=models.CASCADE,
        related_name='results'
    )
    site = models.ForeignKey(Site, on_delete=models.CASCADE)
    forecast_datetime = models.DateTimeField(
        help_text="The datetime this forecast is for"
    )
    predicted_generation_mwh = models.DecimalField(
        max_digits=10, 
        decimal_places=3,
        validators=[MinValueValidator(Decimal('0.0'))],
        help_text="Predicted energy generation in MWh"
    )
    confidence_interval_lower = models.DecimalField(
        max_digits=10, 
        decimal_places=3, 
        null=True, 
        blank=True,
        validators=[MinValueValidator(Decimal('0.0'))],
        help_text="Lower bound of confidence interval"
    )
    confidence_interval_upper = models.DecimalField(
        max_digits=10, 
        decimal_places=3, 
        null=True, 
        blank=True,
        validators=[MinValueValidator(Decimal('0.0'))],
        help_text="Upper bound of confidence interval"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['forecast_datetime']
        unique_together = ['job', 'site', 'forecast_datetime']
        
    def __str__(self):
        return f"Forecast for {self.site.name} at {self.forecast_datetime}"
    
    def clean(self):
        """Custom validation for forecast results."""
        from django.core.exceptions import ValidationError
        
        # Ensure confidence intervals are valid if provided
        if (self.confidence_interval_lower is not None and 
            self.confidence_interval_upper is not None):
            if self.confidence_interval_lower > self.confidence_interval_upper:
                raise ValidationError({
                    'confidence_interval_lower': 'Lower bound cannot be greater than upper bound'
                })
            
            # Ensure predicted value is within confidence interval
            if not (self.confidence_interval_lower <= self.predicted_generation_mwh <= 
                    self.confidence_interval_upper):
                raise ValidationError({
                    'predicted_generation_mwh': 'Predicted value must be within confidence interval'
                })
