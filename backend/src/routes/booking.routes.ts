import { Router } from 'express';
import { 
  getBookingController, 
  getAvailableSeatsController,
  bookSeatController,
  resendTicketController,
  seatSelectionValidation,
  sendVerificationCodeController,
  verifyCodeController,
} from '../controllers/booking.controller';
import rateLimit from 'express-rate-limit';

const router = Router();

const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 bookings per IP
  message: 'Too many booking attempts, please try again later',
});

const verificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per IP
  message: 'Too many verification attempts, please try again later',
});

// Verification routes
router.post('/send-verification', verificationLimiter, sendVerificationCodeController);
router.post('/verify-code', verificationLimiter, verifyCodeController);

// Seat selection routes
router.get('/available-seats', getAvailableSeatsController);
router.post('/book-seat', bookingLimiter, seatSelectionValidation, bookSeatController);

// Booking retrieval and ticket resend
router.get('/:reference', getBookingController);
router.post('/resend-ticket', resendTicketController);

export default router;
