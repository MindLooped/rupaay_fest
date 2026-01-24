import { config } from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables FIRST
config({ path: path.join(__dirname, '../../.env') });

// Now import modules that depend on env variables
import { transporter } from '../config/email';

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
 * Send test cancellation email
 */
async function sendTestEmail() {
  try {
    console.log('📧 Sending test cancellation email...\n');

    // Sample data for testing
    const testData: CancellationEmailData = {
      name: 'Test User',
      email: 'nkandike@gitam.in',
      reference: 'TEST123',
      ticketsCount: 2,
      eventName: 'Rupaay Fest 2025',
      eventDate: 'January 10, 2026 at 6:00 PM',
      seatNumbers: 'A1, A2'
    };

    const subject = `⚠️ Important Update: ${testData.eventName} - Event Date Change`;
    const html = getCancellationEmailHTML(testData);

    await transporter.sendMail({
      from: `"${process.env.EVENT_NAME || 'Event Ticketing'}" <${process.env.EMAIL_USER}>`,
      to: testData.email,
      subject,
      html
    });

    console.log('✅ Test cancellation email sent successfully to:', testData.email);
    console.log('\nPlease check your inbox and verify the email format.');
    
  } catch (error) {
    console.error('❌ Failed to send test email:', error);
  }
}

// Run the script
sendTestEmail();
