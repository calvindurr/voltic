import React, { useState, useEffect } from 'react';
import { Site, CreateSiteRequest } from '../../types';
import './SiteForm.css';

export interface SiteFormProps {
  site?: Site | null;
  onSubmit: (siteData: CreateSiteRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export interface SiteFormData {
  name: string;
  site_type: 'solar' | 'wind' | 'hydro';
  latitude: string;
  longitude: string;
  capacity_mw: string;
}

export interface SiteFormErrors {
  name?: string;
  site_type?: string;
  latitude?: string;
  longitude?: string;
  capacity_mw?: string;
  general?: string;
}

export const SiteForm: React.FC<SiteFormProps> = ({
  site,
  onSubmit,
  onCancel,
  isLoading = false,
  error = null,
}) => {
  const [formData, setFormData] = useState<SiteFormData>({
    name: '',
    site_type: 'solar',
    latitude: '',
    longitude: '',
    capacity_mw: '',
  });

  const [errors, setErrors] = useState<SiteFormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Initialize form data when site prop changes
  useEffect(() => {
    if (site) {
      setFormData({
        name: site.name,
        site_type: site.site_type,
        latitude: site.latitude.toString(),
        longitude: site.longitude.toString(),
        capacity_mw: site.capacity_mw?.toString() || '',
      });
    } else {
      setFormData({
        name: '',
        site_type: 'solar',
        latitude: '',
        longitude: '',
        capacity_mw: '',
      });
    }
    setErrors({});
    setTouched({});
  }, [site]);

  // Validation functions
  const validateName = (name: string): string | undefined => {
    if (!name.trim()) {
      return 'Site name is required';
    }
    if (name.trim().length < 2) {
      return 'Site name must be at least 2 characters';
    }
    if (name.trim().length > 200) {
      return 'Site name must be less than 200 characters';
    }
    return undefined;
  };

  const validateLatitude = (lat: string): string | undefined => {
    if (!lat.trim()) {
      return 'Latitude is required';
    }
    const latNum = parseFloat(lat);
    if (isNaN(latNum)) {
      return 'Latitude must be a valid number';
    }
    if (latNum < -90 || latNum > 90) {
      return 'Latitude must be between -90 and 90';
    }
    return undefined;
  };

  const validateLongitude = (lng: string): string | undefined => {
    if (!lng.trim()) {
      return 'Longitude is required';
    }
    const lngNum = parseFloat(lng);
    if (isNaN(lngNum)) {
      return 'Longitude must be a valid number';
    }
    if (lngNum < -180 || lngNum > 180) {
      return 'Longitude must be between -180 and 180';
    }
    return undefined;
  };

  const validateCapacity = (capacity: string): string | undefined => {
    if (capacity.trim() && capacity.trim() !== '') {
      const capacityNum = parseFloat(capacity);
      if (isNaN(capacityNum)) {
        return 'Capacity must be a valid number';
      }
      if (capacityNum < 0) {
        return 'Capacity must be positive';
      }
      if (capacityNum > 10000) {
        return 'Capacity must be less than 10,000 MW';
      }
    }
    return undefined;
  };

  // Validate all fields
  const validateForm = (): SiteFormErrors => {
    return {
      name: validateName(formData.name),
      latitude: validateLatitude(formData.latitude),
      longitude: validateLongitude(formData.longitude),
      capacity_mw: validateCapacity(formData.capacity_mw),
    };
  };

  // Handle field changes
  const handleFieldChange = (field: keyof SiteFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Handle field blur (for validation)
  const handleFieldBlur = (field: keyof SiteFormData) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // Validate this field
    let fieldError: string | undefined;
    switch (field) {
      case 'name':
        fieldError = validateName(formData.name);
        break;
      case 'latitude':
        fieldError = validateLatitude(formData.latitude);
        break;
      case 'longitude':
        fieldError = validateLongitude(formData.longitude);
        break;
      case 'capacity_mw':
        fieldError = validateCapacity(formData.capacity_mw);
        break;
    }
    
    setErrors(prev => ({ ...prev, [field]: fieldError }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    setTouched({
      name: true,
      site_type: true,
      latitude: true,
      longitude: true,
      capacity_mw: true,
    });

    // Validate form
    const formErrors = validateForm();
    const hasErrors = Object.values(formErrors).some(error => error !== undefined);
    
    if (hasErrors) {
      setErrors(formErrors);
      return;
    }

    try {
      // Clear any previous errors
      setErrors({});
      
      // Prepare submission data
      const submitData: CreateSiteRequest = {
        name: formData.name.trim(),
        site_type: formData.site_type,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        capacity_mw: formData.capacity_mw.trim() ? parseFloat(formData.capacity_mw) : undefined,
      };

      await onSubmit(submitData);
    } catch (err) {
      // Handle submission error
      setErrors({ general: 'Failed to save site. Please try again.' });
    }
  };

  const isFormValid = () => {
    const formErrors = validateForm();
    return !Object.values(formErrors).some(error => error !== undefined);
  };

  return (
    <div className="site-form">
      <form onSubmit={handleSubmit} noValidate>
        {/* General error display */}
        {(error || errors.general) && (
          <div className="form-error-banner">
            {error || errors.general}
          </div>
        )}

        {/* Site Name */}
        <div className="form-group">
          <label htmlFor="siteName" className="form-label">
            Site Name <span className="required">*</span>
          </label>
          <input
            id="siteName"
            type="text"
            className={`form-input ${errors.name && touched.name ? 'error' : ''}`}
            value={formData.name}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            onBlur={() => handleFieldBlur('name')}
            placeholder="Enter site name"
            disabled={isLoading}
            maxLength={200}
          />
          {errors.name && touched.name && (
            <div className="form-error">{errors.name}</div>
          )}
        </div>

        {/* Site Type */}
        <div className="form-group">
          <label htmlFor="siteType" className="form-label">
            Site Type <span className="required">*</span>
          </label>
          <select
            id="siteType"
            className="form-input"
            value={formData.site_type}
            onChange={(e) => handleFieldChange('site_type', e.target.value)}
            disabled={isLoading}
          >
            <option value="solar">Solar</option>
            <option value="wind">Wind</option>
            <option value="hydro">Hydro</option>
          </select>
        </div>

        {/* Coordinates Row */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="latitude" className="form-label">
              Latitude <span className="required">*</span>
            </label>
            <input
              id="latitude"
              type="number"
              step="any"
              className={`form-input ${errors.latitude && touched.latitude ? 'error' : ''}`}
              value={formData.latitude}
              onChange={(e) => handleFieldChange('latitude', e.target.value)}
              onBlur={() => handleFieldBlur('latitude')}
              placeholder="e.g., 40.7128"
              disabled={isLoading}
              min="-90"
              max="90"
            />
            {errors.latitude && touched.latitude && (
              <div className="form-error">{errors.latitude}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="longitude" className="form-label">
              Longitude <span className="required">*</span>
            </label>
            <input
              id="longitude"
              type="number"
              step="any"
              className={`form-input ${errors.longitude && touched.longitude ? 'error' : ''}`}
              value={formData.longitude}
              onChange={(e) => handleFieldChange('longitude', e.target.value)}
              onBlur={() => handleFieldBlur('longitude')}
              placeholder="e.g., -74.0060"
              disabled={isLoading}
              min="-180"
              max="180"
            />
            {errors.longitude && touched.longitude && (
              <div className="form-error">{errors.longitude}</div>
            )}
          </div>
        </div>

        {/* Capacity */}
        <div className="form-group">
          <label htmlFor="capacity" className="form-label">
            Capacity (MW)
          </label>
          <input
            id="capacity"
            type="number"
            step="0.1"
            min="0"
            max="10000"
            className={`form-input ${errors.capacity_mw && touched.capacity_mw ? 'error' : ''}`}
            value={formData.capacity_mw}
            onChange={(e) => handleFieldChange('capacity_mw', e.target.value)}
            onBlur={() => handleFieldBlur('capacity_mw')}
            placeholder="Optional capacity in MW"
            disabled={isLoading}
          />
          {errors.capacity_mw && touched.capacity_mw && (
            <div className="form-error">{errors.capacity_mw}</div>
          )}
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading || !isFormValid()}
          >
            {isLoading ? (
              <>
                <span className="loading-spinner"></span>
                {site ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              site ? 'Update Site' : 'Create Site'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SiteForm;