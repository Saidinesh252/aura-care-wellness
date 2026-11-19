import { AlertTriangle, ChevronDown } from 'lucide-react';
import { useId, useState } from 'react';
import './mistakeGuardrail.css';

export interface GuardrailEntry { mistake: string; correction: string; why?: string }
export type GuardrailCategory = 'exercise' | 'skin' | 'diet' | 'product' | 'senior' | 'general';

interface MistakeGuardrailBannerProps {
  category: GuardrailCategory;
  title?: string;
  mistakes?: readonly GuardrailEntry[];
  compact?: boolean;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

const entry = (mistake: string, correction: string): GuardrailEntry => ({ mistake, correction });
const controlled = entry('Rushing through the demonstration or pushing through pain.', 'Slow the movement, use a comfortable range, and stop if pain, dizziness or weakness develops.');
const squat = entry('Knees folding inward or heels lifting as you lower.', 'Keep your whole foot grounded and your knees moving in the direction of your toes. Use a shallower range or a stable chair when needed.');
const shoulder = entry('Rushing the circle or jutting your chin forward.', 'Look straight ahead and make slow, comfortable shoulder circles with your head steady.');
const push = entry('Elbows flaring far sideways or hips sagging toward the support.', 'Keep your body in a long line. Angle your elbows comfortably back and choose a solid, higher support if needed.');
const lunge = entry('Dropping quickly onto the back knee or losing pressure through the front foot.', 'Step back with enough width for balance. Lower only as far as you can control and keep the front foot planted.');
const gentleCleanse = entry('Scrubbing active acne or using very hot water.', 'Use a gentle cleanser, lukewarm water and your fingertips. Pat dry with a clean towel.');
const sunscreen = entry('Skipping sun protection on cloudy days or relying on makeup SPF alone.', 'Use broad-spectrum sunscreen on exposed skin and reapply at least every two hours outdoors and after swimming or heavy sweating. Consider sun exposure near windows.');
const actives = entry('Applying a strong leave-on active to wet or irritated skin, or starting several at once.', 'Follow the product label, use dry skin when directed, and start one active at a time. Pause optional actives if irritation develops.');
const iron = entry('Having tea or coffee with an iron-rich meal when you need to improve iron intake.', 'Have tea or coffee between meals. Pair plant iron sources with a food rich in vitamin C if it fits your care plan.');
const sprouts = entry('Using raw or lightly cooked sprouts in a ready-to-eat meal.', 'Cook sprouts thoroughly, or use fully cooked beans. This is especially important for older adults or during pregnancy.');
const portions = entry('Making a sudden, severe cut in food portions to meet a number.', 'Keep regular meals and use a sustainable plan. Ask a qualified professional for guidance if you have medical or nutritional concerns.');
const label = entry('Using a suggested amount without reading the package for your exact product.', 'Follow the label or manual for serving, application, equipment setup, allergens and restrictions.');
const band = entry('Stretching damaged bands or fastening them to unstable furniture.', 'Inspect the band and use an anchor and stretch limit approved by its manufacturer.');
const seniorRise = entry('Standing up suddenly after sitting or floor exercises.', 'Sit upright first and stand slowly with stable support. Sit back down if you feel lightheaded.');
const seniorBalance = entry('Practicing balance drills away from a stable support.', 'Keep a fixed rail or counter within easy reach, or choose a seated session when unsteady.');

export const presetGuardrails: Record<string, readonly GuardrailEntry[]> = {
  exercise: [controlled, entry('Starting a new drill at full speed or full load.', 'Start with a gentle warm-up; preview the movement at slow speed and add load gradually.')],
  skin: [gentleCleanse, actives, sunscreen],
  diet: [iron, portions, sprouts],
  product: [label, band],
  senior: [seniorRise, seniorBalance],
  general: [label],
  squat: [squat],
  'goblet-squat': [squat],
  'chair-stand': [squat, seniorRise],
  'shoulder-roll': [shoulder],
  'seated-roll': [shoulder],
  'incline-push': [push],
  'wall-push': [push],
  plank: [entry('Holding your breath or letting the hips sag.', 'Keep breathing and brace gently. Use a shorter hold or an easier variation if form changes.')],
  lunge: [lunge],
  'split-squat': [lunge],
  hinge: [entry('Rounding your back to reach farther.', 'Soften your knees, move your hips back, and stop before you lose a comfortable spine position.')],
  'tandem-walk': [seniorBalance],
  'band-row': [band],
  'skincare-cleanse': [gentleCleanse],
  'skincare-sunscreen': [sunscreen],
  'skincare-treatment': [actives],
  'skincare-haircare': [entry('Using a clarifying shampoo more often than directed despite scalp irritation.', 'Follow the pack’s wash frequency, rinse well, and stop if irritation persists.')],
  'skincare-moisture': [entry('Continuing to use a product that repeatedly stings or irritates.', 'Pause the irritating product and choose a simple fragrance-free formula that you tolerate.')],
};

export function MistakeGuardrailBanner({
  category, title = 'Common mistakes & what to avoid', mistakes, compact = false, collapsible = true, defaultExpanded = true,
}: MistakeGuardrailBannerProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const bodyId = useId();
  const items = mistakes ?? presetGuardrails[category];
  if (!items.length) return null;
  const heading = <span className="mistake-guardrail-title"><AlertTriangle size={compact ? 14 : 16} aria-hidden /><strong>{title.replace(/^⚠️\s*/, '')}</strong></span>;
  return <aside className={`mistake-guardrail-banner${compact ? ' compact' : ''}`} aria-label={title.replace(/^⚠️\s*/, '')}>
    {collapsible ? <button className="mistake-guardrail-header" type="button" aria-expanded={expanded} aria-controls={bodyId} onClick={() => setExpanded(value => !value)}>
      {heading}<ChevronDown size={15} aria-hidden style={{ transform: expanded ? 'rotate(180deg)' : undefined }} />
    </button> : <div className="mistake-guardrail-header">{heading}</div>}
    <div id={bodyId} className="mistake-guardrail-body" hidden={collapsible && !expanded}>
      {items.map(item => <div className="mistake-guardrail-item" key={item.mistake}>
        <div className="mistake-pitfall-row"><span aria-hidden>×</span><span>{item.mistake}</span></div>
        <div className="mistake-correction-row"><span aria-hidden>✓</span><span>{item.correction}</span></div>
        {item.why && <p className="mistake-why-note">{item.why}</p>}
      </div>)}
    </div>
  </aside>;
}
