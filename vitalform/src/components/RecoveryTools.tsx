import { ArrowRight, CalendarCheck, Check, Leaf, Plus, Soup, Zap } from 'lucide-react';
import { useState } from 'react';
import { digestionOptions, identifyMeal, mealSlots, nextCheckIn, outsideMeals, plateauSuggestion, recentCalorieAverage, skinReactions } from '../adaptive';
import { type Macros } from '../context';
import { type Slot } from '../nutrition';
import { mealAdjustment } from '../personalizedNutrition';
import { hasBiometrics, poundsPerKg, type UserBioProfile } from '../profile';
import { safetyFor } from '../safety';
import { useWorkspace } from '../store';
import { Modal, SelectField } from './Shared';

const metricFields = { calories: 'Calories (kcal)', protein: 'Protein (g)', carbs: 'Carbs (g)', fat: 'Fat (g)' } as const;
type DraftMacros = Record<keyof Macros, string>;
const emptyMacros: DraftMacros = { calories: '', protein: '', carbs: '', fat: '' };

export function OutsideMealModal({ onClose }: { onClose: () => void }) {
  const saveOutsideMeal = useWorkspace(state => state.saveOutsideMeal);
  const [meal, setMeal] = useState('');
  const [slot, setSlot] = useState<Slot>('Lunch');
  const [macros, setMacros] = useState<DraftMacros>(emptyMacros);
  const [detail, setDetail] = useState('');
  function fill(preset: typeof outsideMeals[number]) {
    setMeal(preset.name);
    setMacros({ calories: String(preset.macros.calories), protein: String(preset.macros.protein), carbs: String(preset.macros.carbs), fat: String(preset.macros.fat) });
    setDetail(`Example portions only. ${preset.ingredient}`);
  }
  return <Modal title="Log an outside or mess meal" variant="wizard" onClose={onClose}>
    <p className="muted">Tell us what you ate. Vitalform can adjust the later meal ideas while keeping your regular meal schedule.</p>
    <div className="choice-row quick-meals" aria-label="Meal examples">{outsideMeals.map(item => <button key={item.name} className="choice-chip" onClick={() => fill(item)}>{item.name}</button>)}</div>
    <form onSubmit={event => {
      event.preventDefault();
      if (!meal.trim()) return;
      saveOutsideMeal({ name: meal.trim(), slot, macros: { calories: +macros.calories, protein: +macros.protein, carbs: +macros.carbs, fat: +macros.fat } });
      onClose();
    }}>
      <div className="recovery-field-row"><label className="form-field"><span>What did you eat?</span><input type="text" value={meal} maxLength={180} required onChange={event => { setMeal(event.target.value); setDetail(''); }} placeholder="e.g., 2 aloo parathas and curd" /></label>
        <button type="button" className="button secondary" onClick={() => {
          const preset = identifyMeal(meal);
          if (preset) fill(preset);
          else setDetail('No close example. Enter the label or your best portion estimate below.');
        }}>Find estimate</button>
      </div>
      <label className="form-field recovery-meal-slot"><span>Meal slot</span><SelectField value={slot} onChange={event => setSlot(event.target.value as Slot)}>
        {mealSlots.map(item => <option key={item}>{item}</option>)}
      </SelectField></label>
      <div className="recovery-macro-fields">{(Object.entries(metricFields) as [keyof Macros, string][]).map(([key, label]) =>
        <label key={key} className="form-field"><span>{label}</span><input type="number" min={key === 'calories' ? 1 : 0} max={key === 'calories' ? 8000 : 600} step=".1" value={macros[key]} required onChange={event => setMacros({ ...macros, [key]: event.target.value })} /></label>
      )}</div>
      <p className="fine-print" aria-live="polite">{detail || 'Enter serving estimates. Logging this slot again updates your outside meal entry.'}</p>
      <div className="wizard-footer"><button className="button secondary" type="button" onClick={onClose}>Cancel</button><button className="button primary" type="submit">Log and update my day <Check size={16} /></button></div>
    </form>
  </Modal>;
}

