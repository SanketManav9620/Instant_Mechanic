import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';

import connectDB from './config/connectDB.js';
import swaggerSpec from './config/swaggerSpec.js';
import { initSocketServer } from './sockets/socketManager.js';
import { seedDatabase } from './seed/seedData.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { rateLimiter } from './middleware/rateLimiter.js';

import dashboardRoutes from './routes/dashboardRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import mechanicRoutes from './routes/mechanicRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';

import Booking from './models/Booking.js';

dotenv.config();

const app = express();
const httpServer = http.createServer(app);

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// ── Core Middleware ──
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());
app.use('/api', rateLimiter);

// ── Socket.io init & store on Express app for controller access ──
const io = initSocketServer(httpServer, CLIENT_URL);
app.set('io', io); // controllers access via req.app.get('io')

// ── Swagger API Docs ──
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ── Health Check ──
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', time: new Date().toISOString() });
});

// ── REST Routes ──
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/mechanics', mechanicRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/services', serviceRoutes);

// ── 404 & Error Handlers (must be AFTER all routes) ──
app.use(notFoundHandler);
app.use(errorHandler);

// ── Start ──
const startServer = async () => {
  try {
    await connectDB();

    const bookingCount = await Booking.countDocuments();
    if (bookingCount === 0) {
      console.log('ℹ️  Database empty — seeding demo data...');
      await seedDatabase();
    }

    httpServer.listen(PORT, () => {
      console.log(`🚀 Server listening on http://localhost:${PORT}`);
      console.log(`📚 Swagger API Docs at http://localhost:${PORT}/api-docs`);
      console.log(`⚡ Socket.io active and listening for clients`);
    });
  } catch (error) {
    console.error('❌ Server launch failure:', error);
    process.exit(1);
  }
};

startServer();
