import React from 'react';

interface LoadingSkeletonProps {
  className?: string;
  variant?: 'card' | 'table-row' | 'chart' | 'text' | 'circle';
  count?: number;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  className = '',
  variant = 'card',
  count = 1
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'circle':
        return 'rounded-full bg-slate-800/70 animate-pulse';
      case 'text':
        return 'h-4 rounded-md bg-slate-800/70 animate-pulse';
      case 'table-row':
        return 'h-12 w-full rounded-lg bg-slate-900/60 border border-slate-800/50 animate-pulse';
      case 'chart':
        return 'h-72 w-full rounded-2xl bg-slate-900/60 border border-slate-800/80 animate-pulse';
      case 'card':
      default:
        return 'h-28 w-full rounded-2xl bg-slate-900/60 border border-slate-800/80 animate-pulse';
    }
  };

  if (count > 1) {
    return (
      <>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={`${getVariantStyles()} ${className}`} />
        ))}
      </>
    );
  }

  return <div className={`${getVariantStyles()} ${className}`} />;
};

export default LoadingSkeleton;
