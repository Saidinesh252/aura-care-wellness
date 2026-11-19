import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Fingerprint, Salad, ShieldCheck, Sparkles } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { budgets, environments, places, preferences, skinTypes, tiers } from '../context';
import { activityLevels, approaches, calculateProfile, createProfile, exclusions, exposures, fitnessGoals, hasBiometrics, inchesPerCm, poundsPerKg, skinConcerns, type UserBioProfile } from '../profile';
import { metricFormula } from '../evidence';
import { EvidenceInfo } from './Evidence';
import { useWorkspace } from '../store';
import { healthFlags, type HealthFlag } from '../safety';
import { Modal, SelectField } from './Shared';

const steps = [
  { name: 'Body metrics', icon: Fingerprint },
  { name: 'Diet & setup', icon: Salad },
  { name: 'Skin & hair', icon: Sparkles },
  { name: 'Safety check', icon: ShieldCheck },
];

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="form-field"><span>{label}</span>{children}</label>;
}

function ChoiceField<T extends string>({ label, options, selected, onChange, canClear = false }: {
  label: string; options: readonly T[]; selected: T[]; onChange: (values: T[]) => void; canClear?: boolean;
}) {
  return <fieldset className="profile-choices"><legend>{label}</legend><div className="choice-row">
    {canClear && <button type="button" className="choice-chip" aria-pressed={!selected.length} onClick={() => onChange([])}>None</button>}
    {options.map(item => <button type="button" className="choice-chip" key={item} aria-pressed={selected.includes(item)}
      onClick={() => onChange(selected.includes(item) ? selected.filter(value => value !== item) : [...selected, item])}>{item}</button>)}
  </div></fieldset>;
}

