const prisma = new PrismaClient();

// Get all available seats (not booked)
export const getAvailableSeatsController = async (req: Request, res: Response) => {
  try {
    // Assume seats are labeled as A1, A2, ..., H12 (example: 8 rows, 12 seats each)
    const rows = ['A','B','C','D','E','F','G','H'];
    const seatsPerRow = 12;
    const allSeats = rows.flatMap(row => Array.from({length: seatsPerRow}, (_, i) => `${row}${i+1}`));
    // First two rows always booked
    const alwaysBooked = rows.slice(0,2).flatMap(row => Array.from({length: seatsPerRow}, (_, i) => `${row}${i+1}`));
    // Get booked seats from DB
    const bookedStudents = await prisma.student.findMany({ select: { seatNumber: true } });
    const booked = new Set([...alwaysBooked, ...bookedStudents.map(s => s.seatNumber)]);
    const available = allSeats.filter(seat => !booked.has(seat));
    res.json({ success: true, availableSeats: available, bookedSeats: Array.from(booked) });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch seats' });
  }
};

// Get booking by reference
export const getBookingController = async (req: Request, res: Response) => {
  try {
    const { reference } = req.params;
    const booking = await prisma.booking.findUnique({ where: { reference }, include: { students: true } });
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }
    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch booking' });
  }
};

// Validate seat selection (middleware)
export const seatSelectionValidation = (req: Request, res: Response, next: NextFunction) => {
  const { students } = req.body;
  if (!students || !Array.isArray(students) || students.length !== 1) {
    return res.status(400).json({ success: false, error: 'Exactly one student/seat must be selected.' });
  }
  const seatNumber = students[0].seatNumber;
  // Validate seat format (e.g., A1-H12)
  if (!/^[A-H](?:[1-9]|1[0-2])$/.test(seatNumber)) {
    return res.status(400).json({ success: false, error: 'Invalid seat number format.' });
  }
  next();
};

// Email verification and ticket sending
export const verifyEmailController = async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ success: false, error: 'Email and code are required' });
    }
    const booking = await prisma.booking.findFirst({ where: { email, verificationCode: code, status: 'pending' }, include: { students: true } });
    if (!booking) {
      return res.status(400).json({ success: false, error: 'Invalid code or email' });
    }
    // Mark as verified and confirmed
    await prisma.booking.update({ where: { id: booking.id }, data: { isVerified: true, status: 'confirmed' } });
    // Generate QR code
    const qrCode = await generateQRCode(booking.reference);
    // Prepare seatNumbers and studentDetails for email
    const seatNumbers = booking.students.map((s: any) => s.seatNumber).join(', ');
    const studentDetails = booking.students.map((s: any) => `<b>${s.name}</b> (${s.registrationNumber || 'N/A'}) - Seat: <b>${s.seatNumber}</b>`).join('<br>');
    const emailData = {
      name: booking.students[0].name,
      email: booking.email,
      reference: booking.reference,
      ticketsCount: 1,
      qrCode,
      eventName: 'Rupaayi Fest 2026',
      eventDate: 'Monday, January 7, 2026',
      seatNumber: seatNumbers,
      seatNumbers,
      studentDetails,
      venue: 'Auditorium, Gitam University BLR',
      posterUrl: undefined
    };
    await sendTicketEmail(emailData);
    res.json({ success: true, message: 'Email verified and ticket sent.' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Verification failed' });
  }
};
import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { sendEmail, sendTicketEmail } from '../services/email.service';
import { generateQRCode } from '../services/qr.service';
import { generateBookingReference } from '../utils/reference';
import { generateRandomReference } from '../utils/reference';
import { appendMultipleStudentsToCSV } from '../utils/csv-logger';


// Placeholder: getAvailableSeatsController
export const getAvailableSeatsController = async (req: Request, res: Response) => {
  res.status(501).json({ success: false, message: 'Not implemented' });
};

