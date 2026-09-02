import React from 'react';
import { BookingStatus, MechanicStatus } from '../../types';

interface StatusBadgeProps {
  status: BookingStatus | MechanicStatus | string;
  className?: string;
  showRipple?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className = '',
  showRipple = true
}) => {
  const getStyle = (st: string) => {
    switch (st) {
      // Booking Statuses
      case 'Pending':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'Assigned':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      case 'Mechanic On The Way':
      case 'on_the_way':
        return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
      case 'In Progress':
      case 'busy':
        return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';
      case 'Completed':
      case 'available':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'Cancelled':
      case 'offline':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-500/15 text-slate-400 border-slate-500/30';
    }
  };

  const formatLabel = (st: string) => {
    if (st === 'on_the_way') return 'On The Way';
    if (st === 'available') return 'Available';
    if (st === 'busy') return 'Busy';
    if (st === 'offline') return 'Offline';
    return st;
  };

  const isActiveWorkflow = [
    'In Progress',
    'busy',
    'Mechanic On The Way',
    'on_the_way',
    'Assigned'
  ].includes(status);

  return (
    <span
      className={`relative inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border tracking-wide transition-all duration-200 ${getStyle(
        status
      )} ${className}`}
    >
      {/* Live Beacon Ripple for active statuses */}
      {showRipple && isActiveWorkflow && (
        <span className="relative flex h-2 w-2 mr-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
        </span>
      )}
      {(!showRipple || !isActiveWorkflow) && (
        <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80" />
      )}
      {formatLabel(status)}
    </span>
  );
};

export default StatusBadge;
