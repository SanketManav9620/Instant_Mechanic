import { Router } from 'express';
import { getCustomers, getCustomerById, createCustomer, addVehicle } from '../controllers/customerController.js';

const router = Router();

router.get('/', getCustomers);
router.get('/:id', getCustomerById);
router.post('/', createCustomer);
router.post('/:id/vehicles', addVehicle);

export default router;
