import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Download,
  Laptop,
  Layers,
  Share,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Wifi,
  X,
} from 'lucide-react';

interface Props {
  onClose: () => void;
  onInstallNative?: () => Promise<void>;
  isInstallable?: boolean;
  isInstalled?: boolean;
  offlineReady?: boolean;
}

type PlatformTab = 'android' | 'ios' | 'desktop';

export function PWAInstallModal({
  onClose,
  onInstallNative,
  isInstallable = false,
  isInstalled = false,
}: Props) {
  // Auto-detect user platform for best default tab
  const [platform, setPlatform] = useState<PlatformTab>(() => {
    if (typeof navigator === 'undefined') return 'desktop';
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) return 'ios';
    if (/android/.test(ua)) return 'android';
    return 'desktop';
  });

  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleNativeClick = async () => {
    if (!onInstallNative) return;
    setInstalling(true);
    try {
      await onInstallNative();
    } finally {
      setInstalling(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal-card pwa-install-modal"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pwa-install-title"
      >
        {/* Modal Header */}
        <div className="pwa-modal-header">
          <div className="pwa-modal-header-left">
            <div className="pwa-brand-badge">
              <Sparkles size={22} className="text-emerald-400" />
            </div>
            <div>
              <h2 id="pwa-install-title">Install AURA-CARE App</h2>
              <p className="pwa-modal-sub">Standalone Progressive Web App • Full-Screen Biohacking</p>
            </div>
          </div>
          <button
            type="button"
            className="icon-button modal-close-btn"
            onClick={onClose}
            aria-label="Close install guide"
          >
            <X size={18} />
          </button>
        </div>

        {/* Offline Ready Status Badge */}
        <div className="pwa-status-box">
          <div className="pwa-status-pill">
            <span className="pwa-live-emerald-dot" />
            <strong>Offline Ready (Cached)</strong>
          </div>
          <p className="pwa-status-desc">
            All your saved bio-profiles, biomechanics timers, regional PG recipes, and ingredient safety guardrails remain 100% accessible with zero internet connection.
          </p>
        </div>

        {/* Direct One-Click Install if Browser Prompt Available */}
        {isInstallable && !isInstalled && onInstallNative && (
          <div className="pwa-native-callout">
            <div className="pwa-native-callout-text">
              <strong>Your browser supports 1-click installation:</strong>
              <small>Click below to prompt native device installation instantly.</small>
            </div>
            <button
              type="button"
              className="button primary-button pwa-native-btn"
              onClick={handleNativeClick}
              disabled={installing}
            >
              <Download size={16} />
              {installing ? 'Prompting…' : 'Install Directly Now'}
            </button>
          </div>
        )}

        {isInstalled && (
          <div className="pwa-installed-success">
            <CheckCircle2 size={18} className="text-emerald-400" />
            <span>AURA-CARE is already installed on this device! Launch from your home screen or app drawer anytime.</span>
          </div>
        )}

        {/* Platform Selector Tabs */}
        <div className="pwa-platform-tabs" role="tablist" aria-label="Select your device platform">
          <button
            type="button"
            role="tab"
            aria-selected={platform === 'android'}
            className={`pwa-tab-btn ${platform === 'android' ? 'active' : ''}`}
            onClick={() => setPlatform('android')}
          >
            <Smartphone size={16} />
            <span>Android (Chrome)</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={platform === 'ios'}
            className={`pwa-tab-btn ${platform === 'ios' ? 'active' : ''}`}
            onClick={() => setPlatform('ios')}
          >
            <Share size={16} />
            <span>iPhone (Safari)</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={platform === 'desktop'}
            className={`pwa-tab-btn ${platform === 'desktop' ? 'active' : ''}`}
            onClick={() => setPlatform('desktop')}
          >
            <Laptop size={16} />
            <span>Desktop (Chrome/Edge)</span>
          </button>
        </div>

        {/* 3-Step Visual Guides */}
        <div className="pwa-guide-steps">
          {platform === 'android' && (
            <div className="pwa-step-list">
              <div className="pwa-step-card">
                <span className="pwa-step-number">1</span>
                <div className="pwa-step-content">
                  <strong>Open Chrome Menu</strong>
                  <p>In Google Chrome, tap the <strong>three dots (⋮)</strong> menu icon at the top-right corner of your screen.</p>
                </div>
              </div>
              <div className="pwa-step-card">
                <span className="pwa-step-number">2</span>
                <div className="pwa-step-content">
                  <strong>Select "Install App"</strong>
                  <p>Scroll down the menu and tap <strong>"Install App"</strong> (or <strong>"Add to Home screen"</strong>).</p>
                </div>
              </div>
              <div className="pwa-step-card">
                <span className="pwa-step-number">3</span>
                <div className="pwa-step-content">
                  <strong>Confirm & Launch</strong>
                  <p>Tap <strong>"Install"</strong> in the prompt. AURA-CARE will appear on your home screen and app launcher with zero browser URL bar!</p>
                </div>
              </div>
            </div>
          )}

          {platform === 'ios' && (
            <div className="pwa-step-list">
              <div className="pwa-step-card">
                <span className="pwa-step-number">1</span>
                <div className="pwa-step-content">
                  <strong>Tap the Safari Share Icon</strong>
                  <p>In Safari, tap the <strong>Share button</strong> (the square icon with an upward arrow 􀈂) on the bottom navigation bar.</p>
                </div>
              </div>
              <div className="pwa-step-card">
                <span className="pwa-step-number">2</span>
                <div className="pwa-step-content">
                  <strong>Choose "Add to Home Screen"</strong>
                  <p>Scroll down the share sheet options and tap <strong>"Add to Home Screen"</strong>.</p>
                </div>
              </div>
              <div className="pwa-step-card">
                <span className="pwa-step-number">3</span>
                <div className="pwa-step-content">
                  <strong>Tap "Add" in Top-Right</strong>
                  <p>Tap <strong>"Add"</strong> in the top-right corner. AURA-CARE launches with standalone native iOS app performance and instant caching!</p>
                </div>
              </div>
            </div>
          )}

          {platform === 'desktop' && (
            <div className="pwa-step-list">
              <div className="pwa-step-card">
                <span className="pwa-step-number">1</span>
                <div className="pwa-step-content">
                  <strong>Find the Address Bar Icon</strong>
                  <p>Look at the right side of your Chrome or Edge URL address bar for the <strong>Install App icon</strong> (monitor with down arrow).</p>
                </div>
              </div>
              <div className="pwa-step-card">
                <span className="pwa-step-number">2</span>
                <div className="pwa-step-content">
                  <strong>Click "Install AURA-CARE"</strong>
                  <p>Click the icon, then select <strong>"Install"</strong> in the popup dialog box.</p>
                </div>
              </div>
              <div className="pwa-step-card">
                <span className="pwa-step-number">3</span>
                <div className="pwa-step-content">
                  <strong>Standalone Window Ready</strong>
                  <p>AURA-CARE will open in its own clean desktop window with keyboard shortcuts, offline caching, and desktop notifications.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Benefits Footnote */}
        <div className="pwa-benefits-strip">
          <div><ShieldCheck size={14} /> <span>100% Local-First Privacy</span></div>
          <div><Wifi size={14} /> <span>Full Offline Persistence</span></div>
          <div><Layers size={14} /> <span>No App Store Downloads Required</span></div>
        </div>

        {/* Bottom Actions */}
        <div className="modal-actions pwa-modal-foot">
          <button type="button" className="button text-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
