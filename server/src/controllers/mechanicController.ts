import { Request, Response, NextFunction } from 'express';
import Mechanic from '../models/Mechanic.js';
import Booking from '../models/Booking.js';

// ────────────────────────────────────────────────────────────────
// getMechanics — paginated list with optional status/specialty filter
//
// Query params: status, specialty, page, limit
// ────────────────────────────────────────────────────────────────
export const getMechanics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      status,
      specialty,
      page = '1',
      limit = '20'
    } = req.query;

    const filter: any = {};
    if (status && status !== 'all') filter.status = status;
    if (specialty) filter.specialties = specialty;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [total, mechanics] = await Promise.all([
      Mechanic.countDocuments(filter),
      Mechanic.find(filter)
        .populate('currentBooking')
        .sort({ name: 1 })
        .skip(skip)
        .limit(limitNum)
    ]);

    return res.status(200).json({
      success: true,
      data: mechanics,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────────────────────────────────────
// getMechanicById — single mechanic detail + their related bookings
//
// Returns the mechanic profile along with an array of all bookings
// where this mechanic was assigned (both active and historical).
// ────────────────────────────────────────────────────────────────
export const getMechanicById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mechanic = await Mechanic.findById(req.params.id).populate('currentBooking');
    if (!mechanic) {
      return res.status(404).json({ success: false, message: 'Mechanic not found' });
    }

    // Fetch all bookings this mechanic has ever been assigned to
    const relatedBookings = await Booking.find({ mechanic: mechanic._id })
      .populate('customer', 'name email')
      .populate('service', 'name category')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: {
        ...mechanic.toObject(),
        relatedBookings
      }
    });
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────────────────────────────────────
// createMechanic — register a new mechanic profile
// ────────────────────────────────────────────────────────────────
export const createMechanic = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, phone, specialties, status, rating } = req.body;
    if (!name || !email || !phone || !specialties || !specialties.length) {
      return res.status(400).json({ success: false, message: 'Missing required mechanic fields' });
    }

    const mechanic = await Mechanic.create({
      name, email, phone, specialties,
      status: status || 'available',
      rating: rating || 5.0
    });

    const io = req.app.get('io');
    if (io) io.emit('mechanic:status_changed', mechanic);

    return res.status(201).json({ success: true, data: mechanic });
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────────────────────────────────────
// updateMechanicStatus — manually override mechanic fleet status
// ────────────────────────────────────────────────────────────────
export const updateMechanicStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['available', 'busy', 'on_the_way', 'offline'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid mechanic status' });
    }

    const mechanic = await Mechanic.findById(id);
    if (!mechanic) {
      return res.status(404).json({ success: false, message: 'Mechanic not found' });
    }

    mechanic.status = status;
    if (status === 'available' || status === 'offline') {
      mechanic.currentBooking = null;
    }
    await mechanic.save();
    await mechanic.populate('currentBooking');

    const io = req.app.get('io');
    if (io) io.emit('mechanic:status_changed', mechanic);

    return res.status(200).json({ success: true, data: mechanic });
  } catch (error) {
    next(error);
  }
};
