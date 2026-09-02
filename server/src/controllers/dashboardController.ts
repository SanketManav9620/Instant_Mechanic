import { Request, Response, NextFunction } from 'express';
import Booking from '../models/Booking.js';
import Mechanic from '../models/Mechanic.js';
import Customer from '../models/Customer.js';

// getDashboardSummary uses a MongoDB aggregation pipeline instead of
// multiple separate queries. A single $facet stage runs several
// sub-pipelines in one round-trip to the database, which is much
// faster than issuing 6+ independent countDocuments() calls.

export const getDashboardSummary = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // ─── Single aggregation with $facet ───
    // $facet lets us run multiple aggregation sub-pipelines on the
    // same input collection (bookings) in parallel. Each key in the
    // $facet object becomes a named result array.
    const [result] = await Booking.aggregate([
      {
        $facet: {
          // Count every booking in the collection
          totalBookings: [{ $count: 'count' }],

          // Count bookings whose createdAt >= start of today
          todayBookings: [
            { $match: { createdAt: { $gte: todayStart } } },
            { $count: 'count' }
          ],

          // Group bookings by status and count each group
          byStatus: [
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ],

          // Sum the "amount" field of all Completed bookings
          totalRevenue: [
            { $match: { status: 'Completed' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
          ]
        }
      }
    ]);

    // Helper: safely extract a count from a $facet result array.
    // $facet returns [] when no documents match, so we default to 0.
    const extract = (arr: any[]) => (arr.length > 0 ? arr[0].count : 0);

    const totalBookings = extract(result.totalBookings);
    const todayBookings = extract(result.todayBookings);
    const totalRevenue = result.totalRevenue.length > 0 ? result.totalRevenue[0].total : 0;

    // Turn the byStatus array into a keyed object like { Pending: 3, Completed: 5, ... }
    const statusMap: Record<string, number> = {};
    result.byStatus.forEach((s: any) => {
      statusMap[s._id] = s.count;
    });

    // Mechanic counts: separate query because it hits a different collection.
    // countDocuments with a filter uses the index on "status".
    const activeMechanics = await Mechanic.countDocuments({
      status: { $in: ['available', 'busy', 'on_the_way'] }
    });

    // Customers created today
    const newCustomersToday = await Customer.countDocuments({
      createdAt: { $gte: todayStart }
    });

    return res.status(200).json({
      success: true,
      data: {
        totalBookings,
        todayBookings,
        completed: statusMap['Completed'] || 0,
        pending: statusMap['Pending'] || 0,
        cancelled: statusMap['Cancelled'] || 0,
        inProgress: statusMap['In Progress'] || 0,
        assigned: statusMap['Assigned'] || 0,
        totalRevenue,
        activeMechanics,
        newCustomersToday
      }
    });
  } catch (error) {
    next(error);
  }
};
