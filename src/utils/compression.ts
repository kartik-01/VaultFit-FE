/**
 * Compression utilities using fflate
 */
import { gzipSync } from 'fflate';

/**
 * Compress data using gzip
 */
export async function compressData(data: Uint8Array): Promise<Uint8Array> {
  try {
    const compressed = gzipSync(data);
    return compressed;
  } catch (error) {
    throw new Error(`Compression failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Compress file
 */
export async function compressFile(file: File): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const data = new Uint8Array(arrayBuffer);
  return compressData(data);
}