function ChoiceSelect<T extends string>({ value, labels, onChange }: { value: T; labels: Record<T, string>; onChange: (value: T) => void }) {
  return <SelectField value={value} onChange={event => onChange(event.target.value as T)}>
    {(Object.entries(labels) as [T, string][]).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
  </SelectField>;
}

function UnitToggle<T extends string>({ label, options, value, onChange }: { label: string; options: [T, string][]; value: T; onChange: (value: T) => void }) {
  return <div className="profile-unit-row"><span>{label}</span><div className="segmented" role="group" aria-label={`${label} unit`}>
    {options.map(([unit, text]) => <button type="button" key={unit} aria-pressed={unit === value} onClick={() => onChange(unit)}>{text}</button>)}
  </div></div>;
}

const activityLabels = Object.fromEntries(Object.entries(activityLevels).map(([value, info]) => [value, `${info.label} · ${info.detail}`])) as Record<UserBioProfile['activity'], string>;
const heightUnits: ['cm' | 'imperial', string][] = [['cm', 'cm'], ['imperial', 'ft / in']];
const weightUnits: ['kg' | 'lb', string][] = [['kg', 'kg'], ['lb', 'lb']];
const numberLabel = (value: number) => value ? Math.round(value * 10) / 10 : '';

export function ProfileWizard({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const { profile, environment, budget, skin, diet, saveProfile } = useWorkspace();
  const [draft, setDraft] = useState(() => profile ?? createProfile({ environment, budget, diet, skin }));
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const update = <Key extends keyof UserBioProfile>(key: Key, value: UserBioProfile[Key]) => {
    setDraft(current => ({ ...current, [key]: value }));
    setError('');
  };
  const metrics = calculateProfile(draft);
  const inches = Math.round(draft.heightCm * inchesPerCm * 10) / 10;
  const feet = Math.floor(inches / 12);
  const remainder = Math.round((inches % 12) * 10) / 10;
  const weightFactor = draft.weightUnit === 'lb' ? poundsPerKg : 1;
  const valid = hasBiometrics(draft) && draft.targetKg >= 30 && draft.targetKg <= 300;
  function next() {
    if (step === 0 && !valid) {
      setError('Enter your age, height, current weight and target weight within the ranges shown.');
      return;
    }
    if (step < steps.length - 1) setStep(step + 1);
    else { saveProfile(draft); onSave(); }
  }
  return <Modal title={profile ? 'Edit your bio-profile' : 'Build my blueprint'} onClose={onClose} variant="wizard">
    <div className="wizard-progress" role="progressbar" aria-label="Blueprint setup progress" aria-valuenow={step + 1} aria-valuemin={0} aria-valuemax={steps.length}><span style={{ width: `${(step + 1) / steps.length * 100}%` }} /></div>
    <ol className="wizard-steps">{steps.map(({ name, icon: Icon }, index) =>
      <li key={name} aria-current={index === step ? 'step' : undefined} className={index <= step ? 'reached' : ''}>
        <span>{index < step ? <Check size={15} /> : <Icon size={15} />}</span><strong>{name}</strong>
      </li>)}</ol>
    <form noValidate onSubmit={event => { event.preventDefault(); next(); }}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div className="wizard-pane" key={step} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: .14 }}>
          {step === 0 && <>
            <p className="muted">Your measurements stay in this browser. They’re used to estimate your daily targets.</p>
            <div className="wizard-grid">
              <Field label="Age (14–110 years)"><input type="number" min={14} max={110} value={draft.age || ''} onChange={event => update('age', Number(event.target.value))} /></Field>
              <Field label="Biological sex for equation"><ChoiceSelect value={draft.sex} labels={{ private: 'Prefer not to say', female: 'Female', male: 'Male' }} onChange={value => update('sex', value)} /></Field>
              <div className="profile-unit-box">
                <UnitToggle label="Height" options={heightUnits} value={draft.heightUnit} onChange={value => update('heightUnit', value)} />
                {draft.heightUnit === 'cm'
                  ? <Field label="Height (120–230 cm)"><input type="number" min={120} max={230} step=".1" value={numberLabel(draft.heightCm)} onChange={event => update('heightCm', Number(event.target.value))} /></Field>
                  : <div className="wizard-grid"><Field label="Feet"><input type="number" min={3} max={7} value={feet || ''} onChange={event => update('heightCm', (Number(event.target.value) * 12 + remainder) / inchesPerCm)} /></Field>
                    <Field label="Inches"><input type="number" min={0} max={11.9} step=".1" value={draft.heightCm ? remainder : ''} onChange={event => update('heightCm', (feet * 12 + Math.max(0, Math.min(11.9, Number(event.target.value)))) / inchesPerCm)} /></Field></div>}
              </div>
              <div className="profile-unit-box">
                <UnitToggle label="Weight" options={weightUnits} value={draft.weightUnit} onChange={value => update('weightUnit', value)} />
                <div className="wizard-grid">
                  <Field label={`Current ${draft.weightUnit}`}><input type="number" min={30 * weightFactor} max={300 * weightFactor} step=".1" value={numberLabel(draft.weightKg * weightFactor)} onChange={event => update('weightKg', Number(event.target.value) / weightFactor)} /></Field>
                  <Field label={`Target ${draft.weightUnit}`}><input type="number" min={30 * weightFactor} max={300 * weightFactor} step=".1" value={numberLabel(draft.targetKg * weightFactor)} onChange={event => update('targetKg', Number(event.target.value) / weightFactor)} /></Field>
                </div>
              </div>
              <Field label="Activity level"><ChoiceSelect value={draft.activity} labels={activityLabels} onChange={value => update('activity', value)} /></Field>
            </div>
            <div className="metric-preview" aria-label="Live metabolic estimates">
              <div><span>BMI</span><strong>{metrics?.bmi.toFixed(1) ?? '—'}</strong><small>{metrics?.bmiBand ?? 'Height and weight'}</small>{metrics && <EvidenceInfo rule="bmi" formula={metricFormula(draft, 'bmi')} compact />}</div>
              <div><span>BMR</span><strong>{metrics?.bmr?.toLocaleString() ?? '—'}</strong><small>{metrics?.bmrRange ? `${metrics.bmrRange[0]}–${metrics.bmrRange[1]} kcal` : 'kcal at rest'}</small>{metrics?.bmr && <EvidenceInfo rule="bmr" formula={metricFormula(draft, 'bmr')} compact />}</div>
              <div><span>TDEE</span><strong>{metrics?.tdee?.toLocaleString() ?? '—'}</strong><small>kcal per day</small>{metrics?.tdee && <EvidenceInfo rule="tdee" formula={metricFormula(draft, 'tdee')} compact />}</div>
              <div><span>Hydration</span><strong>{metrics?.hydrationMl ? `${(metrics.hydrationMl / 1000).toFixed(2)} L` : '—'}</strong><small>daily estimate</small>{metrics?.hydrationMl && <EvidenceInfo rule="water" formula={metricFormula(draft, 'water')} compact />}</div>
            </div>
            {metrics && draft.age < 20 && <p className="fine-print">{metrics.energyNote}</p>}
          </>}
          {step === 1 && <>
            <p className="muted">Set your goal and kitchen access so your meals and workouts fit your day.</p>
            <div className="wizard-grid">
              <Field label="Primary goal"><ChoiceSelect value={draft.goal} labels={fitnessGoals} onChange={value => update('goal', value)} /></Field>
              <Field label="Dietary preference"><SelectField value={draft.diet} onChange={event => update('diet', event.target.value as UserBioProfile['diet'])}>{preferences.map(value => <option key={value}>{value}</option>)}</SelectField></Field>
              <Field label="Living environment"><SelectField value={draft.environment} onChange={event => update('environment', event.target.value as UserBioProfile['environment'])}>{places.map(value => <option key={value} value={value}>{environments[value].label}</option>)}</SelectField></Field>
              <Field label="Budget tier"><SelectField value={draft.budget} onChange={event => update('budget', event.target.value as UserBioProfile['budget'])}>{tiers.map(value => <option key={value} value={value}>{budgets[value].label}</option>)}</SelectField></Field>
            </div>
            <ChoiceField label="Allergies & exclusions" options={exclusions} selected={draft.exclusions} onChange={values => update('exclusions', values)} canClear />
            <p className="fine-print">Food filters check listed ingredients. Verify current packaging and cross-contact for allergies.</p>
          </>}
          {step === 2 && <>
            <p className="muted">Choose the concerns and exposures you want your routine to address.</p>
            <div className="wizard-grid">
              <Field label="Skin type"><SelectField value={draft.skin} onChange={event => update('skin', event.target.value as UserBioProfile['skin'])}>{skinTypes.map(value => <option key={value}>{value}</option>)}</SelectField></Field>
              <Field label="Preferred approach"><ChoiceSelect value={draft.approach} labels={approaches} onChange={value => update('approach', value)} /></Field>
            </div>
            <ChoiceField label="Skin concerns" options={skinConcerns} selected={draft.concerns} onChange={values => update('concerns', values)} canClear />
            <ChoiceField label="Environmental exposures" options={exposures} selected={draft.exposures} onChange={values => update('exposures', values)} canClear />
          </>}
          {step === 3 && <>
            <p className="muted">This step is optional. Choose anything you want Vitalform to take into account. These selections stay in your browser.</p>
            <fieldset className="profile-choices"><legend>Health &amp; safety check</legend>
              <div className="choice-row">{(Object.entries(healthFlags) as [HealthFlag, string][]).map(([key, label]) => {
                const flags = draft.health ?? [];
                return <button type="button" key={key} className="choice-chip" aria-pressed={flags.includes(key)}
                  onClick={() => update('health', flags.includes(key) ? flags.filter(flag => flag !== key) : [...flags, key])}>{label}</button>;
              })}</div>
            </fieldset>
            <p className="fine-print">The plan may pause calorie changes or skin actives, suggest gentler movement, or show guidance to seek professional care.</p>
          </>}
        </motion.div>
      </AnimatePresence>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="wizard-footer"><button className="button secondary" type="button" onClick={() => step ? setStep(step - 1) : onClose()}>{step > 0 && <ArrowLeft size={16} />}{step ? 'Back' : 'Cancel'}</button>
        <button className="button primary" type="submit">{step < steps.length - 1 ? 'Continue' : 'Save my blueprint'} {step < steps.length - 1 ? <ArrowRight size={16} /> : <Check size={16} />}</button></div>
    </form>
  </Modal>;
}
