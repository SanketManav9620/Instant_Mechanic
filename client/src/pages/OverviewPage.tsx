import React from 'react';
import { Link } from 'react-router-dom';
import { useDashboardSummary, useBookings } from '../hooks/useOperationsQueries';
import { formatCurrencyINR, formatDate } from '../lib/utils';
import { StatusBadge } from '../components/dashboard/StatusBadge';
import { LoadingSkeleton, ErrorState, EmptyState } from '../components/common';
import { ClickToCopy } from '../components/common/ClickToCopy';
import {
  CalendarDays,
  CalendarCheck,
  CheckCircle2,
  Clock,
  XCircle,
  IndianRupee,
  Users,
  UserPlus,
  Car,
  ArrowRight,
  Inbox
} from 'lucide-react';

export const OverviewPage: React.FC = () => {
  const { data: summary, isLoading, isError, refetch } = useDashboardSummary();
  const { data: bookingsData, isLoading: isBookingsLoading, isError: isBookingsError, refetch: refetchBookings } = useBookings({ limit: 6 });

  const bookings = bookingsData?.data || [];

  const statCardsConfig = summary
    ? [
        {
          label: 'Total Bookings',
          value: summary.totalBookings.toLocaleString('en-IN'),
          icon: CalendarDays,
          color: 'text-cyan-400',
          border: 'border-cyan-500/30',
          bg: 'from-cyan-500/10 to-transparent',
          description: 'Lifetime vehicle service tickets'
        },
        {
          label: "Today's Bookings",
          value: summary.todayBookings.toLocaleString('en-IN'),
          icon: CalendarCheck,
          color: 'text-blue-400',
          border: 'border-blue-500/30',
          bg: 'from-blue-500/10 to-transparent',
          description: 'Created since midnight'
        },
        {
          label: 'Completed',
          value: summary.completed.toLocaleString('en-IN'),
          icon: CheckCircle2,
          color: 'text-emerald-400',
          border: 'border-emerald-500/30',
          bg: 'from-emerald-500/10 to-transparent',
          description: 'Successfully serviced & verified'
        },
        {
          label: 'Pending',
          value: summary.pending.toLocaleString('en-IN'),
          icon: Clock,
          color: 'text-amber-400',
          border: 'border-amber-500/30',
          bg: 'from-amber-500/10 to-transparent',
          description: 'Awaiting dispatcher assignment'
        },
        {
          label: 'Cancelled',
          value: summary.cancelled.toLocaleString('en-IN'),
          icon: XCircle,
          color: 'text-rose-400',
          border: 'border-rose-500/30',
          bg: 'from-rose-500/10 to-transparent',
          description: 'Terminated prior to completion'
        },
        {
          label: 'Total Revenue',
          value: formatCurrencyINR(summary.totalRevenue),
          icon: IndianRupee,
          color: 'text-emerald-400',
          border: 'border-emerald-500/40',
          bg: 'from-emerald-500/15 to-transparent',
          description: 'Sum of all completed tickets'
        },
        {
          label: 'Active Mechanics',
          value: summary.activeMechanics.toString(),
          icon: Users,
          color: 'text-purple-400',
          border: 'border-purple-500/30',
          bg: 'from-purple-500/10 to-transparent',
          description: 'Available, busy or on the way'
        },
        {
          label: 'New Customers',
          value: summary.newCustomersToday.toString(),
          icon: UserPlus,
          color: 'text-teal-400',
          border: 'border-teal-500/30',
          bg: 'from-teal-500/10 to-transparent',
          description: 'Registered profile today'
        }
      ]
    : [];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ── 8 Stat Cards Section ── */}
      <section>
        <div className="flex items-center justify-between mb-3.5">
          <div>
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-400">
              Operations KPI Metrics
            </h2>
            <p className="text-[11px] text-slate-500">Live telemetry aggregated via MongoDB</p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            <LoadingSkeleton variant="card" count={8} />
          </div>
        ) : isError || !summary ? (
          <ErrorState
            title="Failed to Load KPI Metrics"
            message="Could not communicate with the dashboard summary endpoint. Please check if your MongoDB server is active."
            onRetry={() => refetch()}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            {statCardsConfig.map((card, idx) => {
              const Icon = card.icon;
              return (
                <div
                  key={idx}
                  className={`p-4 sm:p-5 rounded-2xl bg-slate-900/70 border ${card.border} bg-gradient-to-br ${card.bg} hover:border-slate-600 hover:-translate-y-1 hover:shadow-lg hover:shadow-cyan-500/5 transition-all duration-200 shadow-sm`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      {card.label}
                    </span>
                    <div className={`p-2 rounded-xl bg-slate-950/80 border border-slate-800/80 ${card.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>

                  <div className="mt-3">
                    <span className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      {card.value}
                    </span>
                    <p className="text-[11px] text-slate-400 mt-1 truncate">
                      {card.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Recent Live Bookings Feed ── */}
      <section className="p-4 sm:p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
              Recent Live Bookings
            </h2>
            <p className="text-[11px] text-slate-400">Real-time operations dispatch queue</p>
          </div>
          <Link
            to="/bookings"
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition active:scale-95"
          >
            <span>View Full Roster</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {isBookingsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <LoadingSkeleton variant="card" count={6} />
          </div>
        ) : isBookingsError ? (
          <ErrorState
            title="Failed to Load Recent Bookings"
            message="Could not retrieve the recent booking feed."
            onRetry={() => refetchBookings()}
          />
        ) : bookings.length === 0 ? (
          <EmptyState
            title="No Bookings in System"
            message="There are currently no vehicle bookings registered in the database."
            icon={Inbox}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {bookings.map((booking) => (
              <div
                key={booking._id}
                className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-cyan-500/40 hover:-translate-y-0.5 hover:shadow-md hover:shadow-cyan-500/5 transition-all duration-200 group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <ClickToCopy text={booking.bookingId} label="Booking ID">
                      <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                        {booking.bookingId}
                      </span>
                    </ClickToCopy>
                    <span className="text-xs font-extrabold text-emerald-400">
                      {formatCurrencyINR(booking.amount)}
                    </span>
                  </div>

                  <div className="space-y-1 mb-2">
                    <div className="flex items-center text-xs font-bold text-slate-200">
                      <Car className="h-3.5 w-3.5 text-slate-400 mr-1.5 shrink-0" />
                      <span className="truncate">
                        {booking.vehicle?.make} {booking.vehicle?.model}
                      </span>
                    </div>
                    <ClickToCopy text={booking.vehicle?.licensePlate || ''} label="License Plate">
                      <p className="text-[11px] font-mono text-slate-400 pl-5 hover:text-cyan-300 transition">
                        Plate: {booking.vehicle?.licensePlate}
                      </p>
                    </ClickToCopy>
                  </div>

                  <div className="text-[11px] text-slate-400 bg-slate-900/80 p-2 rounded-lg mb-2">
                    Service: <span className="text-slate-200 font-medium">{booking.service?.name}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-medium">
                    {formatDate(booking.createdAt)}
                  </span>
                  <Link to={`/bookings/${booking._id}`}>
                    <StatusBadge status={booking.status} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default OverviewPage;
