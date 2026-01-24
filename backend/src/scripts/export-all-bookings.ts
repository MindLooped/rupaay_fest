import prisma from '../config/database';
import fs from 'fs';
import path from 'path';

const CSV_FILE_PATH = path.join(__dirname, '../../bookings-export.csv');

// CSV Headers
const CSV_HEADERS = [
  'Booking Reference',
  'GITAM Email',
  'Booking Status',
  'Booked At',
  'Student Name',
  'Registration Number',
  'Seat Number',
  'Event Name',
  'Event Date',
  'Venue',
  'Payment ID',
  'Payment Amount'
];

// Escape CSV field (handle commas, quotes, newlines)
function escapeCSVField(field: any): string {
  if (field === null || field === undefined) {
    return '';
  }
  
  const stringField = String(field);
  
  // If field contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
    return `"${stringField.replace(/"/g, '""')}"`;
  }
  
  return stringField;
}

async function exportAllBookings() {
  try {
    console.log('📊 Starting export of all bookings...');
    
    // Fetch all bookings with students
    const bookings = await prisma.booking.findMany({
      where: {
        status: 'confirmed',
      },
      include: {
        students: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
    
    console.log(`Found ${bookings.length} confirmed bookings`);
    
    // Create CSV content
    const rows: string[] = [];
    rows.push(CSV_HEADERS.join(','));
    
    let totalStudents = 0;
    
    for (const booking of bookings) {
      // Extract actual GITAM email from students or use booking email
      const gitamEmail = booking.students.length > 0 
        ? booking.students[0].gitamEmail || booking.email
        : booking.email;
      
      if (booking.students.length > 0) {
        // Export each student as a separate row
        for (const student of booking.students) {
          const row = [
            escapeCSVField(booking.reference),
            escapeCSVField(student.gitamEmail || gitamEmail),
            escapeCSVField(booking.status),
            escapeCSVField(booking.createdAt.toISOString()),
            escapeCSVField(student.name),
            escapeCSVField(student.registrationNumber),
            escapeCSVField(student.seatNumber),
            escapeCSVField('Rupaayi Fest'),
            escapeCSVField('January 7, 2026'),
            escapeCSVField('Auditorium, Gitam University BLR'),
            escapeCSVField('N/A'),
            escapeCSVField(0)
          ].join(',');
          
          rows.push(row);
          totalStudents++;
        }
      } else {
        // Export booking without student details
        const row = [
          escapeCSVField(booking.reference),
          escapeCSVField(gitamEmail),
          escapeCSVField(booking.status),
          escapeCSVField(booking.createdAt.toISOString()),
          escapeCSVField(booking.name),
          escapeCSVField('N/A'),
          escapeCSVField(booking.seatNumber || 'N/A'),
          escapeCSVField('Rupaayi Fest'),
          escapeCSVField('January 7, 2026'),
          escapeCSVField('Auditorium, Gitam University BLR'),
          escapeCSVField('N/A'),
          escapeCSVField(0)
        ].join(',');
        
        rows.push(row);
        totalStudents++;
      }
    }
    
    // Write to file
    const csvContent = rows.join('\n');
    fs.writeFileSync(CSV_FILE_PATH, csvContent, 'utf8');
    
    console.log(`✅ Export completed!`);
    console.log(`📄 File: ${CSV_FILE_PATH}`);
    console.log(`📊 Exported ${bookings.length} bookings with ${totalStudents} total entries`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Export failed:', error);
    process.exit(1);
  }
}

exportAllBookings();
