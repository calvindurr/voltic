from django.contrib import admin
from .models import Site, Portfolio, PortfolioSite, ForecastJob, ForecastResult


@admin.register(Site)
class SiteAdmin(admin.ModelAdmin):
    list_display = ['name', 'site_type', 'latitude', 'longitude', 'capacity_mw', 'created_at']
    list_filter = ['site_type', 'created_at']
    search_fields = ['name', 'site_type']
    ordering = ['name']
    readonly_fields = ['created_at', 'updated_at']


class PortfolioSiteInline(admin.TabularInline):
    model = PortfolioSite
    extra = 0
    readonly_fields = ['added_at']


@admin.register(Portfolio)
class PortfolioAdmin(admin.ModelAdmin):
    list_display = ['name', 'get_site_count', 'get_total_capacity', 'created_at']
    search_fields = ['name', 'description']
    ordering = ['name']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [PortfolioSiteInline]
    
    def get_site_count(self, obj):
        return obj.get_site_count()
    get_site_count.short_description = 'Sites Count'
    
    def get_total_capacity(self, obj):
        return f"{obj.get_total_capacity()} MW"
    get_total_capacity.short_description = 'Total Capacity'


@admin.register(ForecastJob)
class ForecastJobAdmin(admin.ModelAdmin):
    list_display = ['id', 'portfolio', 'status', 'created_at', 'completed_at']
    list_filter = ['status', 'created_at']
    search_fields = ['portfolio__name']
    ordering = ['-created_at']
    readonly_fields = ['id', 'created_at', 'completed_at']


@admin.register(ForecastResult)
class ForecastResultAdmin(admin.ModelAdmin):
    list_display = ['job', 'site', 'forecast_datetime', 'predicted_generation_mwh', 'created_at']
    list_filter = ['forecast_datetime', 'created_at', 'site__site_type']
    search_fields = ['job__id', 'site__name']
    ordering = ['forecast_datetime']
    readonly_fields = ['created_at']
