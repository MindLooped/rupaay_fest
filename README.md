# RupaayFest2025
A one-of-a-kind ticketing site exclusively built for a club's college fest called "Rupaay"
=======

# College Event Ticket Booking System
A BookMyShow-like ticket booking platform for college events, built for Gitam University.

## 🏗️ Architecture
**Tech Stack:**
- **Backend:** Node.js + Express + TypeScript
- **Database:** SQLite (via Prisma ORM)
- **Email:** Nodemailer (Gmail SMTP)
- **QR Codes:** qrcode library
- **Frontend:** HTML + Tailwind CSS

## 🗄️ Database Schema
See `backend/prisma/schema.prisma` for the full schema. Main tables:
- **bookings**: Stores booking info (reference, email, status, etc.)
- **students**: Stores student details per seat

## API Endpoints
### Public Endpoints
- **GET /api/bookings/available-seats** — List all booked seats
- **POST /api/bookings/book-seat** — Book a seat (requires GITAM email, student info)
- **GET /api/bookings/:reference** — Get booking by reference
- **POST /api/bookings/resend-ticket** — Resend ticket email

### Admin Endpoints (Protected)
- **GET /api/admin/bookings** — List all bookings
- **POST /api/admin/export** — Export bookings as CSV

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- SQLite (bundled, no setup needed)
- Gmail account for email sending

### Installation
1. **Install backend dependencies:**
```bash
cd backend
npm install
# Edit .env with your Gmail credentials and event info
```
2. **Setup database:**
```bash
npx prisma db push
```
3. **Start backend:**
```bash
npm run dev
# Server runs at http://localhost:4000
```
4. **Open frontend:**
Just visit http://localhost:4000/ in your browser (served by backend)

## 🔐 Environment Variables
Example `.env` (see `backend/.env`):
```env
# Database
DATABASE_URL="file:./prisma/dev.db"

# Server
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:4000

# Email (Gmail SMTP)
EMAIL_USER=yourgmail@gmail.com
EMAIL_PASS=your-app-password

# Admin
ADMIN_TOKEN=admin123
MAX_SEATS=500

# Event Config
EVENT_NAME="Rupaayi Fest 2026"
EVENT_DATE="January 7, 2026"
EVENT_VENUE="Auditorium, Gitam University BLR"
```

## 📧 Email Features
- HTML email template with event branding
- Embedded QR code for ticket verification
- Booking reference number
- Event details (date, time, venue)

## 🎯 Key Features
✅ Email-based booking (1 seat per email)
✅ Auto-generated booking reference (e.g., EVT2025001)
✅ QR code generation for each booking
✅ Confirmation email with ticket details
✅ CSV export of bookings
✅ Rate limiting to prevent spam
✅ Responsive design (mobile-friendly)
✅ Real-time seat availability
✅ Duplicate email prevention

## 🛡️ Security
- Rate limiting (5 bookings/15min per IP)
- Email validation
- SQL injection prevention (Prisma)
- XSS protection
- CORS configured
- Admin endpoints protected by token

## 🧪 Testing
You can test the booking flow by visiting the site, selecting a seat, and booking with a GITAM email.

---
