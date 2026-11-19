import { Download, Smartphone, WifiOff, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(() => typeof window !== 'undefined' && (window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true));
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [offlineReady, setOfflineReady] = useState(() => typeof navigator !== 'undefined' && !!navigator.serviceWorker?.controller);

  useEffect(() => {
    // 1. Install Prompt Listener
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    // 2. Online / Offline Listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleWorker = () => setOfflineReady(Boolean(navigator.serviceWorker?.controller));

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    navigator.serviceWorker?.addEventListener('controllerchange', handleWorker);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      navigator.serviceWorker?.removeEventListener('controllerchange', handleWorker);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setIsInstalled(true);
    } catch { /* the browser's install menu remains available */ }
    finally { setDeferredPrompt(null); setIsInstallable(false); }
  };

  return { isInstallable, isInstalled, isOnline, offlineReady, installApp };
}

export function PWAInstallBanner({ state, onOpenGuide }: { state: ReturnType<typeof usePWA>; onOpenGuide?: () => void }) {
  const { isInstalled, isOnline, offlineReady } = state;
  const [dismissed, setDismissed] = useState(false);

  // If offline, show offline badge
  if (!isOnline) {
    return (
      <div className="pwa-offline-banner" role="status" aria-live="polite">
        <WifiOff size={15} />
        <span>
          <strong>You’re offline.</strong> {offlineReady ? 'Your local workspace and saved routines are available.' : 'This session still has access to your saved data.'}
        </span>
      </div>
    );
  }

  // If dismissed, return null
  if (dismissed || isInstalled) return null;


  return (
    <div className="pwa-install-banner" role="complementary" aria-label="Install Progressive Web App">
      <div className="pwa-install-left">
        <span className="pwa-install-icon">
          <Smartphone size={20} />
        </span>
        <div>
          <strong>Install AURA-CARE App</strong>
          <p>Open your saved routines and care logs from your home screen.</p>
        </div>
      </div>
      <div className="pwa-install-actions">
        <button type="button" className="button primary-button pwa-install-btn" onClick={onOpenGuide}>
          <Download size={14} /> Install Now
        </button>
        <button
          type="button"
          className="icon-button pwa-dismiss-btn"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss install banner"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
