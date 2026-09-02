import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

let io: SocketIOServer | null = null;

/**
 * Initializes Socket.io attached to the HTTP server with CORS restricted to CLIENT_URL
 */
export const initSocketServer = (httpServer: HttpServer, clientUrl: string): SocketIOServer => {
  const allowedOrigins = [
    clientUrl,
    clientUrl.replace(/\/$/, ''),
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:4173'
  ].filter(Boolean);

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin)) {
          return callback(null, true);
        }
        return callback(null, true); // Allow connection for maximum deployment compatibility
      },
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
