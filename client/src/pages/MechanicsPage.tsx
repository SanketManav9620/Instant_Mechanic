import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMechanics } from '../hooks/useOperationsQueries';
import { StatusBadge } from '../components/dashboard/StatusBadge';
import { LoadingSkeleton, ErrorState, EmptyState } from '../components/common';
import { ClickToCopy } from '../components/common/ClickToCopy';
import {
  Star,
  Phone,
  Mail,
  ChevronRight,
  Filter,
  Users,
  Search
} from 'lucide-react';

const STATUS_FILTERS = [
  { label: 'All Fleet', value: 'all' },
  { label: 'Available', value: 'available' },
  { label: 'Busy', value: 'busy' },
  { label: 'On The Way', value: 'on_the_way' },
  { label: 'Offline', value: 'offline' }
];

export const MechanicsPage: React.FC = () => {
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading, isError, refetch } = useMechanics({
    status: selectedStatus !== 'all' ? selectedStatus : undefined
  });

  const mechanics = data?.data || [];

  const filteredMechanics = mechanics.filter((m) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      m.name.toLowerCase().includes(term) ||
      m.phone.toLowerCase().includes(term) ||
      m.specialties?.some((s) => s.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* ── Filter & Search Bar ── */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 shadow-xl">
        {/* Search */}
        <div className="relative flex-1 md:max-w-md">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search mechanics by name, phone or specialty..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="h-3.5 w-3.5 text-slate-500 mr-1 shrink-0" />
          {STATUS_FILTERS.map((st) => (
            <button
              key={st.value}
              onClick={() => setSelectedStatus(st.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all active:scale-95 ${
                selectedStatus === st.value
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-950'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Mechanics Content ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <LoadingSkeleton variant="card" count={6} />
        </div>
      ) : isError ? (
        <ErrorState
          title="Failed to Load Fleet Roster"
          message="Could not retrieve the active mechanics fleet from the backend."
          onRetry={() => refetch()}
        />
      ) : filteredMechanics.length === 0 ? (
        <EmptyState
          title="No Mechanics Match Filter"
          message="No field specialists found under the selected status filter or search query."
          icon={Users}
          actionLabel="Clear Filter & Search"
          onAction={() => {
            setSelectedStatus('all');
            setSearchTerm('');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredMechanics.map((m) => {
            const currentBookingId =
              typeof m.currentBooking === 'object' && m.currentBooking
                ? m.currentBooking._id
                : typeof m.currentBooking === 'string'
                ? m.currentBooking
                : null;

            return (
              <div
                key={m._id}
                className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-cyan-500/40 hover:-translate-y-1 hover:shadow-lg hover:shadow-cyan-500/5 transition-all duration-200 shadow-md flex flex-col justify-between group"
              >
                <div>
                  {/* Top: Name & Live Status Badge */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <Link
                        to={`/mechanics/${m._id}`}
                        className="font-extrabold text-sm text-white group-hover:text-cyan-400 transition"
                      >
                        {m.name}
                      </Link>
                      <div className="flex items-center space-x-1.5 text-xs text-amber-400 mt-1">
                        <Star className="h-3.5 w-3.5 fill-amber-400 shrink-0" />
                        <span className="font-bold">{m.rating}</span>
                        <span className="text-slate-500 text-[11px]">
                          • {m.jobsCompleted} jobs completed
                        </span>
                      </div>
                    </div>

                    <StatusBadge status={m.status} />
                  </div>

                  {/* Specialties Pills */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {m.specialties?.map((spec, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-slate-950 text-slate-300 border border-slate-800 font-medium"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-1 text-xs text-slate-400 pt-2.5 border-t border-slate-800/60">
                    <div className="flex items-center space-x-2">
                      <Phone className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      <ClickToCopy text={m.phone} label="Phone Number">
                        <span className="hover:text-cyan-300 transition">{m.phone}</span>
                      </ClickToCopy>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      <ClickToCopy text={m.email} label="Email Address">
                        <span className="truncate hover:text-cyan-300 transition">{m.email}</span>
                      </ClickToCopy>
                    </div>
                  </div>
                </div>

                {/* Bottom: Current/Last Booking Link & Profile Link */}
                <div className="pt-3 mt-3 border-t border-slate-800/80 space-y-2">
                  {/* Current / Active Booking Link */}
                  {currentBookingId ? (
                    <Link
                      to={`/bookings/${currentBookingId}`}
                      className="flex items-center justify-between text-[11px] p-2 rounded-xl bg-cyan-950/40 border border-cyan-800/40 text-cyan-300 hover:bg-cyan-900/30 transition active:scale-95"
                    >
                      <span className="font-semibold truncate">Active Booking Attached</span>
                      <span className="underline font-bold text-cyan-400 ml-1 shrink-0">View ➔</span>
                    </Link>
                  ) : (
                    <div className="text-[11px] text-slate-500 italic px-1">
                      No active booking assigned currently
                    </div>
                  )}

                  {/* Link to Mechanic Detail Page */}
                  <Link
                    to={`/mechanics/${m._id}`}
                    className="flex items-center justify-between text-xs font-bold text-slate-300 hover:text-cyan-400 transition pt-1 active:scale-95"
                  >
                    <span>View Full Job History</span>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MechanicsPage;
