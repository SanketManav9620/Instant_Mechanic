import { Router } from 'express';
import {
  getBookings,
  getBookingById,
  createBooking,
  updateBookingStatus,
  assignMechanic
} from '../controllers/bookingController.js';

const router = Router();

router.get('/', getBookings);
router.get('/:id', getBookingById);
router.post('/', createBooking);
router.patch('/:id/status', updateBookingStatus);
router.patch('/:id/assign', assignMechanic);

export default router;
