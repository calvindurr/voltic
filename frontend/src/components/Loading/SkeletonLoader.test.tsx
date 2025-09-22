import React from 'react';
import { render, screen } from '@testing-library/react';
import SkeletonLoader, { SkeletonCard, SkeletonTable, SkeletonList } from './SkeletonLoader';

describe('SkeletonLoader', () => {
  it('renders single skeleton with default props', () => {
    render(<SkeletonLoader />);
    
    const skeleton = document.querySelector('.skeleton-loader');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveStyle({
      width: '100%',
      height: '20px',
      borderRadius: '4px',
    });
  });

  it('renders multiple skeletons when count is specified', () => {
    render(<SkeletonLoader count={3} />);
    
    const skeletons = document.querySelectorAll('.skeleton-loader');
    expect(skeletons).toHaveLength(3);
  });

  it('applies custom dimensions', () => {
    render(<SkeletonLoader width="200px" height="50px" borderRadius="8px" />);
    
    const skeleton = document.querySelector('.skeleton-loader');
    expect(skeleton).toHaveStyle({
      width: '200px',
      height: '50px',
      borderRadius: '8px',
    });
  });

  it('applies custom className', () => {
    render(<SkeletonLoader className="custom-skeleton" />);
    
    const skeleton = document.querySelector('.skeleton-loader');
    expect(skeleton).toHaveClass('custom-skeleton');
  });

  it('handles numeric dimensions', () => {
    render(<SkeletonLoader width={150} height={30} borderRadius={6} />);
    
    const skeleton = document.querySelector('.skeleton-loader');
    expect(skeleton).toHaveStyle({
      width: '150px',
      height: '30px',
      borderRadius: '6px',
    });
  });
});

describe('SkeletonCard', () => {
  it('renders skeleton card structure', () => {
    render(<SkeletonCard />);
    
    const card = document.querySelector('.skeleton-card');
    expect(card).toBeInTheDocument();
    
    const content = document.querySelector('.skeleton-card__content');
    expect(content).toBeInTheDocument();
    
    const skeletons = document.querySelectorAll('.skeleton-loader');
    expect(skeletons.length).toBeGreaterThan(1);
  });

  it('applies custom className to card', () => {
    render(<SkeletonCard className="custom-card" />);
    
    const card = document.querySelector('.skeleton-card');
    expect(card).toHaveClass('custom-card');
  });
});

describe('SkeletonTable', () => {
  it('renders skeleton table with default dimensions', () => {
    render(<SkeletonTable />);
    
    const table = document.querySelector('.skeleton-table');
    expect(table).toBeInTheDocument();
    
    const rows = document.querySelectorAll('.skeleton-table__row');
    expect(rows).toHaveLength(6); // 1 header + 5 data rows
  });

  it('renders custom number of rows and columns', () => {
    render(<SkeletonTable rows={3} columns={2} />);
    
    const rows = document.querySelectorAll('.skeleton-table__row');
    expect(rows).toHaveLength(4); // 1 header + 3 data rows
    
    // Check that each row has the correct number of skeletons
    rows.forEach(row => {
      const skeletons = row.querySelectorAll('.skeleton-loader');
      expect(skeletons).toHaveLength(2);
    });
  });
});

describe('SkeletonList', () => {
  it('renders skeleton list with default items', () => {
    render(<SkeletonList />);
    
    const list = document.querySelector('.skeleton-list');
    expect(list).toBeInTheDocument();
    
    const items = document.querySelectorAll('.skeleton-list__item');
    expect(items).toHaveLength(5);
  });

  it('renders custom number of items', () => {
    render(<SkeletonList items={3} />);
    
    const items = document.querySelectorAll('.skeleton-list__item');
    expect(items).toHaveLength(3);
  });

  it('renders list item structure correctly', () => {
    render(<SkeletonList items={1} />);
    
    const item = document.querySelector('.skeleton-list__item');
    expect(item).toBeInTheDocument();
    
    const content = document.querySelector('.skeleton-list__content');
    expect(content).toBeInTheDocument();
    
    const skeletons = item?.querySelectorAll('.skeleton-loader');
    expect(skeletons?.length).toBeGreaterThan(1);
  });
});