import prisma from '../config/database';
import { generateBookingReference } from '../utils/reference';
import { generateTicketQR } from './qr.service';
import { sendTicketEmail } from './email.service';
import { appendBookingToCSV, appendMultipleStudentsToCSV, initializeCSV } from '../utils/csv-logger';

interface CreateBookingInput {
  name: string;
  email: string;
  ticketsCount?: number;
}

export async function createBooking(input: CreateBookingInput) {
  const { name, email, ticketsCount = 1 } = input;

  // Check if email already booked (if 1 ticket per email enforced)
  const existing = await prisma.booking.findUnique({ where: { email } });
  if (existing) {
    throw new Error('This email has already booked a ticket');
  }

  // Check total seats available (MongoDB)
  const totalBooked = await prisma.booking.count();
  const maxSeats = parseInt(process.env.TOTAL_SEATS || '500');
  if (totalBooked >= maxSeats) {
    throw new Error('Sorry, all tickets are sold out');
  }

  // Generate reference
  // MongoDB does not support autoincrement, so use count or timestamp for reference
  const bookingCount = await prisma.booking.count();
  const reference = generateBookingReference(Date.now());

  // Generate QR code
  const qrCode = await generateTicketQR(reference, email, name);

  // Create booking
  const booking = await prisma.booking.create({
    data: {
      reference,
      name,
      email,
      ticketsCount,
      qrCode,
      status: 'confirmed',
      eventDate: process.env.EVENT_DATE ? new Date(process.env.EVENT_DATE) : null,
    },
  });

  // Send confirmation email (async, don't wait)
  sendTicketEmail({
    name,
    email,
    reference,
    ticketsCount,
    qrCode,
    eventName: process.env.EVENT_NAME || 'College Event',
    eventDate: process.env.EVENT_DATE || 'TBA',
  }).catch((err) => console.error('Email send failed:', err));

  return booking;
}

export async function getBookingByReference(reference: string) {
  return prisma.booking.findUnique({ 
    where: { reference },
    include: { students: true }
  });
}

export async function getAllBookings(page = 1, limit = 50, search?: string) {
  const skip = (page - 1) * limit;
  
  const where = search
    ? {
        OR: [
          { email: { contains: search, mode: 'insensitive' as any } },
          { name: { contains: search, mode: 'insensitive' as any } },
          { reference: { contains: search, mode: 'insensitive' as any } },
        ],
      }
    : {};

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.booking.count({ where }),
  ]);

  return { bookings, total, page, limit };
}

export async function getBookingStats() {
  // MongoDB: groupBy is not supported, so use findMany and count unique emails manually
  const total = await prisma.booking.count();
  const allBookings = await prisma.booking.findMany({ select: { email: true } });
  const uniqueEmails = new Set(allBookings.map(b => b.email));
  return {
    totalBookings: total,
    uniqueUsers: uniqueEmails.size,
    availableSeats: parseInt(process.env.TOTAL_SEATS || '500') - total,
  };
}

