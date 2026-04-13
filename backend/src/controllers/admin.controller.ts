import { Request, Response, NextFunction } from 'express';
import * as bookingService from '../services/booking.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getAllBookingsController(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = req.query.search as string;

    const result = await bookingService.getAllBookings(page, limit, search);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getStatsController(req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await bookingService.getBookingStats();
    res.json({ success: true, stats });
  } catch (error) {
    next(error);
  }
}

export async function exportBookingsController(req: Request, res: Response, next: NextFunction) {
  try {
    const { bookings } = await bookingService.getAllBookings(1, 10000);
    
    // CSV format
    const csv = [
      'Reference,Name,Email,Tickets,Status,Booked At',
      ...bookings.map((b) =>
        [b.reference, b.name, b.email, b.ticketsCount, b.status, b.createdAt.toISOString()].join(',')
      ),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=bookings.csv');
    res.send(csv);
  } catch (error) {
    next(error);
  }
}

export async function clearAllBookingsController(req: Request, res: Response, next: NextFunction) {
  try {
    console.log('🧹 Admin clearing all bookings...');
    
    // Delete all students first (due to foreign key constraint)
    const deletedStudents = await prisma.student.deleteMany({});
    console.log(`✅ Deleted ${deletedStudents.count} student records`);
    
    // Delete all bookings
    const deletedBookings = await prisma.booking.deleteMany({});
    console.log(`✅ Deleted ${deletedBookings.count} booking records`);
    
    res.json({ 
      success: true, 
      message: 'All bookings cleared successfully',
      deletedBookings: deletedBookings.count,
      deletedStudents: deletedStudents.count,
    });
  } catch (error) {
    console.error('❌ Error clearing bookings:', error);
    next(error);
  }
}
