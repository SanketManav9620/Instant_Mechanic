import { Router } from 'express';
import {
  getMechanics,
  getMechanicById,
  createMechanic,
  updateMechanicStatus
} from '../controllers/mechanicController.js';

const router = Router();

router.get('/', getMechanics);
router.get('/:id', getMechanicById);
router.post('/', createMechanic);
router.patch('/:id/status', updateMechanicStatus);

export default router;
