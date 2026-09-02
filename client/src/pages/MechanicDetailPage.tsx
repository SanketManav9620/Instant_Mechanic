import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useMechanicDetail } from '../hooks/useOperationsQueries';
import { formatCurrencyINR, formatDate } from '../lib/utils';
import { StatusBadge } from '../components/dashboard/StatusBadge';
import { LoadingSkeleton, ErrorState, EmptyState } from '../components/common';
import { ClickToCopy } from '../components/common/ClickToCopy';
import {
  ArrowLeft,
  Star,
  Phone,
  Mail,
  Wrench,
  Calendar,
  ExternalLink,
  Briefcase
} from 'lucide-react';

export const MechanicDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: mechanic, isLoading, isError, refetch } = useMechanicDetail(id);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-6xl">
        <LoadingSkeleton variant="text" className="w-32 h-6" />
        <LoadingSkeleton variant="card" className="h-40" />
        <LoadingSkeleton variant="card" className="h-28" />
        <LoadingSkeleton variant="table-row" count={5} />
      </div>
    );
  }

  if (isError || !mechanic) {
    return (
      <div className="space-y-4 max-w-6xl">
        <Link
          to="/mechanics"
          className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Mechanics Fleet</span>
        </Link>
        <ErrorState
          title="Mechanic Profile Not Found"
          message="Could not retrieve technician details from the server."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const relatedBookings = mechanic.relatedBookings || [];

  return (
    <div className="space-y-6 max-w-6xl">
      {/* ── Back Navigation ── */}
      <Link
        to="/mechanics"
        className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white transition active:scale-95"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Mechanics Fleet</span>
      </Link>

      {/* ── Profile Header Card ── */}
      <div className="p-4 sm:p-6 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center space-x-3">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">{mechanic.name}</h2>
            <StatusBadge status={mechanic.status} className="text-xs px-3 py-1" />
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-2">
            <div className="flex items-center space-x-1 text-amber-400 font-bold">
              <Star className="h-4 w-4 fill-amber-400 shrink-0" />
              <span>{mechanic.rating} Rating</span>
            </div>
            <span>•</span>
            <span className="text-slate-300 font-semibold">
              {mechanic.jobsCompleted} Total Jobs Completed
            </span>
            <span>•</span>
            <span className="text-cyan-400 font-medium">
              {relatedBookings.length} Recorded in System
            </span>
          </div>
        </div>

        {/* Contact info pills */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs text-slate-300">
          <div className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800">
            <Phone className="h-4 w-4 text-cyan-400" />
            <ClickToCopy text={mechanic.phone} label="Phone">
              <span>{mechanic.phone}</span>
            </ClickToCopy>
          </div>
          <div className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800">
            <Mail className="h-4 w-4 text-cyan-400" />
            <ClickToCopy text={mechanic.email} label="Email">
              <span className="truncate max-w-[180px]">{mechanic.email}</span>
            </ClickToCopy>
          </div>
        </div>
      </div>

      {/* ── Specialties & Skills ── */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
        <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-400">
          <Wrench className="h-3.5 w-3.5 text-cyan-400" />
          <span>Certified Specialties</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {mechanic.specialties?.map((spec, i) => (
            <span
              key={i}
              className="text-xs px-3 py-1.5 rounded-xl bg-cyan-950/60 border border-cyan-800/40 text-cyan-300 font-semibold"
            >
              {spec}
            </span>
          ))}
        </div>
      </div>

      {/* ── Full Job History Table ── */}
      <div className="p-4 sm:p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
              Assigned Job History ({relatedBookings.length})
            </h3>
            <p className="text-[11px] text-slate-400">
              Chronological log of all bookings serviced by {mechanic.name}
            </p>
          </div>
        </div>

        {relatedBookings.length === 0 ? (
          <EmptyState
            title="No Past Jobs Found"
            message="This technician currently has no historical service records assigned."
            icon={Briefcase}
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800 shadow">
            <table className="w-full text-left text-xs border-collapse min-w-[650px]">
              <thead className="bg-slate-950/90 text-slate-400 uppercase text-[10px] tracking-wider font-bold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3.5">Booking ID</th>
                  <th className="px-4 py-3.5">Customer</th>
                  <th className="px-4 py-3.5">Service</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-4 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {relatedBookings.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-800/30 transition">
                    <td className="px-4 py-3">
                      <ClickToCopy text={b.bookingId} label="Booking ID">
                        <span className="font-mono font-bold text-cyan-400 hover:underline">
                          {b.bookingId}
                        </span>
                      </ClickToCopy>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-semibold text-white">{b.customer?.name}</div>
                      <div className="text-[10px] text-slate-400">{b.customer?.email}</div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="text-slate-200 font-medium">{b.service?.name}</div>
                      <div className="text-[10px] text-slate-500">{b.service?.category}</div>
                    </td>

                    <td className="px-4 py-3">
                      <StatusBadge status={b.status} />
                    </td>

                    <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                      {formatDate(b.createdAt)}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/bookings/${b._id}`}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-950/80 hover:bg-cyan-600 hover:text-white text-slate-300 transition text-[11px] font-semibold border border-slate-800 active:scale-95"
                      >
                        <span>Inspect</span>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MechanicDetailPage;
