import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Zap } from 'lucide-react';
import { useIsMobile } from '../../hooks/useMobile';

const InstallPrompt = () => {
  const isMobile = useIsMobile();
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    // Check if already dismissed
    const dismissed = localStorage.getItem('pwa-prompt-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        return; // Don't show again for 7 days
      }
    }

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(iOS);

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Wait 30 seconds before showing prompt
      setTimeout(() => {
        setShowPrompt(true);
      }, 30000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // For iOS, show manual instructions after 30 seconds
    if (iOS) {
      setTimeout(() => {
        setShowPrompt(true);
      }, 30000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('PWA installed');
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
    setShowPrompt(false);
  };

  if (!showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-safe animate-slide-up">
      <div className="max-w-md mx-auto bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6">
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors tap-target"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-bold text-lg mb-1">
                Install ShareSync
              </h3>
              <p className="text-purple-100 text-sm leading-relaxed">
                Get the full app experience! Install ShareSync on your {isMobile ? 'phone' : 'device'} for faster access and offline support.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-4 text-sm">
            <div className="flex items-center gap-2 text-purple-100">
              <Zap className="w-4 h-4" />
              <span>Works offline</span>
            </div>
            <div className="flex items-center gap-2 text-purple-100">
              <Download className="w-4 h-4" />
              <span>No app store</span>
            </div>
          </div>

          {isIOS ? (
            // iOS Manual Instructions
            <div className="bg-white/10 rounded-xl p-4 mb-4">
              <p className="text-white font-semibold text-sm mb-2">
                To install on iOS:
              </p>
              <ol className="text-purple-100 text-sm space-y-2 list-decimal list-inside">
                <li>Tap the Share button <span className="inline-block">��</span></li>
                <li>Scroll down and tap "Add to Home Screen"</li>
                <li>Tap "Add" in the top right</li>
              </ol>
            </div>
          ) : (
            // Android/Desktop Install Button
            <button
              onClick={handleInstall}
              className="w-full py-4 bg-white hover:bg-purple-50 text-purple-600 rounded-xl font-bold transition-all active:scale-95 tap-target"
            >
              Install Now
            </button>
          )}

          <button
            onClick={handleDismiss}
            className="w-full mt-3 py-2 text-white/80 hover:text-white text-sm transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default InstallPrompt;
ENDFILEcat > src/components/pwa/InstallPrompt.jsx << 'ENDFILE'
import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Zap } from 'lucide-react';
import { useIsMobile } from '../../hooks/useMobile';

const InstallPrompt = () => {
  const isMobile = useIsMobile();
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    // Check if already dismissed
    const dismissed = localStorage.getItem('pwa-prompt-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        return; // Don't show again for 7 days
      }
    }

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(iOS);

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Wait 30 seconds before showing prompt
      setTimeout(() => {
        setShowPrompt(true);
      }, 30000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // For iOS, show manual instructions after 30 seconds
    if (iOS) {
      setTimeout(() => {
        setShowPrompt(true);
      }, 30000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('PWA installed');
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
    setShowPrompt(false);
  };

  if (!showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-safe animate-slide-up">
      <div className="max-w-md mx-auto bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6">
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors tap-target"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-bold text-lg mb-1">
                Install ShareSync
              </h3>
              <p className="text-purple-100 text-sm leading-relaxed">
                Get the full app experience! Install ShareSync on your {isMobile ? 'phone' : 'device'} for faster access and offline support.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-4 text-sm">
            <div className="flex items-center gap-2 text-purple-100">
              <Zap className="w-4 h-4" />
              <span>Works offline</span>
            </div>
            <div className="flex items-center gap-2 text-purple-100">
              <Download className="w-4 h-4" />
              <span>No app store</span>
            </div>
          </div>

          {isIOS ? (
            // iOS Manual Instructions
            <div className="bg-white/10 rounded-xl p-4 mb-4">
              <p className="text-white font-semibold text-sm mb-2">
                To install on iOS:
              </p>
              <ol className="text-purple-100 text-sm space-y-2 list-decimal list-inside">
                <li>Tap the Share button <span className="inline-block">��</span></li>
                <li>Scroll down and tap "Add to Home Screen"</li>
                <li>Tap "Add" in the top right</li>
              </ol>
            </div>
          ) : (
            // Android/Desktop Install Button
            <button
              onClick={handleInstall}
              className="w-full py-4 bg-white hover:bg-purple-50 text-purple-600 rounded-xl font-bold transition-all active:scale-95 tap-target"
            >
              Install Now
            </button>
          )}

          <button
            onClick={handleDismiss}
            className="w-full mt-3 py-2 text-white/80 hover:text-white text-sm transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default InstallPrompt;
