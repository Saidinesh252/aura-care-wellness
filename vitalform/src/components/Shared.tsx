import { type ReactNode, useEffect, useId, useRef } from 'react';
import { ChevronDown, Droplets, Dumbbell, Salad, Sparkles, X } from 'lucide-react';
import { type Macros, type Pillar, pillars } from '../context';

export const pillarIcons = { skin: Sparkles, fitness: Dumbbell, diet: Salad };

export function IconBadge({ pillar, children }: { pillar: Pillar | 'water' | 'neutral'; children?: ReactNode }) {
  const Icon = pillar === 'water' ? Droplets : pillar === 'neutral' ? Sparkles : pillarIcons[pillar];
  return <span className={`icon-badge tone-${pillar}`}>{children ?? <Icon size={19} strokeWidth={1.9} />}</span>;
}

export function SelectField({ children, icon, className = '', ...props }: React.ComponentProps<'select'> & { icon?: ReactNode }) {
  return <span className={`select-field ${className}`}>
    {icon}<select {...props}>{children}</select><ChevronDown className="select-chevron" size={14} aria-hidden="true" />
  </span>;
}

export function Ring({ value, size = 60, children, tone, label }: {
  value: number; size?: number; children?: ReactNode; tone: 'diet' | 'water' | 'fitness'; label: string;
}) {
  const percentage = Math.max(0, Math.min(value, 100));
  return <div className={`ring tone-${tone}`} style={{ '--ring-size': `${size}px`, '--ring-value': `${percentage}%` } as React.CSSProperties}
    role="progressbar" aria-label={label} aria-valuenow={Math.round(percentage)} aria-valuemin={0} aria-valuemax={100}>
    <span>{children}</span>
  </div>;
}

export function MacroValues({ macros }: { macros: Macros }) {
  return <div className="macro-values">
    <span><strong>{macros.calories}</strong> kcal</span>
    <span><strong>{macros.protein.toFixed(1)} g</strong> protein</span>
    <span><strong>{macros.carbs.toFixed(1)} g</strong> carbs</span>
    <span><strong>{macros.fat.toFixed(1)} g</strong> fat</span>
  </div>;
}

export function PillarLabel({ pillar }: { pillar: Pillar }) {
  const Icon = pillarIcons[pillar];
  return <span className={`pillar-label tone-${pillar}`}><Icon size={13} /> {pillars[pillar]}</span>;
}

export function Modal({ title, children, onClose, variant }: { title: string; children: ReactNode; onClose: () => void; variant?: 'drawer' | 'wizard' }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return <dialog ref={ref} className={`modal ${variant ? `modal-${variant}` : ''}`} aria-labelledby={titleId} onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => {
    if (event.currentTarget === event.target) {
      const bounds = event.currentTarget.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
    }
  }}>
    <div className="modal-header"><h2 id={titleId}>{title}</h2><button className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={19} /></button></div>
    {children}
  </dialog>;
}
