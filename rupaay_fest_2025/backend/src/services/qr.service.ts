import QRCode from 'qrcode';

/**
 * Generate QR code as base64 data URL
 */
export async function generateQRCode(data: string): Promise<string> {
  try {
    return await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 2,
    });
  } catch (error) {
    console.error('QR generation failed:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Generate QR with booking details
 */
export async function generateTicketQR(reference: string, email: string, name: string): Promise<string> {
  const qrData = JSON.stringify({
    ref: reference,
    email,
    name,
    event: process.env.EVENT_NAME || 'College Event',
    verified: true,
  });
  return generateQRCode(qrData);
}
