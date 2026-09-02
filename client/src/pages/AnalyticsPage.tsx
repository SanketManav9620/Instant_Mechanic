import React, { useState } from 'react';
import { useAnalytics } from '../hooks/useOperationsQueries';
import { formatCurrencyINR } from '../lib/utils';
import { LoadingSkeleton, ErrorState, EmptyState } from '../components/common';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  Activity,
  Wrench,
  PieChart as PieIcon,
  BarChart3,
  RefreshCw,
  BarChart2
} from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  Completed: '#10b981',
  'In Progress': '#06b6d4',
  'Mechanic On The Way': '#8b5cf6',
  Assigned: '#3b82f6',
  Pending: '#f59e0b',
  Cancelled: '#ef4444'
};

const CATEGORY_COLORS = [
  '#06b6d4',
  '#8b5cf6',
  '#10b981',
  '#f59e0b',
  '#3b82f6',
  '#ec4899',
  '#14b8a6'
];

const RANGE_OPTIONS = [
  { label: 'Last 7 Days', value: 7 },
  { label: 'Last 30 Days', value: 30 },
  { label: 'Last 90 Days', value: 90 }
];

export const AnalyticsPage: React.FC = () => {
  const [selectedDays, setSelectedDays] = useState<number>(30);
  const { data: analytics, isLoading, isFetching, isError, refetch } = useAnalytics(selectedDays);

  const daily = analytics?.daily || [];
  const byCategory = analytics?.byCategory || [];
  const byStatus = analytics?.byStatus || [];
  const summary = analytics?.summary || { totalBookings: 0, totalRevenue: 0 };

  const avgDailyBookings =
    daily.length > 0 ? (summary.totalBookings / daily.length).toFixed(1) : '0';

  const topCategory = byCategory.length > 0 ? byCategory[0].category : 'N/A';

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ── Top Range Filter Bar ── */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 shadow-xl">
        <div>
          <h2 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
            Operational Telemetry & Performance
          </h2>
          <p className="text-[11px] text-slate-400">
            Real-time analytics aggregated across {selectedDays} days of vehicle servicing
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* 7d/30d/90d Range Selector */}
          <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSelectedDays(opt.value)}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 active:scale-95 ${
                  selectedDays === opt.value
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 transition active:scale-95"
            title="Refresh Analytics"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── KPI Metric Summary for Period ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/70 border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-transparent hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
            <span>Period Bookings</span>
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-white mt-3">
            {summary.totalBookings.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Total tickets over {selectedDays} days</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/70 border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-transparent hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
            <span>Period Revenue</span>
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-white mt-3">
            {formatCurrencyINR(summary.totalRevenue)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Completed service receipts (INR)</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/70 border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-transparent hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
            <span>Daily Velocity</span>
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-white mt-3">
            {avgDailyBookings} <span className="text-xs font-normal text-slate-400">jobs/day</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Average daily booking inflow</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/70 border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-transparent hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
            <span>Leading Category</span>
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Wrench className="h-4 w-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-white mt-3 truncate">{topCategory}</p>
          <p className="text-[11px] text-slate-400 mt-1">Highest service volume demand</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <LoadingSkeleton variant="chart" count={4} />
        </div>
      ) : isError || !analytics ? (
        <ErrorState
          title="Failed to Load Operational Analytics"
          message="Could not communicate with the analytics aggregation pipeline. Check backend server logs."
          onRetry={() => refetch()}
        />
      ) : daily.length === 0 ? (
        <EmptyState
          title="No Analytics Data Available"
          message="There are no recorded bookings within the selected time period."
          icon={BarChart2}
        />
      ) : (
        <div className="space-y-6 sm:space-y-8">
          {/* ── ROW 1: Bookings Over Time (Line) & Revenue Over Time (Area) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* 1. Line Chart: Bookings Over Time */}
            <div className="p-4 sm:p-6 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl space-y-4">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-cyan-400" />
                  <span>Daily Booking Volume Over Time</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Count of new service bookings created each day
                </p>
              </div>

              <div className="h-64 sm:h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={daily} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="label"
                      stroke="#64748b"
                      fontSize={10}
                      tickLine={false}
                      minTickGap={15}
                    />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#090d16',
                        borderColor: '#1e293b',
                        borderRadius: '12px',
                        color: '#f8fafc',
                        fontSize: '12px'
                      }}
                      formatter={(val: number) => [`${val} Bookings`, 'Total Bookings']}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="bookings"
                      stroke="#06b6d4"
                      strokeWidth={3}
                      dot={{ fill: '#06b6d4', r: 3 }}
                      activeDot={{ r: 6, fill: '#38bdf8', stroke: '#090d16', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 2. Area/Line Chart: Revenue Over Time */}
            <div className="p-4 sm:p-6 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl space-y-4">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-emerald-400" />
                  <span>Daily Revenue Velocity (INR)</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Completed service amount receipts per day
                </p>
              </div>

              <div className="h-64 sm:h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={daily} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="label"
                      stroke="#64748b"
                      fontSize={10}
                      tickLine={false}
                      minTickGap={15}
                    />
                    <YAxis
                      stroke="#64748b"
                      fontSize={10}
                      tickLine={false}
                      tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#090d16',
                        borderColor: '#1e293b',
                        borderRadius: '12px',
                        color: '#f8fafc',
                        fontSize: '12px'
                      }}
                      formatter={(val: number) => [formatCurrencyINR(val), 'Revenue']}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#revenueGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* ── ROW 2: Status Breakdown (Donut) & Service Category (Horizontal Bar) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* 3. Donut Chart: Status Breakdown */}
            <div className="p-4 sm:p-6 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl space-y-4">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                  <PieIcon className="h-4 w-4 text-purple-400" />
                  <span>Operational Status Distribution</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Proportion of tickets by current workflow stage
                </p>
              </div>

              <div className="h-64 sm:h-72 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={byStatus}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                    >
                      {byStatus.map((entry: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={STATUS_COLORS[entry.status] || '#64748b'}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#090d16',
                        borderColor: '#1e293b',
                        borderRadius: '12px',
                        color: '#f8fafc',
                        fontSize: '12px'
                      }}
                      formatter={(val: number, name: string) => [
                        `${val} Bookings (${(((val as number) / (summary.totalBookings || 1)) * 100).toFixed(1)}%)`,
                        name
                      ]}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value) => (
                        <span className="text-[11px] text-slate-300 font-medium px-1">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 4. Horizontal Bar Chart: Service Category Breakdown */}
            <div className="p-4 sm:p-6 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl space-y-4">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4 text-amber-400" />
                  <span>Demand by Service Category ($lookup)</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Booking counts grouped by Service Category
                </p>
              </div>

              <div className="h-64 sm:h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={byCategory}
                    margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
                  >
                    <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis
                      type="category"
                      dataKey="category"
                      stroke="#94a3b8"
                      fontSize={10}
                      tickLine={false}
                      width={80}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#090d16',
                        borderColor: '#1e293b',
                        borderRadius: '12px',
                        color: '#f8fafc',
                        fontSize: '12px'
                      }}
                      formatter={(val: number, _name: string, props: any) => [
                        `${val} Bookings (${formatCurrencyINR(props.payload.revenue)})`,
                        'Count'
                      ]}
                    />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                      {byCategory.map((_entry: any, index: number) => (
                        <Cell
                          key={`cat-cell-${index}`}
                          fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;