// Placeholder: seatSelectionValidation (middleware)
export const seatSelectionValidation = (req: Request, res: Response, next: NextFunction) => {
  next();
};
export const bookSeatController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }
    const { gitamEmail, students } = req.body;
    if (!gitamEmail || !students || !Array.isArray(students) || students.length !== 1) {
      res.status(400).json({ success: false, error: 'Invalid booking data' });
      return;
    }
    // Check if this email has already booked a ticket
    const existingBooking = await prisma.booking.findFirst({
      where: {
        email: gitamEmail,
        status: 'confirmed',
      },
    });
    if (existingBooking) {
      res.status(400).json({ success: false, error: 'A ticket has already been issued for this email.' });
      return;
    }
    // Check if seat is already booked
    const seatNumber = students[0].seatNumber;
    const existing = await prisma.student.findFirst({ where: { seatNumber } });
    if (existing) {
      res.status(400).json({ success: false, error: `Seat ${seatNumber} is already booked` });
      return;
    }
    // Generate booking reference
    const bookingCount = await prisma.booking.count();
    const reference = generateBookingReference(bookingCount + 1);
    // Generate verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    // Create booking and student with status 'pending' and verification code
    const booking = await prisma.booking.create({
      data: {
        reference,
        name: students[0].name,
        email: gitamEmail,
        ticketsCount: 1,
        status: 'pending',
        verificationCode,
        isVerified: false,
        students: {
          create: [
            {
              seatNumber: students[0].seatNumber,
              name: students[0].name,
              registrationNumber: students[0].registrationNumber,
              gitamEmail,
            },
          ],
        },
      },
      include: { students: true },
    });
    // Send verification email (simple text for now, can use a template)
    await sendEmail({
      to: gitamEmail,
      subject: 'Verify your email for Rupaayi Fest booking',
      html: `<p>Your verification code is: <b>${verificationCode}</b></p>`
    });
    res.status(201).json({
      success: true,
      message: 'Booking created. Please verify your email.',
      booking: {
        reference: booking.reference,
        email: booking.email,
        students: booking.students,
      },
    });
  } catch (error) {
    console.error('❌ Booking error:', error);
    next(error);
  }
}
export const resendTicketController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { reference, bookingReference } = req.body;
    const refToUse = reference || bookingReference;

    if (!refToUse) {
      res.status(400).json({ success: false, error: 'Booking reference is required' });
      return;
    }

    console.log('📧 Resending ticket for reference:', refToUse);

    // Get booking details
    const booking = await prisma.booking.findUnique({
      where: { reference: refToUse },
      include: {
        students: true,
      },
    });

    if (!booking) {
      console.log('❌ Booking not found:', refToUse);
      res.status(404).json({ success: false, error: 'Booking not found' });
      return;
    }

    if (booking.status !== 'confirmed') {
      res.status(400).json({ success: false, error: 'Only confirmed bookings can resend tickets' });
      return;
    }

    console.log('✅ Booking found, generating QR code...');

    // Generate QR code
    const qrCode = await generateQRCode(refToUse);

    // Prepare seatNumbers and studentDetails for email
    const seatNumbers = booking.students.map((s: any) => s.seatNumber).join(', ');
    const studentDetails = booking.students.map((s: any) =>
      `<b>${s.name}</b> (${s.registrationNumber || 'N/A'}) - Seat: <b>${s.seatNumber}</b>`
    ).join('<br>');
    const emailData = {
      name: booking.students[0].name,
      email: booking.email,
      reference: booking.reference,
      ticketsCount: booking.students.length,
      qrCode,
      eventName: 'Rupaayi Fest 2026',
      eventDate: 'Monday, January 7, 2026',
      seatNumber: seatNumbers,
      seatNumbers,
      studentDetails,
      venue: 'Auditorium, Gitam University BLR',
      posterUrl: undefined // Optionally set a poster URL
    };
    await sendTicketEmail(emailData);
    console.log('✅ Ticket email resent successfully');

    res.json({ success: true, message: 'Ticket email resent successfully' });
  } catch (error) {
    console.error('❌ Resend ticket error:', error);
    next(error);
  }
};
