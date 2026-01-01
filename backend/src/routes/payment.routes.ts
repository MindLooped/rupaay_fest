import { Router } from 'express';
import { createOrderController, verifyPaymentController } from '../controllers/payment.controller';

const router = Router();

// Create a payment order (or return skipPayment when gateway not configured)
router.post('/create-order', createOrderController);

// Verify payment (no-op for skipped payments)
router.post('/verify', verifyPaymentController);

export default router;

