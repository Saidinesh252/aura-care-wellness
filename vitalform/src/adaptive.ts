import { type Macros } from './context';
import { type Meal, type Slot } from './nutrition';
import { calculateProfile, type UserBioProfile } from './profile';
import { safetyFor, shiftDate } from './safety';

export const mealSlots: Slot[] = ['Breakfast', 'Lunch', 'Snack', 'Dinner'];
export const skinReactions = ['Calm', 'Breakouts', 'Irritated', 'Dry / tight'] as const;
export const digestionOptions = ['Comfortable', 'Still hungry', 'Uncomfortably full', 'Digestive discomfort'] as const;
export interface WeeklyCheckIn {
  date: string; weightKg: number; energy: number;
  digestion: typeof digestionOptions[number]; skin: typeof skinReactions[number];
}
export interface LoggedMeal {
  name: string; macros: Macros; slot?: Slot; unplanned?: boolean;
}
export interface Journal {
  water: number; habits: Partial<Record<'am' | 'pm' | 'workout', boolean>>; meals: Record<string, LoggedMeal>;
}

export const outsideMeals = [
  { name: '2 aloo parathas + plain curd', macros: { calories: 560, protein: 16, carbs: 76, fat: 21 }, ingredient: 'Contains wheat and dairy.' },
  { name: 'Chicken biryani, one large plate', macros: { calories: 690, protein: 27, carbs: 88, fat: 25 }, ingredient: 'Ask the kitchen about dairy and nuts.' },
  { name: 'Mess dal, rice and vegetable plate', macros: { calories: 510, protein: 16, carbs: 83, fat: 12 }, ingredient: 'Confirm ingredients and oil with the kitchen.' },
  { name: '2 idlis with sambar', macros: { calories: 300, protein: 11, carbs: 55, fat: 5 }, ingredient: 'Check accompaniments for allergens.' },
] as const;

export function identifyMeal(text: string) {
  const query = text.toLowerCase();
  if (/(?:\b2\b|\btwo\b).*paratha/.test(query) && /curd|dahi|yogurt/.test(query)) return outsideMeals[0];
  if (/chicken/.test(query) && /biryani/.test(query)) return outsideMeals[1];
  if (/\bdal\b/.test(query) && /\brice\b/.test(query)) return outsideMeals[2];
  if (/\bidlis?\b/.test(query) && /(?:\b2\b|\btwo\b)/.test(query) && /sambar/.test(query)) return outsideMeals[3];
}

export function nextCheckIn(checkIns: WeeklyCheckIn[], started: string | null, today: string) {
  const last = checkIns.map(item => item.date).sort().at(-1) ?? started ?? today;
  return shiftDate(last, 7);
}

export function plateauSuggestion(profile: UserBioProfile, checkIns: WeeklyCheckIn[]) {
  const safety = safetyFor(profile);
  if (profile.age < 20 || profile.goal !== 'loss' || safety.steadyEnergy || safety.lowImpact) return null;
  const entries = [...checkIns].sort((a, b) => a.date.localeCompare(b.date)).slice(-3);
  if (entries.length < 3 || entries[2].date < shiftDate(entries[0].date, 14) || entries[2].energy < 3) return null;
  const weights = entries.map(item => item.weightKg);
  const metrics = calculateProfile(profile);
  if (!metrics || metrics.bmi < 22 || Math.max(...weights) - Math.min(...weights) > .5 || profile.weightKg - profile.targetKg < 2) return null;
  return 'Your last three check-ins show a steady weight trend. If walking is comfortable, try gradually adding a short walk, up to roughly 2,000 additional steps. Keep your current meal plan while you review the trend.';
}

export function inferredSlot(id: string, entry: LoggedMeal) {
  return entry.slot ?? mealSlots.find(slot => id.endsWith(`-${slot}`) || id.includes(`-${slot}-`));
}

export function carbPortionNotice(meal: Meal) {
  return meal.macros.carbs >= 55 || meal.ingredients.some(([food, grams]) => ['ricePack', 'murmura', 'bread'].includes(food) && grams >= 65);
}

export interface DayAdjustment { through: number; factor: number; message: string }
export function rebalanceDay(journal: Journal | undefined, target: Macros | null) {
  const entries = Object.entries(journal?.meals ?? {});
  if (!entries.some(([, entry]) => entry.unplanned)) return null;
  const loggedSlots = new Map<number, number>();
  entries.forEach(([id, entry]) => {
    const slot = inferredSlot(id, entry);
    if (!slot) return;
    const index = mealSlots.indexOf(slot);
    loggedSlots.set(index, (loggedSlots.get(index) ?? 0) + entry.macros.calories);
  });
  const through = Math.max(-1, ...loggedSlots.keys());
  const consumed = [...loggedSlots.values()].reduce((total, calories) => total + calories, 0);
  const remainingSlots = mealSlots.length - 1 - through;
  const shares = [.24, .30, .16, .30];
  const standardRemaining = shares.slice(through + 1).reduce((sum, share) => sum + share, 0) * (target?.calories ?? 0);
  const expectedConsumed = [...loggedSlots.keys()].reduce((sum, index) => sum + shares[index], 0) * (target?.calories ?? 0);
  const factor = target?.calories && remainingSlots > 0 && through >= 0
    ? Math.max(.87, Math.min(1.12, 1 + (expectedConsumed - consumed) / standardRemaining * .5)) : 1;
  const message = remainingSlots === 0 ? 'Your meal is logged. Pick up your usual routine tomorrow.'
    : factor < .99 ? 'Later meal portions were adjusted slightly. Keep your regular meal times and eat to comfortable fullness.'
    : factor > 1.01 ? 'Later meals have slightly fuller portions. Use them as options and check in with your appetite.'
    : 'Your meal is logged. Keep your usual meals for the rest of the day.';
  return { through, factor, message } satisfies DayAdjustment;
}

export function recentCalorieAverage(days: Record<string, Journal>, today: string) {
  const firstDate = shiftDate(today, -6);
  const reports = Object.entries(days).filter(([date, journal]) => date >= firstDate && date <= today && Object.keys(journal.meals).length);
  if (!reports.length) return null;
  const total = reports.reduce((sum, [, journal]) => sum + Object.values(journal.meals).reduce((subtotal, entry) => subtotal + entry.macros.calories, 0), 0);
  return { days: reports.length, calories: Math.round(total / reports.length) };
}
