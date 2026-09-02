import React from 'react';
import { LucideIcon, Inbox, RotateCcw } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Records Found',
  message = 'There are no items matching the active filters or query parameters.',
  icon: Icon = Inbox,
  actionLabel,
  onAction,
  className = ''
}) => {
  return (
    <div
      className={`p-10 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-center flex flex-col items-center justify-center space-y-3 ${className}`}
    >
      <div className="h-12 w-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500 shadow-inner">
        <Icon className="h-6 w-6" />
      </div>

      <div className="max-w-sm space-y-1">
        <h4 className="text-sm font-bold text-white tracking-wide">{title}</h4>
        <p className="text-xs text-slate-400 leading-relaxed">{message}</p>
      </div>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition active:scale-95 border border-slate-700"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
};

export default EmptyState;
