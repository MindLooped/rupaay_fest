import { config } from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables FIRST
config({ path: path.join(__dirname, '../../.env') });

// Now import modules that depend on env variables
import { PrismaClient } from '@prisma/client';
import { transporter } from '../config/email';

const prisma = new PrismaClient();

interface CancellationEmailData {
  name: string;
  email: string;
  reference: string;
  ticketsCount: number;
  eventName: string;
  eventDate: string;
  seatNumbers: string;
}

/**
 * Load and populate cancellation email template
 */
function getCancellationEmailHTML(data: CancellationEmailData): string {
  const templatePath = path.join(__dirname, '../../templates/cancellation-email.html');
  let html = fs.readFileSync(templatePath, 'utf-8');
  
  // Replace placeholders
  html = html.replace(/{{name}}/g, data.name);
  html = html.replace(/{{email}}/g, data.email);
  html = html.replace(/{{reference}}/g, data.reference);
  html = html.replace(/{{ticketsCount}}/g, data.ticketsCount.toString());
  html = html.replace(/{{eventName}}/g, data.eventName);
  html = html.replace(/{{eventDate}}/g, data.eventDate);
  html = html.replace(/{{seatNumbers}}/g, data.seatNumbers);
  
  return html;
}

/**
 * Send cancellation email
 */
async function sendCancellationEmail(data: CancellationEmailData): Promise<void> {
  const subject = `⚠️ Important Update: ${data.eventName} - Event Date Change`;
  const html = getCancellationEmailHTML(data);

  try {
    await transporter.sendMail({
      from: `"${process.env.EVENT_NAME || 'Event Ticketing'}" <${process.env.EMAIL_USER}>`,
      to: data.email,
      subject,
      html
    });
    console.log('✅ Cancellation email sent to:', data.email);
  } catch (error) {
    console.error('❌ Failed to send cancellation email to:', data.email, error);
    throw error;
  }
}

/**
 * Main function to send cancellation emails to all bookings
 */
async function sendCancellationToAll() {
  try {
    console.log('📧 Starting to send cancellation emails to all bookings...\n');

    // Fetch all bookings with students
    const bookings = await prisma.booking.findMany({
      include: { students: true },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`Found ${bookings.length} booking(s)\n`);

    if (bookings.length === 0) {
      console.log('No bookings found.');
      await prisma.$disconnect();
      return;
    }

    let successCount = 0;
    let failCount = 0;
    const failedEmails: string[] = [];

    for (const booking of bookings) {
      try {
        console.log(`\n📨 Processing: ${booking.reference}`);
        console.log(`   Name: ${booking.name}`);
        console.log(`   Email: ${booking.email}`);
        console.log(`   Seats: ${booking.students.map(s => s.seatNumber).join(', ')}`);

        const seatNumbers = booking.students.map(s => s.seatNumber).join(', ');
        
        // Prepare email data
        const eventDateStr = booking.eventDate 
          ? new Date(booking.eventDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
          : '27th January 2026';
        const emailData: CancellationEmailData = {
          name: booking.name,
          email: booking.email,
          reference: booking.reference,
          ticketsCount: booking.students.length,
          eventName: booking.eventName,
          eventDate: eventDateStr,
          seatNumbers: seatNumbers
        };

        // Send cancellation email
        await sendCancellationEmail(emailData);
        successCount++;
        
        // Add a small delay to avoid overwhelming the email server
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Error processing booking ${booking.reference}:`, error);
        failCount++;
        failedEmails.push(`${booking.email} (${booking.reference})`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successfully sent: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    
    if (failedEmails.length > 0) {
      console.log('\n❌ Failed emails:');
      failedEmails.forEach(email => console.log(`   - ${email}`));
    }
    
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error in main process:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
sendCancellationToAll();
