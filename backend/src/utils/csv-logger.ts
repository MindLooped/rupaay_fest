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

// Initialize CSV file with headers if it doesn't exist
export function initializeCSV() {
  if (!fs.existsSync(CSV_FILE_PATH)) {
    const headerRow = CSV_HEADERS.join(',') + '\n';
    fs.writeFileSync(CSV_FILE_PATH, headerRow, 'utf8');
    console.log('📄 CSV file initialized:', CSV_FILE_PATH);
  }
}

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

// Append booking to CSV
export function appendBookingToCSV(bookingData: {
  reference: string;
  email: string;
  status: string;
  createdAt: Date;
  studentName: string;
  registrationNumber: string;
  seatNumber: string;
  eventName?: string;
  eventDate?: string;
  venue?: string;
  paymentId?: string;
  paymentAmount?: number;
}) {
  try {
    // Ensure CSV exists
    initializeCSV();
    
    // Create CSV row
    const row = [
      escapeCSVField(bookingData.reference),
      escapeCSVField(bookingData.email),
      escapeCSVField(bookingData.status),
      escapeCSVField(bookingData.createdAt.toISOString()),
      escapeCSVField(bookingData.studentName),
      escapeCSVField(bookingData.registrationNumber),
      escapeCSVField(bookingData.seatNumber),
      escapeCSVField(bookingData.eventName || 'Rupaayi Fest'),
      escapeCSVField(bookingData.eventDate || 'January 20, 2026'),
      escapeCSVField(bookingData.venue || 'Auditorium, Gitam University BLR'),
      escapeCSVField(bookingData.paymentId || 'N/A'),
      escapeCSVField(bookingData.paymentAmount || 0)
    ].join(',') + '\n';
    
    // Append to file
    fs.appendFileSync(CSV_FILE_PATH, row, 'utf8');
    
    console.log(`✅ Booking ${bookingData.reference} added to CSV`);
  } catch (error) {
    console.error('❌ Error appending to CSV:', error);
  }
}

// Append multiple students from one booking
export function appendMultipleStudentsToCSV(bookingData: {
  reference: string;
  email: string;
  status: string;
  createdAt: Date;
  students: Array<{
    name: string;
    registrationNumber: string;
    seatNumber: string;
  }>;
  eventName?: string;
  eventDate?: string;
  venue?: string;
  paymentId?: string;
  paymentAmount?: number;
}) {
  try {
    // Ensure CSV exists
    initializeCSV();
    
    // Add each student as a separate row
    bookingData.students.forEach((student) => {
      const row = [
        escapeCSVField(bookingData.reference),
        escapeCSVField(bookingData.email),
        escapeCSVField(bookingData.status),
        escapeCSVField(bookingData.createdAt.toISOString()),
        escapeCSVField(student.name),
        escapeCSVField(student.registrationNumber),
        escapeCSVField(student.seatNumber),
        escapeCSVField(bookingData.eventName || 'Rupaayi Fest'),
        escapeCSVField(bookingData.eventDate || 'January 20, 2026'),
        escapeCSVField(bookingData.venue || 'Auditorium, Gitam University BLR'),
        escapeCSVField(bookingData.paymentId || 'N/A'),
        escapeCSVField(bookingData.paymentAmount || 0)
      ].join(',') + '\n';
      
      fs.appendFileSync(CSV_FILE_PATH, row, 'utf8');
    });
    
    console.log(`✅ ${bookingData.students.length} student(s) from booking ${bookingData.reference} added to CSV`);
  } catch (error) {
    console.error('❌ Error appending to CSV:', error);
  }
}

// Get CSV file path
export function getCSVFilePath(): string {
  return CSV_FILE_PATH;
}
