import { io, Socket } from 'socket.io-client';

// Extract the base server URL from VITE_API_URL (e.g., http://localhost:5000 from http://localhost:5000/api)
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const socketUrl = import.meta.env.VITE_SOCKET_URL || apiUrl.replace(/\/api\/?$/, '') || 'http://localhost:5000';

/**
 * Global Socket.io client singleton connected to backend server
 */
export const socket: Socket = io(socketUrl, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
  console.log(`⚡ [Socket.io] Connected to server: ${socket.id}`);
});

socket.on('disconnect', (reason) => {
  console.log(`🔌 [Socket.io] Disconnected: ${reason}`);
});

socket.on('connect_error', (error) => {
  console.warn(`⚠️ [Socket.io] Connection error:`, error.message);
});

export default socket;
