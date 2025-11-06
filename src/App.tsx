import { useState } from 'react';
import { Toaster } from 'sonner';
import { ThemeProvider } from './components/ThemeProvider';
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import TrustBadges from './components/TrustBadges';
import PrivacySection from './components/PrivacySection';
import DisclaimerModal from './components/DisclaimerModal';
import UploadScreen from './components/UploadScreen';
import ResultsScreen from './components/ResultsScreen';
import Dashboard from './components/Dashboard';
import Footer from './components/Footer';

type Screen = 'home' | 'upload' | 'results' | 'dashboard';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [showDisclaimer, setShowDisclaimer] = useState(false);


  const handleTryDemo = () => {
    // TODO: Integrate with Auth0 for authentication
    // This will handle user login for storing data and creating shareable links
  };

  const handleGetStarted = () => {
    const hasAcceptedDisclaimer = localStorage.getItem('vaultfit_disclaimer_accepted') === 'true';
    if (hasAcceptedDisclaimer) {
      // User has already accepted, go directly to upload
      setCurrentScreen('upload');
    } else {
      // Show disclaimer for first-time users
      setShowDisclaimer(true);
    }
  };

  const handleDisclaimerAccept = () => {
    // Save acceptance to localStorage
    localStorage.setItem('vaultfit_disclaimer_accepted', 'true');
    setShowDisclaimer(false);
    setCurrentScreen('upload');
  };

  const handleDisclaimerDecline = () => {
    setShowDisclaimer(false);
  };

  const handleUploadComplete = () => {
    setCurrentScreen('results');
  };

  const handleSignupClick = () => {
    alert('Sign up / Login modal would appear here! This would connect to Auth0 for authentication.');
  };

  const handleUploadNew = () => {
    setCurrentScreen('upload');
  };

  const handleLearnMore = () => {
    alert('Learn more modal would appear here with detailed information about how VaultFit works!');
  };

  const handleLogoClick = () => {
    setCurrentScreen('home');
  };

  return (
    <ThemeProvider defaultTheme="dark">
      <div className="min-h-screen bg-background transition-colors duration-300">
        {/* Header - visible on all screens */}
        <Header 
          onTryDemo={handleTryDemo} 
          onLogoClick={handleLogoClick}
          hideNavigation={currentScreen === 'upload' || currentScreen === 'results'}
        />

        {/* Home Screen */}
        {currentScreen === 'home' && (
          <>
            <HeroSection onTryNow={handleGetStarted} onLearnMore={handleLearnMore} />
            <TrustBadges />
            <PrivacySection />
            <Footer />
          </>
        )}

        {/* Upload Screen */}
        {currentScreen === 'upload' && (
          <UploadScreen onUploadComplete={handleUploadComplete} />
        )}

        {/* Results Screen - Client-side only visualization */}
        {currentScreen === 'results' && (
          <ResultsScreen onSignupClick={handleSignupClick} onUploadNew={handleUploadNew} />
        )}

        {/* Dashboard Screen - For logged-in users (future) */}
        {currentScreen === 'dashboard' && <Dashboard />}

        {/* Disclaimer Modal */}
        <DisclaimerModal
          isOpen={showDisclaimer}
          onAccept={handleDisclaimerAccept}
          onDecline={handleDisclaimerDecline}
        />
        
        {/* Toast Notifications */}
        <Toaster position="top-right" />
      </div>
    </ThemeProvider>
  );
}

