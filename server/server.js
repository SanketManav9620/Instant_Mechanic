import http from 'http';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import swaggerUi from 'swagger-ui-express';

import connectDB from './src/config/connectDB.js';
import swaggerSpec from './src/config/swaggerSpec.js';
import { errorHandler, notFoundHandler } from './src/middleware/errorHandler.js';

import dashboardRoutes from './src/routes/dashboardRoutes.js';
import bookingRoutes from './src/routes/bookingRoutes.js';
import mechanicRoutes from './src/routes/mechanicRoutes.js';
import customerRoutes from './src/routes/customerRoutes.js';
import serviceRoutes from './src/routes/serviceRoutes.js';
import Booking from './src/models/Booking.js';
import { seedDatabase } from './src/seed/seedData.js';

dotenv.config();

const app = express();
const httpServer = http.createServer(app);

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// ── Core Middleware ──
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());

// ── Attach Socket.io with CORS restricted to CLIENT_URL ──
const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true
  }
});

// Log client connections & disconnections
io.on('connection', (socket) => {
  console.log(`⚡ [Socket.io] Client connected: ${socket.id}`);

  socket.on('disconnect', (reason) => {
    console.log(`🔌 [Socket.io] Client disconnected: ${socket.id} (${reason})`);
  });
});

// Expose io via app.set('io', io) so controllers can emit events via req.app.get('io')
app.set('io', io);

// ── Swagger UI Documentation ──
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ── Health Check ──
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', time: new Date().toISOString() });
});

// ── Mount REST Routes ──
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/mechanics', mechanicRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/services', serviceRoutes);

// ── Error Handling Middleware ──
app.use(notFoundHandler);
app.use(errorHandler);

// ── Connect Database & Start HTTP Server ──
const startServer = async () => {
  try {
    await connectDB();

    const bookingCount = await Booking.countDocuments();
    if (bookingCount === 0) {
      console.log('ℹ️  Database empty — auto-seeding demo data...');
      await seedDatabase();
    }

    httpServer.listen(PORT, () => {
      console.log(`🚀 Instant Mechanic server listening on http://localhost:${PORT}`);
      console.log(`⚡ Socket.io listening with CORS restricted to ${CLIENT_URL}`);
      console.log(`📚 Swagger Docs available at http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error('❌ Server startup failure:', error);
    process.exit(1);
  }
};

startServer();

export { app, httpServer, io };
