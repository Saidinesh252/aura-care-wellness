import { Check, Clock3, FlaskConical, Leaf, MapPin, Moon, ScanFace, Sparkles, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { environments, price, skinTypes, type Currency, type SkinType } from '../context';
import { comparison, concerns, customSkincareProtocol, workspaceSkin, type Concern, type RoutineTime } from '../skincare';
import { stepEvidence } from '../evidence';
import { comfortFor } from '../familyTypes';
import { type ProductSlot } from '../products';
import { PinnedRoutine } from './PinnedRoutine';
import { emptyJournal, useWorkspace } from '../store';
import { scheduledFormulas } from '../skinSchedule';
import { safetyFor } from '../safety';
import { EvidenceInfo, SafetyBanner } from './Evidence';
import { FormulaPlanner } from './FormulaPlanner';
import { ReadAloudButton } from './ReadAloudButton';
import { IconBadge, Modal, SelectField } from './Shared';
import { MistakeGuardrailBanner, presetGuardrails } from './MistakeGuardrailBanner';
import { WeatherSkincareAlert } from './WeatherProtectionShield';

const options = [
  { name: 'Natural / DIY', icon: Leaf },
  { name: 'Budget pharmacy', icon: FlaskConical },
  { name: 'Luxury splurge', icon: Sparkles },
];
const guardrailsForStep: Record<string, string> = { Cleanse: 'skincare-cleanse', Protect: 'skincare-sunscreen', Treat: 'skincare-treatment' };

function ComparisonCards({ concern, currency }: { concern: Concern; currency: Currency }) {
  const profile = useWorkspace(state => state.profile);
  const guarded = safetyFor(profile).gentleSkin;
  return <div className="comparison-grid">{comparison[concern].map((base, index) => {
    const option = guarded && concern === 'Oil & blemishes' && index === 1
      ? { name: 'Fragrance-free gentle cleanser', note: 'Use a simple wash while optional exfoliating acids are paused.', cost: 349 } : base;
    const { icon: Icon, name } = options[index];
    return <div className="comparison-card" key={option.name}>
      <span><Icon size={15} />{name}</span>
      <h3>{option.name}</h3><p>{option.note}</p><strong>{price(option.cost, currency, true)}</strong>
      <div className="ingredient-evidence"><EvidenceInfo rule={/sunscreen|spf|shade/i.test(option.name) ? 'spf' : /salicylic/i.test(option.name) ? 'active' : 'skin'} compact /></div>
    </div>;
  })}</div>;
}

export function BudgetComparisonModal({ concern, currency, onClose }: { concern: Concern; currency: Currency; onClose: () => void }) {
  const [selected, setSelected] = useState(concern);
  return <Modal title="Ingredient & budget matrix" onClose={onClose}>
    <p className="muted">Compare ways to address the same skin concern at different price points.</p>
    <label className="comparison-select"><span>Skin concern</span><SelectField value={selected} onChange={event => setSelected(event.target.value as Concern)}>{concerns.map(item => <option key={item}>{item}</option>)}</SelectField></label>
    <ComparisonCards concern={selected} currency={currency} />
    <p className="fine-print">Illustrative product prices. <a href="https://www.aad.org/public/everyday-care/skin-care-basics/care/skin-care-budget" target="_blank" rel="noreferrer">AAD skincare basics</a></p>
  </Modal>;
}

export function SkincareModule({ today, target }: { today: string; target?: string }) {
  const { environment, budget, skin, currency, setSkin, days, setHabit, profile, easyDay, pinnedProducts, ownSkincare, skinSchedule, comfortPreference, weatherSeason } = useWorkspace();
  const [time, setTime] = useState<RoutineTime>(target === 'pm' || (profile && target === 'product-Treat') ? 'pm' : 'am');
  const [concern, setConcern] = useState<Concern>('Oil & blemishes');
  const [modal, setModal] = useState(false);
  const protocol = profile && customSkincareProtocol(profile, time, budget, today);
  const savedActives = scheduledFormulas(pinnedProducts, ownSkincare, skinSchedule).length > 0;
  const { steps, care, description, hair } = workspaceSkin(skin, environment, budget, time, profile, today, easyDay === today, savedActives, weatherSeason);
  const completed = (days[today] ?? emptyJournal).habits[time];
  const focusedStep = target?.startsWith('product-') ? target.slice(8) : undefined;
  useEffect(() => {
    if (target === 'formulas') document.getElementById('active-schedule')?.scrollIntoView({ block: 'start' });
    if (focusedStep) document.getElementById(`step-${focusedStep}`)?.scrollIntoView({ block: 'nearest' });
  }, [focusedStep, target]);
  return <>
    <div className="page-intro"><div><span className="page-eyebrow tone-skin"><Sparkles size={15} /> Skincare</span><h1>Skincare Studio</h1><p>Build a morning and evening routine for your skin and space.</p></div><IconBadge pillar="skin"><ScanFace size={26} /></IconBadge></div>
    <SafetyBanner pillar="skin" today={today} />
    <div className="context-strip tone-skin"><MapPin size={21} /><div><strong>{environments[environment].label} skincare</strong><p>{description}</p></div></div>
    <WeatherSkincareAlert />
    <section className="module-section">
      <div className="section-head"><div><h2>Routine builder</h2><p>{care} · {steps.length} steps · {steps.length + (time === 'am' ? 1 : 0)} min</p></div>
        <div className="module-controls">
          <SelectField aria-label="Skin type" icon={<ScanFace size={16} />} value={skin} onChange={event => setSkin(event.target.value as SkinType)}>{skinTypes.map(type => <option key={type}>{type}</option>)}</SelectField>
          <div className="segmented" role="group" aria-label="Routine time">
            <button type="button" aria-pressed={time === 'am'} onClick={() => setTime('am')}><Sun size={16} /> AM</button>
            <button type="button" aria-pressed={time === 'pm'} onClick={() => setTime('pm')}><Moon size={16} /> PM</button>
          </div>
        </div>
      </div>
      {comfortFor(profile?.age, comfortPreference) && <ReadAloudButton className="routine-readout" text={steps.map(step => `${step.label}. ${step.product}. ${step.note}`).join(' ')} />}
      <div className="routine-grid">
        {steps.map((step, index) => <article id={`step-${step.label}`} className={`card routine-card ${focusedStep === step.label ? 'highlighted' : ''}`} key={step.label}>
          <div className="routine-top"><span>{String(index + 1).padStart(2, '0')}</span><span><Clock3 size={14} /> {step.time}</span></div>
          <h3>{step.label === 'LipCare' ? 'Lips' : step.label}</h3><strong>{step.product}</strong><p>{step.note}</p>
          <span className="step-price">{step.price === 0 ? 'No extra cost' : `Est. ${price(step.price, currency, true)}`}</span>
          <EvidenceInfo rule={stepEvidence(step.label, step.product)} compact />
          <PinnedRoutine pillar="skin" slot={step.label as ProductSlot} today={today} time={time} />
          <MistakeGuardrailBanner category="skin" title="What not to do" compact defaultExpanded={false} mistakes={presetGuardrails[guardrailsForStep[step.label] ?? 'skincare-moisture']} />
        </article>)}
      </div>
      <MistakeGuardrailBanner category="skin" />
      {!profile && easyDay !== today && <PinnedRoutine pillar="skin" slot="Hydrate" />}
      {hair && <div className="blueprint-callouts"><div className="context-strip tone-skin"><Sparkles size={20} /><div><strong>Haircare</strong><p>{hair}</p><PinnedRoutine pillar="skin" slot="Haircare" />
        <MistakeGuardrailBanner category="skin" title="What not to do" compact defaultExpanded={false} mistakes={presetGuardrails['skincare-haircare']} /></div></div>{protocol && <p className="fine-print">{protocol.guardrail}</p>}</div>}
      <button className={`button ${completed ? 'secondary' : 'primary'} routine-done`} aria-pressed={!!completed} onClick={() => setHabit(time, !completed)}><Check size={17} /> {completed ? 'Routine complete' : 'Mark routine complete'}</button>
    </section>
    <FormulaPlanner today={today} />
    {!steps.some(step => step.label === 'LipCare') && <PinnedRoutine pillar="skin" slot="LipCare" />}
    <section className="module-section">
      <div className="section-head"><div><h2>Ingredient &amp; budget matrix</h2><p>Compare three approaches for one skin concern.</p></div><button className="button secondary" onClick={() => setModal(true)}><FlaskConical size={16} /> Open comparison</button></div>
      <div className="choice-row" role="group" aria-label="Skin concern">{concerns.map(item => <button className="choice-chip" aria-pressed={item === concern} key={item} onClick={() => setConcern(item)}>{item}</button>)}</div>
      <ComparisonCards concern={concern} currency={currency} />
      <p className="fine-print">Illustrative product prices. <a href="https://www.aad.org/public/everyday-care/skin-care-basics/care/skin-care-budget" target="_blank" rel="noreferrer">AAD skincare basics</a></p>
    </section>
    {modal && <BudgetComparisonModal concern={concern} currency={currency} onClose={() => setModal(false)} />}
  </>;
}
