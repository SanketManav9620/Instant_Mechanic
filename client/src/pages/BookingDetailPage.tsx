import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useBookingDetail, useUpdateBookingStatus, useMechanics, useAssignMechanic } from '../hooks/useOperationsQueries';
import { formatCurrencyINR, formatDate } from '../lib/utils';
import { BookingStatus } from '../types';
import { StatusBadge } from '../components/dashboard/StatusBadge';
import {
  ArrowLeft,
  Car,
  User,
  Wrench,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  ArrowRight,
  ShieldCheck,
  Send
} from 'lucide-react';
import { toast } from 'sonner';

const NEXT_STATUS_CHAIN: Record<BookingStatus, BookingStatus | null> = {
  Pending: 'Assigned',
  Assigned: 'Mechanic On The Way',
  'Mechanic On The Way': 'In Progress',
  'In Progress': 'Completed',
  Completed: null,
  Cancelled: null
};

const ALL_STATUSES: BookingStatus[] = [
  'Pending',
  'Assigned',
  'Mechanic On The Way',
  'In Progress',
  'Completed',
  'Cancelled'
];

export const BookingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: booking, isLoading, isError, refetch } = useBookingDetail(id);
  const updateStatusMutation = useUpdateBookingStatus();
  const assignMechanicMutation = useAssignMechanic();

  const { data: mechanicsData } = useMechanics();
  const mechanics = mechanicsData?.data || [];

  const [customNote, setCustomNote] = useState('');
  const [selectedMechanicId, setSelectedMechanicId] = useState('');

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-500 font-medium animate-pulse">
        Loading booking details from MongoDB...
      </div>
    );
  }

  if (isError || !booking) {
    return (
      <div className="p-8 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs space-y-3">
        <div className="flex items-center space-x-2 font-bold text-sm">
          <AlertCircle className="h-5 w-5" />
          <span>Booking Not Found</span>
        </div>
        <p>The requested booking ID does not exist or could not be loaded.</p>
        <Link
          to="/bookings"
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Return to Bookings Roster</span>
        </Link>
      </div>
    );
  }

  const nextStatus = NEXT_STATUS_CHAIN[booking.status];

  // Handler for advancing one step
  const handleAdvanceStatus = () => {
    if (!nextStatus) return;

    updateStatusMutation.mutate(
      {
        id: booking._id,
        status: nextStatus,
        note: customNote.trim() || `Manual advance to ${nextStatus} via ops control`
      },
      {
        onSuccess: () => {
          setCustomNote('');
          toast.success(`Booking ${booking.bookingId} advanced to "${nextStatus}"`);
          refetch();
        },
        onError: (err: any) => {
          toast.error(`Failed to update status: ${err.message}`);
        }
      }
    );
  };

  // Handler for manual status select
  const handleManualStatusChange = (newStatus: BookingStatus) => {
    updateStatusMutation.mutate(
      {
        id: booking._id,
        status: newStatus,
        note: customNote.trim() || `Manual transition to ${newStatus} via dropdown`
      },
      {
        onSuccess: () => {
          setCustomNote('');
          toast.success(`Status updated to "${newStatus}"`);
          refetch();
        }
      }
    );
  };

  // Handler for assigning mechanic
  const handleAssignMechanic = () => {
    if (!selectedMechanicId) return;

    assignMechanicMutation.mutate(
      {
        bookingId: booking._id,
        mechanicId: selectedMechanicId
      },
      {
        onSuccess: () => {
          setSelectedMechanicId('');
          toast.success('Mechanic successfully assigned to booking');
          refetch();
        }
      }
    );
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* ── Back Navigation ── */}
      <Link
        to="/bookings"
        className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white transition"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Bookings Roster</span>
      </Link>

      {/* ── Header Card ── */}
      <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center space-x-3">
            <span className="font-mono text-xl font-black text-cyan-400 bg-cyan-950/80 px-3.5 py-1 rounded-xl border border-cyan-800/60 shadow">
              {booking.bookingId}
            </span>
            <StatusBadge status={booking.status} className="text-xs px-3 py-1" />
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Created: <strong className="text-slate-200">{formatDate(booking.createdAt)}</strong> • Scheduled For:{' '}
            <strong className="text-slate-200">{formatDate(booking.scheduledAt)}</strong>
          </p>
        </div>

        {/* Total Price Badge */}
        <div className="text-right">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Service Charge
          </span>
          <span className="text-2xl font-black text-emerald-400">
            {formatCurrencyINR(booking.amount)}
          </span>
        </div>
      </div>

      {/* ── DEMO OPERATIONAL CONTROL BAR (Requested Feature) ── */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-900/80 to-blue-950/40 border border-cyan-500/30 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-extrabold uppercase tracking-wider text-cyan-400">
            <PlayCircle className="h-4 w-4" />
            <span>Interactive Operations Demo Controller</span>
          </div>
          <span className="text-[10px] text-slate-400">Calls real backend endpoint & broadcasts Socket.io event</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* One-Click Advance Button */}
          {nextStatus ? (
            <button
              onClick={handleAdvanceStatus}
              disabled={updateStatusMutation.isPending}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/25 flex items-center space-x-2 transition active:scale-95 disabled:opacity-50"
            >
              <span>Advance One Step ➔</span>
              <span className="px-2 py-0.5 rounded bg-black/20 text-white font-mono font-bold">
                {nextStatus}
              </span>
            </button>
          ) : (
            <span className="text-xs text-slate-400 italic bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-800">
              Terminal state reached ({booking.status})
            </span>
          )}

          {/* Manual Jump Dropdown */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400">or Jump To:</span>
            <select
              value={booking.status}
              onChange={(e) => handleManualStatusChange(e.target.value as BookingStatus)}
              disabled={updateStatusMutation.isPending}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              {ALL_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Note input */}
          <input
            type="text"
            placeholder="Add transition note for audit log..."
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* ── 3-Column Info Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Customer Info */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
          <div className="flex items-center space-x-2 text-cyan-400 font-bold text-xs">
            <User className="h-4 w-4" />
            <span>Customer Profile</span>
          </div>
          <div className="space-y-1">
            <p className="font-bold text-white text-sm">{booking.customer?.name}</p>
            <p className="text-xs text-slate-300">{booking.customer?.phone}</p>
            <p className="text-xs text-slate-400">{booking.customer?.email}</p>
            {booking.customer?.address && (
              <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                {booking.customer.address}
              </p>
            )}
          </div>
        </div>

        {/* Vehicle Snapshot */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
          <div className="flex items-center space-x-2 text-blue-400 font-bold text-xs">
            <Car className="h-4 w-4" />
            <span>Vehicle Snapshot</span>
          </div>
          <div className="space-y-1">
            <p className="font-bold text-white text-sm">
              {booking.vehicle?.make} {booking.vehicle?.model}
            </p>
            <p className="text-xs font-mono text-cyan-300 font-bold">
              Plate: {booking.vehicle?.licensePlate}
            </p>
            {booking.vehicle?.year && (
              <p className="text-xs text-slate-400">Model Year: {booking.vehicle.year}</p>
            )}
          </div>
        </div>

        {/* Service & Mechanic */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
          <div className="flex items-center space-x-2 text-purple-400 font-bold text-xs">
            <Wrench className="h-4 w-4" />
            <span>Service & Mechanic</span>
          </div>
          <div className="space-y-1">
            <p className="font-bold text-white text-xs">{booking.service?.name}</p>
            <p className="text-[11px] text-slate-400">Category: {booking.service?.category}</p>

            <div className="pt-2 border-t border-slate-800/80">
              {booking.mechanic ? (
                <div>
                  <p className="text-xs font-semibold text-slate-200">
                    Mechanic: {booking.mechanic.name}
                  </p>
                  <p className="text-[10px] text-slate-400">{booking.mechanic.phone}</p>
                  <StatusBadge status={booking.mechanic.status} className="mt-1 scale-90 origin-left" />
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-amber-400 italic">No mechanic assigned</p>
                  {/* Assign dropdown */}
                  <div className="flex items-center space-x-1.5">
                    <select
                      value={selectedMechanicId}
                      onChange={(e) => setSelectedMechanicId(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-lg text-[11px] p-1 text-slate-200"
                    >
                      <option value="">Select available mechanic</option>
                      {mechanics.map((m) => (
                        <option key={m._id} value={m._id}>
                          {m.name} ({m.status})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleAssignMechanic}
                      disabled={!selectedMechanicId || assignMechanicMutation.isPending}
                      className="px-2 py-1 bg-cyan-600 hover:bg-cyan-500 rounded text-[11px] font-bold text-white disabled:opacity-50"
                    >
                      Assign
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Visual Timeline of Status History ── */}
      <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-6">
        <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-300">
          <Clock className="h-4 w-4 text-cyan-400" />
          <span>Visual Status Transition Timeline & Audit History</span>
        </div>

        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
          {booking.statusHistory?.map((entry, idx) => (
            <div key={idx} className="relative flex items-start space-x-4 text-xs group">
              {/* Timeline marker */}
              <div className="absolute -left-6 top-1 h-3.5 w-3.5 rounded-full bg-cyan-500 border-2 border-slate-950 shadow-[0_0_8px_#06b6d4]" />

              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/90 w-full hover:border-slate-700 transition">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <StatusBadge status={entry.status} />
                    <span className="text-[11px] text-slate-500 font-mono">
                      Step #{idx + 1}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {formatDate(entry.timestamp)}
                  </span>
                </div>
                {entry.note && (
                  <p className="text-slate-300 text-xs mt-2 pl-1 border-l-2 border-cyan-500/40">
                    {entry.note}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BookingDetailPage;
