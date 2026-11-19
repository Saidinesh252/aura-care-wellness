export const environments = {
  home: { label: 'At Home', short: 'Home', detail: 'Full kitchen, private bathroom and space to move' },
  pg: { label: 'PG / Hostel', short: 'PG / Hostel', detail: 'No stove, a shared bathroom and quiet movement' },
  office: { label: 'Office / Travel', short: 'Office', detail: 'Portable meals, pocket essentials and desk breaks' },
  gym: { label: 'Gym / Studio', short: 'Gym', detail: 'Commercial equipment, a shower and portable meals' },
} as const;

export const budgets = {
  zero: { label: 'Zero-Cost / DIY', short: 'Zero-Cost / DIY', minimum: 0, maximum: 500 },
  student: { label: 'Student / Smart Budget', short: 'Smart Budget', minimum: 500, maximum: 2000 },
  mid: { label: 'Mid-Range Enthusiast', short: 'Mid-Range', minimum: 2000, maximum: 7000 },
  luxury: { label: 'Luxury / Clinical', short: 'Luxury', minimum: 7000, maximum: null },
} as const;

export const pillars = { skin: 'Skincare', fitness: 'Body & Fitness', diet: 'Diet & Hydration' } as const;
export const goals = ['Acne / Glow', 'Fat Loss', 'Muscle Gain', 'Sustained Energy'] as const;
export const skinTypes = ['Oily', 'Dry', 'Combination', 'Normal', 'Sensitive'] as const;
export const preferences = ['Omnivore', 'Vegetarian', 'Eggetarian', 'Vegan', 'Jain / Satvik'] as const;

export type Environment = keyof typeof environments;
export type Budget = keyof typeof budgets;
export type Pillar = keyof typeof pillars;
export type Page = 'dashboard' | 'blueprint' | 'gear' | 'family' | 'settings' | 'ergonomics' | Pillar;
export type Goal = (typeof goals)[number];
export type SkinType = (typeof skinTypes)[number];
export type Preference = (typeof preferences)[number];
export type Currency = 'INR' | 'USD';

export interface Macros { protein: number; carbs: number; fat: number; calories: number }
export const zeroMacros: Macros = { protein: 0, carbs: 0, fat: 0, calories: 0 };
export const macroGoals: Macros = { protein: 100, carbs: 250, fat: 65, calories: 2000 };
export const waterGoal = 2000;
export const tiers = Object.keys(budgets) as Budget[];
export const places = Object.keys(environments) as Environment[];

export function price(amount: number, currency: Currency, decimals = false) {
  const usd = currency === 'USD';
  return new Intl.NumberFormat(usd ? 'en-US' : 'en-IN', {
    style: 'currency', currency, maximumFractionDigits: usd && decimals ? 2 : 0,
    minimumFractionDigits: usd && decimals ? 2 : 0,
  }).format(usd ? amount / 93.5 : amount);
}

export function budgetRange(tier: Budget, currency: Currency) {
  const { minimum, maximum } = budgets[tier];
  return maximum === null ? `${price(minimum, currency)}+` : `${price(minimum, currency)}–${price(maximum, currency)}`;
}

export function localDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export interface DiscoveryItem {
  id: string;
  pillar: Pillar;
  page?: Page;
  title: string;
  description: string;
  minutes: number;
  amount: number;
  tags: Goal[];
  target: string;
}
