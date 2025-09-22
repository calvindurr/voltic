import React from 'react';
import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'white';
  text?: string;
  overlay?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color = 'primary',
  text,
  overlay = false,
}) => {
  const spinnerClasses = [
    'loading-spinner',
    `loading-spinner--${size}`,
    `loading-spinner--${color}`,
  ].join(' ');

  const content = (
    <div className="loading-spinner__container">
      <div className={spinnerClasses}>
        <div className="loading-spinner__circle"></div>
      </div>
      {text && <p className="loading-spinner__text">{text}</p>}
    </div>
  );

  if (overlay) {
    return (
      <div className="loading-spinner__overlay">
        {content}
      </div>
    );
  }

  return content;
};

export default LoadingSpinner;