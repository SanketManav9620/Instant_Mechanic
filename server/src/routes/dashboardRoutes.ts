import { Router } from 'express';
import { getDashboardSummary } from '../controllers/dashboardController.js';
import { getAnalytics } from '../controllers/analyticsController.js';

const router = Router();

router.get('/', getDashboardSummary);
router.get('/summary', getDashboardSummary);
router.get('/analytics', getAnalytics);

export default router;
