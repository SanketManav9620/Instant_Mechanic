import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getDashboardSummary,
  getBookings,
  getBookingDetail,
  getMechanics,
  getMechanicDetail,
  getAnalytics,
  updateBookingStatus,
  assignMechanic
} from '../lib/api';
import { IBookingFilters, IMechanicFilters, BookingStatus } from '../types';

/**
 * Hook to fetch aggregated dashboard KPI summary
 * Query Key: ['dashboard-summary']
 */
export const useDashboardSummary = () => {
  return useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: getDashboardSummary,
    staleTime: 1000 * 30 // 30 seconds
  });
};

/**
 * Hook to fetch paginated, filterable, sortable bookings
 * Query Key: ['bookings', filters]
 */
export const useBookings = (filters: IBookingFilters = {}) => {
  return useQuery({
    queryKey: ['bookings', filters],
    queryFn: () => getBookings(filters),
    staleTime: 1000 * 30
  });
};

/**
 * Hook to fetch a single booking detail by ID with populated references
 * Query Key: ['booking', id]
 */
export const useBookingDetail = (id?: string) => {
  return useQuery({
    queryKey: ['booking', id],
    queryFn: () => getBookingDetail(id!),
    enabled: Boolean(id) && id !== 'new'
  });
};

/**
 * Hook to fetch mechanics fleet list
 * Query Key: ['mechanics', filters]
 */
export const useMechanics = (filters: IMechanicFilters = {}) => {
  return useQuery({
    queryKey: ['mechanics', filters],
    queryFn: () => getMechanics(filters),
    staleTime: 1000 * 45
  });
};

/**
 * Hook to fetch mechanic detail including relatedBookings history
 * Query Key: ['mechanic', id]
 */
export const useMechanicDetail = (id?: string) => {
  return useQuery({
    queryKey: ['mechanic', id],
    queryFn: () => getMechanicDetail(id!),
    enabled: Boolean(id)
  });
};

/**
 * Hook to fetch analytics data over N days (7d, 30d, 90d)
 * Query Key: ['analytics', days]
 */
export const useAnalytics = (days: number = 30) => {
  return useQuery({
    queryKey: ['analytics', days],
    queryFn: () => getAnalytics(days),
    staleTime: 1000 * 60 // 1 minute
  });
};

/**
 * Hook for status transition mutation
 */
export const useUpdateBookingStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: BookingStatus; note?: string }) =>
      updateBookingStatus(id, status, note),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking', updated._id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['mechanics'] });
    }
  });
};

/**
 * Hook for assigning mechanic mutation
 */
export const useAssignMechanic = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, mechanicId }: { bookingId: string; mechanicId: string }) =>
      assignMechanic(bookingId, mechanicId),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking', updated._id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['mechanics'] });
    }
  });
};
