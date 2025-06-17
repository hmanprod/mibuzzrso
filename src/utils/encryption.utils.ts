import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';

// Load encryption key from environment variable
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
if (!ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY is not defined in .env file');
}

// Ensure the key is 32 bytes (256 bits) for AES-256
const key = Buffer.from(ENCRYPTION_KEY, 'hex');

// Function to encrypt a URL
export function encryptUrl(url: string): string {
  const iv = randomBytes(16); // Generate a random initialization vector
  const cipher = createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(url, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

// Function to decrypt a URL
export function decryptUrl(encryptedUrl: string): string {
  const [ivHex, encrypted] = encryptedUrl.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}