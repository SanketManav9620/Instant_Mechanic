import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  SortingState
} from '@tanstack/react-table';
import { useBookings } from '../hooks/useOperationsQueries';
import { formatCurrencyINR, formatDate } from '../lib/utils';
import { IBooking, BookingStatus } from '../types';
import { StatusBadge } from '../components/dashboard/StatusBadge';
import { LoadingSkeleton, ErrorState, EmptyState } from '../components/common';
import { ClickToCopy } from '../components/common/ClickToCopy';
import {
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Car,
  RefreshCw,
  Eye,
  Inbox,
  Download
} from 'lucide-react';
import { toast } from 'sonner';

const columnHelper = createColumnHelper<IBooking>();

const STATUS_OPTIONS = [
  { label: 'All Statuses', value: 'all' },
  { label: 'Pending', value: 'Pending' },
  { label: 'Assigned', value: 'Assigned' },
  { label: 'Mechanic On The Way', value: 'Mechanic On The Way' },
  { label: 'In Progress', value: 'In Progress' },
  { label: 'Completed', value: 'Completed' },
  { label: 'Cancelled', value: 'Cancelled' }
];

export const BookingsPage: React.FC = () => {
  const navigate = useNavigate();

  // Query parameter states
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);

  // Debounce search input by 350ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const sortBy = sorting.length > 0 ? sorting[0].id : 'createdAt';
  const order: 'asc' | 'desc' = sorting.length > 0 && sorting[0].desc ? 'desc' : 'asc';

  const { data, isLoading, isFetching, isError, refetch } = useBookings({
    search: debouncedSearch.trim() || undefined,
    status: selectedStatus !== 'all' ? selectedStatus : undefined,
    page,
    limit,
    sortBy,
    order
  });

  const bookings = data?.data || [];
  const pagination = data?.pagination || { total: 0, page: 1, limit: 15, pages: 1 };

  const handleExportCSV = () => {
    if (!bookings.length) {
      toast.error('No bookings available to export');
      return;
    }
    const headers = ['Booking ID', 'Customer', 'Phone', 'Vehicle Make', 'Vehicle Model', 'License Plate', 'Service', 'Category', 'Mechanic', 'Status', 'Amount (INR)', 'Date'];
    const rows = bookings.map((b) => [
      b.bookingId,
      `"${b.customer?.name || ''}"`,
      `"${b.customer?.phone || ''}"`,
      `"${b.vehicle?.make || ''}"`,
      `"${b.vehicle?.model || ''}"`,
      `"${b.vehicle?.licensePlate || ''}"`,
      `"${b.service?.name || ''}"`,
      `"${b.service?.category || ''}"`,
      `"${b.mechanic?.name || 'Unassigned'}"`,
      b.status,
      b.amount,
      `"${new Date(b.createdAt).toLocaleString()}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `instant_mechanic_bookings_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${bookings.length} bookings to CSV`);
  };

  // Define TanStack Table Columns
  const columns = useMemo(
    () => [
      columnHelper.accessor('bookingId', {
        header: 'Booking ID',
        enableSorting: true,
        cell: (info) => (
          <ClickToCopy text={info.getValue()} label="Booking ID">
            <span className="font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
              {info.getValue()}
            </span>
          </ClickToCopy>
        )
      }),
      columnHelper.accessor((row) => row.customer?.name, {
        id: 'customer',
        header: 'Customer',
        enableSorting: false,
        cell: (info) => {
          const row = info.row.original;
          return (
            <div>
              <p className="font-semibold text-white">{row.customer?.name || 'Customer'}</p>
              <p className="text-[10px] text-slate-400">{row.customer?.phone || row.customer?.email}</p>
            </div>
          );
        }
      }),
      columnHelper.accessor((row) => row.vehicle?.make, {
        id: 'vehicle',
        header: 'Vehicle',
        enableSorting: false,
        cell: (info) => {
          const v = info.row.original.vehicle;
          return (
            <div>
              <div className="flex items-center text-xs font-semibold text-slate-200">
                <Car className="h-3 w-3 mr-1 text-slate-400 shrink-0" />
                <span>
                  {v?.make} {v?.model}
                </span>
              </div>
              <ClickToCopy text={v?.licensePlate || ''} label="License Plate">
                <p className="text-[10px] font-mono text-cyan-300 font-bold pl-4">
                  {v?.licensePlate}
                </p>
              </ClickToCopy>
            </div>
          );
        }
      }),
      columnHelper.accessor((row) => row.service?.name, {
        id: 'service',
        header: 'Service',
        enableSorting: false,
        cell: (info) => {
          const s = info.row.original.service;
          return (
            <div>
              <p className="text-slate-200 font-medium">{s?.name || 'Standard Service'}</p>
              <p className="text-[10px] text-slate-500">{s?.category}</p>
            </div>
          );
        }
      }),
      columnHelper.accessor((row) => row.mechanic?.name, {
        id: 'mechanic',
        header: 'Mechanic',
        enableSorting: false,
        cell: (info) => {
          const m = info.row.original.mechanic;
          return m ? (
            <div>
              <p className="text-slate-200 font-medium">{m.name}</p>
              <StatusBadge status={m.status} className="mt-0.5 scale-90 origin-left" />
            </div>
          ) : (
            <span className="text-[11px] text-amber-400/80 italic">Unassigned</span>
          );
        }
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        enableSorting: true,
        cell: (info) => <StatusBadge status={info.getValue()} />
      }),
      columnHelper.accessor('amount', {
        header: 'Amount',
        enableSorting: true,
        cell: (info) => (
          <span className="font-extrabold text-emerald-400">
            {formatCurrencyINR(info.getValue())}
          </span>
        )
      }),
      columnHelper.accessor('createdAt', {
        header: 'Date',
        enableSorting: true,
        cell: (info) => (
          <span className="text-slate-400 text-[11px]">
            {formatDate(info.getValue())}
          </span>
        )
      })
    ],
    []
  );

  const table = useReactTable({
    data: bookings,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true
  });

  return (
    <div className="space-y-6">
      {/* ── Search & Filter Controls ── */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          {/* Debounced Search */}
          <div className="relative flex-1 md:max-w-md">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search booking ID or license plate..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Status Dropdown */}
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-slate-400 shrink-0" />
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(1);
                }}
                className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Page Size Select */}
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value={10}>10 per page</option>
              <option value={15}>15 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
            </select>

            {/* Export CSV Button */}
            <button
              onClick={handleExportCSV}
              className="px-3 py-2 rounded-xl bg-cyan-950/60 border border-cyan-800/60 hover:bg-cyan-900/60 text-cyan-300 font-bold text-xs flex items-center space-x-1.5 transition active:scale-95 shadow"
              title="Export Current Bookings to CSV"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </button>

            {/* Refresh button */}
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 text-slate-300 transition active:scale-95"
              title="Refresh Bookings"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Table Container ── */}
      {isError ? (
        <ErrorState
          title="Failed to Retrieve Bookings"
          message="An error occurred while communicating with the bookings endpoint."
          onRetry={() => refetch()}
        />
      ) : (
        <div className="rounded-2xl bg-slate-900/70 border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[750px]">
              <thead className="bg-slate-950/90 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider font-bold select-none">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      const canSort = header.column.getCanSort();
                      const isSorted = header.column.getIsSorted();

                      return (
                        <th
                          key={header.id}
                          onClick={header.column.getToggleSortingHandler()}
                          className={`px-4 py-3.5 ${
                            canSort ? 'cursor-pointer hover:text-white hover:bg-slate-900/50 transition' : ''
                          }`}
                        >
                          <div className="flex items-center space-x-1.5">
                            <span>
                              {flexRender(header.column.columnDef.header, header.getContext())}
                            </span>
                            {canSort && (
                              <span className="text-slate-500">
                                {isSorted === 'asc' ? (
                                  <ArrowUp className="h-3.5 w-3.5 text-cyan-400" />
                                ) : isSorted === 'desc' ? (
                                  <ArrowDown className="h-3.5 w-3.5 text-cyan-400" />
                                ) : (
                                  <ArrowUpDown className="h-3 w-3 opacity-40 hover:opacity-100" />
                                )}
                              </span>
                            )}
                          </div>
                        </th>
                      );
                    })}
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                ))}
              </thead>

              <tbody className="divide-y divide-slate-800/60 font-medium">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="p-6">
                      <LoadingSkeleton variant="table-row" count={5} className="my-2" />
                    </td>
                  </tr>
                ) : bookings.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12">
                      <EmptyState
                        title="No Bookings Match Criteria"
                        message="Try clearing your search input or resetting the status dropdown."
                        actionLabel="Reset Search & Filters"
                        onAction={() => {
                          setSearchInput('');
                          setSelectedStatus('all');
                          setPage(1);
                        }}
                      />
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => navigate(`/bookings/${row.original._id}`)}
                      className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-3">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-950/70 group-hover:bg-cyan-600 group-hover:text-white text-slate-400 transition text-[11px] font-semibold border border-slate-800 group-hover:border-cyan-500">
                          <Eye className="h-3 w-3" />
                          <span>View</span>
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ── Pagination Footer ── */}
          <div className="px-4 py-3.5 border-t border-slate-800 bg-slate-950/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-slate-400 text-center sm:text-left">
              Showing Page <strong className="text-white">{pagination.page}</strong> of{' '}
              <strong className="text-white">{pagination.pages || 1}</strong> (
              <span className="text-cyan-400 font-bold">{pagination.total}</span> total bookings)
            </span>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page <= 1 || isLoading}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 text-slate-300 font-semibold flex items-center space-x-1 transition active:scale-95"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Prev</span>
              </button>

              <span className="px-3 py-1.5 rounded-xl bg-slate-950 font-mono font-bold text-cyan-400 border border-slate-800">
                {pagination.page} / {pagination.pages || 1}
              </span>

              <button
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={pagination.page >= pagination.pages || isLoading}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 text-slate-300 font-semibold flex items-center space-x-1 transition active:scale-95"
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingsPage;
