# Architectural Decisions Log (DECISIONS.md)

**Project:** Instant Mechanic — Live Operations Dashboard  
**Author:** Ops Team Engineering  
**Purpose:** Technical rationale and design trade-offs document to aid code comprehension, architectural defense, and technical interviews.

---

## 1. System Overview & Architecture

"Instant Mechanic" is a real-time operations dashboard built for vehicle service operators. It tracks customer bookings, dispatches mechanics, monitors live job progress, and provides revenue analytics.

```
       +-------------------------------------------------------+
       |               React + Vite Dashboard (Client)          |
       |  (TanStack Query + Socket.io Client + Recharts + TS)  |
       +--------------------------+----------------------------+
                                  |
                   HTTP REST API  |  Socket.io Events
                   & Mutations    |  (Real-Time Sync)
                                  v
       +-------------------------------------------------------+
       |               Node.js + Express Server                 |
       |     (Socket.io Manager + Mongoose Controllers)       |
       +--------------------------+----------------------------+
                                  |
                                  v
       +-------------------------------------------------------+
       |                  MongoDB Database                     |
       |  (Customer | Mechanic | ServiceCatalog | Booking)     |
       +-------------------------------------------------------+
```

---

## 2. Technical Stack Trade-Offs & Rationale

### 2.1 Frontend Stack

- **React 18 + Vite + TypeScript**:
  - *Why:* Vite offers near-instant HMR (Hot Module Replacement) and fast build times compared to legacy Webpack. TypeScript guarantees compile-time type safety across API requests, socket payloads, and UI component props.
- **TanStack Query (React Query v5)**:
  - *Why:* Operations dashboards are server-state heavy. TanStack Query manages caching, background refetching, mutation states, and optimistic UI updates seamlessly. It eliminates the boilerplate of Redux or Context API for fetching data.
- **Socket.io-Client**:
  - *Why:* Provides real-time bidirectional event-based communication. Unlike raw WebSockets, Socket.io handles automatic reconnection, event multiplexing, and fallback transport mechanisms.
- **Tailwind CSS + Lucide Icons + Recharts**:
  - *Why:* Enables custom, high-density dark-mode dashboard UI styling with utility classes. Recharts renders smooth SVG visualizations for revenue breakdown and operational throughput.

### 2.2 Backend Stack

- **Node.js + Express + Mongoose (TypeScript)**:
  - *Why:* Lightweight, event-driven I/O model ideal for real-time applications. Mongoose provides schema validation, middleware hooks, and population helpers for referenced documents.
- **Socket.io (Server)**:
  - *Why:* Directly attached to the HTTP server instance. Controllers emit broadcast events (e.g., `booking:updated`, `mechanic:status_changed`) immediately after database mutations succeed.

---

## 3. Data Model & Database Schema Decisions

The database design consists of **4 core collections**:

### 3.1 `Customer` Collection
```typescript
{
  name: String,
  email: String,
  phone: String,
  address: String,
  vehicles: Array<{
    make: String,
    model: String,
    year: Number,
    licensePlate: String
  }>
}
```
- *Decision:* Vehicles are embedded directly within the Customer document.
- *Rationale:* Customers rarely have more than 3-5 vehicles. Embedding avoids unnecessary `$lookup` aggregations when creating a booking or rendering customer vehicle options.

### 3.2 `Mechanic` Collection
```typescript
{
  name: String,
  email: String,
  phone: String,
  specialties: [String], // e.g. ["Engine Diagnostics", "Brake Repair"]
  status: 'available' | 'busy' | 'on_the_way' | 'offline',
  jobsCompleted: Number,
  rating: Number, // e.g. 4.8
  currentBooking: ObjectId (ref: 'Booking')
}
```
- *Decision:* Mechanic status includes an explicit operational state machine (`available`, `on_the_way`, `busy`, `offline`) and a direct `currentBooking` reference.
- *Rationale:* Allows ops dispatchers to instantly check mechanic availability and view their active assignment without scanning all pending bookings.

### 3.3 `Service` Collection
```typescript
{
  name: String, // e.g. "Full Synthetic Oil Change"
  category: String, // e.g. "Maintenance", "Diagnostics", "Emergency"
  basePrice: Number,
  estimatedDurationMins: Number
}
```
- *Decision:* Standard service catalog decoupled from individual bookings.
- *Rationale:* Enables central pricing and duration adjustments while keeping booking snapshots immutable.

### 3.4 `Booking` Collection (Primary Transactional Entity)
```typescript
{
  bookingId: String, // Unique human-readable code e.g. "BK-8492"
  customer: ObjectId (ref: 'Customer'),
  vehicle: { make: String, model: String, licensePlate: String }, // Snapshot copy
  service: ObjectId (ref: 'Service'),
  mechanic: ObjectId (ref: 'Mechanic'),
  status: 'Pending' | 'Assigned' | 'Mechanic On The Way' | 'In Progress' | 'Completed' | 'Cancelled',
  amount: Number,
  scheduledAt: Date,
  statusHistory: Array<{
    status: String,
    timestamp: Date,
    note: String
  }>
}
```
- *Decision:* Includes an embedded snapshot of `vehicle` and a complete `statusHistory` array.
- *Rationale:* Storing a vehicle snapshot guarantees that even if a customer later updates or removes a vehicle from their profile, historical service receipts remain accurate. `statusHistory` provides a full operational audit log for SLA tracking.

---

## 4. State Machine & Real-Time Dispatch Logic

When an ops manager updates a booking status via REST API:

1. **Validation & Transition Rule Check**:
   - Changing status to `Assigned` requires a valid `mechanic` ID.
   - Changing to `Mechanic On The Way` or `In Progress` updates the mechanic's status to `on_the_way` or `busy`.
   - Changing to `Completed` increments `jobsCompleted` on the mechanic model, clears `currentBooking`, and resets mechanic status to `available`.
2. **Database Transaction / Atomic Save**:
   - Both the `Booking` document and `Mechanic` document are updated atomically.
3. **Socket Broadcast**:
   - Express controller triggers `io.emit('booking:updated', updatedBooking)` and `io.emit('mechanic:updated', updatedMechanic)`.
4. **Client Cache Mutation**:
   - Front-end Socket handler listens to events and immediately updates TanStack Query cache (`queryClient.setQueryData`), giving every open dashboard tab instant real-time synchronization without page reloads.

---

## 5. Defense FAQ for Internship / Tech Review

- **Q: Why not use Redux for global state?**  
  *A:* Redux is meant for client UI state (theme, modal state, step forms). Server state (DB items) is better handled by TanStack Query, which manages caching, loading states, and invalidation automatically.
- **Q: What happens if two ops managers update the same booking simultaneously?**  
  *A:* The backend controller enforces status validation and Mongoose version keys (`__v`). Socket broadcasts sync the latest state across all connected browsers within milliseconds.
- **Q: Why copy vehicle data into the Booking model instead of referencing only?**  
  *A:* Database denormalization pattern for historical auditability. Service history must preserve the exact vehicle state at the time of service.
