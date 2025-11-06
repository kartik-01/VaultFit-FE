import { useState, useRef } from 'react';
import { Upload, FileArchive, Check, Lock, ArrowRight, Info } from 'lucide-react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { useAppStore } from '../store/useAppStore';
import { extractXMLFromZip, parseHealthXML } from '../utils/xmlParser';
import { generateEncryptionKey, encryptJSON } from '../utils/encryption';
import { toast } from 'sonner';

// Fix for Web Worker import in Vite
const createWorker = () => {
  return new Worker(
    new URL('../workers/xmlParser.worker.ts', import.meta.url),
    { type: 'module' }
  );
};

interface UploadScreenProps {
  onUploadComplete: () => void;
}

export default function UploadScreen({ onUploadComplete }: UploadScreenProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [status, setStatus] = useState<string>('');
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { setProcessing, setEncryptedHealthData, setEncryptionKey } = useAppStore();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFile = async (file: File) => {
    setFileName(file.name);
    setIsProcessing(true);
    setProcessing(true);
    setUploadProgress(0);
    setStatus('Reading file...');

    try {
      // Step 1: Extract XML from file
      setStatus('Extracting XML data...');
      setUploadProgress(10);
      const xmlString = await extractXMLFromZip(file);

      // Step 2: Parse XML (use Web Worker for large files)
      setStatus('Parsing health data...');
      setUploadProgress(20);
      
      let parsedData;
      if (xmlString.length > 10 * 1024 * 1024) {
        // Use Web Worker for files > 10MB
        parsedData = await parseXMLInWorker(xmlString);
      } else {
        parsedData = parseHealthXML(xmlString);
      }
      
      // Step 3: Generate encryption key and encrypt data
      setStatus('Encrypting data...');
      setUploadProgress(80);
      const encryptionKey = await generateEncryptionKey();
      setEncryptionKey(encryptionKey);
      
      const { encrypted, iv } = await encryptJSON(parsedData, encryptionKey);
      setEncryptedHealthData({ encrypted, iv });
      
      setUploadProgress(90);
      setStatus('Processing complete!');
      
      setUploadProgress(100);
      setStatus('Ready to view!');
      
      toast.success('File processed successfully! Your data is ready to view.');
      
      setTimeout(() => {
        onUploadComplete();
      }, 1000);
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error(`Error: ${(error as Error).message}`);
      setIsProcessing(false);
      setProcessing(false);
      setUploadProgress(0);
      setStatus('');
    }
  };

  const parseXMLInWorker = (xmlString: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      try {
        const worker = createWorker();

        worker.postMessage({ xmlString });

        worker.onmessage = (e) => {
          if (e.data.success) {
            resolve(e.data.data);
          } else {
            reject(new Error(e.data.error));
          }
          worker.terminate();
        };

        worker.onerror = (error) => {
          reject(error);
          worker.terminate();
        };
      } catch (error) {
        // Fallback to main thread parsing if worker fails
        console.warn('Worker failed, falling back to main thread:', error);
        resolve(parseHealthXML(xmlString));
      }
    });
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Effect */}
      <div className="absolute inset-0 gradient-mesh opacity-30" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />

      <div className="relative max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 animate-slide-in-up">
          <h2 className="text-4xl sm:text-5xl mb-4">
            Upload Your <span className="text-gradient">Health Data</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Securely process your Apple Health export locally in your browser
          </p>
        </div>

        {/* Upload Card */}
        <div className="glass-card rounded-3xl p-8 sm:p-12 mb-8 animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
          {/* Upload Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative border-2 border-dashed rounded-2xl p-12 text-center transition-all
              ${isDragging 
                ? 'border-cyan-500 bg-cyan-500/10' 
                : 'border-border hover:border-cyan-500/50 hover:bg-cyan-500/5'
              }
              ${isProcessing ? 'pointer-events-none' : 'cursor-pointer'}
            `}
            onClick={() => !isProcessing && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip,.xml"
              onChange={handleFileSelect}
              className="hidden"
            />

            {!isProcessing ? (
              <div className="space-y-6">
                {/* Upload Icon */}
                <div className="relative inline-block">
                  <div className="absolute inset-0 gradient-primary rounded-2xl blur-xl opacity-50" />
                  <div className="relative w-20 h-20 gradient-primary rounded-2xl mx-auto flex items-center justify-center">
                    <Upload className="w-10 h-10 text-white" />
                  </div>
                </div>
                
                <div>
                  <h3 className="text-2xl text-foreground mb-2">
                    Drop your file here
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    or click to browse
                  </p>

                  <div className="flex justify-center">
                    <Button className="gradient-primary hover:opacity-90 transition-all hover:shadow-lg hover:shadow-cyan-500/50 gap-2">
                      Select Apple Health Export
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-4 text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <FileArchive className="w-4 h-4" />
                    .zip
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-2">
                    <FileArchive className="w-4 h-4" />
                    .xml
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Processing Icon */}
                <div className="relative inline-block">
                  {uploadProgress === 100 ? (
                    <>
                      <div className="absolute inset-0 gradient-success rounded-2xl blur-xl opacity-50" />
                      <div className="relative w-20 h-20 gradient-success rounded-2xl mx-auto flex items-center justify-center">
                        <Check className="w-10 h-10 text-white" />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="absolute inset-0 gradient-primary rounded-2xl blur-xl opacity-50 animate-pulse-glow" />
                      <div className="relative w-20 h-20 gradient-primary rounded-2xl mx-auto flex items-center justify-center">
                        <FileArchive className="w-10 h-10 text-white" />
                      </div>
                    </>
                  )}
                </div>

                <div>
                  <h3 className="text-2xl text-foreground mb-2">
                    {uploadProgress === 100 ? 'Processing Complete!' : 'Processing Your Data...'}
                  </h3>
                  <p className="text-muted-foreground mb-2">{fileName}</p>
                  {status && (
                    <p className="text-sm text-cyan-600 dark:text-cyan-500/70 mb-4">{status}</p>
                  )}
                  
                  {/* Progress Bar */}
                  <div className="max-w-md mx-auto">
                    <Progress value={uploadProgress} className="h-2 mb-4" />
                    <p className="text-muted-foreground">
                      {Math.round(uploadProgress)}% • {status || 'Processing...'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Security Note */}
          {!isProcessing && (
            <div className="mt-8 p-6 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20 flex items-start gap-3">
              <Lock className="w-5 h-5 text-emerald-600 dark:text-emerald-500/70 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-foreground mb-2">
                  100% Client-Side Processing
                </h4>
                <p className="text-muted-foreground">
                  Your data never leaves your device. Everything is processed and encrypted
                  locally in your browser, ensuring maximum privacy and security.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* How to Export Guide */}
        <div className="glass-card rounded-2xl p-8 animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-start gap-3 mb-6">
            <Info className="w-5 h-5 text-cyan-600 dark:text-cyan-500/70 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xl text-foreground mb-4">
                How to export from Apple Health
              </h4>
              <ol className="space-y-3 text-muted-foreground">
                <li className="flex gap-3">
                  <span className="text-cyan-600 dark:text-cyan-400 flex-shrink-0">1.</span>
                  <span>Open the <strong>Health app</strong> on your iPhone</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-cyan-600 dark:text-cyan-400 flex-shrink-0">2.</span>
                  <span>Tap your <strong>profile picture</strong> in the top right</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-cyan-600 dark:text-cyan-400 flex-shrink-0">3.</span>
                  <span>Scroll down and tap <strong>"Export All Health Data"</strong></span>
                </li>
                <li className="flex gap-3">
                  <span className="text-cyan-600 dark:text-cyan-400 flex-shrink-0">4.</span>
                  <span>Tap "Export" and save the file</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-cyan-600 dark:text-cyan-400 flex-shrink-0">5.</span>
                  <span>Transfer the ZIP file to this device and upload it here</span>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
