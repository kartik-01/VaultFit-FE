/**
 * API client for backend communication
 */
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface UploadChunkRequest {
  uploadId: string;
  chunkIndex: number;
  totalChunks: number;
  encryptedData: string; // base64
  iv: string; // base64
}

export interface UploadMetadata {
  uploadId: string;
  fileName: string;
  fileSize: number;
  totalChunks: number;
  expiresAt?: string;
}

/**
 * Initialize upload and get upload ID
 */
export async function initUpload(metadata: Omit<UploadMetadata, 'uploadId'>): Promise<string> {
  const response = await api.post<{ uploadId: string }>('/upload/init', metadata);
  return response.data.uploadId;
}

/**
 * Upload a single chunk
 */
export async function uploadChunk(chunk: UploadChunkRequest): Promise<void> {
  await api.post('/upload/chunk', chunk);
}

/**
 * Complete upload
 */
export async function completeUpload(uploadId: string): Promise<{ shareableLink: string }> {
  const response = await api.post<{ shareableLink: string }>(`/upload/complete/${uploadId}`);
  return response.data;
}

/**
 * Get upload metadata
 */
export async function getUploadMetadata(uploadId: string): Promise<UploadMetadata> {
  const response = await api.get<UploadMetadata>(`/upload/${uploadId}/metadata`);
  return response.data;
}

export default api;

