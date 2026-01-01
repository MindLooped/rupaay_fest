import prisma from '../src/config/database';

async function clearCollections() {
  await prisma.student.deleteMany();
  await prisma.booking.deleteMany();
  console.log('All data deleted from student and booking collections.');
  await prisma.$disconnect();
}

clearCollections().catch((e) => {
  console.error(e);
  process.exit(1);
});
