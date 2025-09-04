/**
 * Generate a unique keg ID with SK prefix
 */
export function generateKegId(): string {
  // Generate random 8-digit number
  const randomNum = Math.floor(10000000 + Math.random() * 90000000);
  return `K-${randomNum}`;
}

/**
 * Generate QR code string for a keg ID
 */
export function generateQrCode(kegId: string): string {
  // Add SK prefix to create QR code
  return `SK${kegId.replace('K-', '')}`;
}

/**
 * Extract keg ID from QR code
 */
export function extractKegIdFromQR(qrCode: string): string {
  // Remove SK prefix and add K- prefix
  if (qrCode.startsWith('SK')) {
    return `K-${qrCode.substring(2)}`;
  }
  return qrCode;
}

/**
 * Validate QR code format
 */
export function isValidQRCode(qrCode: string): boolean {
  // Should start with SK followed by 8 digits
  return /^SK\d{8}$/.test(qrCode);
}

/**
 * Validate keg ID format
 */
export function isValidKegId(kegId: string): boolean {
  // Should be K- followed by 8 digits
  return /^K-\d{8}$/.test(kegId);
}