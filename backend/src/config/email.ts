import nodemailer from 'nodemailer';

// Gmail SMTP setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email service error:', error.message);
    console.log('⚠️  Make sure you have set EMAIL_USER and EMAIL_PASS in .env file');
    console.log('⚠️  For Gmail, use App Password instead of your regular password');
  } else {
    console.log('✅ Email service ready: Gmail SMTP');
    console.log('📧 Sending from:', process.env.EMAIL_USER);
  }
});

export { transporter };
