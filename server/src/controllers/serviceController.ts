import { Request, Response, NextFunction } from 'express';
import Service from '../models/Service.js';

export const getServices = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category } = req.query;
    const filter: any = {};
    if (category && category !== 'all') filter.category = category;

    const services = await Service.find(filter).sort({ category: 1, name: 1 });
    return res.status(200).json({ success: true, data: services });
  } catch (error) {
    next(error);
  }
};

export const createService = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, category, basePrice, estimatedDurationMins } = req.body;
    if (!name || !category || basePrice === undefined || !estimatedDurationMins) {
      return res.status(400).json({ success: false, message: 'Missing required service fields' });
    }

    const service = await Service.create({ name, category, basePrice, estimatedDurationMins });
    return res.status(201).json({ success: true, data: service });
  } catch (error) {
    next(error);
  }
};
