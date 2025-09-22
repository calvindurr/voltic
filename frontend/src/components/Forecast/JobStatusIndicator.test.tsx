import React from 'react';
import { render, screen } from '@testing-library/react';
import { JobStatusIndicator } from './JobStatusIndicator';
import { ForecastJob } from '../../types';

describe('JobStatusIndicator', () => {
  const baseJob: Omit<ForecastJob, 'status'> = {
    id: 'job-123',
    portfolio: 1,
    created_at: '2024-01-01T12:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders pending job status correctly', () => {
    const pendingJob: ForecastJob = {
      ...baseJob,
      status: 'pending',
    };

    render(<JobStatusIndicator job={pendingJob} />);

    expect(screen.getByText('⏳')).toBeInTheDocument();
    expect(screen.getByText(/PENDING/)).toBeInTheDocument();
    expect(screen.getByText('job-123')).toBeInTheDocument();
    expect(screen.getByText(/1\/1\/2024/)).toBeInTheDocument();
  });

  it('renders running job status correctly', () => {
    const runningJob: ForecastJob = {
      ...baseJob,
      status: 'running',
    };

    render(<JobStatusIndicator job={runningJob} />);

    expect(screen.getByText('🔄')).toBeInTheDocument();
    expect(screen.getByText(/RUNNING/)).toBeInTheDocument();
    expect(screen.getByText('Processing...')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders completed job status correctly', () => {
    const completedJob: ForecastJob = {
      ...baseJob,
      status: 'completed',
      completed_at: '2024-01-01T12:05:30Z',
    };

    render(<JobStatusIndicator job={completedJob} />);

    expect(screen.getByText('✅')).toBeInTheDocument();
    expect(screen.getByText(/COMPLETED/)).toBeInTheDocument();
    expect(screen.getAllByText(/1\/1\/2024/)).toHaveLength(2); // Started and completed times
  });

  it('renders failed job status with error message', () => {
    const failedJob: ForecastJob = {
      ...baseJob,
      status: 'failed',
      completed_at: '2024-01-01T12:02:15Z',
      error_message: 'Network timeout occurred',
    };

    render(<JobStatusIndicator job={failedJob} />);

    expect(screen.getByText('❌')).toBeInTheDocument();
    expect(screen.getByText(/FAILED/)).toBeInTheDocument();
    expect(screen.getByText('Network timeout occurred')).toBeInTheDocument();
  });

  it('calculates elapsed time correctly for completed job', () => {
    const completedJob: ForecastJob = {
      ...baseJob,
      status: 'completed',
      created_at: '2024-01-01T12:00:00Z',
      completed_at: '2024-01-01T12:05:30Z', // 5 minutes 30 seconds later
    };

    render(<JobStatusIndicator job={completedJob} />);

    expect(screen.getByText('5m 30s')).toBeInTheDocument();
  });

  it('calculates elapsed time for running job using current time', () => {
    const runningJob: ForecastJob = {
      ...baseJob,
      status: 'running',
      created_at: new Date(Date.now() - 225000).toISOString(), // 3 minutes 45 seconds ago
    };

    render(<JobStatusIndicator job={runningJob} />);

    // Just check that some duration is displayed
    expect(screen.getByText(/Duration:/)).toBeInTheDocument();
    expect(screen.getByText(/\d+[hms]/)).toBeInTheDocument(); // Should show some time format
  });

  it('formats elapsed time with hours correctly', () => {
    const completedJob: ForecastJob = {
      ...baseJob,
      status: 'completed',
      created_at: '2024-01-01T10:00:00Z',
      completed_at: '2024-01-01T12:35:20Z', // 2 hours 35 minutes 20 seconds later
    };

    render(<JobStatusIndicator job={completedJob} />);

    // Check that duration is displayed with hours format
    expect(screen.getByText(/Duration:/)).toBeInTheDocument();
    expect(screen.getByText(/\d+h \d+m \d+s/)).toBeInTheDocument();
  });

  it('applies correct CSS classes for different statuses', () => {
    const { rerender } = render(
      <JobStatusIndicator job={{ ...baseJob, status: 'pending' }} />
    );
    expect(screen.getByRole('status')).toHaveClass('status-pending');

    rerender(<JobStatusIndicator job={{ ...baseJob, status: 'running' }} />);
    expect(screen.getByRole('status')).toHaveClass('status-running');

    rerender(<JobStatusIndicator job={{ ...baseJob, status: 'completed' }} />);
    expect(screen.getByRole('status')).toHaveClass('status-completed');

    rerender(<JobStatusIndicator job={{ ...baseJob, status: 'failed' }} />);
    expect(screen.getByRole('status')).toHaveClass('status-failed');
  });

  it('handles unknown status gracefully', () => {
    const unknownJob = {
      ...baseJob,
      status: 'unknown' as any,
    };

    render(<JobStatusIndicator job={unknownJob} />);

    expect(screen.getByText('❓')).toBeInTheDocument();
    expect(screen.getByText(/UNKNOWN/)).toBeInTheDocument();
  });

  it('does not show completed time for non-completed jobs', () => {
    const pendingJob: ForecastJob = {
      ...baseJob,
      status: 'pending',
    };

    render(<JobStatusIndicator job={pendingJob} />);

    expect(screen.queryByText(/Completed:/)).not.toBeInTheDocument();
  });

  it('does not show error message for successful jobs', () => {
    const completedJob: ForecastJob = {
      ...baseJob,
      status: 'completed',
      completed_at: '2024-01-01T12:05:00Z',
    };

    render(<JobStatusIndicator job={completedJob} />);

    expect(screen.queryByText(/Error:/)).not.toBeInTheDocument();
  });

  it('shows progress indicator only for running jobs', () => {
    const { rerender } = render(
      <JobStatusIndicator job={{ ...baseJob, status: 'running' }} />
    );
    expect(screen.getByText('Processing...')).toBeInTheDocument();

    rerender(<JobStatusIndicator job={{ ...baseJob, status: 'pending' }} />);
    expect(screen.queryByText('Processing...')).not.toBeInTheDocument();

    rerender(<JobStatusIndicator job={{ ...baseJob, status: 'completed' }} />);
    expect(screen.queryByText('Processing...')).not.toBeInTheDocument();
  });
});