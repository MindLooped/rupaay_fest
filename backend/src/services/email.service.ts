import { transporter } from '../config/email';
import fs from 'fs';
import path from 'path';

interface TicketEmailData {
  name: string;
  email: string;
  reference: string;
  ticketsCount: number;
  qrCode: string;
  eventName: string;
  eventDate: string;
  seatNumber?: string;
  seatNumbers?: string;
  studentDetails?: string;
  posterUrl?: string;
  venue?: string;
}

/**
 * Load and populate email template
 */
function getEmailHTML(data: TicketEmailData): string {
  const templatePath = path.join(__dirname, '../../templates/ticket-email.html');
  let html = fs.readFileSync(templatePath, 'utf-8');
  
  // Replace placeholders
  html = html.replace(/{{name}}/g, data.name);
  html = html.replace(/{{reference}}/g, data.reference);
  html = html.replace(/{{ticketsCount}}/g, data.ticketsCount.toString());
  html = html.replace(/{{qrCode}}/g, data.qrCode);
  html = html.replace(/{{eventName}}/g, data.eventName);
  html = html.replace(/{{eventDate}}/g, data.eventDate);
  html = html.replace(/{{seatNumber}}/g, data.seatNumber || 'N/A');
  html = html.replace(/{{seatNumbers}}/g, data.seatNumbers || data.seatNumber || 'N/A');
  html = html.replace(/{{studentDetails}}/g, data.studentDetails || 'N/A');
  html = html.replace(/{{posterUrl}}/g, data.posterUrl || 'https://img.icons8.com/color/48/000000/ticket.png');
  html = html.replace(/{{venue}}/g, data.venue || 'TBA');
  return html;
}

/**
 * Send ticket confirmation email
 */
export async function sendTicketEmail(data: TicketEmailData): Promise<void> {
  const subject = `🎟️ Your Ticket for ${data.eventName} - ${data.reference}`;

  // Prepare seatNumbers and studentDetails for template
  let seatNumbers = data.seatNumbers;
  let studentDetails = data.studentDetails;
  // If not provided, fallback to seatNumber and name
  if (!seatNumbers && data.seatNumber) {
    seatNumbers = data.seatNumber;
  }
  if (!studentDetails && data.name) {
    studentDetails = `${data.name}`;
  }

  const html = getEmailHTML({ ...data, seatNumbers, studentDetails });

  // Extract base64 data from QR code data URL
  const base64Data = data.qrCode.replace(/^data:image\/png;base64,/, '');

  try {
    await transporter.sendMail({
      from: `"${process.env.EVENT_NAME || 'Event Ticketing'}" <${process.env.EMAIL_USER}>`,
      to: data.email,
      subject,
      html,
      attachments: [
        {
          filename: 'qr-code.png',
          content: base64Data,
          encoding: 'base64',
          cid: 'qrcode@ticket' // This CID will be referenced in the HTML
        }
      ]
    });
    console.log('✅ Ticket email sent to:', data.email);
  } catch (error) {
    console.error('❌ Failed to send ticket email:', error);
    console.warn('⚠️  Booking will continue without email - please fix email configuration');
    // Don't throw error - allow booking to succeed even if email fails
  }
}

/**
 * Send a generic email (verification codes, etc.)
 */
export async function sendEmail(options: { to: string; subject: string; html: string }, qrCode?: string): Promise<void> {
  try {
    const mailOptions: any = {
      from: `"${process.env.EVENT_NAME || 'Event Ticketing'}" <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    };
    
    // Add QR code attachment if provided
    if (qrCode) {
      const base64Data = qrCode.replace(/^data:image\/png;base64,/, '');
      mailOptions.attachments = [
        {
          filename: 'qr-code.png',
          content: base64Data,
          encoding: 'base64',
          cid: 'qrcode@ticket'
        }
      ];
    }
    
    const info = await transporter.sendMail(mailOptions);
    
    console.log('\n📧 ========== EMAIL SENT ==========');
    console.log('To:', options.to);
    console.log('Subject:', options.subject);
    console.log('Message ID:', info.messageId);
    console.log('====================================\n');
  } catch (error: any) {
    console.error('❌ Email sending failed:', error.message);
    throw error;
  }
}