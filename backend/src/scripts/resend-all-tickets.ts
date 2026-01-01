import { PrismaClient } from '@prisma/client';
import { sendEmail } from '../services/email.service';
import { generateQRCode } from '../services/qr.service';

const prisma = new PrismaClient();

async function resendAllTickets() {
  try {
    console.log('📧 Starting to resend tickets to all bookings...\n');

    // Fetch all bookings with students
    const bookings = await prisma.booking.findMany({
      include: { students: true },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`Found ${bookings.length} booking(s)\n`);

    if (bookings.length === 0) {
      console.log('No bookings found to resend emails.');
      await prisma.$disconnect();
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (const booking of bookings) {
      try {
        console.log(`\n📨 Processing: ${booking.reference}`);
        console.log(`   Email: ${booking.email}`);
        console.log(`   Seats: ${booking.students.map(s => s.seatNumber).join(', ')}`);

        // Generate QR code for this booking
        const qrData = JSON.stringify({
          reference: booking.reference,
          eventName: booking.eventName,
          seats: booking.students.map(s => s.seatNumber).join(', '),
          email: booking.email
        });

        const qrCode = await generateQRCode(qrData);
        const seatNumbersText = booking.students.map(s => s.seatNumber).join(', ');
        const gitamEmail = booking.email;

        // Send email with the new template
        await sendEmail({
          to: gitamEmail,
          subject: `🎉 Booking Confirmed - ${booking.eventName}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  padding: 0;
                  margin: 0;
                }
                .email-wrapper {
                  padding: 40px 20px;
                }
                .email-container { 
                  max-width: 600px; 
                  margin: 0 auto; 
                  background: white; 
                  border-radius: 20px;
                  overflow: hidden;
                  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                }
                .header { 
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: white;
                  padding: 50px 30px;
                  text-align: center;
                  position: relative;
                }
                .header::after {
                  content: '';
                  position: absolute;
                  bottom: -20px;
                  left: 0;
                  right: 0;
                  height: 40px;
                  background: white;
                  border-radius: 50% 50% 0 0 / 100% 100% 0 0;
                }
                .header h1 { 
                  font-size: 32px;
                  margin-bottom: 12px;
                  font-weight: 800;
                  text-shadow: 0 2px 10px rgba(0,0,0,0.2);
                }
                .header p { 
                  font-size: 18px;
                  opacity: 0.95;
                  font-weight: 500;
                }
                .content { 
                  padding: 40px 30px 30px;
                }
                .success-badge {
                  background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
                  color: white;
                  padding: 12px 24px;
                  border-radius: 50px;
                  display: inline-block;
                  font-size: 14px;
                  font-weight: 700;
                  text-transform: uppercase;
                  letter-spacing: 1px;
                  margin-bottom: 25px;
                  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
                }
                .booking-ref { 
                  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                  color: white;
                  padding: 30px;
                  border-radius: 16px;
                  text-align: center;
                  margin-bottom: 30px;
                  box-shadow: 0 8px 25px rgba(245, 87, 108, 0.3);
                }
                .booking-ref p { 
                  font-size: 12px;
                  text-transform: uppercase;
                  letter-spacing: 2px;
                  margin-bottom: 10px;
                  opacity: 0.9;
                  font-weight: 600;
                }
                .booking-ref h2 { 
                  font-size: 28px;
                  letter-spacing: 3px;
                  font-weight: 800;
                  word-break: break-all;
                  line-height: 1.3;
                }
                .info-card {
                  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                  border-radius: 16px;
                  padding: 25px;
                  margin-bottom: 30px;
                  border: 2px solid #e2e8f0;
                }
                .info-row {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  padding: 16px 0;
                  border-bottom: 2px dashed #cbd5e1;
                }
                .info-row:last-child {
                  border-bottom: none;
                }
                .info-label {
                  color: #475569;
                  font-size: 15px;
                  font-weight: 700;
                  display: flex;
                  align-items: center;
                  gap: 8px;
                }
                .info-value {
                  color: #0f172a;
                  font-size: 15px;
                  font-weight: 700;
                  text-align: right;
                  max-width: 60%;
                  word-break: break-word;
                }
                .highlight {
                  color: #f5576c;
                  font-size: 16px;
                }
                .qr-section {
                  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
                  border: 3px solid #fbbf24;
                  border-radius: 20px;
                  padding: 35px;
                  text-align: center;
                  margin-bottom: 30px;
                  box-shadow: 0 8px 25px rgba(251, 191, 36, 0.2);
                }
                .qr-section h3 {
                  font-size: 22px;
                  color: #92400e;
                  margin-bottom: 20px;
                  font-weight: 800;
                  text-transform: uppercase;
                  letter-spacing: 1px;
                }
                .qr-section img {
                  max-width: 250px;
                  border: 5px solid white;
                  border-radius: 16px;
                  padding: 20px;
                  background: white;
                  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                  margin: 10px 0;
                }
                .qr-section p {
                  color: #92400e;
                  font-size: 14px;
                  margin-top: 20px;
                  font-weight: 600;
                }
                .alert-box {
                  background: #dbeafe;
                  border-left: 4px solid #3b82f6;
                  padding: 20px;
                  border-radius: 8px;
                  margin-bottom: 25px;
                }
                .alert-box p {
                  color: #1e40af;
                  font-size: 14px;
                  line-height: 1.6;
                  margin: 0;
                  font-weight: 600;
                }
                .footer {
                  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                  padding: 30px;
                  text-align: center;
                  color: white;
                }
                .footer p {
                  color: #cbd5e1;
                  font-size: 13px;
                  margin-bottom: 10px;
                  line-height: 1.6;
                }
                .footer .event-name {
                  color: #fbbf24;
                  font-weight: 800;
                  font-size: 20px;
                  margin-top: 15px;
                  text-transform: uppercase;
                  letter-spacing: 2px;
                }
                .footer .contact {
                  margin-top: 20px;
                  padding-top: 20px;
                  border-top: 1px solid #334155;
                }
                @media only screen and (max-width: 600px) {
                  .email-wrapper { padding: 20px 10px; }
                  .email-container { border-radius: 12px; }
                  .header { padding: 35px 20px; }
                  .header h1 { font-size: 26px; }
                  .content { padding: 25px 20px; }
                  .booking-ref h2 { font-size: 22px; letter-spacing: 2px; }
                  .info-row { flex-direction: column; align-items: flex-start; gap: 8px; }
                  .info-value { text-align: left; max-width: 100%; }
                  .qr-section img { max-width: 200px; }
                }
              </style>
            </head>
            <body>
              <div class="email-wrapper">
                <div class="email-container">
                  <div class="header">
                    <h1>🎉 Booking Confirmed!</h1>
                    <p>Get ready for an amazing experience</p>
                  </div>
                  
                  <div class="content">
                    <center>
                      <div class="success-badge">✓ Successfully Booked</div>
                    </center>

                    <div class="booking-ref">
                      <p>Your Booking ID</p>
                      <h2>${booking.reference}</h2>
                    </div>
                    
                    <div class="info-card">
                      <div class="info-row">
                        <span class="info-label">📧 Email</span>
                        <span class="info-value">${gitamEmail}</span>
                      </div>
                      <div class="info-row">
                        <span class="info-label">🎫 Seat Number${booking.students.length > 1 ? 's' : ''}</span>
                        <span class="info-value highlight">${seatNumbersText}</span>
                      </div>
                      <div class="info-row">
                        <span class="info-label">📅 Event Date</span>
                        <span class="info-value">January 20, 2026</span>
                      </div>
                      <div class="info-row">
                        <span class="info-label">🕐 Time</span>
                        <span class="info-value">10:00 AM onwards</span>
                      </div>
                      <div class="info-row">
                        <span class="info-label">📍 Venue</span>
                        <span class="info-value">${booking.venue}</span>
                      </div>
                    </div>

                    <div class="alert-box">
                      <p>⏰ <strong>Important:</strong> Please arrive 15-20 minutes before the event starts. Carry a valid ID card for verification.</p>
                    </div>
                    
                    <div class="qr-section">
                      <h3>🎟️ Entry QR Code</h3>
                      <img src="cid:qrcode@ticket" alt="Entry QR Code" />
                      <p><strong>⚠️ SHOW THIS QR CODE AT THE ENTRANCE</strong></p>
                      <p>Save this email or take a screenshot for quick access</p>
                    </div>
                  </div>
                  
                  <div class="footer">
                    <p class="event-name">🎭 Rupaayi Fest 2026 🎭</p>
                    <p style="margin-top: 20px;">Organized by GITAM University, Bangalore</p>
                    <div class="contact">
                      <p style="font-size: 12px;">For queries, contact: rupaayfestgitam@gmail.com</p>
                      <p style="color: #94a3b8; font-size: 11px; margin-top: 15px;">This is an automated email. Please do not reply to this message.</p>
                    </div>
                  </div>
                </div>
              </div>
            </body>
            </html>
          `,
        }, qrCode);

        console.log(`   ✅ Email sent successfully!`);
        successCount++;

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error: any) {
        console.log(`   ❌ Failed to send email: ${error.message}`);
        failCount++;
      }
    }

    console.log(`\n\n📊 Summary:`);
    console.log(`   Total bookings: ${bookings.length}`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);

    await prisma.$disconnect();
    console.log('\n✨ Done!');
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

resendAllTickets();
