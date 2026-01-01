import prisma from '../config/database';

async function removeC3Booking() {
  try {
    // Find the student with seatNumber 'C3'
    const student = await prisma.student.findFirst({ where: { seatNumber: 'C3' } });
    if (student) {
      // Delete the student record
      await prisma.student.delete({ where: { id: student.id } });
      // Optionally, delete the booking if it has no more students
      const remainingStudents = await prisma.student.findMany({ where: { bookingId: student.bookingId } });
      if (remainingStudents.length === 0) {
        await prisma.booking.delete({ where: { id: student.bookingId } });
      }
      console.log('Removed booking and student for seat C3.');
    } else {
      console.log('No student found for seat C3.');
    }
  } catch (error) {
    console.error('Error removing C3 booking:', error);
  } finally {
    await prisma.$disconnect();
  }
}

removeC3Booking();
