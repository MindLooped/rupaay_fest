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
 * Send cancellation email to specific email address
 */
async function sendCancellationToEmail(email: string) {
  try {
    console.log(`📧 Fetching booking for: ${email}...\n`);

    // Fetch booking for this email
    const booking = await prisma.booking.findFirst({
      where: { email: email },
      include: { students: true }
    });

    if (!booking) {
      console.log(`❌ No booking found for email: ${email}`);
      await prisma.$disconnect();
      return;
    }

    console.log(`✅ Found booking: ${booking.reference}`);
    console.log(`   Name: ${booking.name}`);
    console.log(`   Seats: ${booking.students.map(s => s.seatNumber).join(', ')}`);
    console.log(`   Tickets: ${booking.students.length}\n`);

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

    const subject = `⚠️ Important Update: ${emailData.eventName} - Event Date Change`;
    const html = getCancellationEmailHTML(emailData);

    // Send email
    await transporter.sendMail({
      from: `"${process.env.EVENT_NAME || 'Event Ticketing'}" <${process.env.EMAIL_USER}>`,
      to: emailData.email,
      subject,
      html
    });

    console.log('✅ Cancellation email sent successfully!\n');
    console.log('📋 Email Details:');
    console.log(`   To: ${emailData.email}`);
    console.log(`   Reference: ${emailData.reference}`);
    console.log(`   Seats: ${emailData.seatNumbers}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script with the specified email
const emailToSend = 'kalavala@gitam.in';
sendCancellationToEmail(emailToSend);
