import React from 'react';
import { render, screen } from '@testing-library/react';
import LoadingSpinner from './LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders with default props', () => {
    render(<LoadingSpinner />);
    
    const spinner = document.querySelector('.loading-spinner');
    expect(spinner).toHaveClass('loading-spinner--medium');
    expect(spinner).toHaveClass('loading-spinner--primary');
  });

  it('renders with custom size', () => {
    render(<LoadingSpinner size="large" />);
    
    const spinner = document.querySelector('.loading-spinner');
    expect(spinner).toHaveClass('loading-spinner--large');
  });

  it('renders with custom color', () => {
    render(<LoadingSpinner color="secondary" />);
    
    const spinner = document.querySelector('.loading-spinner');
    expect(spinner).toHaveClass('loading-spinner--secondary');
  });

  it('renders with text', () => {
    render(<LoadingSpinner text="Loading data..." />);
    
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('renders as overlay when overlay prop is true', () => {
    render(<LoadingSpinner overlay={true} />);
    
    const overlay = document.querySelector('.loading-spinner__overlay');
    expect(overlay).toBeInTheDocument();
  });

  it('does not render overlay by default', () => {
    render(<LoadingSpinner />);
    
    const overlay = document.querySelector('.loading-spinner__overlay');
    expect(overlay).not.toBeInTheDocument();
  });

  it('combines all props correctly', () => {
    render(
      <LoadingSpinner 
        size="small" 
        color="white" 
        text="Please wait..." 
        overlay={true} 
      />
    );
    
    const spinner = document.querySelector('.loading-spinner');
    expect(spinner).toHaveClass('loading-spinner--small');
    expect(spinner).toHaveClass('loading-spinner--white');
    expect(screen.getByText('Please wait...')).toBeInTheDocument();
    
    const overlay = document.querySelector('.loading-spinner__overlay');
    expect(overlay).toBeInTheDocument();
  });
});