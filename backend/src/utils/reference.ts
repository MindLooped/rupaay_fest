/**
 * Generate a unique booking reference
 * Format: EVT2025001, EVT2025002, etc.
 */
export function generateBookingReference(bookingNumber: number): string {
  // Format: RUPPAAFEST0001, RUPPAAFEST0002, ...
  const prefix = 'RUPPAAFEST';
  const paddedNumber = bookingNumber.toString().padStart(4, '0');
  return `${prefix}${paddedNumber}`;
}

/**
 * Alternative: Random alphanumeric reference
 * Format: BK7X9M2A
 */
export function generateRandomReference(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'BK';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
