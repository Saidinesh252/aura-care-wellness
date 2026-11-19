import { ArrowRight, Fingerprint, ShieldCheck } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { isSupabaseConfigured, supabaseAuth } from '../storage/supabaseClient';
import { useWorkspace } from '../store';
import { Modal } from './Shared';
import './authGate.css';

interface Props {
  onClose: () => void;
  onContinueGuest: () => void;
  onLoginSuccess: (user: { id: string; email: string; displayName: string }) => void;
}

export function AuthGate({ onClose, onContinueGuest, onLoginSuccess }: Props) {
  const [signup, setSignup] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState('');
  const setAuthUser = useWorkspace(state => state.setAuthUser);

  function guest() {
    onContinueGuest();
    try { localStorage.setItem('auracare_auth_mode', 'guest'); } catch { /* in-memory guest mode remains available */ }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!navigator.onLine) { setFeedback('Sign-in needs an internet connection. Continue as a guest to access your saved workspace.'); return; }
    const values = new FormData(event.currentTarget);
    const email = String(values.get('email')).trim();
    const password = String(values.get('password'));
    const name = String(values.get('name') ?? '').trim();
    setBusy(true);
    setFeedback('');
    try {
      const session = await supabaseAuth.passwordAccess(email, password, signup ? name : undefined);
      if (!session) {
        setSignup(false);
        setFeedback('Check your email to confirm the account. You can then sign in here.');
        return;
      }
      const user = {
        id: session.user.id, email: session.user.email ?? email,
        displayName: session.user.user_metadata?.display_name || name || email.split('@')[0],
        createdAt: new Date().toISOString(),
      };
      setAuthUser(user);
      onLoginSuccess(user);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Unable to reach the account server.');
    } finally { setBusy(false); }
  }

  return <Modal title="Welcome to AURA-CARE" variant="wizard" onClose={onClose}>
    <div className="audit-auth">
      <div className="audit-auth-context"><span><ShieldCheck size={21} aria-hidden /></span><p>Your routines, settings and care logs stay available on this device. An account is optional.</p></div>
      {isSupabaseConfigured ? <>
        <div className="segmented" role="group" aria-label="Account options">
          <button type="button" aria-pressed={!signup} onClick={() => { setSignup(false); setFeedback(''); }}>Sign in</button>
          <button type="button" aria-pressed={signup} onClick={() => { setSignup(true); setFeedback(''); }}>Create account</button>
        </div>
        <form className="auth-form" onSubmit={submit}>
          {signup && <label className="form-field">Display name<input name="name" autoComplete="name" maxLength={60} required /></label>}
          <label className="form-field">Email<input name="email" type="email" autoComplete="email" maxLength={254} required /></label>
          <label className="form-field">Password<input name="password" type="password" minLength={6} maxLength={128} autoComplete={signup ? 'new-password' : 'current-password'} required /></label>
          <button type="submit" className="button primary" disabled={busy}>{busy ? 'Connecting…' : signup ? 'Create account' : 'Sign in'} <ArrowRight size={16} aria-hidden /></button>
        </form>
      </> : <p className="muted">Account sign-in is unavailable on this installation.</p>}
      {feedback && <p className="fine-print" role="status">{feedback}</p>}
      <button type="button" className="button secondary audit-guest" onClick={guest} disabled={busy}>
        <Fingerprint size={17} aria-hidden /> Continue without login
      </button>
    </div>
  </Modal>;
}
