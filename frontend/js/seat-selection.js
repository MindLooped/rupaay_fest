const API_URL = 'https://rupaay-fest-backend.vercel.app';

let selectedSeats = [];
let bookedSeats = [];
let gitamEmail = '';
let seatsToBook = 1;

// Configuration for auditorium seating
// Rows A-M: 28 seats (1-14 left, aisle, 15-28 right)
// Row N: 26 seats (1-13 left, aisle, 14-26 right)
// Rows O-U: 28 seats (1-14 left, aisle, 15-28 right)
const SEATING_LAYOUT = [
  { row: 'A', seats: 28, aisleAfter: 14 },
  { row: 'B', seats: 28, aisleAfter: 14 },
  { row: 'C', seats: 28, aisleAfter: 14 },
  { row: 'D', seats: 28, aisleAfter: 14 },
  { row: 'E', seats: 28, aisleAfter: 14 },
  { row: 'F', seats: 28, aisleAfter: 14 },
  { row: 'G', seats: 28, aisleAfter: 14 },
  { row: 'H', seats: 28, aisleAfter: 14 },
  { row: 'I', seats: 28, aisleAfter: 14 },
  { row: 'J', seats: 28, aisleAfter: 14 },
  { row: 'K', seats: 28, aisleAfter: 14 },
  { row: 'L', seats: 28, aisleAfter: 14 },
  { row: 'M', seats: 28, aisleAfter: 14 },
  { row: 'N', seats: 26, aisleAfter: 13 },
  { row: 'O', seats: 28, aisleAfter: 14 },
  { row: 'P', seats: 28, aisleAfter: 14 },
  { row: 'Q', seats: 28, aisleAfter: 14 },
  { row: 'R', seats: 28, aisleAfter: 14 },
  { row: 'S', seats: 28, aisleAfter: 14 },
  { row: 'T', seats: 28, aisleAfter: 14 },
  { row: 'U', seats: 28, aisleAfter: 14 },
];

const ROWS = SEATING_LAYOUT.map(r => r.row);

// On page load
window.addEventListener('DOMContentLoaded', async () => {
  try {
    // Load booked seats
    await loadBookedSeats();
    
    // Setup quantity selection
    setupQuantitySelection();
  } catch (error) {
    console.error('Initialization error:', error);
    alert('Error loading seat selection. Please try again.');
  }
});

function setupQuantitySelection() {
  const quantityOptions = document.querySelectorAll('.quantity-option');
  const iconElement = document.getElementById('quantity-icon');
  
  // Icon mapping based on quantity
  const iconMap = {
    1: '🚲',
    2: '🏍️',
    3: '🛺',
    4: '🚗',
    5: '🚗',
    6: '🚙',
    7: '🚙',
    8: '🚐',
    9: '🚐',
    10: '🚐'
  };
  
  quantityOptions.forEach(option => {
    option.addEventListener('click', () => {
      // Remove selected class from all
      quantityOptions.forEach(opt => opt.classList.remove('selected'));
      
      // Add selected class to clicked option
      option.classList.add('selected');
      
      // Update seats to book
      seatsToBook = parseInt(option.getAttribute('data-quantity'));
      
      // Update icon based on selection
      if (iconElement && iconMap[seatsToBook]) {
        iconElement.textContent = iconMap[seatsToBook];
      }
    });
  });
  
  // Continue button
  document.getElementById('continue-btn').addEventListener('click', () => {
    document.getElementById('quantity-step').classList.add('hidden');
    document.getElementById('seat-map-step').classList.remove('hidden');
    document.getElementById('seats-to-select').textContent = seatsToBook;
    
    // Generate seat map
    generateSeatMap();
  });
  
  // Back button
  document.getElementById('back-btn').addEventListener('click', () => {
    document.getElementById('seat-map-step').classList.add('hidden');
    document.getElementById('quantity-step').classList.remove('hidden');
    selectedSeats = [];
    document.getElementById('selection-info').classList.add('hidden');
  });
}

