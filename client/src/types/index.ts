export type BookingStatus =
  | 'Pending'
  | 'Assigned'
  | 'Mechanic On The Way'
  | 'In Progress'
  | 'Completed'
  | 'Cancelled';

export type MechanicStatus = 'available' | 'busy' | 'on_the_way' | 'offline';

export interface IVehicle {
  _id?: string;
  make: string;
  model: string;
  year?: number;
  licensePlate: string;
}

export interface ICustomer {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  vehicles: IVehicle[];
  createdAt: string;
  updatedAt: string;
  relatedBookings?: IBooking[];
}

export interface IService {
  _id: string;
  name: string;
  category: string;
  basePrice: number;
  estimatedDurationMins: number;
}

export interface IStatusHistory {
  _id?: string;
  status: BookingStatus;
  timestamp: string;
  note?: string;
}

export interface IMechanic {
  _id: string;
  name: string;
  email: string;
  phone: string;
  specialties: string[];
  status: MechanicStatus;
  jobsCompleted: number;
  rating: number;
  currentBooking?: IBooking | string | null;
  createdAt: string;
  updatedAt: string;
  relatedBookings?: IBooking[];
}

export interface IBooking {
  _id: string;
  bookingId: string;
  customer: ICustomer;
  vehicle: IVehicle;
  service: IService;
  mechanic?: IMechanic | null;
  status: BookingStatus;
  amount: number;
  scheduledAt: string;
  statusHistory: IStatusHistory[];
  createdAt: string;
  updatedAt: string;
}

export interface IPagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface IApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: IPagination;
}

export interface IDashboardSummary {
  totalBookings: number;
  todayBookings: number;
  completed: number;
  pending: number;
  cancelled: number;
  inProgress: number;
  assigned: number;
  totalRevenue: number;
  activeMechanics: number;
  newCustomersToday: number;
}

export interface IBookingFilters {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export interface IMechanicFilters {
  status?: string;
  specialty?: string;
  page?: number;
  limit?: number;
}

export interface IDailyMetric {
  date: string;
  label: string;
  bookings: number;
  revenue: number;
}

export interface ICategoryMetric {
  category: string;
  count: number;
  revenue: number;
}

export interface IStatusMetric {
  status: string;
  count: number;
}

export interface IAnalyticsData {
  days: number;
  daily: IDailyMetric[];
  byCategory: ICategoryMetric[];
  byStatus: IStatusMetric[];
  summary: {
    totalBookings: number;
    totalRevenue: number;
  };
}

