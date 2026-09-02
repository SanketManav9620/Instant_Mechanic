import { Request, Response, NextFunction } from 'express';
import Booking from '../models/Booking.js';

// ────────────────────────────────────────────────────────────────
// getAnalytics — Returns daily booking counts, revenue over time,
// booking counts grouped by service category (via $lookup on Service),
// and status breakdown for the last N days (7d, 30d, 90d).
// ────────────────────────────────────────────────────────────────
export const getAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { days = '30' } = req.query;
    const numDays = Math.min(90, Math.max(1, parseInt(days as string, 10) || 30));

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - numDays);
    startDate.setHours(0, 0, 0, 0);

    // ── MongoDB Aggregation with $facet & $lookup ──
    const [aggregationResult] = await Booking.aggregate([
      {
        $facet: {
          // 1. Daily booking counts and revenue for the last N days
          dailyMetrics: [
            { $match: { createdAt: { $gte: startDate } } },
            {
              $group: {
                _id: {
                  $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                },
                bookings: { $sum: 1 },
                revenue: {
                  $sum: {
                    $cond: [{ $eq: ['$status', 'Completed'] }, '$amount', 0]
                  }
                }
              }
            },
            { $sort: { _id: 1 } }
          ],

          // 2. Booking counts & revenue grouped by service category via $lookup
          categoryBreakdown: [
            { $match: { createdAt: { $gte: startDate } } },
            {
              $lookup: {
                from: 'services',
                localField: 'service',
                foreignField: '_id',
                as: 'serviceDoc'
              }
            },
            { $unwind: '$serviceDoc' },
            {
              $group: {
                _id: '$serviceDoc.category',
                count: { $sum: 1 },
                revenue: {
                  $sum: {
                    $cond: [{ $eq: ['$status', 'Completed'] }, '$amount', 0]
                  }
                }
              }
            },
            { $sort: { count: -1 } }
          ],

          // 3. Status breakdown counts for the donut chart
          statusBreakdown: [
            { $match: { createdAt: { $gte: startDate } } },
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 }
              }
            },
            { $sort: { count: -1 } }
          ],

          // 4. Period totals
          periodSummary: [
            { $match: { createdAt: { $gte: startDate } } },
            {
              $group: {
                _id: null,
                totalBookings: { $sum: 1 },
                totalRevenue: {
                  $sum: {
                    $cond: [{ $eq: ['$status', 'Completed'] }, '$amount', 0]
                  }
                }
              }
            }
          ]
        }
      }
    ]);

    // Format daily metrics with all continuous dates filled in
    const dailyMap = new Map<string, { bookings: number; revenue: number }>();
    (aggregationResult.dailyMetrics || []).forEach((item: any) => {
      dailyMap.set(item._id, { bookings: item.bookings, revenue: item.revenue });
    });

    const continuousDaily: Array<{ date: string; label: string; bookings: number; revenue: number }> = [];
    const currentDate = new Date(startDate);
    const today = new Date();

    while (currentDate <= today) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const monthStr = currentDate.toLocaleDateString('en-US', { month: 'short' });
      const dayNum = currentDate.getDate();
      const label = `${monthStr} ${dayNum}`;

      const existing = dailyMap.get(dateStr) || { bookings: 0, revenue: 0 };
      continuousDaily.push({
        date: dateStr,
        label,
        bookings: existing.bookings,
        revenue: existing.revenue
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    const byCategory = (aggregationResult.categoryBreakdown || []).map((cat: any) => ({
      category: cat._id || 'Uncategorized',
      count: cat.count,
      revenue: cat.revenue
    }));

    const byStatus = (aggregationResult.statusBreakdown || []).map((st: any) => ({
      status: st._id,
      count: st.count
    }));

    const summary = aggregationResult.periodSummary?.[0] || {
      totalBookings: 0,
      totalRevenue: 0
    };

    return res.status(200).json({
      success: true,
      data: {
        days: numDays,
        daily: continuousDaily,
        byCategory,
        byStatus,
        summary: {
          totalBookings: summary.totalBookings,
          totalRevenue: summary.totalRevenue
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