async function loadBookedSeats() {
  try {
    const response = await fetch(`${API_URL}/api/bookings/available-seats`);
    const data = await response.json();
    
    if (data.success) {
      bookedSeats = data.bookedSeats || [];
    }
  } catch (error) {
    console.error('Failed to load booked seats:', error);
  }
}

function generateSeatMap() {
  const seatMap = document.getElementById('seat-map');
  seatMap.innerHTML = '';
  
  SEATING_LAYOUT.forEach(rowConfig => {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'flex items-center gap-1 justify-center';

    // Row label
    const labelDiv = document.createElement('div');
    labelDiv.className = 'row-label';
    labelDiv.textContent = rowConfig.row;
    rowDiv.appendChild(labelDiv);



    // Block all seats in rows A and B (A1-A28, B1-B28)
    for (let i = 1; i <= rowConfig.seats; i++) {
      const seatNumber = `${rowConfig.row}${i}`;
      const seatDiv = document.createElement('div');
      seatDiv.className = 'seat';
      seatDiv.textContent = i;
      seatDiv.setAttribute('data-seat', seatNumber);

      if (rowConfig.row === 'A' || rowConfig.row === 'B') {
        seatDiv.classList.add('blocked');
        seatDiv.title = 'Not available for booking';
      } else if (bookedSeats.includes(seatNumber)) {
        seatDiv.classList.add('booked');
      } else {
        seatDiv.classList.add('available');
        seatDiv.addEventListener('click', () => selectSeat(seatNumber));
      }

      // Add aisle after the left side
      if (i === rowConfig.aisleAfter) {
        rowDiv.appendChild(seatDiv);
        const aisle = document.createElement('div');
        aisle.className = 'w-8';
        rowDiv.appendChild(aisle);
      } else {
        rowDiv.appendChild(seatDiv);
      }
    }

    seatMap.appendChild(rowDiv);
  });
}

function selectSeat(seatNumber) {
  const seatElement = document.querySelector(`[data-seat="${seatNumber}"]`);
  
  if (!seatElement) return;
  
  // Check if seat is already selected
  const seatIndex = selectedSeats.indexOf(seatNumber);
  
  if (seatIndex > -1) {
    // Deselect seat
    selectedSeats.splice(seatIndex, 1);
    seatElement.classList.remove('selected');
    seatElement.classList.add('available');
  } else {
    // Check if we can select more seats
    if (selectedSeats.length >= seatsToBook) {
      alert(`You can only select ${seatsToBook} seat(s)`);
      return;
    }
    
    // Select seat
    selectedSeats.push(seatNumber);
    seatElement.classList.remove('available');
    seatElement.classList.add('selected');
  }
  
  // Update display
  if (selectedSeats.length > 0) {
    document.getElementById('selected-seats-display').textContent = selectedSeats.join(', ');
    document.getElementById('selection-info').classList.remove('hidden');
    
    // Generate student detail forms for each seat
    generateStudentForms();
  } else {
    document.getElementById('selection-info').classList.add('hidden');
  }
}

// Generate student detail forms for each selected seat
function generateStudentForms() {
  const container = document.getElementById('students-forms-container');
  container.innerHTML = '';
  
  selectedSeats.forEach((seat, index) => {
    const formDiv = document.createElement('div');
    formDiv.style.background = 'white';
    formDiv.style.border = '2px solid #e5e7eb';
    formDiv.className = 'rounded-lg p-6 shadow-sm hover:shadow-md transition-all';
    formDiv.innerHTML = `
      <h3 class="text-xl font-bold mb-4 text-gray-800 pb-3 border-b-2 border-gray-200">
        Student ${index + 1} - Seat ${seat}
      </h3>
      
      <div class="space-y-4">
        <!-- Name -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
          <input
            type="text"
            id="student-name-${index}"
            data-seat="${seat}"
            placeholder="Enter full name"
            class="student-input w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all text-base"
            required
          />
        </div>
        
        <!-- Registration Number -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">Registration Number</label>
          <input
            type="text"
            id="registration-number-${index}"
            data-seat="${seat}"
            placeholder="e.g., BU21EECE0123456"
            class="student-input w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all text-base"
            required
          />
        </div>
      </div>
    `;
    
    container.appendChild(formDiv);
  });
}

