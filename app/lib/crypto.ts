/**
 * Crypto utilities for encrypting/decrypting sensitive data
 * Used primarily for refresh token storage
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 64;

/**
 * Get encryption key from environment
 * Must be 32 bytes (256 bits) base64 encoded
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY_32B_BASE64;
  
  if (!key) {
    throw new Error('ENCRYPTION_KEY_32B_BASE64 environment variable is not set');
  }
  
  const keyBuffer = Buffer.from(key, 'base64');
  
  if (keyBuffer.length !== 32) {
    throw new Error('Encryption key must be exactly 32 bytes');
  }
  
  return keyBuffer;
}

/**
 * Encrypt a string value
 * Returns base64 encoded string containing IV + auth tag + encrypted data
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  
  const cipher = createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  const authTag = cipher.getAuthTag();
  
  // Combine IV + auth tag + encrypted data
  const combined = Buffer.concat([
    iv,
    authTag,
    Buffer.from(encrypted, 'base64'),
  ]);
  
  return combined.toString('base64');
}

/**
 * Decrypt a string value
 * Expects base64 encoded string containing IV + auth tag + encrypted data
 */
export function decrypt(ciphertext: string): string {
  const key = getEncryptionKey();
  const combined = Buffer.from(ciphertext, 'base64');
  
  // Extract IV, auth tag, and encrypted data
  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted.toString('base64'), 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Generate a random 32-byte encryption key for .env
 * Run: node -e "console.log(require('./lib/crypto').generateEncryptionKey())"
 */
export function generateEncryptionKey(): string {
  return randomBytes(32).toString('base64');
}
