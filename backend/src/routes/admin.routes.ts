import { Router } from 'express';
import { getAllBookingsController, getStatsController, exportBookingsController, clearAllBookingsController } from '../controllers/admin.controller';
import { adminAuth } from '../middleware/auth';

const router = Router();

router.use(adminAuth);

router.get('/bookings', getAllBookingsController);
router.get('/stats', getStatsController);
router.get('/export', exportBookingsController);
router.post('/clear-bookings', clearAllBookingsController);

export default router;
