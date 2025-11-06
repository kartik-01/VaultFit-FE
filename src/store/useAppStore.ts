import { create } from 'zustand';
import type { ParsedHealthData } from '../utils/xmlParser';

export type HealthData = ParsedHealthData;

interface AppState {
  // Upload state
  isProcessing: boolean;
  uploadProgress: number;
  fileName: string | null;
  
  // Parsed data - stored encrypted
  encryptedHealthData: { encrypted: string; iv: string } | null;
  
  // Encryption
  encryptionKey: CryptoKey | null;
  
  // Upload metadata
  uploadId: string | null;
  
  // Actions
  setProcessing: (processing: boolean) => void;
  setUploadProgress: (progress: number) => void;
  setFileName: (name: string | null) => void;
  setEncryptedHealthData: (data: { encrypted: string; iv: string } | null) => void;
  setEncryptionKey: (key: CryptoKey | null) => void;
  setUploadId: (id: string | null) => void;
  
  // Helper: Get decrypted health data (decrypts on access)
  getHealthData: () => Promise<HealthData | null>;
  
  reset: () => void;
}

const initialState = {
  isProcessing: false,
  uploadProgress: 0,
  fileName: null,
  encryptedHealthData: null,
  encryptionKey: null,
  uploadId: null,
};

export const useAppStore = create<AppState>((set, get) => ({
  ...initialState,
  setProcessing: (processing) => set({ isProcessing: processing }),
  setUploadProgress: (progress) => set({ uploadProgress: progress }),
  setFileName: (name) => set({ fileName: name }),
  setEncryptedHealthData: (data) => set({ encryptedHealthData: data }),
  setEncryptionKey: (key) => set({ encryptionKey: key }),
  setUploadId: (id) => set({ uploadId: id }),
  getHealthData: async () => {
    const { encryptedHealthData, encryptionKey } = get();
    if (!encryptedHealthData || !encryptionKey) {
      return null;
    }
    
    try {
      const { decryptJSON } = await import('../utils/encryption');
      return await decryptJSON(
        encryptedHealthData.encrypted,
        encryptedHealthData.iv,
        encryptionKey
      );
    } catch (error) {
      console.error('Failed to decrypt health data:', error);
      return null;
    }
  },
  reset: () => set(initialState),
}));

