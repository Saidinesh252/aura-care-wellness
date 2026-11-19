import { useEffect, useState, useRef, type ChangeEvent } from 'react';
import {
  AlertTriangle,
  Bell,
  Building2,
  Check,
  ChevronRight,
  Cloud,
  CloudOff,
  Compass,
  Database,
  Download,
  FileUp,
  Fingerprint,
  House,
  Lock,
  LogOut,
  Ruler,
  Shield,
  Smartphone,
  Trash2,
  User,
} from 'lucide-react';
import {
  useWorkspace,
  type WorkspaceData,
  type WeatherSeason,
} from '../store';
import {
  getNotificationPermission,
  requestNotificationPermission,
} from '../services/notificationService';
import { PRESET_CITIES } from '../services/weatherService';
import { supabaseAuth } from '../storage/supabaseClient';
import { maximumBackupBytes, validateBackup } from '../vault';
import { Modal } from './Shared';
import './settingsView.css';

interface Props {
  onOpenAuthGate?: () => void;
  onOpenVault?: () => void;
  onOpenPWAInstall?: () => void;
  onOpenWeather?: () => void;
}

export function SettingsView({ onOpenAuthGate, onOpenVault, onOpenPWAInstall, onOpenWeather }: Props) {
  const {
    theme,
    setTheme,
    currency,
    toggleCurrency,
    environment,
    setEnvironment,
    selectedCity,
    setSelectedCity,
    weatherMode,
    setWeatherMode,
    weatherSeason,
    setWeatherSeason,
    defaultCuisine,
    setDefaultCuisine,
    measurementUnits,
    setMeasurementUnits,
    displayName,
    setDisplayName,
    userEmail,
    setUserEmail,
    authMode,
    authUser,
    signOut,
    notificationConfig,
    updateNotificationConfig,
    soundEffectsEnabled,
    setSoundEffectsEnabled,
    voiceReadAloudEnabled,
    setVoiceReadAloudEnabled,
    resetAllData,
  } = useWorkspace();

  const [assistantConfigured, setAssistantConfigured] = useState<boolean | null>(null);
  const [restorable, setRestorable] = useState<WorkspaceData | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [notificationPerm, setNotificationPerm] = useState(() => getNotificationPermission());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const toastTimeout = useRef<number | undefined>(undefined);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/assistant', { cache: 'no-store', signal: controller.signal })
      .then(response => response.ok ? response.json() : null)
      .then(value => setAssistantConfigured(value?.configured === true))
      .catch(() => { if (!controller.signal.aborted) setAssistantConfigured(false); });
    return () => { controller.abort(); window.clearTimeout(toastTimeout.current); };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    window.clearTimeout(toastTimeout.current);
    toastTimeout.current = window.setTimeout(() => setToastMessage(null), 4800);
  };

  // Request notification permission
  const handleRequestPerm = async () => {
    const granted = await requestNotificationPermission();
    setNotificationPerm(getNotificationPermission());
    if (granted) {
      updateNotificationConfig({ enabled: true });
      showToast('Push & Wellness Reminders enabled!');
    } else {
      showToast('Notification permission was denied in browser settings.');
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      if (file.size > maximumBackupBytes) throw new Error('Select a backup under 5 MB.');
      const parsed = JSON.parse(await file.text());
      const data = parsed?.data ?? parsed;
      if (!data || !Object.hasOwn(data, 'days')) throw new Error('Choose a legacy AURA-CARE file. Encrypted backups open in the health vault.');
      setRestorable(validateBackup(data));
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to read the backup file.');
    }
  };

  // Reset all app data confirmation
  const handleConfirmReset = () => {
    supabaseAuth.signOut();
    resetAllData();
    setResetConfirmOpen(false);
    showToast('All app data has been reset to defaults.');
  };


  return (
    <div className="settings-container">
      {/* Page Title & Intro */}
      <header className="settings-header">
        <div>
          <h1>Settings & Preferences</h1>
          <p>Fine-tune your biohacking workspace, regional environments, notification alerts, and data privacy.</p>
        </div>
        <div className="settings-header-badge">
          <Shield size={16} className="text-emerald-400" />
          <span>Local storage · Encrypted backup</span>
        </div>
      </header>

      {/* Toast Notice */}
      {toastMessage && (
        <div className="settings-toast" role="status">
          <Check size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Grid of 4 Interactive Settings Cards */}
      <div className="settings-grid">
        {/* ========================================================= */}
        {/* CARD 1: Account & Personal Preferences */}
        {/* ========================================================= */}
        <section className="settings-card" aria-labelledby="heading-account">
          <div className="settings-card-head">
            <span className="settings-card-icon icon-emerald">
              <User size={20} />
            </span>
            <div>
              <h2 id="heading-account">Account & Personal Preferences</h2>
              <small>Profile identity, currency, units, and color themes</small>
            </div>
          </div>

          <div className="settings-card-body">
            {/* Account Status / Cloud Sync Badge */}
            <div className="settings-account-badge">
              <div className="settings-account-info">
                {authMode === 'authenticated' && authUser ? (
                  <>
                    <div className="settings-user-avatar">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <strong>{displayName}</strong>
                      <span className="settings-user-email">{authUser.email}</span>
                      <span className="settings-sync-status cloud-synced">
                        <Cloud size={12} /> Cloud Sync Active
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="settings-user-avatar guest-avatar">
                      <Fingerprint size={20} />
                    </div>
                    <div>
                      <strong>Local-First Guest Mode</strong>
                      <span className="settings-user-email">Offline device storage only</span>
                      <span className="settings-sync-status local-only">
                        <CloudOff size={12} /> Local-Only (Private)
                      </span>
                    </div>
                  </>
                )}
              </div>

              {authMode === 'authenticated' ? (
                <button
                  type="button"
                  className="button text-button sign-out-btn"
                  onClick={() => { supabaseAuth.signOut(); signOut(); }}
                  title="Sign out of cloud sync"
                >
                  <LogOut size={14} /> Sign Out
                </button>
              ) : (
                <button
                  type="button"
                  className="button secondary-button sign-in-btn"
                  onClick={onOpenAuthGate}
                >
                  Sign In to Sync <ChevronRight size={14} />
                </button>
              )}
            </div>

            {/* Display Name Field */}
            <div className="settings-field">
              <label htmlFor="setting-display-name">Display Name</label>
              <input
                id="setting-display-name"
                type="text"
                className="settings-input"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="e.g. Alex Biohacker"
              />
            </div>

            {/* Email Field (Optional) */}
            <div className="settings-field">
              <label htmlFor="setting-email">
                Email Address <span className="settings-optional">(optional)</span>
              </label>
              <input
                id="setting-email"
                type="email"
                className="settings-input"
                value={userEmail}
                onChange={e => setUserEmail(e.target.value)}
                placeholder="alex@example.com"
              />
            </div>

            {/* Preferred Currency Selector */}
            <div className="settings-field">
              <label>Preferred Currency</label>
              <div className="settings-segmented" role="radiogroup" aria-label="Preferred Currency">
                <button
                  type="button"
                  className={`settings-segment-btn ${currency === 'INR' ? 'active' : ''}`}
                  onClick={() => {
                    if (currency !== 'INR') toggleCurrency();
                  }}
                  aria-pressed={currency === 'INR'}
                >
                  <strong>₹ INR</strong>
                  <small>Indian Rupee</small>
                </button>
                <button
                  type="button"
                  className={`settings-segment-btn ${currency === 'USD' ? 'active' : ''}`}
                  onClick={() => {
                    if (currency !== 'USD') toggleCurrency();
                  }}
                  aria-pressed={currency === 'USD'}
                >
                  <strong>$ USD</strong>
                  <small>US Dollar</small>
                </button>
              </div>
            </div>

            {/* Measurement Units */}
            <div className="settings-field">
              <label>Measurement Units</label>
              <div className="settings-segmented" role="radiogroup" aria-label="Measurement Units">
                <button
                  type="button"
                  className={`settings-segment-btn ${measurementUnits === 'metric' ? 'active' : ''}`}
                  onClick={() => setMeasurementUnits('metric')}
                  aria-pressed={measurementUnits === 'metric'}
                >
                  <Ruler size={14} />
                  <span><strong>Metric</strong> (kg, cm, ml)</span>
                </button>
                <button
                  type="button"
                  className={`settings-segment-btn ${measurementUnits === 'imperial' ? 'active' : ''}`}
                  onClick={() => setMeasurementUnits('imperial')}
                  aria-pressed={measurementUnits === 'imperial'}
                >
                  <Ruler size={14} />
                  <span><strong>Imperial</strong> (lbs, ft, oz)</span>
                </button>
              </div>
            </div>

            {/* Theme Selector (3 Options: Obsidian Dark, Alabaster Light, High-Contrast Elder Mode) */}
            <div className="settings-field">
              <label>Theme & Visual Contrast</label>
              <div className="settings-theme-cards" role="radiogroup" aria-label="App Theme">
                <button
                  type="button"
                  className={`settings-theme-card theme-obsidian ${theme === 'dark' ? 'active' : ''}`}
                  onClick={() => setTheme('dark')}
                  aria-pressed={theme === 'dark'}
                >
                  <span className="theme-preview-dot dark-dot" />
                  <strong>Obsidian Dark</strong>
                  <small>#0B0F17 Biohacking</small>
                </button>

                <button
                  type="button"
                  className={`settings-theme-card theme-alabaster ${theme === 'light' ? 'active' : ''}`}
                  onClick={() => setTheme('light')}
                  aria-pressed={theme === 'light'}
                >
                  <span className="theme-preview-dot light-dot" />
                  <strong>Alabaster Light</strong>
                  <small>#FAFAFA Clean Paper</small>
                </button>

                <button
                  type="button"
                  className={`settings-theme-card theme-elder ${theme === 'elder' ? 'active' : ''}`}
                  onClick={() => setTheme('elder')}
                  aria-pressed={theme === 'elder'}
                >
                  <span className="theme-preview-dot elder-dot" />
                  <strong>High-Contrast Elder Mode</strong>
                  <small>Enlarged Text & Clear Borders</small>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* CARD 2: Location, Weather & Regional Defaults */}
        {/* ========================================================= */}
        <section className="settings-card" aria-labelledby="heading-location">
          <div className="settings-card-head">
            <span className="settings-card-icon icon-cyan">
              <Compass size={20} />
            </span>
            <div>
              <h2 id="heading-location">Location, Weather & Regional Defaults</h2>
              <small>PG vs Home setup, city GPS climate, and regional cuisine</small>
            </div>
          </div>

          <div className="settings-card-body">
            {/* Living Setup: PG / Hostel vs At Home */}
            <div className="settings-field">
              <label>Default Living Setup</label>
              <div className="settings-segmented" role="radiogroup" aria-label="Living Setup">
                <button
                  type="button"
                  className={`settings-segment-btn ${environment === 'pg' ? 'active' : ''}`}
                  onClick={() => setEnvironment('pg')}
                  aria-pressed={environment === 'pg'}
                >
                  <Building2 size={16} />
                  <div>
                    <strong>PG / Hostel</strong>
                    <small>Kettle cooking, quiet movement</small>
                  </div>
                </button>
                <button
                  type="button"
                  className={`settings-segment-btn ${environment === 'home' ? 'active' : ''}`}
                  onClick={() => setEnvironment('home')}
                  aria-pressed={environment === 'home'}
                >
                  <House size={16} />
                  <div>
                    <strong>At Home</strong>
                    <small>Full kitchen, open movement</small>
                  </div>
                </button>
              </div>
            </div>

            {/* Home City Selection */}
            <div className="settings-field">
              <label htmlFor="setting-home-city">Home City</label>
              <select
                id="setting-home-city"
                className="settings-select"
                value={selectedCity}
                onChange={e => setSelectedCity(e.target.value)}
              >
                {PRESET_CITIES.map(city => (
                  <option key={city.id} value={city.name}>
                    {city.name}
                  </option>
                ))}
                {selectedCity === 'My Location' && <option>My Location</option>}
              </select>
              <button type="button" className="button text-button" onClick={onOpenWeather}><Compass size={15} /> Open weather controls and GPS</button>
            </div>

            {/* Weather Mode: Auto GPS vs Manual Season */}
            <div className="settings-field">
              <label>Weather Detection & Climate Shield</label>
              <div className="settings-toggle-row">
                <div>
                  <strong>Use weather for your selected city</strong>
                  <p className="settings-subtext">Fetch live temperature, UV index, and air quality via Open-Meteo</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-label="Use weather for your selected city"
                  aria-checked={weatherMode === 'auto'}
                  className={`settings-switch ${weatherMode === 'auto' ? 'on' : 'off'}`}
                  onClick={() => setWeatherMode(weatherMode === 'auto' ? 'manual' : 'auto')}
                >
                  <span className="settings-switch-thumb" />
                </button>
              </div>

              {/* Manual Season Override Pills if Manual Mode */}
              {weatherMode === 'manual' && (
                <div className="settings-sub-panel">
                  <span className="settings-sub-label">Manual Season Override:</span>
                  <div className="settings-season-pills">
                    {(['summer', 'monsoon', 'winter', 'pollution'] as WeatherSeason[]).map(season => (
                      <button
                        type="button"
                        key={season}
                        className={`settings-season-pill ${weatherSeason === season ? 'active' : ''}`}
                        onClick={() => setWeatherSeason(season)}
                      >
                        {season === 'summer' && '☀️ Summer (UV Shield)'}
                        {season === 'monsoon' && '🌧️ Monsoon (Humidity)'}
                        {season === 'winter' && '❄️ Winter (Barrier Occlusives)'}
                        {season === 'pollution' && '🌫️ Pollution (AQI Defense)'}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Default Cuisine */}
            <div className="settings-field">
              <label>Default Cuisine</label>
              <div className="settings-segmented" role="radiogroup" aria-label="Default Cuisine">
                <button
                  type="button"
                  className={`settings-segment-btn ${defaultCuisine === 'south-indian' ? 'active' : ''}`}
                  onClick={() => setDefaultCuisine('south-indian')}
                  aria-pressed={defaultCuisine === 'south-indian'}
                >
                  <strong>South Indian</strong>
                  <small>Idli, Dosa, Sambhar, Rasam</small>
                </button>
                <button
                  type="button"
                  className={`settings-segment-btn ${defaultCuisine === 'north-indian' ? 'active' : ''}`}
                  onClick={() => setDefaultCuisine('north-indian')}
                  aria-pressed={defaultCuisine === 'north-indian'}
                >
                  <strong>North Indian</strong>
                  <small>Roti, Dal, Paneer, Chana</small>
                </button>
                <button
                  type="button"
                  className={`settings-segment-btn ${defaultCuisine === 'pan-indian' ? 'active' : ''}`}
                  onClick={() => setDefaultCuisine('pan-indian')}
                  aria-pressed={defaultCuisine === 'pan-indian'}
                >
                  <strong>Pan-Indian</strong>
                  <small>Balanced Regional Staples</small>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* CARD 3: Daily Reminder Notifications & Audio */}
        {/* ========================================================= */}
        <section className="settings-card" aria-labelledby="heading-notifications">
          <div className="settings-card-head">
            <span className="settings-card-icon icon-amber">
              <Bell size={20} />
            </span>
            <div>
              <h2 id="heading-notifications">Daily Reminder Notifications & Audio</h2>
              <small>Hydration pulses, skincare alerts, and AURA-BOT sound</small>
            </div>
          </div>

          <div className="settings-card-body">
            {/* Browser Permission Alert if not granted */}
            {notificationPerm !== 'granted' && (
              <div className="settings-perm-banner">
                <div>
                  <strong>Browser Notifications Disabled</strong>
                  <p>Enable permissions to receive hydration timers, morning SPF alerts, and workout reminders.</p>
                </div>
                <button type="button" className="button primary-button btn-small" onClick={handleRequestPerm}>
                  Enable Reminders
                </button>
              </div>
            )}

            {/* Master Reminder Toggle */}
            <div className="settings-toggle-row">
              <div>
                <strong>Master Reminders Switch</strong>
                <p className="settings-subtext">Enable or pause all automated background alerts</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={notificationConfig.enabled}
                className={`settings-switch ${notificationConfig.enabled ? 'on' : 'off'}`}
                onClick={() => updateNotificationConfig({ enabled: !notificationConfig.enabled })}
              >
                <span className="settings-switch-thumb" />
              </button>
            </div>

            {/* Hydration Reminders */}
            <div className="settings-reminder-item">
              <div className="settings-toggle-row">
                <div>
                  <strong>💧 Hydration Reminders</strong>
                  <p className="settings-subtext">Periodic prompt to drink +250ml water</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={notificationConfig.hydration}
                  className={`settings-switch ${notificationConfig.hydration ? 'on' : 'off'}`}
                  onClick={() => updateNotificationConfig({ hydration: !notificationConfig.hydration })}
                >
                  <span className="settings-switch-thumb" />
                </button>
              </div>
              {notificationConfig.hydration && (
                <div className="settings-time-row">
                  <label htmlFor="hydration-interval">Interval:</label>
                  <select
                    id="hydration-interval"
                    className="settings-select-small"
                    value={notificationConfig.hydrationIntervalMinutes || 120}
                    onChange={e =>
                      updateNotificationConfig({ hydrationIntervalMinutes: parseInt(e.target.value, 10) })
                    }
                  >
                    <option value={60}>Every 1 hour (60 min)</option>
                    <option value={90}>Every 1.5 hours (90 min)</option>
                    <option value={120}>Every 2 hours (120 min)</option>
                    <option value={180}>Every 3 hours (180 min)</option>
                  </select>
                </div>
              )}
            </div>

            {/* AM Skincare Alert */}
            <div className="settings-reminder-item">
              <div className="settings-toggle-row">
                <div>
                  <strong>☀️ Morning Skincare & SPF Alert</strong>
                  <p className="settings-subtext">Daytime antioxidant and broad-spectrum sunscreen reminder</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={notificationConfig.amSkincare}
                  className={`settings-switch ${notificationConfig.amSkincare ? 'on' : 'off'}`}
                  onClick={() => updateNotificationConfig({ amSkincare: !notificationConfig.amSkincare })}
                >
                  <span className="settings-switch-thumb" />
                </button>
              </div>
              {notificationConfig.amSkincare && (
                <div className="settings-time-row">
                  <label htmlFor="am-time">Time:</label>
                  <input
                    id="am-time"
                    type="time"
                    className="settings-time-input"
                    value={notificationConfig.amSkincareTime || '08:00'}
                    onChange={e => updateNotificationConfig({ amSkincareTime: e.target.value })}
                  />
                </div>
              )}
            </div>

            {/* PM Skincare Alert */}
            <div className="settings-reminder-item">
              <div className="settings-toggle-row">
                <div>
                  <strong>🌙 Night Active & Barrier Alert</strong>
                  <p className="settings-subtext">Double-cleanse and retinoid/ceramide routine reminder</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={notificationConfig.pmSkincare}
                  className={`settings-switch ${notificationConfig.pmSkincare ? 'on' : 'off'}`}
                  onClick={() => updateNotificationConfig({ pmSkincare: !notificationConfig.pmSkincare })}
                >
                  <span className="settings-switch-thumb" />
                </button>
              </div>
              {notificationConfig.pmSkincare && (
                <div className="settings-time-row">
                  <label htmlFor="pm-time">Time:</label>
                  <input
                    id="pm-time"
                    type="time"
                    className="settings-time-input"
                    value={notificationConfig.pmSkincareTime || '21:30'}
                    onChange={e => updateNotificationConfig({ pmSkincareTime: e.target.value })}
                  />
                </div>
              )}
            </div>

            {/* Workout / Walk Reminder */}
            <div className="settings-reminder-item">
              <div className="settings-toggle-row">
                <div>
                  <strong>🏃 Workout / Walk Reminder</strong>
                  <p className="settings-subtext">Daily movement or mobility exercise nudge</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={notificationConfig.workout}
                  className={`settings-switch ${notificationConfig.workout ? 'on' : 'off'}`}
                  onClick={() => updateNotificationConfig({ workout: !notificationConfig.workout })}
                >
                  <span className="settings-switch-thumb" />
                </button>
              </div>
              {notificationConfig.workout && (
                <div className="settings-time-row">
                  <label htmlFor="workout-time">Time:</label>
                  <input
                    id="workout-time"
                    type="time"
                    className="settings-time-input"
                    value={notificationConfig.workoutTime || '18:00'}
                    onChange={e => updateNotificationConfig({ workoutTime: e.target.value })}
                  />
                </div>
              )}
            </div>

            {/* Audio Effects & Voice Read-Aloud */}
            <div className="settings-reminder-item">
              <div className="settings-toggle-row">
                <div>
                  <strong>AURA-BOT Sound Effects & Ambient Synth</strong>
                  <p className="settings-subtext">Procedural Web Audio blips and celebratory tones</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={soundEffectsEnabled}
                  className={`settings-switch ${soundEffectsEnabled ? 'on' : 'off'}`}
                  onClick={() => setSoundEffectsEnabled(!soundEffectsEnabled)}
                >
                  <span className="settings-switch-thumb" />
                </button>
              </div>
            </div>

            <div className="settings-reminder-item">
              <div className="settings-toggle-row">
                <div>
                  <strong>Voice Read-Aloud (Speech Synthesis)</strong>
                  <p className="settings-subtext">Read AI coach replies aloud using browser speech</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={voiceReadAloudEnabled}
                  className={`settings-switch ${voiceReadAloudEnabled ? 'on' : 'off'}`}
                  onClick={() => setVoiceReadAloudEnabled(!voiceReadAloudEnabled)}
                >
                  <span className="settings-switch-thumb" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* CARD 4: AI Coach API & Data Privacy Vault */}
        {/* ========================================================= */}
        <section className="settings-card" aria-labelledby="heading-privacy">
          <div className="settings-card-head">
            <span className="settings-card-icon icon-purple">
              <Database size={20} />
            </span>
            <div>
              <h2 id="heading-privacy">AI Coach API & Data Privacy Vault</h2>
              <small>Assistant connection, JSON backups and local storage</small>
            </div>
          </div>

          <div className="settings-card-body">
            <div className="settings-field">
              <strong>Assistant connection</strong>
              <p role="status">{assistantConfigured === null ? 'Checking connection…' : assistantConfigured ? 'Local assistant and optional online site questions available.' : 'Local assistant available offline.'}</p>
              <small className="settings-helptext">Configure the optional provider on the server with <code>PIP_ASSISTANT_API_KEY</code> in <code>.env.local</code>.</small>
            </div>

            {/* Data Management Buttons Strip */}
            <div className="settings-data-management-box">
              <div className="settings-sub-label">Local Data & Backup Controls:</div>
              <div className="settings-data-btns">
                <button
                  type="button"
                  className="button secondary-button"
                  onClick={onOpenVault}
                >
                  <Download size={15} /> Encrypted JSON backup
                </button>

                <button
                  type="button"
                  className="button secondary-button"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileUp size={15} /> Import legacy JSON
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".json,application/json"
                  style={{ display: 'none' }}
                />

                <button
                  type="button"
                  className="button danger-button"
                  onClick={() => setResetConfirmOpen(true)}
                >
                  <Trash2 size={15} /> Reset All App Data
                </button>
              </div>
            </div>

            {/* Quick Links to PWA & Vault */}
            <div className="settings-quick-links">
              {onOpenPWAInstall && (
                <button type="button" className="settings-link-chip" onClick={onOpenPWAInstall}>
                  <Smartphone size={14} /> Install App Hub
                </button>
              )}
              {onOpenVault && (
                <button type="button" className="settings-link-chip" onClick={onOpenVault}>
                  <Lock size={14} /> Open Health Vault
                </button>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Confirmation Modal for Reset All Data */}
      {restorable && <Modal title="Replace saved workspace?" onClose={() => setRestorable(null)}>
        <div className="audit-auth">
          <p>The backup has {restorable.familyMembers.length + 1} profiles. Restoring it replaces the care logs and settings on this device.</p>
          <button className="button primary" type="button" onClick={() => {
            useWorkspace.getState().restoreWorkspace(restorable);
            setRestorable(null);
            showToast('Backup restored.');
          }}>Restore backup</button>
        </div>
      </Modal>}
      {resetConfirmOpen && (
        <div className="modal-backdrop" onClick={() => setResetConfirmOpen(false)}>
          <div className="modal-card settings-reset-modal" onClick={e => e.stopPropagation()}>
            <div className="settings-reset-modal-head">
              <AlertTriangle size={24} className="text-red-400" />
              <h3>Reset All App Data?</h3>
            </div>
            <p className="settings-reset-modal-text">
              This action will permanently erase your local bio-profiles, logged meals, hydration history, and custom routines stored in this browser.
            </p>
            <p className="settings-reset-modal-tip">
              Tip: You can use <strong>Export JSON Backup</strong> before resetting to preserve your data.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="button text-button"
                onClick={() => setResetConfirmOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button danger-button"
                onClick={handleConfirmReset}
              >
                Yes, Reset Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
