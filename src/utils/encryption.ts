/**
 * Encryption utilities using Web Crypto API
 * All encryption happens client-side with AES-GCM
 */

const CHUNK_SIZE = 1024 * 1024; // 1MB chunks

/**
 * Generate a new encryption key
 */
export async function generateEncryptionKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true, // extractable
    ['encrypt', 'decrypt']
  );
}

/**
 * Export key to base64 string
 */
export async function exportKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey('raw', key);
  const buffer = new Uint8Array(exported);
  return btoa(String.fromCharCode(...buffer));
}

/**
 * Import key from base64 string
 */
export async function importKey(keyString: string): Promise<CryptoKey> {
  const keyData = Uint8Array.from(atob(keyString), (c) => c.charCodeAt(0));
  return await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt data using AES-GCM
 */
export async function encryptData(
  data: Uint8Array,
  key: CryptoKey
): Promise<{ encrypted: Uint8Array; iv: Uint8Array }> {
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM
  
  // Ensure we have proper ArrayBuffers for Web Crypto API
  // Create new ArrayBuffers to avoid SharedArrayBuffer issues
  const dataBuffer = new Uint8Array(data).buffer;
  const ivBuffer = new Uint8Array(iv).buffer;
  
  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: ivBuffer,
    },
    key,
    dataBuffer
  );

  return {
    encrypted: new Uint8Array(encrypted),
    iv: iv,
  };
}

/**
 * Decrypt data using AES-GCM
 */
export async function decryptData(
  encrypted: Uint8Array,
  iv: Uint8Array,
  key: CryptoKey
): Promise<Uint8Array> {
  // Ensure we have proper ArrayBuffers for Web Crypto API
  // Create new ArrayBuffers to avoid SharedArrayBuffer issues
  const encryptedBuffer = new Uint8Array(encrypted).buffer;
  const ivBuffer = new Uint8Array(iv).buffer;
  
  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: ivBuffer,
    },
    key,
    encryptedBuffer
  );

  return new Uint8Array(decrypted);
}

/**
 * Encrypt file in chunks for large files
 */
export async function encryptFileInChunks(
  file: File,
  key: CryptoKey,
  onProgress?: (progress: number) => void
): Promise<Array<{ encrypted: Uint8Array; iv: Uint8Array; index: number }>> {
  const chunks: Array<{ encrypted: Uint8Array; iv: Uint8Array; index: number }> = [];
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);
    const arrayBuffer = await chunk.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);

    const { encrypted, iv } = await encryptData(data, key);
    chunks.push({ encrypted, iv, index: i });

    if (onProgress) {
      onProgress(((i + 1) / totalChunks) * 100);
    }
  }

  return chunks;
}

/**
 * Encrypt JSON data (like HealthData)
 */
export async function encryptJSON(
  data: any,
  key: CryptoKey
): Promise<{ encrypted: string; iv: string }> {
  const jsonString = JSON.stringify(data);
  const dataBytes = new TextEncoder().encode(jsonString);
  const { encrypted, iv } = await encryptData(dataBytes, key);
  
  return {
    encrypted: btoa(String.fromCharCode(...encrypted)),
    iv: btoa(String.fromCharCode(...iv)),
  };
}

/**
 * Decrypt JSON data (like HealthData)
 */
export async function decryptJSON(
  encrypted: string,
  iv: string,
  key: CryptoKey
): Promise<any> {
  const encryptedBytes = Uint8Array.from(atob(encrypted), (c) => c.charCodeAt(0));
  const ivBytes = Uint8Array.from(atob(iv), (c) => c.charCodeAt(0));
  const decryptedBytes = await decryptData(encryptedBytes, ivBytes, key);
  const jsonString = new TextDecoder().decode(decryptedBytes);
  return JSON.parse(jsonString);
}
