from rest_framework import serializers
from decimal import Decimal
from .models import Site, Portfolio, PortfolioSite, ForecastJob, ForecastResult


class SiteSerializer(serializers.ModelSerializer):
    """Serializer for Site model with validation for required fields."""
    
    class Meta:
        model = Site
        fields = [
            'id', 'name', 'site_type', 'latitude', 'longitude', 
            'capacity_mw', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_name(self, value):
        """Validate that site name is not empty and has reasonable length."""
        if not value or not value.strip():
            raise serializers.ValidationError("Site name cannot be empty.")
        if len(value.strip()) < 2:
            raise serializers.ValidationError("Site name must be at least 2 characters long.")
        return value.strip()
    
    def validate_site_type(self, value):
        """Validate that site type is one of the allowed choices."""
        valid_types = [choice[0] for choice in Site.SITE_TYPE_CHOICES]
        if value not in valid_types:
            raise serializers.ValidationError(
                f"Invalid site type. Must be one of: {', '.join(valid_types)}"
            )
        return value
    
    def validate_latitude(self, value):
        """Validate latitude is within valid range."""
        if value < Decimal('-90.0') or value > Decimal('90.0'):
            raise serializers.ValidationError("Latitude must be between -90 and 90 degrees.")
        return value
    
    def validate_longitude(self, value):
        """Validate longitude is within valid range."""
        if value < Decimal('-180.0') or value > Decimal('180.0'):
            raise serializers.ValidationError("Longitude must be between -180 and 180 degrees.")
        return value
    
    def validate_capacity_mw(self, value):
        """Validate capacity is positive if provided."""
        if value is not None and value <= 0:
            raise serializers.ValidationError("Capacity must be greater than 0 MW.")
        return value
    
    def validate(self, data):
        """Cross-field validation to check for duplicate coordinates."""
        # Let the database constraint handle duplicate coordinates
        # The view will catch IntegrityError and return proper response
        return data


class PortfolioSiteSerializer(serializers.ModelSerializer):
    """Serializer for PortfolioSite through model."""
    
    site = SiteSerializer(read_only=True)
    site_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = PortfolioSite
        fields = ['site', 'site_id', 'added_at']
        read_only_fields = ['added_at']


class PortfolioSerializer(serializers.ModelSerializer):
    """Serializer for Portfolio model with nested site relationships."""
    
    sites = SiteSerializer(many=True, read_only=True)
    site_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        help_text="List of site IDs to include in this portfolio"
    )
    total_capacity = serializers.SerializerMethodField()
    site_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Portfolio
        fields = [
            'id', 'name', 'description', 'sites', 'site_ids',
            'total_capacity', 'site_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'total_capacity', 'site_count']
    
    def get_total_capacity(self, obj):
        """Get the total capacity of all sites in the portfolio."""
        return obj.get_total_capacity()
    
    def get_site_count(self, obj):
        """Get the number of sites in the portfolio."""
        return obj.get_site_count()
    
    def validate_name(self, value):
        """Validate that portfolio name is not empty and has reasonable length."""
        if not value or not value.strip():
            raise serializers.ValidationError("Portfolio name cannot be empty.")
        if len(value.strip()) < 2:
            raise serializers.ValidationError("Portfolio name must be at least 2 characters long.")
        return value.strip()
    
    def validate_site_ids(self, value):
        """Validate that all provided site IDs exist."""
        if not value:
            return value
        
        # Check that all site IDs exist
        existing_sites = Site.objects.filter(id__in=value)
        existing_ids = set(existing_sites.values_list('id', flat=True))
        provided_ids = set(value)
        
        missing_ids = provided_ids - existing_ids
        if missing_ids:
            raise serializers.ValidationError(
                f"The following site IDs do not exist: {', '.join(map(str, missing_ids))}"
            )
        
        # Check for duplicates
        if len(value) != len(set(value)):
            raise serializers.ValidationError("Duplicate site IDs are not allowed.")
        
        return value
    
    def create(self, validated_data):
        """Create portfolio and associate sites."""
        site_ids = validated_data.pop('site_ids', [])
        portfolio = Portfolio.objects.create(**validated_data)
        
        if site_ids:
            sites = Site.objects.filter(id__in=site_ids)
            portfolio.sites.set(sites)
        
        return portfolio
    
    def update(self, instance, validated_data):
        """Update portfolio and manage site associations."""
        site_ids = validated_data.pop('site_ids', None)
        
        # Update basic fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update site associations if site_ids provided
        if site_ids is not None:
            sites = Site.objects.filter(id__in=site_ids)
            instance.sites.set(sites)
        
        return instance


class ForecastJobSerializer(serializers.ModelSerializer):
    """Serializer for ForecastJob model."""
    
    portfolio_name = serializers.CharField(source='portfolio.name', read_only=True)
    
    class Meta:
        model = ForecastJob
        fields = [
            'id', 'portfolio', 'portfolio_name', 'status', 
            'created_at', 'completed_at', 'error_message'
        ]
        read_only_fields = ['id', 'status', 'created_at', 'completed_at', 'error_message']


class ForecastResultSerializer(serializers.ModelSerializer):
    """Serializer for ForecastResult model."""
    
    site_name = serializers.CharField(source='site.name', read_only=True)
    site_type = serializers.CharField(source='site.site_type', read_only=True)
    
    class Meta:
        model = ForecastResult
        fields = [
            'id', 'job', 'site', 'site_name', 'site_type',
            'forecast_datetime', 'predicted_generation_mwh',
            'confidence_interval_lower', 'confidence_interval_upper',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']