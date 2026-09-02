import { Request, Response, NextFunction } from 'express';
import Customer from '../models/Customer.js';
import Booking from '../models/Booking.js';

// ────────────────────────────────────────────────────────────────
// getCustomers — paginated customer list
// ────────────────────────────────────────────────────────────────
export const getCustomers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '20', search } = req.query;

    const filter: any = {};
    if (search && typeof search === 'string' && search.trim() !== '') {
      const regex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { name: regex },
        { email: regex },
        { phone: regex }
      ];
    }

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [total, customers] = await Promise.all([
      Customer.countDocuments(filter),
      Customer.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
    ]);

    return res.status(200).json({
      success: true,
      data: customers,
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
// getCustomerById — single customer with their related bookings
// ────────────────────────────────────────────────────────────────
export const getCustomerById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    // Fetch all bookings for this customer
    const relatedBookings = await Booking.find({ customer: customer._id })
      .populate('service', 'name category basePrice')
      .populate('mechanic', 'name status')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: {
        ...customer.toObject(),
        relatedBookings
      }
    });
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────────────────────────────────────
// createCustomer — register a new customer (with optional vehicles)
// ────────────────────────────────────────────────────────────────
export const createCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, phone, address, vehicles } = req.body;
    if (!name || !email || !phone || !address) {
      return res.status(400).json({ success: false, message: 'Missing required customer fields' });
    }

    const existing = await Customer.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A customer with this email already exists' });
    }

    const customer = await Customer.create({
      name, email, phone, address,
      vehicles: vehicles || []
    });

    return res.status(201).json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────────────────────────────────────
// addVehicle — add a vehicle to an existing customer profile
// ────────────────────────────────────────────────────────────────
export const addVehicle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { make, model, year, licensePlate } = req.body;

    if (!make || !model || !year || !licensePlate) {
      return res.status(400).json({ success: false, message: 'Missing required vehicle fields' });
    }

    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    customer.vehicles.push({ make, model, year, licensePlate });
    await customer.save();

    return res.status(200).json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
};
