import { ArrowUpRight, Info, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { type Pillar } from '../context';
import { evidence, tierLabels, type EvidenceKey } from '../evidence';
import { safetyFor } from '../safety';
import { useWorkspace } from '../store';
import { Modal } from './Shared';

export function EvidenceInfo({ rule, formula, compact = false }: { rule: EvidenceKey; formula?: string; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const item = evidence[rule];
  const tier = item.tier ? tierLabels[item.tier] : 'Planning reference';
  return <>
    <button type="button" className={`evidence-pill evidence-${item.tier ?? 'reference'} ${compact ? 'evidence-compact' : ''}`} onClick={() => setOpen(true)} aria-label={`Why this recommendation? ${item.title}`}>
      <Info size={14} /><span>{compact ? (item.tier ? `Tier ${item.tier}` : 'Method') : tier}</span>
    </button>
    {open && <Modal title="Why this recommendation?" variant="drawer" onClose={() => setOpen(false)}>
      <div className="evidence-drawer"><span className={`evidence-pill evidence-${item.tier ?? 'reference'}`}><Info size={14} /> {tier}</span>
        <h3>{item.title}</h3><p>{item.summary}</p>
        {formula && <div className="evidence-formula"><strong>How this app calculates it</strong><p>{formula}</p></div>}
        {'href' in item && <a className="button secondary" href={item.href} target="_blank" rel="noreferrer">{item.source} <ArrowUpRight size={15} /></a>}
      </div>
    </Modal>}
  </>;
}

export function SafetyBanner({ pillar, today }: { pillar?: Pillar; today?: string }) {
  const profile = useWorkspace(state => state.profile);
  const guidance = safetyFor(profile, today).guidance.filter(item => !pillar || item.pillar === pillar);
  if (!guidance.length) return null;
  return <aside className="safety-banner" aria-label="Safety guidance">
    <ShieldCheck size={21} /><div><strong>Safety adjusted for you</strong>
      {guidance.map(item => <p key={item.text}>{item.text} {item.href && <a href={item.href} target="_blank" rel="noreferrer">{item.source}</a>}</p>)}
    </div>
  </aside>;
}
