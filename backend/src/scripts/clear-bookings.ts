import prisma from '../config/database';

async function clearBookings() {
  try {
    await prisma.student.deleteMany();
    await prisma.booking.deleteMany();
    console.log('All bookings and students have been deleted.');
  } catch (error) {
    console.error('Error clearing bookings:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearBookings();
