import { type UserBioProfile } from './profile';
import { products } from './products';
import { defaultFormulaTiming, formulaActives, potentFormula, type ScheduledFormula, type SkinRoutineEntry, type SkinTiming } from './formulas';
import { safetyFor } from './safety';

export function scheduledFormulas(pinnedProducts: string[], ownSkincare: SkinRoutineEntry[], timings: Record<string, SkinTiming>): ScheduledFormula[] {
  const pinned = products.flatMap(product => {
    if (!pinnedProducts.includes(product.id) || product.pillar !== 'skin' || product.slot !== 'Treat') return [];
    const actives = formulaActives(product.spec.join(' '));
    return [{ id: product.id, name: `${product.brand} ${product.name}`, actives, timing: timings[product.id] ?? defaultFormulaTiming(product.slot) }];
  });
  return [...pinned, ...ownSkincare.map(entry => ({ ...entry, actives: [entry.active], timing: timings[entry.id] ?? entry.timing }))];
}

export function formulaHold(entry: ScheduledFormula, profile: UserBioProfile | null, today: string, easy: boolean, sensitive = profile?.skin === 'Sensitive') {
  if (entry.timing === 'paused') return 'Paused in your schedule';
  if (easy) return 'Paused for today’s minimum routine';
  if (safetyFor(profile, today).gentleSkin) return 'Paused for your skin safety settings';
  if (profile && profile.age < 20 && potentFormula(entry.actives)) return 'Ask a clinician about strong actives for this age group';
  if (sensitive && entry.actives.includes('peel')) return 'High-acid peels are held for sensitive skin';
}
