import axios from 'axios';
import {
  IDashboardSummary,
  IBooking,
  IMechanic,
  IBookingFilters,
  IMechanicFilters,
  IPagination,
  IApiResponse,
  BookingStatus,
  IAnalyticsData
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Fetch aggregated dashboard KPI summary (single $facet aggregation)
 */
export const getDashboardSummary = async (): Promise<IDashboardSummary> => {
  const { data } = await apiClient.get<IApiResponse<IDashboardSummary>>('/dashboard/summary');
  return data.data;
};

/**
 * Fetch paginated, filterable, sortable bookings
 */
export const getBookings = async (
  filters: IBookingFilters = {}
): Promise<{ data: IBooking[]; pagination: IPagination }> => {
  const { data } = await apiClient.get<IApiResponse<IBooking[]>>('/bookings', {
    params: filters
  });
  return {
    data: data.data,
    pagination: data.pagination || { total: data.data.length, page: 1, limit: 20, pages: 1 }
  };
};

/**
 * Fetch single booking detail with fully populated customer, mechanic, service, and history
 */
export const getBookingDetail = async (id: string): Promise<IBooking> => {
  const { data } = await apiClient.get<IApiResponse<IBooking>>(`/bookings/${id}`);
  return data.data;
};

/**
 * Update booking status
 */
export const updateBookingStatus = async (
  id: string,
  status: BookingStatus,
  note?: string
): Promise<IBooking> => {
  const { data } = await apiClient.patch<IApiResponse<IBooking>>(`/bookings/${id}/status`, {
    status,
    note
  });
  return data.data;
};

/**
 * Assign mechanic to booking
 */
export const assignMechanic = async (
  bookingId: string,
  mechanicId: string
): Promise<IBooking> => {
  const { data } = await apiClient.patch<IApiResponse<IBooking>>(`/bookings/${bookingId}/assign`, {
    mechanicId
  });
  return data.data;
};

/**
 * Fetch mechanics fleet list (paginated)
 */
export const getMechanics = async (
  filters: IMechanicFilters = {}
): Promise<{ data: IMechanic[]; pagination: IPagination }> => {
  const { data } = await apiClient.get<IApiResponse<IMechanic[]>>('/mechanics', {
    params: filters
  });
  return {
    data: data.data,
    pagination: data.pagination || { total: data.data.length, page: 1, limit: 20, pages: 1 }
  };
};

/**
 * Fetch mechanic profile detail including relatedBookings history
 */
export const getMechanicDetail = async (id: string): Promise<IMechanic> => {
  const { data } = await apiClient.get<IApiResponse<IMechanic>>(`/mechanics/${id}`);
  return data.data;
};

/**
 * Fetch operational analytics over N days (daily volume/revenue, service categories, status)
 */
export const getAnalytics = async (days: number = 30): Promise<IAnalyticsData> => {
  const { data } = await apiClient.get<IApiResponse<IAnalyticsData>>('/dashboard/analytics', {
    params: { days }
  });
  return data.data;
};

export default apiClient;
