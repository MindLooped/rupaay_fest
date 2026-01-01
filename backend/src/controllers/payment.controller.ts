import { Request, Response, NextFunction } from 'express';

// Create a lightweight payment order. If a real payment gateway
// isn't configured, the frontend will receive `skipPayment: true`
// and proceed directly to booking.
export const createOrderController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { amount = 1, currency = 'INR' } = req.body || {};

    // If a real payment provider key is configured, integrations
    // could be added here. For now return a skipPayment response
    // so the frontend continues the booking flow.
    res.json({
      success: true,
      skipPayment: true,
      orderId: `skip_order_${Date.now()}`,
      key: process.env.RAZORPAY_KEY_ID || '',
      amount,
      currency,
    });
  } catch (error) {
    next(error as Error);
  }
};

// Verify payment - when payments are skipped this simply returns success
export const verifyPaymentController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // In a real integration, verify signatures here. For now always succeed.
    res.json({ success: true, verified: true });
  } catch (error) {
    next(error as Error);
  }
};


