const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Instant Mechanic — Live Operations API',
    version: '1.0.0',
    description: 'REST API for the Instant Mechanic live vehicle service operations dashboard. Supports CRUD for bookings, mechanics, customers, and services, plus a dashboard aggregation endpoint and real-time Socket.io events.'
  },
  servers: [
    { url: 'http://localhost:5000', description: 'Local Development Server' }
  ],
  tags: [
    { name: 'Dashboard', description: 'Aggregated KPI metrics for the operations dashboard' },
    { name: 'Bookings', description: 'Service booking lifecycle management' },
    { name: 'Mechanics', description: 'Mechanic fleet roster and status control' },
    { name: 'Customers', description: 'Customer profile and vehicle management' },
    { name: 'Services', description: 'Service catalog administration' },
    { name: 'Health', description: 'Server health check' }
  ],
  paths: {
    '/api/health': {
      get: {
        tags: ['Health'],
        summary: 'Server health check',
        responses: {
          '200': {
            description: 'Server is running',
            content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string' }, time: { type: 'string' } } } } }
          }
        }
      }
    },
    '/api/dashboard/summary': {
      get: {
        tags: ['Dashboard'],
        summary: 'Get aggregated dashboard KPI summary',
        description: 'Returns totalBookings, todayBookings, completed, pending, cancelled, totalRevenue, activeMechanics, and newCustomersToday using a MongoDB $facet aggregation.',
        responses: {
          '200': {
            description: 'Dashboard summary data',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        totalBookings: { type: 'integer' },
                        todayBookings: { type: 'integer' },
                        completed: { type: 'integer' },
                        pending: { type: 'integer' },
                        cancelled: { type: 'integer' },
                        inProgress: { type: 'integer' },
                        assigned: { type: 'integer' },
                        totalRevenue: { type: 'number' },
                        activeMechanics: { type: 'integer' },
                        newCustomersToday: { type: 'integer' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/bookings': {
      get: {
        tags: ['Bookings'],
        summary: 'List bookings (paginated, filterable, sortable)',
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search by bookingId or vehicle.licensePlate' },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['Pending', 'Assigned', 'Mechanic On The Way', 'In Progress', 'Completed', 'Cancelled'] } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
          { name: 'sortBy', in: 'query', schema: { type: 'string', default: 'createdAt' } },
          { name: 'order', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' } }
        ],
        responses: {
          '200': {
            description: 'Paginated booking list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { type: 'array', items: { '$ref': '#/components/schemas/Booking' } },
                    pagination: { '$ref': '#/components/schemas/Pagination' }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Bookings'],
        summary: 'Create a new service booking',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['customerId', 'vehicle', 'serviceId'],
                properties: {
                  customerId: { type: 'string' },
                  vehicle: { type: 'object', properties: { make: { type: 'string' }, model: { type: 'string' }, licensePlate: { type: 'string' } } },
                  serviceId: { type: 'string' },
                  mechanicId: { type: 'string' },
                  scheduledAt: { type: 'string', format: 'date-time' },
                  note: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '201': { description: 'Booking created successfully' },
          '400': { description: 'Missing required fields' },
          '404': { description: 'Customer or Service not found' }
        }
      }
    },
    '/api/bookings/{id}': {
      get: {
        tags: ['Bookings'],
        summary: 'Get booking by ID with populated references',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Booking details' },
          '404': { description: 'Booking not found' }
        }
      }
    },
    '/api/bookings/{id}/status': {
      patch: {
        tags: ['Bookings'],
        summary: 'Update booking status (pushes to statusHistory, emits socket event)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: { type: 'string', enum: ['Pending', 'Assigned', 'Mechanic On The Way', 'In Progress', 'Completed', 'Cancelled'] },
                  note: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Status updated; booking:updated socket event emitted' },
          '400': { description: 'Invalid status' },
          '404': { description: 'Booking not found' }
        }
      }
    },
    '/api/bookings/{id}/assign': {
      patch: {
        tags: ['Bookings'],
        summary: 'Assign or reassign a mechanic to a booking',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['mechanicId'], properties: { mechanicId: { type: 'string' } } } } }
        },
        responses: {
          '200': { description: 'Mechanic assigned' },
          '400': { description: 'mechanicId is required' },
          '404': { description: 'Booking or Mechanic not found' }
        }
      }
    },
    '/api/mechanics': {
      get: {
        tags: ['Mechanics'],
        summary: 'List mechanics (paginated, filterable by status/specialty)',
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['available', 'busy', 'on_the_way', 'offline'] } },
          { name: 'specialty', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } }
        ],
        responses: { '200': { description: 'Paginated mechanic list' } }
      },
      post: {
        tags: ['Mechanics'],
        summary: 'Register a new mechanic',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'phone', 'specialties'],
                properties: { name: { type: 'string' }, email: { type: 'string' }, phone: { type: 'string' }, specialties: { type: 'array', items: { type: 'string' } } }
              }
            }
          }
        },
        responses: { '201': { description: 'Mechanic created' } }
      }
    },
    '/api/mechanics/{id}': {
      get: {
        tags: ['Mechanics'],
        summary: 'Get mechanic by ID with related bookings',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Mechanic detail with relatedBookings[]' }, '404': { description: 'Mechanic not found' } }
      }
    },
    '/api/mechanics/{id}/status': {
      patch: {
        tags: ['Mechanics'],
        summary: 'Override mechanic operational status',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['status'], properties: { status: { type: 'string', enum: ['available', 'busy', 'on_the_way', 'offline'] } } } } }
        },
        responses: { '200': { description: 'Status updated' }, '400': { description: 'Invalid status' } }
      }
    },
    '/api/customers': {
      get: {
        tags: ['Customers'],
        summary: 'List customers (paginated, searchable by name/email/phone)',
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } }
        ],
        responses: { '200': { description: 'Paginated customer list' } }
      },
      post: {
        tags: ['Customers'],
        summary: 'Register a new customer with optional vehicles',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'phone', 'address'],
                properties: { name: { type: 'string' }, email: { type: 'string' }, phone: { type: 'string' }, address: { type: 'string' }, vehicles: { type: 'array', items: { type: 'object' } } }
              }
            }
          }
        },
        responses: { '201': { description: 'Customer created' }, '400': { description: 'Duplicate email or missing fields' } }
      }
    },
    '/api/customers/{id}': {
      get: {
        tags: ['Customers'],
        summary: 'Get customer by ID with related bookings',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Customer detail with relatedBookings[]' }, '404': { description: 'Customer not found' } }
      }
    },
    '/api/customers/{id}/vehicles': {
      post: {
        tags: ['Customers'],
        summary: 'Add a vehicle to an existing customer',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['make', 'model', 'year', 'licensePlate'],
                properties: { make: { type: 'string' }, model: { type: 'string' }, year: { type: 'integer' }, licensePlate: { type: 'string' } }
              }
            }
          }
        },
        responses: { '200': { description: 'Vehicle added' }, '404': { description: 'Customer not found' } }
      }
    },
    '/api/services': {
      get: {
        tags: ['Services'],
        summary: 'List all service offerings (filterable by category)',
        parameters: [{ name: 'category', in: 'query', schema: { type: 'string' } }],
        responses: { '200': { description: 'Service catalog list' } }
      },
      post: {
        tags: ['Services'],
        summary: 'Create a new service offering',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'category', 'basePrice', 'estimatedDurationMins'],
                properties: { name: { type: 'string' }, category: { type: 'string' }, basePrice: { type: 'number' }, estimatedDurationMins: { type: 'integer' } }
              }
            }
          }
        },
        responses: { '201': { description: 'Service created' } }
      }
    }
  },
  components: {
    schemas: {
      Pagination: {
        type: 'object',
        properties: {
          total: { type: 'integer' },
          page: { type: 'integer' },
          limit: { type: 'integer' },
          pages: { type: 'integer' }
        }
      },
      Booking: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          bookingId: { type: 'string' },
          customer: { type: 'object' },
          vehicle: { type: 'object', properties: { make: { type: 'string' }, model: { type: 'string' }, licensePlate: { type: 'string' } } },
          service: { type: 'object' },
          mechanic: { type: 'object' },
          status: { type: 'string', enum: ['Pending', 'Assigned', 'Mechanic On The Way', 'In Progress', 'Completed', 'Cancelled'] },
          amount: { type: 'number' },
          scheduledAt: { type: 'string', format: 'date-time' },
          statusHistory: { type: 'array', items: { type: 'object', properties: { status: { type: 'string' }, timestamp: { type: 'string', format: 'date-time' }, note: { type: 'string' } } } },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      }
    }
  }
};

export default swaggerSpec;
