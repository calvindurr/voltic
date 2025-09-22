import React from 'react';
import './SkeletonLoader.css';

interface SkeletonLoaderProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  count?: number;
  className?: string;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = '20px',
  borderRadius = '4px',
  count = 1,
  className = '',
}) => {
  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius,
  };

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`skeleton-loader ${className}`}
          style={style}
        />
      ))}
    </>
  );
};

// Predefined skeleton components for common use cases
export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`skeleton-card ${className}`}>
    <SkeletonLoader height="200px" borderRadius="8px" />
    <div className="skeleton-card__content">
      <SkeletonLoader height="24px" width="70%" />
      <SkeletonLoader height="16px" width="100%" />
      <SkeletonLoader height="16px" width="80%" />
    </div>
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number; columns?: number }> = ({ 
  rows = 5, 
  columns = 4 
}) => (
  <div className="skeleton-table">
    {/* Header */}
    <div className="skeleton-table__row">
      {Array.from({ length: columns }).map((_, index) => (
        <SkeletonLoader key={index} height="20px" width="80%" />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="skeleton-table__row">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <SkeletonLoader key={colIndex} height="16px" width="90%" />
        ))}
      </div>
    ))}
  </div>
);

export const SkeletonList: React.FC<{ items?: number }> = ({ items = 5 }) => (
  <div className="skeleton-list">
    {Array.from({ length: items }).map((_, index) => (
      <div key={index} className="skeleton-list__item">
        <SkeletonLoader width="40px" height="40px" borderRadius="50%" />
        <div className="skeleton-list__content">
          <SkeletonLoader height="18px" width="60%" />
          <SkeletonLoader height="14px" width="40%" />
        </div>
      </div>
    ))}
  </div>
);

export default SkeletonLoader;