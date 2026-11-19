import { Bell, BellOff, CheckCircle2, Clock, Droplets, HeartPulse, Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import { useWorkspace } from '../store';
import { getNotificationPermission, isNotificationSupported, requestNotificationPermission, sendTestNotification } from '../services/notificationService';

export function NotificationModal({ onClose }: { onClose: () => void }) {
  const { notificationConfig, updateNotificationConfig } = useWorkspace();
  const [permission, setPermission] = useState(getNotificationPermission);
  const [testSent, setTestSent] = useState(false);
  const supported = isNotificationSupported();

  const handleToggleMaster = async () => {
    if (!notificationConfig.enabled) {
      const granted = await requestNotificationPermission();
      setPermission(getNotificationPermission());
      if (granted) {
        updateNotificationConfig({ enabled: true });
      }
    } else {
      updateNotificationConfig({ enabled: false });
    }
  };

  const handleSendTest = async () => {
    const success = await sendTestNotification();
    if (success) {
      setTestSent(true);
      setTimeout(() => setTestSent(false), 4000);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="notification-modal-title">
      <div className="modal notification-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="brand-icon" style={{ width: 34, height: 34 }}>
              <Bell size={18} />
            </span>
            <div>
              <h2 id="notification-modal-title" style={{ margin: 0, fontSize: 18 }}>Wellness &amp; Health Reminders</h2>
              <small style={{ color: 'var(--muted)', fontSize: 12 }}>Local Browser &amp; PWA Notifications</small>
            </div>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'grid', gap: 16, marginTop: 14 }}>
          {/* Permission Status Card */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 12,
              background: 'var(--surface-tint)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div>
              <strong>Browser Notification Status:</strong>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, fontSize: 12 }}>
                <span
                  style={{
                    display: 'inline-block',
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: permission === 'granted' ? '#10b981' : permission === 'denied' ? '#ef4444' : '#f59e0b',
                  }}
                />
                <span style={{ textTransform: 'capitalize' }}>{permission}</span>
                {!supported && ' (Not supported by browser)'}
              </div>
            </div>

            <button
              type="button"
              className={`button ${notificationConfig.enabled ? 'primary-button' : 'secondary-button'}`}
              onClick={handleToggleMaster}
              disabled={!supported}
              style={{ minHeight: 38, fontSize: 12 }}
            >
              {notificationConfig.enabled ? (
                <>
                  <Bell size={14} /> Reminders Active
                </>
              ) : (
                <>
                  <BellOff size={14} /> Enable Alerts
                </>
              )}
            </button>
          </div>

          {/* Test Notification Trigger */}
          {permission === 'granted' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>Verify desktop/mobile alert system:</span>
              <button
                type="button"
                className="button text-button"
                onClick={handleSendTest}
                style={{ fontSize: 12, color: 'var(--green-dark)', display: 'inline-flex', alignItems: 'center', gap: 5 }}
              >
                {testSent ? <CheckCircle2 size={14} color="#10b981" /> : <Sparkles size={14} />}
                {testSent ? 'Notification Triggered!' : 'Send Test Notification'}
              </button>
            </div>
          )}

          {/* Channels Configuration */}
          <div style={{ display: 'grid', gap: 12 }}>
            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Notification Channels</h4>

            {/* 1. Hydration */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Droplets size={18} color="#0284c7" />
                <div>
                  <strong style={{ fontSize: 13 }}>Daily Hydration Pulse</strong>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>Periodic reminders to drink 250ml water</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <select
                  value={notificationConfig.hydrationIntervalMinutes}
                  onChange={(e) => updateNotificationConfig({ hydrationIntervalMinutes: Number(e.target.value) })}
                  className="select-field"
                  style={{ fontSize: 12, padding: '4px 8px', borderRadius: 6, minHeight: 32 }}
                  disabled={!notificationConfig.enabled}
                >
                  <option value={60}>Every 60 min</option>
                  <option value={90}>Every 90 min</option>
                  <option value={120}>Every 120 min</option>
                </select>
                <input
                  type="checkbox"
                  checked={notificationConfig.hydration && notificationConfig.enabled}
                  onChange={(e) => updateNotificationConfig({ hydration: e.target.checked })}
                  disabled={!notificationConfig.enabled}
                />
              </div>
            </div>

            {/* 2. AM Skincare */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Sparkles size={18} color="#f59e0b" />
                <div>
                  <strong style={{ fontSize: 13 }}>AM Skincare &amp; SPF Alert</strong>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>Morning barrier routine &amp; UV protection</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="time"
                  value={notificationConfig.amSkincareTime}
                  onChange={(e) => updateNotificationConfig({ amSkincareTime: e.target.value })}
                  style={{ fontSize: 12, padding: '4px 6px', borderRadius: 6, border: '1px solid var(--border)' }}
                  disabled={!notificationConfig.enabled}
                />
                <input
                  type="checkbox"
                  checked={notificationConfig.amSkincare && notificationConfig.enabled}
                  onChange={(e) => updateNotificationConfig({ amSkincare: e.target.checked })}
                  disabled={!notificationConfig.enabled}
                />
              </div>
            </div>

            {/* 3. PM Skincare */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Clock size={18} color="#8b5cf6" />
                <div>
                  <strong style={{ fontSize: 13 }}>PM Skincare &amp; Active Recovery</strong>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>Double cleansing &amp; overnight barrier repair</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="time"
                  value={notificationConfig.pmSkincareTime}
                  onChange={(e) => updateNotificationConfig({ pmSkincareTime: e.target.value })}
                  style={{ fontSize: 12, padding: '4px 6px', borderRadius: 6, border: '1px solid var(--border)' }}
                  disabled={!notificationConfig.enabled}
                />
                <input
                  type="checkbox"
                  checked={notificationConfig.pmSkincare && notificationConfig.enabled}
                  onChange={(e) => updateNotificationConfig({ pmSkincare: e.target.checked })}
                  disabled={!notificationConfig.enabled}
                />
              </div>
            </div>

            {/* 4. Elder / Family Care */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <HeartPulse size={18} color="#ec4899" />
                <div>
                  <strong style={{ fontSize: 13 }}>Family &amp; Elder Care Reminders</strong>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>Prescription medicines, BP checks &amp; gentle walks</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="time"
                  value={notificationConfig.elderCareTime}
                  onChange={(e) => updateNotificationConfig({ elderCareTime: e.target.value })}
                  style={{ fontSize: 12, padding: '4px 6px', borderRadius: 6, border: '1px solid var(--border)' }}
                  disabled={!notificationConfig.enabled}
                />
                <input
                  type="checkbox"
                  checked={notificationConfig.elderCare && notificationConfig.enabled}
                  onChange={(e) => updateNotificationConfig({ elderCare: e.target.checked })}
                  disabled={!notificationConfig.enabled}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
            <button type="button" className="button primary-button" onClick={onClose} style={{ minHeight: 38 }}>
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
