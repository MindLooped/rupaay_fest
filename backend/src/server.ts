import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';

import bookingRoutes from './routes/booking.routes';
import adminRoutes from './routes/admin.routes';
import paymentRoutes from './routes/payment.routes';
import { initializeCSV } from './utils/csv-logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
}));
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from frontend
app.use(express.static(path.join(__dirname, '../../frontend/public')));
app.use('/js', express.static(path.join(__dirname, '../../frontend/js')));

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payment', paymentRoutes);

// Serve index.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/public/index.html'));
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// Book A1 to B28 by default on startup
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function bookDefaultSeats() {
  const seatRows = ['A', 'B'];
  const seatNumbers = [];
  for (const row of seatRows) {
    for (let i = 1; i <= 28; i++) {
      seatNumbers.push(`${row}${i}`);
    }
  }
  for (const seat of seatNumbers) {
    const exists = await prisma.student.findFirst({ where: { seatNumber: seat } });
    if (!exists) {
      // Create a dummy booking for each seat
      await prisma.booking.create({
        data: {
          reference: `DEFAULT-${seat}`,
          name: `Default User`,
          email: `default+${seat}@rupaayi.com`,
          ticketsCount: 1,
          status: 'confirmed',
          students: {
            create: [{
              seatNumber: seat,
              name: `Default User`,
              registrationNumber: 'N/A',
              gitamEmail: `default+${seat}@rupaayi.com`,
            }],
          },
        },
      });
    }
  }
}
bookDefaultSeats().catch(console.error);

app.listen(PORT, () => {
  // Initialize CSV file on server start
  initializeCSV();
  
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📧 Email service: ${process.env.SENDGRID_API_KEY ? 'SendGrid' : 'Nodemailer'}`);
  console.log(`🎫 Event: ${process.env.EVENT_NAME || 'Not configured'}`);
  console.log(`📊 CSV export: backend/bookings-export.csv`);
});
