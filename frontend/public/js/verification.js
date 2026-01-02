const API_URL = 'https://rupaay-fest-backend.vercel.app';

let userEmail = '';

// Step 1: Send verification code
document.getElementById('email-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const sendBtn = document.getElementById('send-code-btn');
  const errorDiv = document.getElementById('email-error');
  const errorText = document.getElementById('email-error-text');
  
  const email = document.getElementById('email').value.trim();
  userEmail = email;
  
  // Hide previous errors
  errorDiv.classList.add('hidden');
  
  // Disable button
  sendBtn.disabled = true;
  sendBtn.textContent = 'Sending...';
  
  try {
    const response = await fetch(`${API_URL}/api/bookings/send-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      // Show verification code step
      document.getElementById('email-step').classList.add('hidden');
      document.getElementById('code-step').classList.remove('hidden');
      document.getElementById('display-email').textContent = email;
    } else {
      // Handle specific errors
      if (response.status === 429) {
        errorText.textContent = 'Too many requests. Please wait a moment and try again.';
      } else {
        errorText.textContent = data.error || 'Failed to send verification code';
      }
      errorDiv.classList.remove('hidden');
      sendBtn.disabled = false;
      sendBtn.textContent = 'Send Verification Code';
    }
  } catch (error) {
    errorText.textContent = 'Network error. Please check your connection.';
    errorDiv.classList.remove('hidden');
    sendBtn.disabled = false;
    sendBtn.textContent = 'Send Verification Code';
  }
});

// Step 2: Verify code
document.getElementById('verify-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const verifyBtn = document.getElementById('verify-btn');
  const errorDiv = document.getElementById('verify-error');
  const errorText = document.getElementById('verify-error-text');
  const successDiv = document.getElementById('verify-success');
  
  const code = document.getElementById('code').value.trim();
  
  // Hide previous messages
  errorDiv.classList.add('hidden');
  successDiv.classList.add('hidden');
  
  // Disable button
  verifyBtn.disabled = true;
  verifyBtn.textContent = 'Verifying...';
  
  try {
    const response = await fetch(`${API_URL}/api/bookings/verify-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: userEmail, code }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Show success message
      successDiv.classList.remove('hidden');
      
      // Store email in localStorage
      localStorage.setItem('verifiedEmail', userEmail);
      
      // Redirect to seat selection after 1 second
      setTimeout(() => {
        window.location.href = 'seat-selection.html';
      }, 1000);
    } else {
      errorText.textContent = data.error || 'Invalid verification code';
      errorDiv.classList.remove('hidden');
      verifyBtn.disabled = false;
      verifyBtn.textContent = 'Verify & Continue';
    }
  } catch (error) {
    errorText.textContent = 'Network error. Please try again.';
    errorDiv.classList.remove('hidden');
    verifyBtn.disabled = false;
    verifyBtn.textContent = 'Verify & Continue';
  }
});

// Resend code
document.getElementById('resend-btn').addEventListener('click', async () => {
  const resendBtn = document.getElementById('resend-btn');
  const errorDiv = document.getElementById('verify-error');
  const errorText = document.getElementById('verify-error-text');
  
  errorDiv.classList.add('hidden');
  resendBtn.disabled = true;
  resendBtn.textContent = 'Resending...';
  
  try {
    const response = await fetch(`${API_URL}/api/bookings/send-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: userEmail }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      resendBtn.textContent = 'Code Resent!';
      setTimeout(() => {
        resendBtn.disabled = false;
        resendBtn.textContent = 'Resend Code';
      }, 3000);
    } else {
      errorText.textContent = 'Failed to resend code';
      errorDiv.classList.remove('hidden');
      resendBtn.disabled = false;
      resendBtn.textContent = 'Resend Code';
    }
  } catch (error) {
    errorText.textContent = 'Network error';
    errorDiv.classList.remove('hidden');
    resendBtn.disabled = false;
    resendBtn.textContent = 'Resend Code';
  }
});