// Confirm booking - show GITAM email popup
document.getElementById('confirm-btn').addEventListener('click', async () => {
  if (!selectedSeats || selectedSeats.length === 0) {
    alert('Please select at least one seat');
    return;
  }
  
  if (selectedSeats.length !== seatsToBook) {
    alert(`Please select exactly ${seatsToBook} seat(s). You have selected ${selectedSeats.length}.`);
    return;
  }
  
  // Collect all student details
  const students = [];
  
  for (let i = 0; i < selectedSeats.length; i++) {
    const name = document.getElementById(`student-name-${i}`).value.trim();
    const registrationNumber = document.getElementById(`registration-number-${i}`).value.trim();
    
    // Validate each student's details
    if (!name) {
      alert(`Please enter name for Seat ${selectedSeats[i]}`);
      document.getElementById(`student-name-${i}`).focus();
      return;
    }
    
    if (!registrationNumber) {
      alert(`Please enter registration number for Seat ${selectedSeats[i]}`);
      document.getElementById(`registration-number-${i}`).focus();
      return;
    }
    
    students.push({
      seatNumber: selectedSeats[i],
      name,
      registrationNumber
    });
  }
  
  // Show GITAM email popup
  showGitamEmailPopup(students);
});

// Show GITAM Email Popup
function showGitamEmailPopup(students) {
  const popup = document.createElement('div');
  popup.id = 'email-popup';
  popup.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
  popup.innerHTML = `
    <div class="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
      <div class="text-center mb-6">
        <div class="text-6xl mb-4">📧</div>
        <h2 class="text-2xl font-bold text-gray-800 mb-2">Enter Your GITAM Email</h2>
        <p class="text-gray-600">We'll send your ticket to this email</p>
      </div>
      
      <div class="mb-6">
        <label class="block text-gray-700 font-semibold mb-2">GITAM Email Address</label>
        <input
          type="email"
          id="popup-gitam-email"
          placeholder="yourname@gitam.in"
          class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-lg"
          autocomplete="email"
        />
        <p class="text-xs text-gray-500 mt-2">Must end with @gitam.in or @gitam.edu</p>
      </div>
      
      <div id="popup-error" class="hidden bg-red-50 border border-red-200 rounded p-3 mb-4">
        <p class="text-sm text-red-800" id="popup-error-text"></p>
      </div>
      
      <div class="flex gap-3">
        <button
          id="cancel-email-btn"
          class="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg font-semibold transition-colors"
        >
          Cancel
        </button>
        <button
          id="submit-email-btn"
          class="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-semibold transition-colors"
        >
          Send Ticket
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(popup);
  
  const emailInput = document.getElementById('popup-gitam-email');
  const submitBtn = document.getElementById('submit-email-btn');
  const cancelBtn = document.getElementById('cancel-email-btn');
  const errorDiv = document.getElementById('popup-error');
  const errorText = document.getElementById('popup-error-text');
  
  // Focus on email input
  emailInput.focus();
  
  // Cancel button
  cancelBtn.addEventListener('click', () => {
    document.body.removeChild(popup);
  });
  
  // Submit button
  submitBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    
    // Validate GITAM email
    if (!email) {
      errorText.textContent = 'Please enter your GITAM email';
      errorDiv.classList.remove('hidden');
      return;
    }
    
    if (!email.endsWith('@gitam.in') && !email.endsWith('@gitam.edu')) {
      errorText.textContent = 'Please enter a valid GITAM email (ending with @gitam.in or @gitam.edu)';
      errorDiv.classList.remove('hidden');
      return;
    }
    
    // Hide error
    errorDiv.classList.add('hidden');
    
    // Disable buttons
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing Payment...';
    cancelBtn.disabled = true;
    
    try {
      // Step 1: Create Razorpay order
      const orderResponse = await fetch(`${API_URL}/api/payment/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: 1, // ₹1 per booking
          currency: 'INR',
          seats: students.map(s => s.seatNumber),
        }),
      });
      
      const orderData = await orderResponse.json();
      
      if (!orderData.success) {
        throw new Error(orderData.error || 'Failed to create payment order');
      }
      
      console.log('💰 Payment order created:', orderData.orderId);
      
      // If payment is skipped (Razorpay not configured), proceed directly to booking
      if (orderData.skipPayment) {
        console.log('⚠️  Payment skipped - Razorpay not configured');
        submitBtn.textContent = 'Confirming Booking...';
        
        const bookingResponse = await fetch(`${API_URL}/api/bookings/book-seat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            gitamEmail: email,
            students: students,
            paymentId: 'test_payment_' + Date.now(),
            orderId: orderData.orderId,
          }),
        });
        
        const bookingData = await bookingResponse.json();
        
        console.log('🎯 Booking API Response:', bookingData);
        
        if (bookingData.success) {
          localStorage.setItem('latestBooking', JSON.stringify(bookingData.booking));
          console.log('💾 Saved to localStorage:', localStorage.getItem('latestBooking'));
          document.body.removeChild(popup);
          window.location.href = 'success.html';
        } else {
          errorText.textContent = bookingData.error || 'Booking failed. Please try again.';
          errorDiv.classList.remove('hidden');
          submitBtn.disabled = false;
          submitBtn.textContent = 'Send Ticket';
          cancelBtn.disabled = false;
          
          if (bookingData.error && bookingData.error.includes('already booked')) {
            await loadBookedSeats();
            selectedSeats = [];
            document.getElementById('selection-info').classList.add('hidden');
            generateSeatMap();
            document.body.removeChild(popup);
          }
        }
        return;
      }
      
      // Step 2: Open Razorpay Checkout
      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Rupaayi Fest 2026',
        description: `Seat(s): ${students.map(s => s.seatNumber).join(', ')}`,
        order_id: orderData.orderId,
        prefill: {
          email: email,
        },
        theme: {
          color: '#ec5e71'
        },
        handler: async function (response) {
          console.log('✅ Payment successful:', response);
          
          // Step 3: Verify payment
          submitBtn.textContent = 'Verifying Payment...';
          
          const verifyResponse = await fetch(`${API_URL}/api/payment/verify`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });
          
          const verifyData = await verifyResponse.json();
          
          if (!verifyData.success) {
            throw new Error('Payment verification failed');
          }
          
          console.log('✅ Payment verified');
          
          // Step 4: Book seats with payment info
          submitBtn.textContent = 'Confirming Booking...';
          
          const bookingResponse = await fetch(`${API_URL}/api/bookings/book-seat`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              gitamEmail: email,
              students: students,
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
            }),
          });
          
          const bookingData = await bookingResponse.json();
          
          console.log('🎯 Booking API Response:', bookingData);
          
          if (bookingData.success) {
            // Store booking data
            localStorage.setItem('latestBooking', JSON.stringify(bookingData.booking));
            console.log('💾 Saved to localStorage:', localStorage.getItem('latestBooking'));
            
            // Remove popup
            document.body.removeChild(popup);
            
            // Redirect to success page
            window.location.href = 'success.html';
          } else {
            errorText.textContent = bookingData.error || 'Booking failed. Please contact support.';
            errorDiv.classList.remove('hidden');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send Ticket';
            cancelBtn.disabled = false;
            
            // Reload seats if seat was taken
            if (bookingData.error && bookingData.error.includes('already booked')) {
              await loadBookedSeats();
              selectedSeats = [];
              document.getElementById('selection-info').classList.add('hidden');
              generateSeatMap();
              document.body.removeChild(popup);
            }
          }
        },
        modal: {
          ondismiss: function() {
            console.log('❌ Payment cancelled by user');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send Ticket';
            cancelBtn.disabled = false;
            errorText.textContent = 'Payment was cancelled. Please try again.';
            errorDiv.classList.remove('hidden');
          }
        }
      };
      
      const razorpay = new Razorpay(options);
      razorpay.open();
      
    } catch (error) {
      console.error('Payment/Booking error:', error);
      errorText.textContent = error.message || 'Network error. Please check your connection.';
      errorDiv.classList.remove('hidden');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Ticket';
      cancelBtn.disabled = false;
    }
  });
  
  // Allow Enter key to submit
  emailInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      submitBtn.click();
    }
  });
}
