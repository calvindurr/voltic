import React from 'react';
import { ForecastJob } from '../../types';

interface JobStatusIndicatorProps {
  job: ForecastJob;
}

export const JobStatusIndicator: React.FC<JobStatusIndicatorProps> = ({ job }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'running':
        return '🔄';
      case 'completed':
        return '✅';
      case 'failed':
        return '❌';
      default:
        return '❓';
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'status-pending';
      case 'running':
        return 'status-running';
      case 'completed':
        return 'status-completed';
      case 'failed':
        return 'status-failed';
      default:
        return 'status-unknown';
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getElapsedTime = () => {
    const startTime = new Date(job.created_at);
    const endTime = job.completed_at ? new Date(job.completed_at) : new Date();
    const elapsed = endTime.getTime() - startTime.getTime();
    
    const seconds = Math.floor(elapsed / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  return (
    <div className={`job-status-indicator ${getStatusClass(job.status)}`} role="status">
      <div className="status-header">
        <span className="status-icon">{getStatusIcon(job.status)}</span>
        <span className="status-text">
          Forecast Job: <strong>{job.status.toUpperCase()}</strong>
        </span>
      </div>

      <div className="status-details">
        <div className="detail-item">
          <span className="label">Job ID:</span>
          <span className="value">{job.id}</span>
        </div>
        
        <div className="detail-item">
          <span className="label">Started:</span>
          <span className="value">{formatDateTime(job.created_at)}</span>
        </div>

        {job.completed_at && (
          <div className="detail-item">
            <span className="label">Completed:</span>
            <span className="value">{formatDateTime(job.completed_at)}</span>
          </div>
        )}

        <div className="detail-item">
          <span className="label">Duration:</span>
          <span className="value">{getElapsedTime()}</span>
        </div>

        {job.status === 'running' && (
          <div className="progress-indicator">
            <div className="progress-bar" role="progressbar">
              <div className="progress-fill"></div>
            </div>
            <span className="progress-text">Processing...</span>
          </div>
        )}

        {job.status === 'failed' && job.error_message && (
          <div className="error-details">
            <span className="label">Error:</span>
            <span className="error-message">{job.error_message}</span>
          </div>
        )}
      </div>
    </div>
  );
};