// Get all bookings with student details for CSV export
export async function getAllBookingsWithStudents() {
  const bookings = await prisma.booking.findMany({
    where: {
      status: 'confirmed',
    },
    include: {
      students: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
  
  return bookings;
}

// Store verification code for email
export async function storeVerificationCode(email: string, code: string) {
  // Try to find existing entry
  const existing = await prisma.booking.findUnique({ where: { email } });
  
  if (existing) {
    // Update existing entry
    return await prisma.booking.update({
      where: { email },
      data: {
        verificationCode: code,
        isVerified: false, // Reset verification status
      },
    });
  } else {
    // Create new entry with just verification code
    const reference = generateBookingReference(Date.now());
    return await prisma.booking.create({
      data: {
        reference,
        name: 'Pending',
        email,
        verificationCode: code,
        isVerified: false,
        status: 'pending',
      },
    });
  }
}

// Verify code
export async function verifyCode(email: string, code: string) {
  const booking = await prisma.booking.findUnique({ where: { email } });
  
  if (!booking || booking.verificationCode !== code) {
    return false;
  }
  
  // Mark as verified
  await prisma.booking.update({
    where: { email },
    data: { isVerified: true },
  });
  
  return true;
}

// Mark email as verified (for test mode)
export async function markAsVerified(email: string) {
  const existing = await prisma.booking.findUnique({ where: { email } });
  
  if (existing) {
    await prisma.booking.update({
      where: { email },
      data: { isVerified: true },
    });
  } else {
    const reference = generateBookingReference(Date.now());
    await prisma.booking.create({
      data: {
        reference,
        name: 'Pending',
        email,
        isVerified: true,
        status: 'pending',
      },
    });
  }
}

// Check if email is verified
export async function checkEmailVerified(email: string) {
  const booking = await prisma.booking.findUnique({ where: { email } });
  return booking?.isVerified || false;
}

// Get booked seats
export async function getBookedSeats() {
  const bookings = await prisma.booking.findMany({
    where: {
      seatNumber: { not: null },
      status: 'confirmed',
    },
    select: { seatNumber: true },
  });
  
  // Split comma-separated seats and flatten the array
  const allSeats = bookings
    .map(b => b.seatNumber)
    .filter(Boolean)
    .flatMap(seats => seats!.split(',').map(s => s.trim()));
  
  return allSeats;
}

// Check if seat is available
export async function isSeatAvailable(seatNumber: string) {
  const existing = await prisma.booking.findUnique({
    where: { seatNumber },
  });
  
  return !existing;
}

// Create booking with seat
export async function createBookingWithSeat(input: { 
  email: string; 
  seatNumber: string; 
  name: string;
  registrationNumber?: string;
  gitamEmail?: string;
}) {
  const { email, seatNumber, name, registrationNumber, gitamEmail } = input;
  
  // Check if email already has booking
  const existing = await prisma.booking.findUnique({ where: { email } });
  
  if (!existing) {
    throw new Error('Email not found. Please verify your email first.');
  }
  
  if (!existing.isVerified) {
    throw new Error('Email not verified');
  }
  
  // Handle multiple seats (comma-separated)
  const seatNumbers = seatNumber.split(',').map(s => s.trim());
  
  // Check if all seats are available
  for (const seat of seatNumbers) {
    const seatTaken = await prisma.booking.findUnique({ where: { seatNumber: seat } });
    if (seatTaken && seatTaken.email !== email) {
      throw new Error(`Seat ${seat} is already booked`);
    }
  }
  
  // Use the first seat as the primary seat
  const primarySeat = seatNumbers[0];
  
  // Generate QR code with all seats
  const qrCode = await generateTicketQR(existing.reference, email, name);
  
  // Update booking with seat and confirm
  const booking = await prisma.booking.update({
    where: { email },
    data: {
      name,
      seatNumber: seatNumber, // Store all seats comma-separated
      ticketsCount: seatNumbers.length, // Update count to match selected seats
      qrCode,
      status: 'confirmed',
      students: registrationNumber && gitamEmail ? {
        create: seatNumbers.map(seat => ({
          seatNumber: seat,
          name,
          registrationNumber: registrationNumber!,
          gitamEmail: gitamEmail!,
        })),
      } : undefined,
    },
    include: {
      students: true,
    },
  });
  
  // Send confirmation email
  sendTicketEmail({
    name,
    email,
    reference: booking.reference,
    ticketsCount: seatNumbers.length,
    qrCode,
    eventName: 'Rupaayi Fest',
    eventDate: 'January 7, 2026',
    seatNumber,
    venue: 'Auditorium, Gitam University BLR',
  }).catch((err) => console.error('Email send failed:', err));
  
  return booking;
}

// Create booking with multiple seats and student details
export async function createBookingWithSeats(input: { 
  email: string; 
  students: Array<{
    seatNumber: string;
    name: string;
    registrationNumber: string;
  }>;
  paymentId?: string;
  paymentAmount?: number;
}) {
  const { email, students, paymentId, paymentAmount } = input;
  
  // Extract all seat numbers
  const seatNumbers = students.map(s => s.seatNumber);
  
  // Check if all seats are available
  for (const seat of seatNumbers) {
    const seatTaken = await prisma.booking.findUnique({ where: { seatNumber: seat } });
    if (seatTaken) {
      throw new Error(`Seat ${seat} is already booked`);
    }
  }
  
  // Generate booking reference in RUPPAAFEST format
  const bookingCount = await prisma.booking.count();
  const reference = generateBookingReference(bookingCount + 1);
  
  // Generate QR code with all seats
  const qrCode = await generateTicketQR(reference, email, students.map(s => s.name).join(', '));
  
  // Create new booking with seats using reference as unique identifier
  const booking = await prisma.booking.create({
    data: {
      reference,
      name: students.map(s => s.name).join(', '),
      email: `${reference}@booking.local`, // Use unique email based on reference
      seatNumber: seatNumbers.join(','),
      ticketsCount: students.length,
      qrCode,
      status: 'confirmed',
      eventDate: process.env.EVENT_DATE ? new Date(process.env.EVENT_DATE) : null,
      students: {
        create: students.map(student => ({
          seatNumber: student.seatNumber,
          name: student.name,
          registrationNumber: student.registrationNumber,
          gitamEmail: email, // Store actual GITAM email in student record
        })),
      },
    },
    include: {
      students: true,
    },
  });
  
  // Log to CSV file automatically
  appendMultipleStudentsToCSV({
    reference: booking.reference,
    email: email, // Use actual GITAM email
    status: booking.status,
    createdAt: booking.createdAt,
    students: students,
    eventName: 'Rupaayi Fest',
    eventDate: 'January 7, 2026',
    venue: 'Auditorium, Gitam University BLR',
    paymentId: paymentId,
    paymentAmount: paymentAmount || 0
  });
  
  // Return booking with actual email and event details
  return {
    ...booking,
    email: email, // Return the actual GITAM email to the frontend
    eventName: 'Rupaayi Fest',
    eventLocation: 'Gitam University BLR',
    venue: 'Auditorium, Gitam University BLR',
  };
}