export function CheckInModal({ profile, today, onClose }: { profile: UserBioProfile; today: string; onClose: () => void }) {
  const { checkIns, saveCheckIn } = useWorkspace();
  const existing = checkIns.find(item => item.date === today);
  const unit = profile.weightUnit === 'lb' ? poundsPerKg : 1;
  const [weight, setWeight] = useState(String(Math.round((existing?.weightKg ?? profile.weightKg) * unit * 10) / 10));
  const [energy, setEnergy] = useState(existing?.energy ?? 3);
  const [digestion, setDigestion] = useState<typeof digestionOptions[number]>(existing?.digestion ?? 'Comfortable');
  const [skin, setSkin] = useState<typeof skinReactions[number]>(existing?.skin ?? 'Calm');
  const [error, setError] = useState('');
  return <Modal title="Weekly 60-second check-in" variant="wizard" onClose={onClose}>
    <p className="muted">A snapshot of a regular week helps the plan respond to how you feel.</p>
    <form onSubmit={event => {
      event.preventDefault();
      const kg = Number(weight) / unit;
      if (kg < 30 || kg > 300 || !Number.isFinite(kg)) { setError('Enter a current weight within the supported range.'); return; }
      saveCheckIn({ date: today, weightKg: kg, energy, digestion, skin });
      onClose();
    }}>
      <div className="wizard-grid">
        <label className="form-field"><span>Current weight ({profile.weightUnit})</span><input type="number" min={Math.ceil(30 * unit * 10) / 10} max={Math.floor(300 * unit * 10) / 10} step=".1" required value={weight} onChange={event => setWeight(event.target.value)} /></label>
        <label className="form-field"><span>Energy · {energy} of 5</span><input className="energy-range" type="range" min={1} max={5} value={energy} onChange={event => setEnergy(Number(event.target.value))} /></label>
        <label className="form-field"><span>Digestion and satiety</span><SelectField value={digestion} onChange={event => setDigestion(event.target.value as typeof digestion)}>{digestionOptions.map(option => <option key={option}>{option}</option>)}</SelectField></label>
        <label className="form-field"><span>Skin reaction</span><SelectField value={skin} onChange={event => setSkin(event.target.value as typeof skin)}>{skinReactions.map(option => <option key={option}>{option}</option>)}</SelectField></label>
      </div>
      {(skin === 'Irritated' || skin === 'Dry / tight') && <p className="fine-print">Saving this check-in pauses optional actives for four days and switches your skincare to gentle barrier care.</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="wizard-footer"><button className="button secondary" type="button" onClick={onClose}>Cancel</button><button className="button primary">Save check-in <Check size={16} /></button></div>
    </form>
  </Modal>;
}

export function RecoveryPanel({ today, onMeal, onCheckIn, onProfile }: { today: string; onMeal: () => void; onCheckIn: () => void; onProfile: () => void }) {
  const { easyDay, toggleEasyDay, profile, checkIns, profileStarted } = useWorkspace();
  const easy = easyDay === today;
  const next = nextCheckIn(checkIns, profileStarted, today);
  const profileReady = profile !== null && hasBiometrics(profile);
  const due = profileReady && today >= next;
  const latest = checkIns.at(-1);
  const advice = profile && plateauSuggestion(profile, checkIns);
  return <section className="recovery-panel dashboard-section" aria-labelledby="recovery-title">
    <div className="section-head"><div><h2 id="recovery-title">Make today work</h2><p>Adjust your plan when your day changes.</p></div></div>
    <div className="recovery-grid">
      <button className="recovery-action card recovery-easy" onClick={() => toggleEasyDay(today)} aria-pressed={easy}><span><Leaf size={21} /></span><div><strong>{easy ? 'Minimum routine is on' : 'Having a tough day?'}</strong><small>{easy ? 'Tap to return to your usual plan' : 'Short mobility and simple skin care'}</small></div><span className="recovery-switch" /></button>
      <button className="recovery-action card" onClick={onMeal}><span><Soup size={21} /></span><div><strong>Log a mess or takeaway meal</strong><small>Update what’s left of today’s plan</small></div><Plus size={16} /></button>
      <button className="recovery-action card" onClick={profileReady ? onCheckIn : onProfile}><span><CalendarCheck size={21} /></span><div><strong>{due ? 'Weekly check-in due' : 'Weekly check-in'}</strong><small>{profileReady ? due ? 'Take 60 seconds to update your plan' : `Next reminder ${next}` : 'Set up your bio-profile to begin'}</small></div><ArrowRight size={16} /></button>
    </div>
    {latest && <p className="fine-print recovery-summary"><Zap size={14} /> Last check-in {latest.date} · Energy {latest.energy}/5 · {latest.skin} skin · {latest.digestion}</p>}
    {latest && latest.energy <= 2 && !easy && <p className="recovery-advice">Your last check-in recorded low energy. Try today’s minimum routine if a shorter session feels right.</p>}
    {advice && <p className="recovery-advice">{advice}</p>}
  </section>;
}

export function MealRecoveryNote({ today, onMeal }: { today: string; onMeal: () => void }) {
  const { profile, days } = useWorkspace();
  const adjustment = mealAdjustment(profile, days[today]);
  const week = recentCalorieAverage(days, today);
  return <aside className="meal-recovery-note">
    <div><span><Soup size={18} /> Outside or mess meal</span><p>{adjustment?.message ?? 'Log food from your mess, a restaurant or a takeaway.'}</p>
      {week && !safetyFor(profile).generalNutrition && (!profile || profile.age >= 20) && <small>{week.calories.toLocaleString()} kcal average across {week.days} logged {week.days === 1 ? 'day' : 'days'} this week. Partial logs can undercount meals.</small>}</div>
    <button className="button secondary" onClick={onMeal}><Plus size={15} /> Log outside meal</button>
  </aside>;
}
