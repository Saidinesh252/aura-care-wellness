import { Check, ChevronDown, ChevronRight, UserRound, UsersRound } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { useWorkspace } from '../store';
import './family.css';

export function FamilyAvatar({ name }: { name?: string }) {
  const initials = name?.trim().split(/\s+/).slice(0, 2).map(word => Array.from(word)[0]?.toUpperCase()).join('');
  return <span className="family-avatar" aria-hidden>{initials || <UserRound size={17} />}</span>;
}

export function FamilyCircle({ onOpenHub }: { onOpenHub: () => void }) {
  const { familyMembers, activeMemberId, switchFamilyMember } = useWorkspace();
  const member = familyMembers.find(item => item.id === activeMemberId);
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const circleId = useId();

  useEffect(() => {
    if (!open) return;
    function dismiss(event: PointerEvent) {
      if (event.target instanceof Node && !anchor.current?.contains(event.target)) setOpen(false);
    }
    function escape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      setOpen(false);
      trigger.current?.focus();
    }
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', dismiss);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);

  function select(id: string) {
    switchFamilyMember(id);
    setOpen(false);
    trigger.current?.focus();
  }

  return <div className="family-circle" ref={anchor}>
    <button ref={trigger} type="button" className="family-circle-trigger" aria-label={`Family Circle, ${member?.name ?? 'My profile'} active`}
      aria-expanded={open} aria-controls={circleId} onClick={() => setOpen(!open)}>
      <UsersRound size={17} aria-hidden />
      <span>{member?.name ?? 'Family Circle'}</span>
      <ChevronDown className="family-circle-chevron" size={13} aria-hidden />
    </button>
    {open && <div id={circleId} className="family-circle-panel" aria-label="Switch active profile">
      <strong>Family Circle</strong>
      <div className="family-circle-options">
        <button type="button" aria-pressed={!member} onClick={() => select('self')}>
          <FamilyAvatar /><span>My profile</span>{!member && <Check size={17} aria-hidden />}
        </button>
        {familyMembers.map(item => <button type="button" key={item.id} aria-pressed={item.id === activeMemberId} onClick={() => select(item.id)}>
          <FamilyAvatar name={item.name} /><span>{item.name}<small>{item.relationship} · {item.age} years</small></span>
          {item.id === activeMemberId && <Check size={17} aria-hidden />}
        </button>)}
      </div>
      <button type="button" className="family-circle-hub" onClick={() => { setOpen(false); onOpenHub(); }}>
        Open Family &amp; Elder Care <ChevronRight size={16} aria-hidden />
      </button>
    </div>}
  </div>;
}
