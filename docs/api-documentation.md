# Instant Mechanic — Complete API Documentation

Comprehensive REST API reference for the Instant Mechanic Live Operations Management Platform.

- **Base URL:** `http://localhost:5000/api`
- **Swagger Interactive UI:** `http://localhost:5000/api-docs`
- **Content-Type:** `application/json`

---

## Table of Contents
1. [Health Check](#1-health-check)
2. [Dashboard & Analytics](#2-dashboard--analytics)
   - [GET /dashboard/summary](#get-apidashboardsummary)
   - [GET /dashboard/analytics](#get-apidashboardanalytics)
3. [Bookings API](#3-bookings-api)
   - [GET /bookings](#get-apibookings)
   - [POST /bookings](#post-apibookings)
   - [GET /bookings/:id](#get-apibookingsid)
   - [PATCH /bookings/:id/status](#patch-apibookingsidstatus)
   - [PATCH /bookings/:id/assign](#patch-apibookingsidassign)
4. [Mechanics Fleet API](#4-mechanics-fleet-api)
   - [GET /mechanics](#get-apimechanics)
   - [POST /mechanics](#post-apimechanics)
   - [GET /mechanics/:id](#get-apimechanicsid)
   - [PATCH /mechanics/:id/status](#patch-apimechanicsidstatus)
5. [Customers API](#5-customers-api)
   - [GET /customers](#get-apicustomers)
   - [POST /customers](#post-apicustomers)
   - [GET /customers/:id](#get-apicustomersid)
6. [Services Catalog API](#6-services-catalog-api)
   - [GET /services](#get-apiservices)
   - [POST /services](#post-apiservices)
   - [GET /services/:id](#get-apiservicesid)
7. [WebSocket Real-Time Events](#7-websocket-real-time-events)

---

## 1. Health Check

### `GET /api/health`
Returns the operational health and uptime status of the Express server.

- **Query Parameters:** None
- **Request Body:** None

#### Example Response (200 OK):
```json
{
  "status": "ok",
  "service": "Instant Mechanic Operations API",
  "timestamp": "2026-09-01T14:30:00.000Z"
}
```

---

## 2. Dashboard & Analytics

### `GET /api/dashboard/summary`
Calculates high-level operational KPIs using a single MongoDB `$facet` aggregation pipeline.

- **Query Parameters:** None
- **Request Body:** None

#### Example Response (200 OK):
```json
{
  "success": true,
  "data": {
    "totalBookings": 550,
    "todayBookings": 47,
    "completed": 302,
    "pending": 49,
    "cancelled": 39,
    "inProgress": 58,
    "assigned": 54,
    "totalRevenue": 1155198,
    "activeMechanics": 25,
    "newCustomersToday": 60
  }
}
```

---

### `GET /api/dashboard/analytics`
Returns daily volume/revenue metrics, service category demand (via `$lookup` on Service), status distribution, and period summary over an adjustable sliding window.

- **Query Parameters:**
  | Parameter | Type | Default | Description |
  | :--- | :--- | :--- | :--- |
  | `days` | `number` | `30` | Number of days to analyze (`7`, `30`, or `90`) |

- **Request Body:** None

#### Example Response (200 OK):
```json
{
  "success": true,
  "data": {
    "days": 30,
    "daily": [
      {
        "date": "2026-08-03",
        "label": "Aug 3",
        "bookings": 8,
        "revenue": 24500
      },
      {
        "date": "2026-08-04",
        "label": "Aug 4",
        "bookings": 6,
        "revenue": 35394
      }
    ],
    "byCategory": [
      {
        "category": "Engine",
        "count": 93,
        "revenue": 187972
      },
      {
        "category": "Battery",
        "count": 45,
        "revenue": 9889
      },
      {
        "category": "General Service",
        "count": 44,
        "revenue": 55984
      }
    ],
    "byStatus": [
      { "status": "Completed", "count": 108 },
      { "status": "In Progress", "count": 56 },
      { "status": "Mechanic On The Way", "count": 54 },
      { "status": "Assigned", "count": 54 },
      { "status": "Pending", "count": 45 },
      { "status": "Cancelled", "count": 13 }
    ],
    "summary": {
      "totalBookings": 330,
      "totalRevenue": 404292
    }
  }
}
```

---

## 3. Bookings API

### `GET /api/bookings`
Returns a paginated, searchable, filterable list of bookings with populated foreign references (`customer`, `mechanic`, `service`).

- **Query Parameters:**
  | Parameter | Type | Description |
  | :--- | :--- | :--- |
  | `search` | `string` | Regex match on `bookingId` or `vehicle.licensePlate` |
  | `status` | `string` | Filter by `Pending`, `Assigned`, `Mechanic On The Way`, `In Progress`, `Completed`, `Cancelled` |
  | `page` | `number` | Page number (default `1`) |
  | `limit` | `number` | Items per page (default `10`) |
  | `sortBy` | `string` | Field to sort by: `createdAt`, `amount`, `status`, `bookingId` (default `createdAt`) |
  | `order` | `string` | Sort direction: `asc` or `desc` (default `desc`) |

#### Example Response (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "_id": "6701f4c9a89d1b001a111111",
      "bookingId": "BK-10042",
      "customer": {
        "_id": "6701f4c9a89d1b001a222222",
        "name": "Aarav Sharma",
        "email": "aarav.sharma@example.com",
        "phone": "+91 98765 43210"
      },
      "mechanic": {
        "_id": "6701f4c9a89d1b001a333333",
        "name": "Rajesh Kumar",
        "status": "busy",
        "phone": "+91 98111 22334"
      },
      "service": {
        "_id": "6701f4c9a89d1b001a444444",
        "name": "Comprehensive Engine Diagnostic",
        "category": "Engine",
        "basePrice": 2499
      },
      "vehicle": {
        "make": "Hyundai",
        "model": "Creta",
        "year": 2022,
        "licensePlate": "DL01AB1234"
      },
      "status": "In Progress",
      "amount": 2499,
      "statusHistory": [
        {
          "status": "Pending",
          "timestamp": "2026-08-30T10:00:00.000Z",
          "note": "Initial booking request created"
        },
        {
          "status": "Assigned",
          "timestamp": "2026-08-30T10:05:00.000Z",
          "note": "Assigned to specialist Rajesh Kumar"
        },
        {
          "status": "In Progress",
          "timestamp": "2026-08-30T10:25:00.000Z",
          "note": "Diagnostic inspection started"
        }
      ],
      "createdAt": "2026-08-30T10:00:00.000Z",
      "updatedAt": "2026-08-30T10:25:00.000Z"
    }
  ],
  "pagination": {
    "total": 550,
    "page": 1,
    "limit": 10,
    "pages": 55
  }
}
```

---

### `POST /api/bookings`
Creates a new vehicle service booking with an auto-generated `bookingId` (`BK-XXXXX`).

- **Request Body:**
```json
{
  "customer": "6701f4c9a89d1b001a222222",
  "service": "6701f4c9a89d1b001a444444",
  "vehicle": {
    "make": "Tata",
    "model": "Harrier",
    "year": 2023,
    "licensePlate": "MH02CD5678"
  },
  "amount": 3499,
  "mechanic": "6701f4c9a89d1b001a333333"
}
```

#### Example Response (201 Created):
```json
{
  "success": true,
  "data": {
    "_id": "6701f4c9a89d1b001a999999",
    "bookingId": "BK-10551",
    "status": "Assigned",
    "amount": 3499,
    "createdAt": "2026-09-01T14:40:00.000Z"
  }
}
```

---

### `GET /api/bookings/:id`
Fetches a complete booking record by its MongoDB `_id` with populated foreign models.

- **URL Parameters:** `id` (MongoDB ObjectId)

#### Example Response (200 OK):
```json
{
  "success": true,
  "data": {
    "_id": "6701f4c9a89d1b001a111111",
    "bookingId": "BK-10042",
    "status": "In Progress",
    "amount": 2499,
    "customer": { ... },
    "mechanic": { ... },
    "service": { ... },
    "vehicle": { ... },
    "statusHistory": [ ... ]
  }
}
```

---

### `PATCH /api/bookings/:id/status`
Advances or updates the status of a booking. Pushes an entry to `statusHistory`, triggers mechanic side-effects (e.g. freeing mechanic when Completed/Cancelled), and broadcasts `booking:updated` via Socket.io.

- **URL Parameters:** `id` (MongoDB ObjectId)
- **Request Body:**
```json
{
  "status": "Completed",
  "note": "Final multi-point safety verification completed"
}
```

#### Example Response (200 OK):
```json
{
  "success": true,
  "message": "Booking status updated to Completed",
  "data": {
    "_id": "6701f4c9a89d1b001a111111",
    "bookingId": "BK-10042",
    "status": "Completed",
    "statusHistory": [
      ...
      {
        "status": "Completed",
        "timestamp": "2026-09-01T14:45:00.000Z",
        "note": "Final multi-point safety verification completed"
      }
    ]
  }
}
```

---

### `PATCH /api/bookings/:id/assign`
Assigns or reassigns a technician to a booking. Automatically transitions the booking status to `Assigned` (if currently `Pending`), updates the mechanic's `currentBooking`, and sets their status to `busy`.

- **URL Parameters:** `id` (MongoDB ObjectId)
- **Request Body:**
```json
{
  "mechanicId": "6701f4c9a89d1b001a333333"
}
```

#### Example Response (200 OK):
```json
{
  "success": true,
  "message": "Mechanic Rajesh Kumar assigned to booking BK-10042",
  "data": {
    "_id": "6701f4c9a89d1b001a111111",
    "bookingId": "BK-10042",
    "mechanic": {
      "_id": "6701f4c9a89d1b001a333333",
      "name": "Rajesh Kumar",
      "status": "busy"
    },
    "status": "Assigned"
  }
}
```

---

## 4. Mechanics Fleet API

### `GET /api/mechanics`
Returns the active fleet of field technicians with optional status and specialty filters.

- **Query Parameters:**
  | Parameter | Type | Description |
  | :--- | :--- | :--- |
  | `status` | `string` | `available`, `busy`, `on_the_way`, `offline` |
  | `specialty` | `string` | Filter by specialty (e.g. `Engine`, `Brakes`, `Tyres`) |
  | `page` | `number` | Page number |
  | `limit` | `number` | Items per page |

#### Example Response (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "_id": "6701f4c9a89d1b001a333333",
      "name": "Rajesh Kumar",
      "email": "rajesh.kumar@example.com",
      "phone": "+91 98111 22334",
      "specialties": ["Engine", "Brakes"],
      "status": "busy",
      "rating": 4.8,
      "jobsCompleted": 34,
      "currentBooking": "6701f4c9a89d1b001a111111"
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 20,
    "pages": 2
  }
}
```

---

### `POST /api/mechanics`
Enrolls a new technician into the operations roster.

- **Request Body:**
```json
{
  "name": "Vikram Singh",
  "email": "vikram.singh@example.com",
  "phone": "+91 98222 33445",
  "specialties": ["Tyres", "AC Repair"]
}
```

#### Example Response (201 Created):
```json
{
  "success": true,
  "data": {
    "_id": "6701f4c9a89d1b001a555555",
    "name": "Vikram Singh",
    "status": "available",
    "rating": 5.0,
    "jobsCompleted": 0
  }
}
```

---

### `GET /api/mechanics/:id`
Retrieves a mechanic's full profile along with their historical `relatedBookings[]` array (full job history).

- **URL Parameters:** `id` (MongoDB ObjectId)

#### Example Response (200 OK):
```json
{
  "success": true,
  "data": {
    "_id": "6701f4c9a89d1b001a333333",
    "name": "Rajesh Kumar",
    "rating": 4.8,
    "jobsCompleted": 34,
    "specialties": ["Engine", "Brakes"],
    "status": "busy",
    "phone": "+91 98111 22334",
    "email": "rajesh.kumar@example.com",
    "relatedBookings": [
      {
        "_id": "6701f4c9a89d1b001a111111",
        "bookingId": "BK-10042",
        "status": "Completed",
        "amount": 2499,
        "createdAt": "2026-08-28T09:15:00.000Z",
        "customer": {
          "name": "Aarav Sharma",
          "email": "aarav.sharma@example.com"
        },
        "service": {
          "name": "Comprehensive Engine Diagnostic",
          "category": "Engine"
        }
      }
    ]
  }
}
```

---

### `PATCH /api/mechanics/:id/status`
Updates a technician's fleet availability status (`available`, `busy`, `on_the_way`, `offline`).

- **URL Parameters:** `id` (MongoDB ObjectId)
- **Request Body:**
```json
{
  "status": "available"
}
```

#### Example Response (200 OK):
```json
{
  "success": true,
  "message": "Mechanic status updated to available",
  "data": {
    "_id": "6701f4c9a89d1b001a333333",
    "status": "available"
  }
}
```

---

## 5. Customers API

### `GET /api/customers`
Returns paginated list of registered vehicle owners.

- **Query Parameters:** `search`, `page`, `limit`

#### Example Response (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "_id": "6701f4c9a89d1b001a222222",
      "name": "Aarav Sharma",
      "email": "aarav.sharma@example.com",
      "phone": "+91 98765 43210",
      "vehicles": [
        {
          "make": "Hyundai",
          "model": "Creta",
          "year": 2022,
          "licensePlate": "DL01AB1234"
        }
      ]
    }
  ]
}
```

---

### `POST /api/customers`
Registers a new customer profile.

- **Request Body:**
```json
{
  "name": "Priya Nair",
  "email": "priya.nair@example.com",
  "phone": "+91 97111 88990",
  "vehicles": [
    {
      "make": "Maruti Suzuki",
      "model": "Swift",
      "year": 2021,
      "licensePlate": "KA03MN4321"
    }
  ]
}
```

#### Example Response (201 Created):
```json
{
  "success": true,
  "data": {
    "_id": "6701f4c9a89d1b001a888888",
    "name": "Priya Nair",
    "email": "priya.nair@example.com"
  }
}
```

---

### `GET /api/customers/:id`
Retrieves customer details and their previous service bookings.

---

## 6. Services Catalog API

### `GET /api/services`
Lists all vehicle repair packages available across categories.

- **Query Parameters:** `category` (optional)

#### Example Response (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "_id": "6701f4c9a89d1b001a444444",
      "name": "Comprehensive Engine Diagnostic",
      "category": "Engine",
      "basePrice": 2499,
      "estimatedDurationMinutes": 90,
      "description": "Full electronic ECU scanning and compression test."
    },
    {
      "_id": "6701f4c9a89d1b001a444445",
      "name": "Complete Periodic Service",
      "category": "General Service",
      "basePrice": 3499,
      "estimatedDurationMinutes": 180,
      "description": "Engine oil change, oil filter replacement, fluid top-ups."
    }
  ]
}
```

---

### `POST /api/services`
Creates a new vehicle repair catalog item.

- **Request Body:**
```json
{
  "name": "Ceramic Paint Protection",
  "category": "Cosmetic",
  "basePrice": 7999,
  "estimatedDurationMinutes": 240,
  "description": "9H nano-coating exterior paint shield"
}
```

---

## 7. WebSocket Real-Time Events

The server provides a live WebSocket feed using **Socket.io**.

- **Connection URL:** `ws://localhost:5000` (restricted via CORS to `CLIENT_URL`)

### Server ➔ Client Broadcast: `booking:updated`
Fires whenever a booking transitions states, a mechanic is assigned, or the continuous operations simulator (`simulate.js`) triggers an automated progression.

#### Payload Structure:
```json
{
  "_id": "6701f4c9a89d1b001a111111",
  "bookingId": "BK-10042",
  "status": "In Progress",
  "amount": 2499,
  "customer": {
    "_id": "6701f4c9a89d1b001a222222",
    "name": "Aarav Sharma",
    "email": "aarav.sharma@example.com"
  },
  "mechanic": {
    "_id": "6701f4c9a89d1b001a333333",
    "name": "Rajesh Kumar",
    "status": "busy"
  },
  "service": {
    "name": "Comprehensive Engine Diagnostic",
    "category": "Engine"
  },
  "vehicle": {
    "make": "Hyundai",
    "model": "Creta",
    "licensePlate": "DL01AB1234"
  },
  "statusHistory": [ ... ],
  "updatedAt": "2026-09-01T14:45:00.000Z"
}
```

#### Client Behavior:
1. Displays an instant **Sonner toast alert**: `Booking BK-10042 Updated` (New status: `In Progress`).
2. Invalidates TanStack Query keys `['bookings']` and `['dashboard-summary']`, refreshing UI tables and stat counters in place without full page reloads.
