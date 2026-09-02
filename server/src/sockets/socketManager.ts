import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

let io: SocketIOServer | null = null;

/**
 * Initializes Socket.io attached to the HTTP server with CORS restricted to CLIENT_URL
 */
export const initSocketServer = (httpServer: HttpServer, clientUrl: string): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: clientUrl || 'http://localhost:5173',
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
      credentials: true
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log(`⚡ [Socket.io] Client connected: ${socket.id} (IP: ${socket.handshake.address})`);

    socket.on('disconnect', (reason: string) => {
      console.log(`🔌 [Socket.io] Client disconnected: ${socket.id} (Reason: ${reason})`);
    });
  });

  return io;
};

/**
 * Returns the current Socket.io server instance
 */
export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.io has not been initialized! Call initSocketServer first.');
  }
  return io;
};

export default initSocketServer;
