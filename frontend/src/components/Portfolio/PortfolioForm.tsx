import React, { useState, useEffect } from 'react';
import { Portfolio, CreatePortfolioRequest } from '../../types';
import './PortfolioForm.css';

export interface PortfolioFormProps {
  portfolio?: Portfolio | null;
  onSubmit: (portfolioData: CreatePortfolioRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export interface PortfolioFormData {
  name: string;
  description: string;
}

export interface PortfolioFormErrors {
  name?: string;
  description?: string;
  general?: string;
}

export const PortfolioForm: React.FC<PortfolioFormProps> = ({
  portfolio,
  onSubmit,
  onCancel,
  isLoading = false,
  error = null,
}) => {
  const [formData, setFormData] = useState<PortfolioFormData>({
    name: '',
    description: '',
  });

  const [errors, setErrors] = useState<PortfolioFormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Initialize form data when portfolio prop changes
  useEffect(() => {
    if (portfolio) {
      setFormData({
        name: portfolio.name,
        description: portfolio.description,
      });
    } else {
      setFormData({
        name: '',
        description: '',
      });
    }
    setErrors({});
    setTouched({});
  }, [portfolio]);

  // Validation functions
  const validateName = (name: string): string | undefined => {
    if (!name.trim()) {
      return 'Portfolio name is required';
    }
    if (name.trim().length < 2) {
      return 'Portfolio name must be at least 2 characters';
    }
    if (name.trim().length > 200) {
      return 'Portfolio name must be less than 200 characters';
    }
    return undefined;
  };

  const validateDescription = (description: string): string | undefined => {
    if (description.length > 1000) {
      return 'Description must be less than 1000 characters';
    }
    return undefined;
  };

  // Validate all fields
  const validateForm = (): PortfolioFormErrors => {
    return {
      name: validateName(formData.name),
      description: validateDescription(formData.description),
    };
  };

  // Handle field changes
  const handleFieldChange = (field: keyof PortfolioFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Handle field blur (for validation)
  const handleFieldBlur = (field: keyof PortfolioFormData) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // Validate this field
    let fieldError: string | undefined;
    switch (field) {
      case 'name':
        fieldError = validateName(formData.name);
        break;
      case 'description':
        fieldError = validateDescription(formData.description);
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
      description: true,
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
      const submitData: CreatePortfolioRequest = {
        name: formData.name.trim(),
        description: formData.description.trim(),
      };

      await onSubmit(submitData);
    } catch (err) {
      // Handle submission error
      setErrors({ general: 'Failed to save portfolio. Please try again.' });
    }
  };

  const isFormValid = () => {
    const formErrors = validateForm();
    return !Object.values(formErrors).some(error => error !== undefined);
  };

  return (
    <div className="portfolio-form">
      <form onSubmit={handleSubmit} noValidate>
        {/* General error display */}
        {(error || errors.general) && (
          <div className="form-error-banner">
            {error || errors.general}
          </div>
        )}

        {/* Portfolio Name */}
        <div className="form-group">
          <label htmlFor="portfolioName" className="form-label">
            Portfolio Name <span className="required">*</span>
          </label>
          <input
            id="portfolioName"
            type="text"
            className={`form-input ${errors.name && touched.name ? 'error' : ''}`}
            value={formData.name}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            onBlur={() => handleFieldBlur('name')}
            placeholder="Enter portfolio name"
            disabled={isLoading}
            maxLength={200}
          />
          {errors.name && touched.name && (
            <div className="form-error">{errors.name}</div>
          )}
        </div>

        {/* Portfolio Description */}
        <div className="form-group">
          <label htmlFor="portfolioDescription" className="form-label">
            Description
          </label>
          <textarea
            id="portfolioDescription"
            className={`form-input form-textarea ${errors.description && touched.description ? 'error' : ''}`}
            value={formData.description}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            onBlur={() => handleFieldBlur('description')}
            placeholder="Enter portfolio description (optional)"
            disabled={isLoading}
            maxLength={1000}
            rows={4}
          />
          {errors.description && touched.description && (
            <div className="form-error">{errors.description}</div>
          )}
          <div className="character-count">
            {formData.description.length}/1000 characters
          </div>
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
                {portfolio ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              portfolio ? 'Update Portfolio' : 'Create Portfolio'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PortfolioForm;