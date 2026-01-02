import { Router } from 'express';
import { getAllBookingsController, getStatsController, exportBookingsController } from '../controllers/admin.controller';
import { adminAuth } from '../middleware/auth';

const router = Router();

router.use(adminAuth);

router.get('/bookings', getAllBookingsController);
router.get('/stats', getStatsController);
router.get('/export', exportBookingsController);

export default router;
