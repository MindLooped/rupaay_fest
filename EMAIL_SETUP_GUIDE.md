# Gmail SMTP Setup Guide - Send Tickets via Email
## 📧 How to Set Up Email Notifications
Follow these steps to enable automatic ticket emails to users after they book:
---
## Step 1: Get Gmail App Password
**Important:** You need to use an **App Password**, NOT your regular Gmail password.
### Generate App Password:
1. **Go to your Google Account:**
   - Visit: https://myaccount.google.com/
2. **Enable 2-Factor Authentication (Required):**
   - Go to Security → 2-Step Verification
   - Follow the steps to enable it (if not already enabled)
3. **Create App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Or: Security → 2-Step Verification → App passwords (at the bottom)
   - Select app: **Mail**
   - Select device: **Other (Custom name)**
   - Type: **Event Ticketing**
   - Click **Generate**
4. **Copy the 16-character password:**
   - It will look like: `abcd efgh ijkl mnop`
   - Copy it (without spaces): `abcdefghijklmnop`
---
## Step 2: Update .env File
Open `/backend/.env` and update these lines:
```env
# Email Configuration (Gmail)
EMAIL_USER=your-actual-email@gmail.com
EMAIL_PASS=abcdefghijklmnop
```
**Example:**
```env
EMAIL_USER=nagasai@gmail.com
EMAIL_PASS=xyzw abcd efgh ijkl
```
---

## Step 3: Restart the Server

```bash
cd backend
npm run dev
```

You should see:
```
✅ Email service ready: Gmail SMTP
📧 Sending from: your-email@gmail.com
```
---
## Step 4: Test It!

1. Go to `http://localhost:4000`
2. Select a seat
3. Enter a GITAM email
4. Complete the booking
5. **Check the email inbox** - ticket should arrive!
---
## Troubleshooting
### Error: "Invalid login: 535-5.7.8 Username and Password not accepted"
- ✅ Use **App Password**, not your regular password
- ✅ Make sure 2-Factor Authentication is enabled
- ✅ Remove spaces from the App Password
- ✅ Check EMAIL_USER is correct (full email address)

### Error: "Less secure app access"
- Gmail no longer supports "less secure apps"
- You MUST use App Password

### Emails not sending
1. Check terminal logs for email errors
2. Verify .env file has correct credentials
3. Make sure server restarted after updating .env
4. Check Gmail "Sent" folder
5. Check recipient's spam folder
---
## Email Template
The system automatically sends a beautiful HTML email with:
- ✅ Booking confirmation
- ✅ QR code for entry
- ✅ Event details (date, time, venue)
- ✅ Seat numbers
- ✅ Student details
---
## What Users Receive
When a user books a ticket, they receive an email with:
**Subject:** 🎫 Ticket Confirmed - Rupaayi Fest

**Content:**
- Event poster
- Booking reference number
- Seat numbers
- Student names & registration numbers
- QR code for entry
- Event details (Jan 20, 2026 at Auditorium)

---

## Security Notes

- ⚠️ **Never commit .env file to Git**
- ⚠️ App Password is like a password - keep it secret
- ⚠️ You can revoke App Passwords anytime from Google Account
- ✅ App Password only works with this app (safer than regular password)

---

## Alternative: Use Different Email Service

If you want to use a different email provider:

### Outlook/Hotmail:
```env
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-password
```

### Yahoo:
```env
EMAIL_USER=your-email@yahoo.com
EMAIL_PASS=your-app-password
```

(Note: Other providers may also require app passwords)

---

## Quick Setup Checklist

- [ ] Enable 2-Factor Authentication on Gmail
- [ ] Generate App Password from Google Account
- [ ] Update EMAIL_USER in .env
- [ ] Update EMAIL_PASS in .env (App Password)
- [ ] Restart backend server
- [ ] Test by making a booking
- [ ] Check email inbox for ticket

---

## Need Help?

If emails still don't work:
1. Check terminal for error messages
2. Verify Gmail account settings
3. Try generating a new App Password
4. Make sure no spaces in APP_PASS
