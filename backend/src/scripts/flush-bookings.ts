import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🧹 Starting to flush all bookings...\n');
    
    // Delete all students first (due to foreign key constraint)
    const deletedStudents = await prisma.student.deleteMany({});
    console.log(`✅ Deleted ${deletedStudents.count} student records\n`);
    
    // Delete all bookings
    const deletedBookings = await prisma.booking.deleteMany({});
    console.log(`✅ Deleted ${deletedBookings.count} booking records\n`);
    
    console.log('🎉 Database cleared successfully!');
    console.log('✅ Only default bookings (A1-B28) will remain as booked by the system.\n');
    
  } catch (error) {
    console.error('❌ Error clearing bookings:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
