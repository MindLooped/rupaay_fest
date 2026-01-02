import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { sendEmail, sendTicketEmail } from '../services/email.service';
import { generateQRCode } from '../services/qr.service';
import { generateBookingReference } from '../utils/reference';
import { generateRandomReference } from '../utils/reference';
import { appendMultipleStudentsToCSV } from '../utils/csv-logger';

const prisma = new PrismaClient();

// Validation middleware for seat selection
export const seatSelectionValidation = [
  body('gitamEmail')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('students')
    .isArray({ min: 1, max: 1 })
    .withMessage('You can book only 1 seat per registration'),
  body('students.*.seatNumber')
    .notEmpty()
    .withMessage('Seat number is required'),
  body('students.*.name')
    .trim()
    .notEmpty()
    .withMessage('Student name is required'),

];

// Get available seats
export const getAvailableSeatsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get all students for confirmed bookings
    const students = await prisma.student.findMany({
      where: {
        booking: {
          status: 'confirmed',
        },
      },
      select: {
        seatNumber: true,
      },
    });
    const bookedSeats = students.map((s: { seatNumber: string }) => s.seatNumber);
      // Add A1-B28 as booked by default
      const defaultBooked = [];
      for (let row of ['A', 'B']) {
        const max = row === 'A' ? 28 : 28;
        for (let i = 1; i <= max; i++) {
          defaultBooked.push(`${row}${i}`);
        }
      }
      // Merge and deduplicate
      const allBooked = Array.from(new Set([...bookedSeats, ...defaultBooked]));
      res.json({ bookedSeats: allBooked });
  } catch (error: any) {
    next(error);
  }
};

// Get booking by reference
export const getBookingController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { reference } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { reference: reference },
      include: {
        students: true,
      },
    });

    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    res.json(booking);
  } catch (error: any) {
    next(error);
  }
};

// Resend ticket email
// Book seat controller
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

    // Check if seat is in blocked range (A1-A28, B1-B28)
    const seatNumber = students[0].seatNumber;
    const blockedPattern = /^(A|B)([1-9]|1[0-9]|2[0-8])$/;
    if (blockedPattern.test(seatNumber)) {
      res.status(400).json({ success: false, error: `Seats A1-A28 and B1-B28 are not available for booking.` });
      return;
    }
    // Check if seat is already booked
    const existing = await prisma.student.findFirst({ where: { seatNumber } });
    if (existing) {
      res.status(400).json({ success: false, error: `Seat ${seatNumber} is already booked` });
      return;
    }

    // Generate booking reference (incremental RUPPAAFEST format)
    const bookingCount = await prisma.booking.count();
    const reference = generateBookingReference(bookingCount + 1);

    // Create booking and student
    const booking = await prisma.booking.create({
      data: {
        reference,
        name: students[0].name,
        email: gitamEmail,
        ticketsCount: 1,
        status: 'confirmed',
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

    // Generate QR code
    const qrCode = await generateQRCode(reference);

    // Prepare seatNumbers and studentDetails for email
    const seatNumbers = students.map((s: any) => s.seatNumber).join(', ');
    const studentDetails = students.map((s: any) =>
      `<b>${s.name}</b> (${s.registrationNumber || 'N/A'}) - Seat: <b>${s.seatNumber}</b>`
    ).join('<br>');
    const emailData = {
      name: students[0].name,
      email: gitamEmail,
      reference,
      ticketsCount: 1,
      qrCode,
      eventName: 'Rupaayi Fest 2026',
      eventDate: 'Monday, January 7, 2026',
      seatNumber: seatNumber,
      seatNumbers,
      studentDetails,
      venue: 'Auditorium, Gitam University BLR',
      posterUrl: undefined // Optionally set a poster URL
    };
    await sendTicketEmail(emailData);

    // Log to CSV
    await appendMultipleStudentsToCSV({
      reference: booking.reference,
      email: booking.email,
      status: booking.status,
      createdAt: booking.createdAt,
      students: booking.students.map((s: { name: string; registrationNumber: string; seatNumber: string }) => ({
        name: s.name,
        registrationNumber: s.registrationNumber,
        seatNumber: s.seatNumber
      })),
      eventName: 'Rupaayi Fest 2026',
      eventDate: 'January 7, 2026',
      venue: 'Auditorium, Gitam University BLR'
    });

    res.status(201).json({
      success: true,
      message: 'Booking confirmed successfully',
      booking: {
        reference: booking.reference,
        email: booking.email,
        students: booking.students,
      },
    });
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error('❌ Booking error:', error);
    next(error);
  }
};
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
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error('❌ Resend ticket error:', error);
    next(error);
  }
};
