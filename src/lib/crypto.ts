/**
 * Client-side encryption utilities using Web Crypto API
 * Zero-knowledge architecture - passwords never leave the browser
 */

const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const KEY_ITERATIONS = 100000;

/**
 * Derives a cryptographic key from a password using PBKDF2
 */
async function deriveKey(password: string, salt: BufferSource): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: KEY_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a message using AES-GCM with a password-derived key
 * Returns base64-encoded encrypted data with salt and IV prepended
 */
export async function encryptMessage(message: string, password: string): Promise<string> {
  const encoder = new TextEncoder();
  const messageBuffer = encoder.encode(message);

  // Generate random salt and IV
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  // Derive key from password
  const key = await deriveKey(password, salt);

  // Encrypt the message
  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    messageBuffer
  );

  // Combine salt + IV + encrypted data
  const encryptedData = new Uint8Array(encryptedBuffer);
  const combined = new Uint8Array(SALT_LENGTH + IV_LENGTH + encryptedData.length);
  combined.set(salt, 0);
  combined.set(iv, SALT_LENGTH);
  combined.set(encryptedData, SALT_LENGTH + IV_LENGTH);

  // Convert to base64
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypts a message using AES-GCM with a password-derived key
 * Expects base64-encoded data with salt and IV prepended
 */
export async function decryptMessage(encryptedData: string, password: string): Promise<string> {
  try {
    // Decode from base64
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));

    // Extract salt, IV, and encrypted data
    const salt = combined.slice(0, SALT_LENGTH);
    const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const encrypted = combined.slice(SALT_LENGTH + IV_LENGTH);

    // Derive key from password
    const key = await deriveKey(password, salt);

    // Decrypt the message
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      encrypted
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    throw new Error('Decryption failed. Invalid password or corrupted data.');
  }
}

/**
 * Creates a password hash for verification (non-reversible)
 * Used to verify password without storing it
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generates a cryptographically secure random token
 */
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}
