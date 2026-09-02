# Instant Mechanic — Live Operations Dashboard & Telemetry Platform

An enterprise-grade, real-time MERN (MongoDB, Express, React, Node.js) operations command center engineered for on-demand roadside vehicle mechanics and garage dispatch fleets.

Featuring sub-second WebSocket telemetry, TanStack Query caching, headless TanStack Table v8 grids, Recharts performance analytics, and an autonomous event simulator.

---

## Table of Contents
- [1. Project Overview](#1-project-overview)
- [2. Tech Stack](#2-tech-stack)
- [3. Architecture & Data Flow](#3-architecture--data-flow)
- [4. Environment Variables](#4-environment-variables)
- [5. Local Setup & Installation](#5-local-setup--installation)
- [6. Database Seeding & Event Simulator](#6-database-seeding--event-simulator)
- [7. API Documentation](#7-api-documentation)
- [8. Deployment Guide](#8-deployment-guide)
- [9. AI Usage & Agentic Workflow](#9-ai-usage--agentic-workflow)

---

## 1. Project Overview

**Instant Mechanic** orchestrates high-volume vehicle breakdown dispatches, roadside repairs, and routine maintenance bookings. It bridges the gap between field technicians, vehicle owners, and dispatch operators.

### Key Capabilities:
- **Real-Time Operations Telemetry:** Instant WebSocket synchronization via Socket.io with automated UI cache invalidation and toast alerts.
- **KPI Metrics ($facet Aggregation):** Single-query MongoDB pipeline computing active jobs, revenue in Indian Rupees (INR), fleet availability, and daily throughput.
- **Headless Data Grid (TanStack Table v8):** Multi-column sorting, debounced regex search (by booking ID or license plate), status filtering, and pagination.
- **Deep Analytics (Recharts):** Multi-chart telemetry dashboard featuring booking volume trajectories, revenue velocity (INR), operational status donut distribution, and service category breakdown via MongoDB `$lookup`.
- **Interactive Operations Demo Controller:** Allows dispatchers or interviewers to advance booking statuses with a single click, append audit log notes, and observe live updates broadcast across all connected clients.
- **Autonomous Event Simulator (`simulate.js`):** Background worker that continuously advances bookings through the operational lifecycle every 15–30 seconds.

---

## 2. Tech Stack

### Frontend Client
| Technology | Purpose |
| :--- | :--- |
| **React 18 + Vite** | High-performance SPA build tooling |
| **TypeScript** | Strict end-to-end type safety |
| **Tailwind CSS** | Custom glassmorphism, responsive styling, dark theme |
| **TanStack Query v5** | Server-state caching, background refetching, mutation lifecycle |
| **TanStack Table v8** | Headless, virtualized, sortable, paginated data grid |
| **Recharts** | Telemetry visualizations (Line, Area, Donut, Horizontal Bar) |
| **Socket.io Client** | Real-time WebSocket connection to dispatch server |
| **Sonner** | Modern stacked toast alerts |
| **Lucide React** | Consistent iconography |

### Backend Server
| Technology | Purpose |
| :--- | :--- |
| **Node.js + Express** | High-concurrency RESTful API engine |
| **MongoDB + Mongoose** | Document database with `$facet` & `$lookup` aggregations |
| **Socket.io** | WebSocket broadcast hub with CORS restrictions |
| **Swagger UI Express** | Interactive OpenAPI 3.0 API documentation at `/api-docs` |
| **@faker-js/faker** | Deterministic realistic seeder generation |
| **CORS & Morgan** | Cross-origin resource sharing & HTTP request logging |

---

## 3. Architecture & Data Flow

```
                     ┌────────────────────────┐
                     │   Browser Client(s)    │
                     │  React 18 + Vite + TS  │
                     └──────▲──────────┬──────┘
                            │          │
             Socket.io      │          │  REST Requests
       (booking:updated)    │          │  (Axios / TanStack Query)
                            │          │
                     ┌──────┴──────────▼──────┐
                     │   Express API Server   │
                     │       (Port 5000)      │
                     └──────▲──────────┬──────┘
                            │          │
        Mongoose Aggregation│          │  CRUD Operations
         ($facet, $lookup)  │          │  Indexed Queries
                            │          │
                     ┌──────┴──────────▼──────┐
                     │     MongoDB Server     │
                     │      (Port 27017)      │
                     └────────────────────────┘
                                ▲
                                │ PATCH /api/bookings/:id/status
                     ┌──────────┴─────────────┐
                     │ Continuous Simulator   │
                     │     (simulate.js)      │
                     └────────────────────────┘
```

### Key Architectural Decisions:
1. **Denormalized Vehicle Snapshots:** Vehicles are denormalized directly inside `Booking` documents to preserve historical accuracy (make, model, license plate) even if the customer edits their profile later.
2. **Compound & Text Indexes:** High-speed `$or` regex searches on `bookingId` and `vehicle.licensePlate` with pagination support.
3. **Unified Single-Roundtrip `$facet` Aggregations:** Summary KPIs and Analytics metrics execute in one database call rather than multiple serial `countDocuments()` calls.
4. **WebSocket Decoupling:** Express controllers obtain `io` via `req.app.get('io')` and emit events upon database persistence, keeping socket transport completely decoupled from business logic.

---

## 4. Environment Variables

### Server Configuration (`server/.env`)
Create a `.env` file in `server/` with the following variables:

```env
# MongoDB Connection String (Use 127.0.0.1 on Windows to bypass IPv6 resolution latency)
MONGO_URI=mongodb://127.0.0.1:27017/instant-mechanic

# Port for Express API Server
PORT=5000

# Client origin allowed by CORS and Socket.io
CLIENT_URL=http://localhost:5173
```

### Client Configuration (`client/.env`)
Create a `.env` file in `client/` with the following variables:

```env
# Base API URL pointing to Express backend
VITE_API_URL=http://localhost:5000/api
```

---

## 5. Local Setup & Installation

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB**: Local Community Server running on `mongodb://127.0.0.1:27017` (or MongoDB Atlas URI)

### Step 1: Clone Repository
```bash
git clone https://github.com/your-username/instant-mechanic-dashboard.git
cd instant-mechanic-dashboard
```

### Step 2: Install Server Dependencies
```bash
cd server
npm install
```

### Step 3: Install Client Dependencies
```bash
cd ../client
npm install
```

### Step 4: Seed Database with Realistic Fleet Data
Run the high-performance seeder to generate 550 realistic bookings, 60 customers, 25 mechanics, and 8 INR repair packages:
```bash
cd ../server
npm run seed
```

### Step 5: Start Development Servers

**Terminal 1 — Backend Server (Port 5000):**
```bash
cd server
npm run dev
```
*Backend will start on `http://localhost:5000` with Swagger docs at `http://localhost:5000/api-docs`.*

**Terminal 2 — Frontend Client (Port 5173):**
```bash
cd client
npm run dev
```
*Frontend will launch on `http://localhost:5173`.*

---

## 6. Database Seeding & Event Simulator

### Seeder Script (`server/src/seed/seedData.ts`)
- Cleans existing collections and seeds:
  - **8 Vehicle Repair Services:** Realistic INR base prices (₹899 to ₹7,999) across Engine, Brakes, Tyres, AC, Battery, Cosmetic, and General Service.
  - **60 Customers:** Indian names with registered vehicles.
  - **25 Mechanics:** Star ratings (4.1 to 5.0), verified specialties, and availability states.
  - **550 Bookings:** Spanning the past 90 days with realistic status distribution (~55% Completed).
- Command: `npm run seed`

### Continuous Event Simulator (`server/simulate.js`)
- Runs continuously in the background.
- Every 15–30 seconds, picks a random `Pending` or `Assigned` booking.
- Calls `PATCH /api/bookings/:id/status`, pushing to `statusHistory` and broadcasting `booking:updated`.
- Demonstrates live client synchronization without user interaction.
- Command to run in separate terminal:
  ```bash
  cd server
  npm run simulate
  ```

---

## 7. API Documentation

Interactive OpenAPI 3.0 documentation is available directly in the browser at:
👉 **`http://localhost:5000/api-docs`**

For the complete endpoint specification including query parameters, request bodies, and JSON responses, see:
📖 **[`docs/api-documentation.md`](docs/api-documentation.md)**

### Quick Route Summary:
- `GET /api/health` — Server health status
- `GET /api/dashboard/summary` — High-level KPI metrics ($facet)
- `GET /api/dashboard/analytics` — Multi-day telemetry ($lookup on Service)
- `GET /api/bookings` — Paginated, searchable data table
- `POST /api/bookings` — Create new booking
- `GET /api/bookings/:id` — Detail view with full timeline
- `PATCH /api/bookings/:id/status` — Advance status & broadcast event
- `PATCH /api/bookings/:id/assign` — Assign mechanic to job
- `GET /api/mechanics` — Fleet roster with live status
- `GET /api/mechanics/:id` — Technician profile with full job history
- `GET /api/services` — Service catalog with INR pricing
- `GET /api/customers` — Registered vehicle owners

---

## 8. Deployment Guide

### Deploying the Backend (Render / Railway / Fly.io)
1. Set the root directory to `server/`.
2. Build command: `npm install && npm run build`
3. Start command: `npm start`
4. Set Environment Variables:
   - `MONGO_URI`: MongoDB Atlas connection string.
   - `PORT`: `5000` (or injected by platform).
   - `CLIENT_URL`: URL of the deployed frontend (e.g. `https://instant-mechanic.vercel.app`).

### Deploying the Frontend (Vercel / Netlify / Cloudflare Pages)
1. Set root directory to `client/`.
2. Framework preset: **Vite**
3. Build command: `npm run build`
4. Output directory: `dist`
5. Set Environment Variable:
   - `VITE_API_URL`: URL of the deployed backend (e.g. `https://instant-mechanic-api.onrender.com/api`).

---

## 9. AI Usage & Agentic Workflow

This project was built with the assistance of **Google DeepMind's Antigravity Advanced Agentic Coding System**:

- **Architecture Planning:** Interactive plan alignment defining MERN separation, denormalization trade-offs, and aggregation optimizations in `all_flows` and `DECISIONS.md`.
- **Database Engineering:** Schemas with compound text indexes and atomic status transitions.
- **Real-Time Testing:** Autonomous headless browser testing (`browser_subagent`) capturing WebP video sessions verifying multi-resolution responsiveness (375px, 768px, 1440px), toast notifications, and interactive status advance controls.
- **Documentation:** Continuous chronological step-by-step audit logging maintained in `all_flows`.
