import { type Budget, type Environment, type Macros, type Preference, type SkinType } from './context';
import { safetyFor, type HealthFlag } from './safety';

export const activityLevels = {
  sedentary: { label: 'Sedentary', detail: 'Mostly seated', factor: 1.2, water: 0 },
  light: { label: 'Lightly active', detail: '1–3 days a week', factor: 1.375, water: 150 },
  moderate: { label: 'Moderately active', detail: '3–5 days a week', factor: 1.55, water: 250 },
  very: { label: 'Very active', detail: '6–7 days a week', factor: 1.725, water: 400 },
} as const;

export const fitnessGoals = {
  loss: 'Fat loss', gain: 'Lean muscle gain', recomp: 'Body recomposition', maintenance: 'Sustained energy & maintenance',
} as const;
export const exclusions = ['Dairy / lactose', 'Gluten', 'Nuts', 'Soy', 'Seafood'] as const;
export const skinConcerns = ['Acne & breakouts', 'Dark spots / hyperpigmentation', 'Tanning / sun damage', 'Dullness & uneven texture', 'Fine lines', 'Dark circles'] as const;
export const exposures = ['Hard water', 'High outdoor sun / UV', 'Urban pollution', 'High AC / dry air'] as const;
export const approaches = { natural: 'Natural / home care', clinical: 'Pharmacy / clinical', hybrid: 'Hybrid' } as const;
export type FitnessGoal = keyof typeof fitnessGoals;
export type Exclusion = typeof exclusions[number];
export type SkinConcern = typeof skinConcerns[number];
export type Exposure = typeof exposures[number];
export type Approach = keyof typeof approaches;

export interface UserBioProfile {
  age: number;
  sex: 'female' | 'male' | 'private';
  heightCm: number;
  weightKg: number;
  targetKg: number;
  heightUnit: 'cm' | 'imperial';
  weightUnit: 'kg' | 'lb';
  activity: keyof typeof activityLevels;
  goal: FitnessGoal;
  environment: Environment;
  budget: Budget;
  diet: Preference;
  exclusions: Exclusion[];
  skin: SkinType;
  concerns: SkinConcern[];
  exposures: Exposure[];
  approach: Approach;
  health?: HealthFlag[];
  skinHoldUntil?: string;
}

export function createProfile(context: Pick<UserBioProfile, 'environment' | 'budget' | 'diet' | 'skin'>): UserBioProfile {
  return {
    ...context, age: 0, sex: 'private', heightCm: 0, weightKg: 0, targetKg: 0,
    heightUnit: 'cm', weightUnit: 'kg', activity: 'light', goal: 'maintenance', exclusions: [],
    concerns: [], exposures: [], approach: 'hybrid', health: [],
  };
}

export const inchesPerCm = 1 / 2.54;
export const poundsPerKg = 2.2046226218;

export function hasBiometrics(profile: UserBioProfile) {
  return Number.isInteger(profile.age) && profile.age >= 14 && profile.age <= 110 &&
    profile.heightCm >= 120 && profile.heightCm <= 230 &&
    profile.weightKg >= 30 && profile.weightKg <= 300;
}

export interface CalculatedMacros {
  bmi: number;
  bmiBand: string | null;
  bmr: number | null;
  tdee: number | null;
  bmrRange: [number, number] | null;
  hydrationMl: number | null;
  targets: Macros | null;
  energyNote: string;
}

export function calculateProfile(profile: UserBioProfile): CalculatedMacros | null {
  if (!hasBiometrics(profile)) return null;
  const { age, weightKg, heightCm, sex, activity, goal, targetKg } = profile;
  const bmi = weightKg / (heightCm / 100) ** 2;
  if (age < 20) return {
    bmi, bmiBand: null, bmr: null, tdee: null, bmrRange: null, hydrationMl: null, targets: null,
    energyNote: 'This blueprint uses general meals and movement for ages 14–19. BMI interpretation at these ages uses age- and sex-specific growth charts.',
  };
  const bmiBand = bmi < 18.5 ? 'Below adult reference range' : bmi < 25 ? 'Within adult reference range' : bmi < 30 ? 'Above adult reference range' : 'Adult BMI 30 or higher';
  if (age >= 80) return {
    bmi, bmiBand, bmr: null, tdee: null, bmrRange: null, hydrationMl: null, targets: null,
    energyNote: 'At age 80 and above, Vitalform offers general meal ideas. A clinician or dietitian can help set personalized intake and fluid goals.',
  };
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  const bmr = base + (sex === 'female' ? -161 : sex === 'male' ? 5 : -78);
  const tdee = bmr * activityLevels[activity].factor;
  const safety = safetyFor(profile);
  if (safety.generalNutrition) return {
    bmi, bmiBand, bmr: null, tdee: null, bmrRange: null, hydrationMl: null, targets: null,
    energyNote: 'Your plan provides meal ideas. Set individual calorie, carbohydrate and fluid targets with your care team.',
  };
  const validLoss = bmi >= 20 && targetKg / (heightCm / 100) ** 2 >= 18.5 && targetKg < weightKg - 1;
  const validGain = targetKg > weightKg + 1;
  const requestedChange = goal === 'loss' || goal === 'gain';
  const change = safety.steadyEnergy ? 0 : goal === 'loss' && validLoss ? -Math.min(300, tdee * .12) : goal === 'gain' && validGain ? Math.min(250, tdee * .10) : 0;
  const calories = Math.max(1200, Math.round((tdee + change) / 10) * 10);
  const referenceKg = Math.min(weightKg, 27.5 * (heightCm / 100) ** 2);
  const protein = Math.round(Math.min(calories * .25 / 4, referenceKg * (goal === 'maintenance' ? 1.2 : 1.5)));
  const fat = Math.round(calories * .28 / 9);
  const carbs = Math.round((calories - protein * 4 - fat * 9) / 4);
  const hydrationMl = Math.round(Math.min(3500, weightKg * 35 + activityLevels[activity].water) / 50) * 50;
  const privacy = sex === 'private' ? ' Energy estimates use the midpoint of the two Mifflin–St Jeor equation variants.' : '';
  return {
    bmi, bmiBand, bmr: Math.round(bmr), tdee: Math.round(tdee),
    bmrRange: sex === 'private' ? [Math.round(base - 161), Math.round(base + 5)] : null,
    hydrationMl, targets: { calories, protein, fat, carbs },
    energyNote: (safety.steadyEnergy ? 'Weight-change adjustments are paused for your health settings. These are general maintenance estimates.' : requestedChange && change === 0
      ? 'This plan uses maintenance calories because the current and target weights do not support the selected adjustment.'
      : 'Calories, macros and hydration are planning estimates. Hydration includes an activity allowance and is capped at 3.5 L in this planner.') + privacy,
  };
}
