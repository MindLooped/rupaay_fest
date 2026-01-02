// frontend/js/secure-booking.js
// This script handles the secure, verified booking process for Rupaayi Fest

const API_URL = 'http://localhost:4000'; // Update if needed

let selectedSeats = [];
let seatsToBook = 1;
let students = [];
let userEmail = '';

// Call this after collecting seat selection and student details
async function startBookingFlow(seats, studentDetails) {
  selectedSeats = seats;
  students = studentDetails;
  showEmailPopup();
}

function showEmailPopup() {
  // ... (reuse your popup code for email input)
  // On submit, call submitEmailForBooking
}

async function submitEmailForBooking(email) {
  userEmail = email;
  // Call backend to create booking and send verification code
  const response = await fetch(`${API_URL}/api/bookings/book-seat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gitamEmail: email, students })
  });
  const data = await response.json();
  if (data.success) {
    showVerificationPopup();
  } else {
    alert(data.error || 'Booking failed.');
  }
}

function showVerificationPopup() {
  // ... (show a popup/form for the user to enter the verification code)
  // On submit, call verifyEmailCode
}

async function verifyEmailCode(code) {
  const response = await fetch(`${API_URL}/api/bookings/verify-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: userEmail, code })
  });
  const data = await response.json();
  if (data.success) {
    alert('Booking confirmed! Check your email for the ticket.');
    window.location.href = 'success.html';
  } else {
    alert(data.error || 'Verification failed.');
  }
}

// Export or attach these functions to your booking flow as needed.
