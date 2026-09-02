import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from './components/ui/sonner';
import { DashboardLayout } from './components/layout/DashboardLayout';

import OverviewPage from './pages/OverviewPage';
import AnalyticsPage from './pages/AnalyticsPage';
import BookingsPage from './pages/BookingsPage';
import BookingDetailPage from './pages/BookingDetailPage';
import MechanicsPage from './pages/MechanicsPage';
import MechanicDetailPage from './pages/MechanicDetailPage';

// QueryClient configuration with sensible defaults for live operations:
// staleTime: 30s ensures cached data is used while remaining fresh
// retry: 1 avoids infinite request hammering on server error
// refetchOnWindowFocus: false avoids disruptive background refetches while operating the board
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 seconds
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Dashboard Layout wrapper for all primary routes */}
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<OverviewPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="bookings" element={<BookingsPage />} />
            <Route path="bookings/:id" element={<BookingDetailPage />} />
            <Route path="mechanics" element={<MechanicsPage />} />
            <Route path="mechanics/:id" element={<MechanicDetailPage />} />
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>

        {/* Global Toast Provider (sonner) for live booking update notifications */}
        <Toaster position="top-right" richColors closeButton />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
