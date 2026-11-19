export type SkinTiming = 'am' | 'pm' | 'both' | 'paused';
export const skinTimingLabels: Record<SkinTiming, string> = { am: 'AM', pm: 'PM', both: 'AM & PM', paused: 'Paused' };
export const activeLabels = {
  retinoid: 'Retinol / retinoid',
  aha: 'AHA (glycolic or lactic acid)',
  bha: 'BHA (salicylic acid)',
  vitaminC: 'Vitamin C',
  benzoyl: 'Benzoyl peroxide',
  niacinamide: 'Niacinamide',
  peel: 'High-acid peel',
} as const;
export type Active = keyof typeof activeLabels;
export interface SkinRoutineEntry { id: string; name: string; active: Active; timing: SkinTiming }
export interface ScheduledFormula { id: string; name: string; actives: Active[]; timing: SkinTiming }

export function formulaActives(ingredients: string) {
  const rules: Record<Active, RegExp> = {
    retinoid: /\b(?:retin(?:ol|al|yl|oid|-a\b)|adapalene|tretinoin|tazarotene|trifarotene)/i,
    aha: /\baha\b|glycolic|lactic acid|mandelic/i,
    bha: /\bbha\b|salicylic/i,
    vitaminC: /\bvitamin[\s-]+c\b|ascorbic acid|ascorbyl/i,
    benzoyl: /\b(?:benzoyl peroxide|bpo)\b/i,
    niacinamide: /niacinamide/i,
    peel: /high.acid|peel strength|\b[2-9][0-9]\s*%\s*(?:aha|glycolic)|\b(?:aha|glycolic acid)\s*[2-9][0-9]\s*%/i,
  };
  return (Object.keys(rules) as Active[]).filter(key => rules[key].test(ingredients));
}

export function potentFormula(actives: Active[]) {
  return actives.some(active => ['retinoid', 'aha', 'bha', 'peel', 'benzoyl'].includes(active));
}

export function defaultFormulaTiming(slot: string): SkinTiming {
  if (slot === 'Treat') return 'pm';
  if (slot === 'Protect') return 'am';
  return 'both';
}

type ConflictKind = 'retinoid-acid' | 'vitamin-benzoyl' | 'sensitive-peel';
export interface FormulaConflict { first: ScheduledFormula; second: ScheduledFormula; kind: ConflictKind; reason: string; times: ('am' | 'pm')[] }
const includesTime = (timing: SkinTiming, time: 'am' | 'pm') => timing === time || timing === 'both';

export function formulaConflicts(items: ScheduledFormula[], sensitive: boolean) {
  const conflicts: FormulaConflict[] = [];
  const schedules: ('am' | 'pm')[] = ['am', 'pm'];
  items.forEach((first, index) => items.slice(index + 1).forEach(second => {
    const times = schedules.filter(time => includesTime(first.timing, time) && includesTime(second.timing, time));
    if (!times.length) return;
    const pair = (left: Active[], right: Active[]) =>
      (first.actives.some(active => left.includes(active)) && second.actives.some(active => right.includes(active))) ||
      (second.actives.some(active => left.includes(active)) && first.actives.some(active => right.includes(active)));
    if (pair(['retinoid'], ['aha', 'bha', 'peel'])) conflicts.push({ first, second, times, kind: 'retinoid-acid', reason: 'Layering a retinoid and an exfoliating acid can increase irritation. Follow each label and ask your prescriber before combining if one is prescribed.' });
    else if (pair(['vitaminC'], ['benzoyl'])) conflicts.push({ first, second, times, kind: 'vitamin-benzoyl', reason: 'Separate vitamin C and benzoyl peroxide as a precaution. Compatibility depends on the specific formulas.' });
    else if (sensitive && pair(['niacinamide'], ['peel'])) conflicts.push({ first, second, times, kind: 'sensitive-peel', reason: 'A strong acid peel can irritate sensitive skin. Pause the peel while you assess tolerance.' });
  }));
  return conflicts;
}

export function splitFormulas(items: ScheduledFormula[], sensitive: boolean) {
  const next = items.map(item => ({ ...item }));
  for (let round = 0; round < next.length * 3; round++) {
    const conflict = formulaConflicts(next, sensitive)[0];
    if (!conflict) break;
    const { first, second, kind } = conflict;
    if (kind === 'sensitive-peel') {
      const peel = first.actives.includes('peel') ? first : second;
      peel.timing = 'paused';
    } else if (kind === 'retinoid-acid') {
      const acidActives: Active[] = ['aha', 'bha', 'peel'];
      const firstIsRetinoid = first.actives.includes('retinoid') && second.actives.some(active => acidActives.includes(active));
      const [retinoid, acid] = firstIsRetinoid ? [first, second] : [second, first];
      retinoid.timing = 'pm';
      acid.timing = sensitive || acid.actives.includes('peel') ? 'paused' : 'am';
    } else {
      const firstIsVitamin = first.actives.includes('vitaminC') && second.actives.includes('benzoyl');
      const [vitamin, benzoyl] = firstIsVitamin ? [first, second] : [second, first];
      vitamin.timing = 'am';
      benzoyl.timing = 'pm';
    }

    const remaining = formulaConflicts(next, sensitive).some(item => item.first.id === first.id && item.second.id === second.id);
    if (remaining) second.timing = 'paused';
  }
  for (const conflict of formulaConflicts(next, sensitive)) conflict.second.timing = 'paused';
  return Object.fromEntries(next.map(entry => [entry.id, entry.timing]));
}
