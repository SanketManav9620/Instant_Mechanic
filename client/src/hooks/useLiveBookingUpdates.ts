import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { socket } from '../lib/socket';

interface BookingUpdatePayload {
  _id: string;
  bookingId: string;
  status: string;
  vehicle?: {
    make: string;
    model: string;
    licensePlate: string;
  };
  customer?: {
    name: string;
  };
  mechanic?: {
    name: string;
  } | null;
}

/**
 * Custom hook that listens for real-time `booking:updated` Socket.io events.
 * 1. Invalidates ['bookings'] and ['dashboard-summary'] React Query keys to auto-refresh UI.
 * 2. Triggers a toast notification with the booking ID, new status, and vehicle info.
 */
export const useLiveBookingUpdates = () => {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    const handleConnect = () => {
      setIsConnected(true);
      console.log('⚡ [useLiveBookingUpdates] Connected to live updates socket');
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      console.log('🔌 [useLiveBookingUpdates] Disconnected from live updates socket');
    };

    const handleBookingUpdated = (booking: BookingUpdatePayload) => {
      console.log(`📡 [Socket Event] booking:updated received for ${booking.bookingId} (${booking.status})`);

      // 1. Invalidate both specified React Query keys
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['mechanics'] });

      // 2. Trigger rich toast notification showing booking ID and new status
      const vehicleDesc = booking.vehicle
        ? `${booking.vehicle.make} ${booking.vehicle.model} (${booking.vehicle.licensePlate})`
        : '';

      toast.info(`Booking ${booking.bookingId} Updated`, {
        description: `Status: ${booking.status}${vehicleDesc ? ` • ${vehicleDesc}` : ''}`,
        duration: 5000,
        action: {
          label: 'View',
          onClick: () => {
            console.log('Selected booking from toast:', booking.bookingId);
          }
        }
      });
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('booking:updated', handleBookingUpdated);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('booking:updated', handleBookingUpdated);
    };
  }, [queryClient]);

  return { isConnected };
};

export default useLiveBookingUpdates;
