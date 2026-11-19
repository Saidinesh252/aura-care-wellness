import { Check, Pin, X } from 'lucide-react';
import { useState } from 'react';
import { localDate, type Pillar } from '../context';
import { formulaConflicts } from '../formulas';
import { createProfile } from '../profile';
import { matchProduct, products, type Product, type ProductSlot } from '../products';
import { shiftDate } from '../safety';
import { formulaHold, scheduledFormulas } from '../skinSchedule';
import { emptyJournal, useWorkspace } from '../store';

export function useProductProfile() {
  const { environment, budget, diet, skin, profile } = useWorkspace();
  return profile ?? createProfile({ environment, budget, diet, skin });
}

export function pinReplacementIds(product: Product) {
  return products.filter(item => (product.pillar === 'skin' && product.slot !== 'Treat' && item.pillar === 'skin' && item.slot === product.slot) ||
    (product.labelProtein && product.fitKey && item.fitKey === product.fitKey)).map(item => item.id);
}

function ServingLog({ product, today }: { product: Product; today: string }) {
  const { days, toggleMeal } = useWorkspace();
  const [open, setOpen] = useState(false);
  const id = `product-serving-${product.labelProtein && product.fitKey ? product.fitKey : product.id}`;
  const logged = (days[today] ?? emptyJournal).meals[id];
  const prefilled = product.serving && { name: `${product.brand} ${product.name} (${product.serving.size})`, macros: product.serving.macros };
  if (!prefilled && !product.labelProtein) return null;
  if (logged || prefilled) return <button type="button" className="button secondary" aria-pressed={!!logged} onClick={() => {
    const meal = logged ?? prefilled;
    if (meal) toggleMeal(id, meal);
  }}>{logged ? <><Check size={14} /> Logged</> : 'Log serving'}</button>;
  return <div className="label-log">
    <button type="button" className="button secondary" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? 'Close label' : 'Log from label'}</button>
    {open && <form className="label-log-form" onSubmit={event => {
      event.preventDefault();
      const values = new FormData(event.currentTarget);
      const protein = product.labelProtein ?? 0;
      toggleMeal(id, { name: `${product.brand} ${product.name} (1 serving)`, macros: {
        protein, calories: Number(values.get('calories')), carbs: Number(values.get('carbs')), fat: Number(values.get('fat')),
      } });
      setOpen(false);
    }}>
      <p>Use the amounts per serving on your current pack. Protein is {product.labelProtein} g.</p>
      {([['calories', 'Calories (kcal)', 1500], ['carbs', 'Carbs (g)', 120], ['fat', 'Fat (g)', 100]] as const).map(([key, label, max]) =>
        <label className="form-field" key={key}><span>{label}</span><input type="number" name={key} min={0} max={max} step="0.1" required /></label>)}
      <button className="button primary" type="submit">Log serving</button>
    </form>}
  </div>;
}

export function PinnedRoutine({ pillar, slot, today, time }: { pillar: Pillar; slot?: ProductSlot; today?: string; time?: 'am' | 'pm' }) {
  const profile = useProductProfile();
  const { pinnedProducts, toggleProduct, ownSkincare, skinSchedule, skinRamps, easyDay } = useWorkspace();
  const date = today ?? localDate();
  const formulas = slot === 'Treat' ? scheduledFormulas(pinnedProducts, ownSkincare, skinSchedule) : [];
  const conflicts = formulaConflicts(formulas, profile.skin === 'Sensitive');
  const pinned = products.filter(item => {
    if (item.pillar !== pillar || (slot && item.slot !== slot) || !pinnedProducts.includes(item.id) || !matchProduct(item, profile, true)) return false;
    const formula = formulas.find(entry => entry.id === item.id);
    if (!formula) return true;
    if (formulaHold(formula, profile, date, easyDay === date) || (skinRamps[item.id] && date < shiftDate(skinRamps[item.id], 10))) return false;
    if (time && formula.timing !== time && formula.timing !== 'both') return false;
    return !conflicts.some(conflict => (conflict.first.id === item.id || conflict.second.id === item.id) && (!time || conflict.times.includes(time)));
  });
  if (!pinned.length) return null;
  return <div className="pinned-routine">
    <span className="pinned-label"><Pin size={14} /> {pillar === 'skin' ? 'Pinned option for this step' : 'Pinned to this routine'}</span>
    {pinned.map(product => {
      const serving = product.serving;
      return <div className="pinned-row" key={product.id}>
        <div><strong>{product.brand} {product.name}</strong>{serving && today && <small>{serving.size} · {serving.macros.protein} g protein</small>}{pillar === 'skin' && <small>Use in place of the suggested product for this step.</small>}</div>
        <button type="button" className="plain-icon" aria-label={`Unpin ${product.name}`} onClick={() => toggleProduct(product.id)}><X size={14} /></button>
        {today && <ServingLog product={product} today={today} />}
      </div>;
    })}
  </div>;
}
