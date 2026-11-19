import {
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Droplets,
  Footprints,
  HeartHandshake,
  HeartPulse,
  KeyRound,
  Link,
  Lock,
  RefreshCw,
  Share2,
  UserCheck,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useWorkspace } from '../store';
import { hybridStorageAdapter } from '../storage/storageAdapter';
import type { SharedCarePacket } from '../storage/types';
import { localDate } from '../context';
import { emptyCareDay } from '../familyTypes';

export function FamilySyncModal({
  initialMemberId,
  initialSyncCode,
  onClose,
}: {
  initialMemberId?: string;
  initialSyncCode?: string;
  onClose: () => void;
}) {
  const { familyMembers, memberWorkspaces, days, careDays, careReminders, activeMemberId } = useWorkspace();

  const [activeTab, setActiveTab] = useState<'share' | 'connect'>(initialSyncCode ? 'connect' : 'share');

  // Share tab state
  const targetMemberId = initialMemberId || (familyMembers.length > 0 ? familyMembers[0].id : activeMemberId);
  const [selectedMemberId, setSelectedMemberId] = useState(targetMemberId);
  const [accessMode, setAccessMode] = useState<'readonly' | 'collaborative'>('readonly');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isCloud, setIsCloud] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Connect tab state
  const [inputCode, setInputCode] = useState(initialSyncCode || '');
  const [connectedPacket, setConnectedPacket] = useState<SharedCarePacket | null>(null);
  const [connectLoading, setConnectLoading] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // If initialSyncCode was provided, fetch it right away
  useEffect(() => {
    if (initialSyncCode) {
      handleConnect(initialSyncCode);
    }
  }, [initialSyncCode]);

  // Handle generating a share code
  const handleGenerateShare = async () => {
    setIsGenerating(true);
    try {
      const today = localDate();
      const member = familyMembers.find((m) => m.id === selectedMemberId);
      const memberWs = memberWorkspaces[selectedMemberId];

      const name = member?.name || 'My Profile';
      const age = member?.age || 65;
      const relationship = member?.relationship || 'Parent';

      const careDay = (memberWs?.careDays?.[today] ?? careDays[today]) || emptyCareDay;
      const reminders = memberWs?.careReminders ?? careReminders;
      const waterMl = (memberWs?.days?.[today]?.water ?? days[today]?.water) || 0;
      const habits = (memberWs?.days?.[today]?.habits ?? days[today]?.habits) || {};

      // Short readable code
      const cleanName = name.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase() || 'CARE';
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const syncCode = `AURA-${cleanName}-${randomSuffix}`;

      const packet: SharedCarePacket = {
        syncCode,
        memberId: selectedMemberId,
        memberName: name,
        relationship,
        age,
        accessMode,
        today,
        careDay,
        careReminders: reminders,
        waterMl,
        habits,
        updatedAt: new Date().toISOString(),
      };

      const result = await hybridStorageAdapter.createFamilyShare(packet);
      setGeneratedCode(result.syncCode);
      setShareUrl(result.shareUrl);
      setIsCloud(result.isCloud);
    } catch (e: any) {
      console.warn('Share creation error:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  // Handle connecting to code
  const handleConnect = async (codeToFetch?: string) => {
    const code = codeToFetch || inputCode;
    if (!code.trim()) return;

    setConnectLoading(true);
    setConnectError(null);
    try {
      const result = await hybridStorageAdapter.fetchSharedFamilyProfile(code);
      if (result.success && result.packet) {
        setConnectedPacket(result.packet);
        setSyncStatus(result.isCloud ? 'Live Cloud-Synced (Supabase)' : 'Local P2P Decoded (Offline Safe)');
      } else {
        setConnectError(result.error || 'Could not locate family sync code.');
      }
    } catch (e: any) {
      setConnectError(e?.message || 'Failed to fetch family profile.');
    } finally {
      setConnectLoading(false);
    }
  };

  // Handle collaborative checkoff
  const handleToggleReminder = async (reminderId: string) => {
    if (!connectedPacket || connectedPacket.accessMode === 'readonly') return;

    const currentCompleted = connectedPacket.careDay.completedReminderIds || [];
    const nextCompleted = currentCompleted.includes(reminderId)
      ? currentCompleted.filter((id) => id !== reminderId)
      : [...currentCompleted, reminderId];

    const nextCareDay = {
      ...connectedPacket.careDay,
      completedReminderIds: nextCompleted,
    };

    setConnectedPacket({
      ...connectedPacket,
      careDay: nextCareDay,
      updatedAt: new Date().toISOString(),
    });

    await hybridStorageAdapter.updateSharedCare(
      connectedPacket.syncCode,
      nextCareDay,
      connectedPacket.waterMl
    );
  };

  const handleAddWater = async (amount: number) => {
    if (!connectedPacket || connectedPacket.accessMode === 'readonly') return;

    const nextWater = Math.max(0, connectedPacket.waterMl + amount);
    setConnectedPacket({
      ...connectedPacket,
      waterMl: nextWater,
      updatedAt: new Date().toISOString(),
    });

    await hybridStorageAdapter.updateSharedCare(
      connectedPacket.syncCode,
      connectedPacket.careDay,
      nextWater
    );
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="family-sync-title">
      <div className="modal" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="brand-icon" style={{ width: 34, height: 34, background: '#086045' }}>
              <HeartHandshake size={18} />
            </span>
            <div>
              <h2 id="family-sync-title" style={{ margin: 0, fontSize: 18 }}>Family Circle Link &amp; Caregiver Sync</h2>
              <small style={{ color: 'var(--muted)', fontSize: 12 }}>
                {hybridStorageAdapter.isCloudConfigured
                  ? 'Cloud Sync Enabled (Supabase)'
                  : 'Local-First P2P Link (Zero-Server Fallback)'}
              </small>
            </div>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="segmented" style={{ width: '100%', margin: '14px 0' }}>
          <button
            type="button"
            style={{ flex: 1 }}
            aria-pressed={activeTab === 'share'}
            onClick={() => setActiveTab('share')}
          >
            <Share2 size={14} /> Share Parent/Elder Profile
          </button>
          <button
            type="button"
            style={{ flex: 1 }}
            aria-pressed={activeTab === 'connect'}
            onClick={() => setActiveTab('connect')}
          >
            <Link size={14} /> Connect via Sync Code
          </button>
        </div>

        {/* TAB 1: SHARE */}
        {activeTab === 'share' && (
          <div style={{ display: 'grid', gap: 16 }}>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>
              Generate a secure link or sync code for relatives and caregivers. They will be able to check daily water, walk minutes, and medicine completion on their own devices.
            </p>

            <div style={{ display: 'grid', gap: 10 }}>
              <label className="form-field">
                <span>Select Family Profile to Share</span>
                <select
                  value={selectedMemberId}
                  onChange={(e) => {
                    setSelectedMemberId(e.target.value);
                    setGeneratedCode(null);
                  }}
                  className="select-field"
                  style={{ width: '100%', padding: '8px 12px', minHeight: 38 }}
                >
                  <option value={activeMemberId}>Myself</option>
                  {familyMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.relationship}, Age {m.age})
                    </option>
                  ))}
                </select>
              </label>

              <div style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 650 }}>Access Permission Mode:</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className={`button ${accessMode === 'readonly' ? 'primary-button' : 'secondary-button'}`}
                    onClick={() => {
                      setAccessMode('readonly');
                      setGeneratedCode(null);
                    }}
                    style={{ flex: 1, minHeight: 34, fontSize: 12 }}
                  >
                    <Lock size={13} /> Read-Only (Vitals View)
                  </button>
                  <button
                    type="button"
                    className={`button ${accessMode === 'collaborative' ? 'primary-button' : 'secondary-button'}`}
                    onClick={() => {
                      setAccessMode('collaborative');
                      setGeneratedCode(null);
                    }}
                    style={{ flex: 1, minHeight: 34, fontSize: 12 }}
                  >
                    <UserCheck size={13} /> Collaborative (Caregiver)
                  </button>
                </div>
              </div>
            </div>

            {!generatedCode ? (
              <button
                type="button"
                className="button primary-button"
                onClick={handleGenerateShare}
                disabled={isGenerating}
                style={{ width: '100%', minHeight: 42, marginTop: 6 }}
              >
                {isGenerating ? <RefreshCw size={15} className="spinning" /> : <KeyRound size={15} />}
                Generate Family Caregiver Sync Code
              </button>
            ) : (
              <div
                style={{
                  padding: 14,
                  borderRadius: 12,
                  background: 'var(--surface-tint)',
                  border: '1px solid var(--border)',
                  display: 'grid',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--green-dark)' }}>
                    {isCloud ? '🟢 Live Cloud Code (Supabase)' : '🔒 P2P Encrypted Code (Local-First)'}
                  </span>
                  <span className="badge" style={{ fontSize: 10, textTransform: 'uppercase' }}>
                    {accessMode}
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <code style={{ fontSize: 15, fontWeight: 800, letterSpacing: '0.04em' }}>{generatedCode}</code>
                  <button
                    type="button"
                    className="button text-button"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedCode);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    style={{ fontSize: 12 }}
                  >
                    {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />} Copy Code
                  </button>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className="button primary-button"
                    onClick={handleCopyLink}
                    style={{ flex: 1, minHeight: 38, fontSize: 12 }}
                  >
                    {copied ? <CheckCircle2 size={14} /> : <Link size={14} />}
                    {copied ? 'Link Copied to Clipboard!' : 'Copy Direct Caregiver Link'}
                  </button>
                </div>
                <small style={{ color: 'var(--muted)', fontSize: 11 }}>
                  Caregivers opening this link will immediately see the elder’s daily hydration, walks, and reminders.
                </small>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CONNECT */}
        {activeTab === 'connect' && (
          <div style={{ display: 'grid', gap: 16 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                placeholder="Paste Family Sync Code or Link (e.g. AURA-MOM-5921)..."
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text)',
                  fontSize: 13,
                }}
              />
              <button
                type="button"
                className="button primary-button"
                onClick={() => handleConnect()}
                disabled={connectLoading || !inputCode.trim()}
                style={{ minHeight: 38, padding: '0 16px' }}
              >
                {connectLoading ? <RefreshCw size={14} className="spinning" /> : <Link size={14} />}
                Connect
              </button>
            </div>

            {connectError && (
              <div style={{ padding: '8px 12px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: 12 }}>
                {connectError}
              </div>
            )}

            {/* Connected Elder Dashboard Preview */}
            {connectedPacket && (
              <div
                style={{
                  padding: 16,
                  borderRadius: 14,
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  display: 'grid',
                  gap: 14,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16 }}>
                      {connectedPacket.memberName} ({connectedPacket.relationship}, {connectedPacket.age}y)
                    </h3>
                    <small style={{ color: 'var(--muted)', fontSize: 11 }}>{syncStatus}</small>
                  </div>
                  <span className="badge" style={{ fontSize: 11, background: '#10b981', color: 'white' }}>
                    {connectedPacket.accessMode === 'collaborative' ? 'Caregiver Live Mode' : 'Read-Only View'}
                  </span>
                </div>

                {/* Vitals & Daily Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {/* Water */}
                  <div style={{ padding: 10, borderRadius: 10, background: 'var(--surface-tint)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#0284c7', fontSize: 12, fontWeight: 700 }}>
                      <Droplets size={14} /> Water
                    </div>
                    <strong style={{ fontSize: 16, display: 'block', marginTop: 4 }}>{connectedPacket.waterMl} ml</strong>
                    {connectedPacket.accessMode === 'collaborative' && (
                      <button
                        type="button"
                        className="button text-button"
                        onClick={() => handleAddWater(250)}
                        style={{ fontSize: 11, padding: 0, marginTop: 4, color: '#0284c7' }}
                      >
                        +250ml Log
                      </button>
                    )}
                  </div>

                  {/* Walk Minutes */}
                  <div style={{ padding: 10, borderRadius: 10, background: 'var(--surface-tint)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#10b981', fontSize: 12, fontWeight: 700 }}>
                      <Footprints size={14} /> Movement
                    </div>
                    <strong style={{ fontSize: 16, display: 'block', marginTop: 4 }}>
                      {connectedPacket.careDay.movementMinutes} mins
                    </strong>
                    <small style={{ fontSize: 10, color: 'var(--muted)' }}>Gentle mobility</small>
                  </div>

                  {/* Comfort Vitals */}
                  <div style={{ padding: 10, borderRadius: 10, background: 'var(--surface-tint)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#ec4899', fontSize: 12, fontWeight: 700 }}>
                      <HeartPulse size={14} /> Wellness
                    </div>
                    <strong style={{ fontSize: 13, display: 'block', marginTop: 4 }}>
                      Mood: {connectedPacket.careDay.mood || 'Steady'}
                    </strong>
                    <small style={{ fontSize: 10, color: 'var(--muted)' }}>
                      Pain: {connectedPacket.careDay.pain !== null ? `${connectedPacket.careDay.pain}/10` : 'None'}
                    </small>
                  </div>
                </div>

                {/* Medication / Care Reminders Checklist */}
                <div>
                  <strong style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>
                    <Clock size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                    Medication &amp; Vitals Reminders ({connectedPacket.careReminders.length}):
                  </strong>
                  <div style={{ display: 'grid', gap: 6 }}>
                    {connectedPacket.careReminders.map((rem) => {
                      const isDone = connectedPacket.careDay.completedReminderIds.includes(rem.id);
                      return (
                        <div
                          key={rem.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            borderRadius: 8,
                            background: isDone ? 'color-mix(in srgb, var(--green-soft), transparent 40%)' : 'var(--surface-tint)',
                            border: '1px solid var(--border)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)' }}>{rem.time}</span>
                            <span style={{ fontSize: 12, textDecoration: isDone ? 'line-through' : 'none', opacity: isDone ? 0.7 : 1 }}>
                              {rem.label}
                            </span>
                          </div>
                          {connectedPacket.accessMode === 'collaborative' ? (
                            <button
                              type="button"
                              className={`button ${isDone ? 'primary-button' : 'secondary-button'}`}
                              onClick={() => handleToggleReminder(rem.id)}
                              style={{ minHeight: 26, fontSize: 11, padding: '0 8px' }}
                            >
                              {isDone ? <Check size={12} /> : null} {isDone ? 'Taken' : 'Mark Done'}
                            </button>
                          ) : (
                            <span style={{ fontSize: 11, color: isDone ? '#10b981' : 'var(--muted)', fontWeight: 650 }}>
                              {isDone ? '✓ Completed' : 'Pending'}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <button type="button" className="button secondary-button" onClick={onClose} style={{ minHeight: 38 }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
