import { Check, Cloud, Download, LockKeyhole, LogIn, LogOut, RefreshCw, ShieldCheck, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import { localDate } from '../context';
import { useWorkspace, workspaceSnapshot, type WorkspaceData } from '../store';
import { decryptBackup, encryptBackup, maximumBackupBytes } from '../vault';
import { hybridStorageAdapter } from '../storage/storageAdapter';
import type { CloudUser } from '../storage/types';
import { Modal } from './Shared';

export function HealthVault({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<'export' | 'restore' | 'cloud'>('export');
  const [passphrase, setPassphrase] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [restorable, setRestorable] = useState<WorkspaceData | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const supported = typeof crypto !== 'undefined' && Boolean(crypto.subtle);

  // Cloud state
  const isCloudConfigured = hybridStorageAdapter.isCloudConfigured;
  const [cloudUser, setCloudUser] = useState<CloudUser | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [cloudBusy, setCloudBusy] = useState(false);
  const [cloudStatus, setCloudStatus] = useState('');
  const [cloudError, setCloudError] = useState('');

  useEffect(() => {
    if (isCloudConfigured) {
      hybridStorageAdapter.getAuthState().then(({ user }) => setCloudUser(user));
    }
  }, [isCloudConfigured]);

  function switchMode(next: typeof mode) {
    setMode(next);
    setPassphrase('');
    setFile(null);
    setRestorable(null);
    setError('');
    setStatus('');
    setCloudStatus('');
    setCloudError('');
  }

  async function handleBackup() {
    setBusy(true);
    setError('');
    setStatus('');
    try {
      if (mode === 'export') {
        const snapshot = workspaceSnapshot(useWorkspace.getState());
        const contents = await encryptBackup(snapshot, passphrase);
        if (contents.length > maximumBackupBytes) throw new Error('This backup exceeds the 5 MB limit.');
        const url = URL.createObjectURL(new Blob([contents], { type: 'application/json' }));
        const download = document.createElement('a');
        download.href = url;
        download.download = `vitalform-backup-${localDate()}.json`;
        download.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        setStatus('Encrypted backup ready. Keep the file and passphrase somewhere you can find them.');
      } else {
        if (!file) throw new Error('Choose a Vitalform backup to restore.');
        if (file.size > maximumBackupBytes) throw new Error('Select a backup below 5 MB.');
        setRestorable(await decryptBackup(await file.text(), passphrase));
      }
      setPassphrase('');
    } catch (failure) {
      setError(failure instanceof SyntaxError ? 'The file does not contain valid backup JSON.' : failure instanceof Error ? failure.message : 'The backup could not be processed.');
    } finally { setBusy(false); }
  }

  // Cloud Sync Handlers
  async function handleSendOtp() {
    if (!emailInput.trim()) return;
    setCloudBusy(true);
    setCloudError('');
    setCloudStatus('');
    try {
      const res = await hybridStorageAdapter.signInWithOtp(emailInput.trim());
      if (res.success) {
        setCloudStatus(res.message);
      } else {
        setCloudError(res.error || 'Failed to send login code.');
      }
    } catch (e: any) {
      setCloudError(e?.message || 'Network error');
    } finally {
      setCloudBusy(false);
    }
  }

  async function handleSyncToCloud() {
    setCloudBusy(true);
    setCloudError('');
    setCloudStatus('');
    try {
      const snapshot = workspaceSnapshot(useWorkspace.getState());
      const res = await hybridStorageAdapter.syncToCloud(snapshot);
      if (res.success) {
        setCloudStatus(`Workspace synced successfully to PostgreSQL cloud at ${res.syncedAt}.`);
      } else {
        setCloudError(res.error || 'Sync failed.');
      }
    } catch (e: any) {
      setCloudError(e?.message || 'Cloud sync error');
    } finally {
      setCloudBusy(false);
    }
  }

  async function handleRestoreFromCloud() {
    setCloudBusy(true);
    setCloudError('');
    setCloudStatus('');
    try {
      const res = await hybridStorageAdapter.fetchFromCloud();
      if (res.success && res.data) {
        useWorkspace.setState(res.data);
        setCloudStatus('Cloud workspace successfully restored to this browser.');
      } else {
        setCloudError(res.error || 'No remote cloud backup found.');
      }
    } catch (e: any) {
      setCloudError(e?.message || 'Cloud restore error');
    } finally {
      setCloudBusy(false);
    }
  }

  async function handleSignOut() {
    await hybridStorageAdapter.signOut();
    setCloudUser(null);
    setCloudStatus('Signed out from cloud session.');
  }

  return (
    <Modal title="Local-first health vault" variant="drawer" onClose={onClose}>
      <div className="vault-intro">
        <LockKeyhole size={22} />
        <div>
          <h3>Stored in this browser</h3>
          <p>Vitalform keeps everyone’s measurements, routines and care logs in local browser storage. Download an encrypted copy to move them or recover them after clearing browser data.</p>
        </div>
      </div>

      <div className="segmented vault-mode" role="group" aria-label="Backup action">
        <button type="button" aria-pressed={mode === 'export'} onClick={() => switchMode('export')} disabled={busy}>
          <Download size={15} /> Export
        </button>
        <button type="button" aria-pressed={mode === 'restore'} onClick={() => switchMode('restore')} disabled={busy}>
          <Upload size={15} /> Restore
        </button>
        <button type="button" aria-pressed={mode === 'cloud'} onClick={() => switchMode('cloud')} disabled={busy}>
          <Cloud size={15} /> {isCloudConfigured ? 'Cloud Sync' : 'Storage Engine'}
        </button>
      </div>

      {!supported && mode !== 'cloud' && (
        <p className="form-error">Encrypted backups require a browser with Web Crypto on HTTPS or localhost.</p>
      )}

      {/* CLOUD TAB */}
      {mode === 'cloud' && (
        <div style={{ display: 'grid', gap: 14, marginTop: 8 }}>
          {isCloudConfigured ? (
            <div style={{ display: 'grid', gap: 14 }}>
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
                  <strong style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                    <Cloud size={15} color="#10b981" /> Supabase PostgreSQL Cloud Sync
                  </strong>
                  <small style={{ color: 'var(--muted)', fontSize: 11 }}>
                    {cloudUser ? `Signed in as ${cloudUser.email || cloudUser.id}` : 'Guest Mode (Local storage active)'}
                  </small>
                </div>
                {cloudUser && (
                  <button type="button" className="button text-button" onClick={handleSignOut} style={{ fontSize: 11 }}>
                    <LogOut size={13} /> Sign Out
                  </button>
                )}
              </div>

              {!cloudUser ? (
                <div style={{ display: 'grid', gap: 10 }}>
                  <label className="form-field">
                    <span>Email address for Magic Link sign-in</span>
                    <input
                      type="email"
                      placeholder="name@example.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      disabled={cloudBusy}
                    />
                  </label>
                  <button
                    type="button"
                    className="button primary"
                    onClick={handleSendOtp}
                    disabled={cloudBusy || !emailInput.trim()}
                  >
                    <LogIn size={15} /> Send Magic Login Link
                  </button>
                  <small style={{ color: 'var(--muted)', fontSize: 11 }}>
                    No password needed. You will receive a secure login email to sync across all your devices.
                  </small>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 8 }}>
                  <button
                    type="button"
                    className="button primary"
                    onClick={handleSyncToCloud}
                    disabled={cloudBusy}
                  >
                    <RefreshCw size={14} className={cloudBusy ? 'spinning' : ''} /> Sync Current Workspace to Cloud
                  </button>
                  <button
                    type="button"
                    className="button secondary"
                    onClick={handleRestoreFromCloud}
                    disabled={cloudBusy}
                  >
                    <Download size={14} /> Restore Latest from Cloud
                  </button>
                </div>
              )}

              {cloudStatus && <p className="vault-status" role="status"><Check size={16} />{cloudStatus}</p>}
              {cloudError && <p className="form-error" role="alert">{cloudError}</p>}
            </div>
          ) : (
            <div
              style={{
                padding: '16px 14px',
                borderRadius: 14,
                background: 'var(--surface-tint)',
                border: '1px solid var(--border)',
                display: 'grid',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="brand-icon" style={{ width: 34, height: 34, background: '#086045' }}>
                  <ShieldCheck size={18} />
                </span>
                <div>
                  <strong style={{ fontSize: 14 }}>100% Local-First Storage Active</strong>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>Zero Cloud Dependency / Guest Mode</div>
                </div>
              </div>

              <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: 'var(--text)' }}>
                Your bio-profile, elder care logs, and custom meal plans are saved securely in your browser’s <strong>localStorage</strong>.
                You do not need to sign up or send any personal health data to outside servers.
              </p>

              <div
                style={{
                  padding: 10,
                  borderRadius: 10,
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  fontSize: 11.5,
                  color: 'var(--muted)',
                  lineHeight: 1.5,
                }}
              >
                <strong>Developer &amp; Caregiver Cloud Option:</strong>
                <p style={{ margin: '4px 0 0' }}>
                  To enable live real-time cloud sync, configure <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in <code>.env.local</code>.
                  Database schema is ready in <code>supabase/schema.sql</code>.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* EXPORT / RESTORE TABS */}
      {mode !== 'cloud' && (
        <>
          {restorable ? (
            <div className="vault-review">
              <h3>Backup unlocked</h3>
              <p>{restorable.familyMembers.length + 1} {restorable.familyMembers.length ? 'profiles' : 'profile'} · {Object.keys(restorable.days).length} journal days for the active profile</p>
              <p>Restoring replaces the Vitalform data in this browser with the contents of this backup.</p>
              <div className="wizard-footer">
                <button className="button secondary" onClick={() => setRestorable(null)}>Cancel restore</button>
                <button className="button primary" onClick={() => {
                  useWorkspace.setState(restorable);
                  setRestorable(null);
                  setFile(null);
                  setStatus('Backup restored to this browser.');
                }}>
                  <Check size={16} /> Replace with backup
                </button>
              </div>
            </div>
          ) : (
            <form className="vault-form" onSubmit={(event) => { event.preventDefault(); void handleBackup(); }}>
              {mode === 'restore' && (
                <label className="form-field">
                  <span>Encrypted JSON file</span>
                  <input type="file" accept=".json,application/json" disabled={busy} required onChange={(event) => { setFile(event.target.files?.[0] ?? null); setError(''); }} />
                </label>
              )}
              <label className="form-field">
                <span>Backup passphrase</span>
                <input type="password" minLength={mode === 'export' ? 10 : undefined} maxLength={512} autoComplete={mode === 'export' ? 'new-password' : 'current-password'} required value={passphrase} disabled={busy} onChange={(event) => setPassphrase(event.target.value)} />
              </label>
              <p className="fine-print">The exported JSON uses AES-256-GCM encryption. Save your passphrase separately so you can unlock the file later.</p>
              <button className="button primary" disabled={!supported || busy}>
                {busy ? 'Working…' : mode === 'export' ? 'Download encrypted backup' : 'Unlock and review backup'}
              </button>
            </form>
          )}

          {status && <p className="vault-status" role="status"><Check size={16} /><span style={{ marginLeft: 6 }}>{status}</span></p>}
          {error && <p className="form-error" role="alert">{error}</p>}
        </>
      )}
    </Modal>
  );
}
