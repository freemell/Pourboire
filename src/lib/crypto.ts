import sodium from 'libsodium-wrappers';

// Initialize sodium
await sodium.ready;

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

// Convert hex string to Uint8Array
function hexToUint8Array(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

// Convert Uint8Array to hex string
function uint8ArrayToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export function encryptPrivateKey(privateKey: Uint8Array): string {
  if (!ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY is missing. Set it in .env.local');
  }
  const key = hexToUint8Array(ENCRYPTION_KEY);
  
  // Generate a random nonce
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  
  // Encrypt the private key
  const encrypted = sodium.crypto_secretbox_easy(privateKey, nonce, key);
  
  // Combine nonce and encrypted data
  const combined = new Uint8Array(nonce.length + encrypted.length);
  combined.set(nonce);
  combined.set(encrypted, nonce.length);
  
  return uint8ArrayToHex(combined);
}

export function decryptPrivateKey(encryptedHex: string): Uint8Array {
  if (!ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY is missing. Set it in .env.local');
  }
  const key = hexToUint8Array(ENCRYPTION_KEY);
  const combined = hexToUint8Array(encryptedHex);
  
  // Extract nonce and encrypted data
  const nonce = combined.slice(0, sodium.crypto_secretbox_NONCEBYTES);
  const encrypted = combined.slice(sodium.crypto_secretbox_NONCEBYTES);
  
  // Decrypt the private key
  const decrypted = sodium.crypto_secretbox_open_easy(encrypted, nonce, key);
  
  if (!decrypted) {
    throw new Error('Failed to decrypt private key');
  }
  
  return decrypted;
}

export function generateEncryptionKey(): string {
  const key = sodium.randombytes_buf(sodium.crypto_secretbox_KEYBYTES);
  return uint8ArrayToHex(key);
}


