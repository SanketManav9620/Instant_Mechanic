import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Failed to Load Data',
  message = 'An unexpected error occurred while communicating with the operations server.',
  onRetry,
  className = ''
}) => {
  return (
    <div
      className={`p-6 rounded-2xl bg-rose-950/20 border border-rose-500/30 text-rose-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 backdrop-blur-sm ${className}`}
    >
      <div className="flex items-start space-x-3">
        <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 shrink-0 mt-0.5">
          <AlertCircle className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-rose-200">{title}</h4>
          <p className="text-xs text-rose-300/80 mt-1 leading-relaxed">{message}</p>
        </div>
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          className="self-start sm:self-center px-3.5 py-2 rounded-xl bg-rose-500/25 hover:bg-rose-500/40 text-rose-200 text-xs font-bold flex items-center space-x-2 transition active:scale-95 border border-rose-500/40 shrink-0"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Retry Request</span>
        </button>
      )}
    </div>
  );
};

export default ErrorState;
