import React from 'react';
import { ApiError } from '../../types';
import { getErrorMessage, getFieldErrors, isNetworkError, isValidationError } from '../../utils/errorUtils';
import './ErrorMessage.css';

interface ErrorMessageProps {
  error: ApiError | Error | string | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
  variant?: 'inline' | 'banner' | 'modal';
  showRetry?: boolean;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  onRetry,
  onDismiss,
  className = '',
  variant = 'inline',
  showRetry = true,
}) => {
  if (!error) return null;

  const message = getErrorMessage(error);
  const fieldErrors = typeof error === 'object' && 'error' in error ? getFieldErrors(error) : null;
  const isNetwork = typeof error === 'object' && 'error' in error ? isNetworkError(error) : false;
  const isValidation = typeof error === 'object' && 'error' in error ? isValidationError(error) : false;

  const getIcon = () => {
    if (isNetwork) return '🌐';
    if (isValidation) return '⚠️';
    return '❌';
  };

  const getTitle = () => {
    if (isNetwork) return 'Connection Error';
    if (isValidation) return 'Validation Error';
    return 'Error';
  };

  const errorClasses = [
    'error-message',
    `error-message--${variant}`,
    isNetwork ? 'error-message--network' : '',
    isValidation ? 'error-message--validation' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={errorClasses} role="alert">
      <div className="error-message__content">
        <div className="error-message__header">
          <span className="error-message__icon">{getIcon()}</span>
          <h4 className="error-message__title">{getTitle()}</h4>
          {onDismiss && (
            <button
              className="error-message__dismiss"
              onClick={onDismiss}
              aria-label="Dismiss error"
            >
              ×
            </button>
          )}
        </div>
        
        <p className="error-message__text">{message}</p>
        
        {fieldErrors && (
          <div className="error-message__field-errors">
            <h5>Please fix the following issues:</h5>
            <ul>
              {Object.entries(fieldErrors).map(([field, errors]) => (
                <li key={field}>
                  <strong>{field}:</strong> {errors.join(', ')}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {showRetry && onRetry && (isNetwork || !isValidation) && (
          <div className="error-message__actions">
            <button
              className="error-message__retry"
              onClick={onRetry}
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;