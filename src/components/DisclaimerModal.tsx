import { useState, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Checkbox } from './ui/checkbox';

interface DisclaimerModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export default function DisclaimerModal({
  isOpen,
  onAccept,
  onDecline,
}: DisclaimerModalProps) {
  const [hasScrolled, setHasScrolled] = useState(false);
  const [hasAgreed, setHasAgreed] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setHasScrolled(false);
      setHasAgreed(false);
    }
  }, [isOpen]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    
    // Get the actual scrollable element (ScrollArea uses a viewport div)
    const viewport = element.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement;
    if (!viewport) return;
    
    const scrollTop = viewport.scrollTop;
    const scrollHeight = viewport.scrollHeight;
    const clientHeight = viewport.clientHeight;
    
    // Check if content is actually scrollable
    const isScrollable = scrollHeight > clientHeight;
    
    // If not scrollable, content fits in view - enable immediately
    if (!isScrollable && !hasScrolled) {
      setHasScrolled(true);
      return;
    }
    
    // User must scroll to within 5px of the absolute bottom
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const hasReachedBottom = distanceFromBottom <= 5;
    
    if (hasReachedBottom && !hasScrolled) {
      setHasScrolled(true);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onDecline()}>
      <DialogContent className="max-w-2xl glass-card shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl">Important Information</DialogTitle>
              <DialogDescription>
                Please read carefully before continuing
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[450px] pr-4" onScrollCapture={handleScroll}>
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-2xl text-foreground mb-2">🔒 Privacy Policy & Disclaimer</h2>
              <p className="text-sm text-muted-foreground">Effective Date: November 6, 2025</p>
            </div>

            {/* 1. Overview */}
            <div>
              <h3 className="mb-4 flex items-center gap-2">
                <span className="text-xl sm:text-2xl text-gradient">1. Overview</span>
              </h3>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  This web application ("the App") allows users to upload and visualize Apple Health data 
                  (e.g., steps, heart rate, workouts) in a secure, privacy-preserving way.
                </p>
                <p>
                  <strong>All data is processed and encrypted locally on your device</strong> before any upload occurs. 
                  The App cannot read, decrypt, or access your health information.
                </p>
                <p>
                  The App is intended for personal use only to help users better understand their own data. 
                  <strong>It is not a medical service</strong> and must not be used for diagnosis, treatment, 
                  or professional healthcare decision-making.
                </p>
              </div>
            </div>

            {/* 2. Data Handling and Storage */}
            <div>
              <h3 className="mb-4 flex items-center gap-2">
                <span className="text-xl sm:text-2xl text-gradient">2. Data Handling and Storage</span>
              </h3>
              
              <div className="space-y-4">
                <div className="p-4 rounded-xl glass-card border-cyan-500/30">
                  <h4 className="text-foreground mb-2">a. Guest Mode (No Account)</h4>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex gap-2">
                      <span className="text-cyan-600 dark:text-cyan-500/70 flex-shrink-0">•</span>
                      <span>All processing occurs entirely in your browser.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-cyan-600 dark:text-cyan-500/70 flex-shrink-0">•</span>
                      <span>No data, identifiers, or cookies are stored on our servers.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-cyan-600 dark:text-cyan-500/70 flex-shrink-0">•</span>
                      <span>When you close or refresh the page, your data is deleted from memory.</span>
                    </li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl glass-card border-emerald-500/30">
                  <h4 className="text-foreground mb-2">b. Logged-In Mode (Optional)</h4>
                  <p className="text-muted-foreground mb-3">
                    If you choose to create an account using Auth0, you can access additional features 
                    such as shareable encrypted links. Even in this mode:
                  </p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex gap-2">
                      <span className="text-emerald-600 dark:text-emerald-500/70 flex-shrink-0">•</span>
                      <span>Your health data is encrypted locally (AES-GCM) before leaving your device.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-emerald-600 dark:text-emerald-500/70 flex-shrink-0">•</span>
                      <span>Only the encrypted ciphertext is stored on our servers or cloud storage.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-emerald-600 dark:text-emerald-500/70 flex-shrink-0">•</span>
                      <span>The encryption key never leaves your browser and is embedded only in the shareable link (the part after #key=), which the server never receives.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-emerald-600 dark:text-emerald-500/70 flex-shrink-0">•</span>
                      <span>We cannot decrypt, read, or modify your uploaded data.</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-foreground mb-2">c. Metadata</h4>
                  <p className="text-muted-foreground">
                    To operate the service, we may store minimal non-identifiable metadata (e.g., file size, 
                    upload timestamp, expiration date). <strong>No health metrics or personally identifiable 
                    information (PII) are stored or logged.</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* 3. Sharing Links */}
            <div>
              <h3 className="mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500/70" />
                <span className="text-xl sm:text-2xl text-gradient">3. Sharing Links</span>
              </h3>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  When you create a shareable link, anyone who has the full link (including the decryption 
                  key in the URL fragment) can decrypt and view your data.
                </p>
                <p>
                  <strong>You are solely responsible for who you share this link with.</strong> You may 
                  revoke access at any time by deleting or expiring the upload in your account.
                </p>
              </div>
            </div>

            {/* 4. Security Measures */}
            <div>
              <h3 className="mb-4 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-500/70" />
                <span className="text-xl sm:text-2xl text-gradient">4. Security Measures</span>
              </h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-emerald-600 dark:text-emerald-500/70 flex-shrink-0">•</span>
                  <span><strong>End-to-End Encryption:</strong> All health data is encrypted before upload and decrypted only in the user's or recipient's browser.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-600 dark:text-emerald-500/70 flex-shrink-0">•</span>
                  <span><strong>Transport Security:</strong> All communications use HTTPS/TLS 1.3.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-600 dark:text-emerald-500/70 flex-shrink-0">•</span>
                  <span><strong>Zero-Knowledge Architecture:</strong> Our servers never possess decryption keys.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-600 dark:text-emerald-500/70 flex-shrink-0">•</span>
                  <span><strong>Open Source:</strong> Parts of this application are open source so that the community can verify our security claims.</span>
                </li>
              </ul>
              <p className="text-muted-foreground mt-3 italic">
                Despite these measures, no system is completely immune to risk. By using the App, you 
                acknowledge that you assume responsibility for the protection of your own data and key.
              </p>
            </div>

            {/* 5. Legal & Regulatory */}
            <div>
              <h3 className="mb-4 flex items-center gap-2">
                <span className="text-xl sm:text-2xl text-gradient">5. Legal & Regulatory</span>
              </h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-cyan-600 dark:text-cyan-500/70 flex-shrink-0">•</span>
                  <span>This App is not a "covered entity" or "business associate" under the U.S. HIPAA regulations.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-cyan-600 dark:text-cyan-500/70 flex-shrink-0">•</span>
                  <span>The App does not provide medical advice or professional healthcare services.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-cyan-600 dark:text-cyan-500/70 flex-shrink-0">•</span>
                  <span>If a medical professional chooses to view shared data, they do so under their own regulatory obligations.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-cyan-600 dark:text-cyan-500/70 flex-shrink-0">•</span>
                  <span>We comply with applicable consumer privacy laws (e.g., FTC Act § 5, CCPA, GDPR) by being transparent about our data practices and by minimizing data collection.</span>
                </li>
              </ul>
            </div>

            {/* 6. User Consent */}
            <div>
              <h3 className="mb-4 flex items-center gap-2">
                <span className="text-xl sm:text-2xl text-gradient">6. User Consent</span>
              </h3>
              <p className="text-muted-foreground mb-3">
                By using this App, you agree that:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-cyan-600 dark:text-cyan-500/70 flex-shrink-0">•</span>
                  <span>You understand and accept how encryption and sharing work.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-cyan-600 dark:text-cyan-500/70 flex-shrink-0">•</span>
                  <span>You consent to your data being processed and encrypted locally.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-cyan-600 dark:text-cyan-500/70 flex-shrink-0">•</span>
                  <span>You understand that if you lose your decryption key, your data cannot be recovered.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-cyan-600 dark:text-cyan-500/70 flex-shrink-0">•</span>
                  <span>You accept that this App is for informational and educational use only.</span>
                </li>
              </ul>
            </div>

            {/* 7. Changes */}
            <div>
              <h3 className="mb-4 flex items-center gap-2">
                <span className="text-xl sm:text-2xl text-gradient">7. Changes</span>
              </h3>
              <p className="text-muted-foreground">
                We may update this Privacy Policy & Disclaimer from time to time. The "Effective Date" 
                at the top will indicate the latest version. Significant changes will be communicated 
                via an in-app notice.
              </p>
            </div>

            {/* 8. Contact */}
            <div>
              <h3 className="mb-4 flex items-center gap-2">
                <span className="text-xl sm:text-2xl text-gradient">8. Contact</span>
              </h3>
              <p className="text-muted-foreground">
                For privacy questions, bug reports, or security concerns:<br />
                📧 <strong>privacy@vaultfit.app</strong>
              </p>
            </div>

            {/* Developer's Note */}
            <div className="p-4 rounded-xl glass-card border-cyan-500/30">
              <div className="flex gap-3">
                <Info className="w-5 h-5 text-cyan-600 dark:text-cyan-500/70 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-foreground mb-2">🧭 Developer's Note</h4>
                  <p className="text-muted-foreground">
                    This project demonstrates secure, end-to-end encrypted data visualization using modern 
                    Web Crypto APIs. It is designed for transparency and privacy-first principles, not as 
                    a regulated health or medical service.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-sm text-muted-foreground pt-4 border-t border-border text-center">
              <p>Last updated: November 6, 2025</p>
            </div>
          </div>
        </ScrollArea>

        <div className="flex items-center gap-3 py-4 border-t border-border">
          <Checkbox
            id="agree"
            checked={hasAgreed}
            onCheckedChange={(checked) => setHasAgreed(checked === true)}
            disabled={!hasScrolled}
          />
          <label
            htmlFor="agree"
            className={`cursor-pointer select-none transition-colors ${
              hasScrolled 
                ? 'text-foreground' 
                : 'text-muted-foreground/50 cursor-not-allowed'
            }`}
          >
            I have read and agree to these terms
            {!hasScrolled && <span className="text-amber-600 dark:text-amber-500/70 ml-2 text-sm">(please read the entire disclaimer)</span>}
          </label>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onDecline}
            className="glass-card hover:border-red-500/50"
          >
            Decline
          </Button>
          <Button
            onClick={onAccept}
            disabled={!hasScrolled || !hasAgreed}
            className="gradient-primary hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            I Agree & Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
