import { Request, Response, NextFunction } from 'express';
import Booking, { BookingStatus } from '../models/Booking.js';
import Mechanic from '../models/Mechanic.js';

// ────────────────────────────────────────────────────────────────
// getBookings — paginated, filterable, sortable list
//
// Query params supported:
//   search   – partial match on bookingId OR vehicle.licensePlate
//   status   – exact match on booking status enum
//   page     – 1-indexed page number (default 1)
//   limit    – items per page (default 20, max 100)
//   sortBy   – field name to sort on (default "createdAt")
//   order    – "asc" or "desc" (default "desc")
//
// Returns { success, data, pagination: { total, page, limit, pages } }
// ────────────────────────────────────────────────────────────────
export const getBookings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      search,
      status,
      page = '1',
      limit = '20',
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    // Build Mongoose filter object dynamically
    const filter: any = {};

    // If the caller sent a status filter (and it isn't "all"), add it
    if (status && status !== 'all') {
      filter.status = status;
    }

    // If the caller sent a search term, match against bookingId
    // OR embedded vehicle.licensePlate using case-insensitive regex.
    // We use $or so either field matching is enough.
    if (search && typeof search === 'string' && search.trim() !== '') {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      filter.$or = [
        { bookingId: regex },
        { 'vehicle.licensePlate': regex }
      ];
    }

    // Parse pagination values; clamp limit to 100 max
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    // Build sort object. order === 'asc' → 1, otherwise → -1
    const sortOrder = order === 'asc' ? 1 : -1;
    const sortObj: Record<string, 1 | -1> = { [sortBy as string]: sortOrder };

    // countDocuments uses the same filter to calculate total hits.
    // We run count and find in parallel with Promise.all for speed.
    const [total, bookings] = await Promise.all([
      Booking.countDocuments(filter),
      Booking.find(filter)
        .populate('customer', 'name email phone')   // only project needed fields
        .populate('mechanic', 'name status phone rating')
        .populate('service', 'name category basePrice estimatedDurationMins')
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
    ]);

    const pages = Math.ceil(total / limitNum);

    return res.status(200).json({
      success: true,
      data: bookings,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages
      }
    });
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────────────────────────────────────
// getBookingById — single booking with fully populated references
// ────────────────────────────────────────────────────────────────
export const getBookingById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('customer')
      .populate('mechanic')
      .populate('service');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    return res.status(200).json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────────────────────────────────────
// createBooking — create a new service booking, optionally
// assign a mechanic immediately (status becomes "Assigned")
// ────────────────────────────────────────────────────────────────
export const createBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { customerId, vehicle, serviceId, mechanicId, scheduledAt, note } = req.body;

    if (!customerId || !vehicle || !vehicle.make || !vehicle.model || !vehicle.licensePlate || !serviceId) {
      return res.status(400).json({ success: false, message: 'Missing required booking fields' });
    }

    // Lookup service to pull the base price for the booking amount
    const Service = (await import('../models/Service.js')).default;
    const Customer = (await import('../models/Customer.js')).default;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    // Generate human-readable booking ID like BK-4921
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const bookingId = `BK-${randomNum}`;

    const initialStatus: BookingStatus = mechanicId ? 'Assigned' : 'Pending';

    const booking = await Booking.create({
      bookingId,
      customer: customerId,
      vehicle: { make: vehicle.make, model: vehicle.model, licensePlate: vehicle.licensePlate },
      service: serviceId,
      mechanic: mechanicId || null,
      status: initialStatus,
      amount: service.basePrice,
      scheduledAt: scheduledAt || new Date(),
      statusHistory: [{
        status: initialStatus,
        timestamp: new Date(),
        note: note || 'Booking created via ops dispatch'
      }]
    });

    // If a mechanic was assigned upfront, mark them busy
    if (mechanicId) {
      const mechanic = await Mechanic.findById(mechanicId);
      if (mechanic) {
        mechanic.status = 'busy';
        mechanic.currentBooking = booking._id as any;
        await mechanic.save();
      }
    }

    // Populate for the response and socket broadcast
    const populated = await Booking.findById(booking._id)
      .populate('customer', 'name email phone')
      .populate('mechanic', 'name status phone rating')
      .populate('service', 'name category basePrice estimatedDurationMins');

    // Emit real-time event via Socket.io
    // req.app.get('io') returns the Socket.io server instance
    // that was stored on the Express app during initialization
    const io = req.app.get('io');
    if (io) io.emit('booking:created', populated);

    return res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────────────────────────────────────
// updateBookingStatus — advance or change booking status
//
// Body: { status: BookingStatus, note?: string }
//
// Side-effects:
//   • Pushes a timestamped entry into statusHistory[]
//   • Updates the assigned mechanic's status field accordingly
//   • Emits "booking:updated" via Socket.io for real-time sync
// ────────────────────────────────────────────────────────────────
export const updateBookingStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body as { status: BookingStatus; note?: string };

    const validStatuses: BookingStatus[] = [
      'Pending', 'Assigned', 'Mechanic On The Way', 'In Progress', 'Completed', 'Cancelled'
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status: ${status}` });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Update status and append to audit trail
    booking.status = status;
    booking.statusHistory.push({
      status,
      timestamp: new Date(),
      note: note || `Status updated to ${status}`
    });

    await booking.save();

    // ── Side-effects on the assigned mechanic ──
    if (booking.mechanic) {
      const mechanic = await Mechanic.findById(booking.mechanic);
      if (mechanic) {
        if (status === 'Mechanic On The Way') {
          mechanic.status = 'on_the_way';
        } else if (status === 'In Progress') {
          mechanic.status = 'busy';
        } else if (status === 'Completed') {
          mechanic.status = 'available';
          mechanic.currentBooking = null;
          mechanic.jobsCompleted += 1;
        } else if (status === 'Cancelled') {
          mechanic.status = 'available';
          mechanic.currentBooking = null;
        }
        await mechanic.save();

        const io = req.app.get('io');
        if (io) io.emit('mechanic:status_changed', mechanic);
      }
    }

    // Re-fetch with populated refs for the response payload
    const populated = await Booking.findById(id)
      .populate('customer', 'name email phone')
      .populate('mechanic', 'name status phone rating')
      .populate('service', 'name category basePrice estimatedDurationMins');

    // Emit booking:updated so every connected dashboard updates instantly
    const io = req.app.get('io');
    if (io) io.emit('booking:updated', populated);

    return res.status(200).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────────────────────────────────────
// assignMechanic — assign (or reassign) a mechanic to a booking
// ────────────────────────────────────────────────────────────────
export const assignMechanic = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { mechanicId } = req.body;

    if (!mechanicId) {
      return res.status(400).json({ success: false, message: 'mechanicId is required' });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const mechanic = await Mechanic.findById(mechanicId);
    if (!mechanic) {
      return res.status(404).json({ success: false, message: 'Mechanic not found' });
    }

    booking.mechanic = mechanic._id as any;
    booking.status = 'Assigned';
    booking.statusHistory.push({
      status: 'Assigned',
      timestamp: new Date(),
      note: `Assigned to mechanic ${mechanic.name}`
    });
    await booking.save();

    mechanic.status = 'busy';
    mechanic.currentBooking = booking._id as any;
    await mechanic.save();

    const populated = await Booking.findById(id)
      .populate('customer', 'name email phone')
      .populate('mechanic', 'name status phone rating')
      .populate('service', 'name category basePrice estimatedDurationMins');

    const io = req.app.get('io');
    if (io) {
      io.emit('booking:updated', populated);
      io.emit('mechanic:status_changed', mechanic);
    }

    return res.status(200).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};
