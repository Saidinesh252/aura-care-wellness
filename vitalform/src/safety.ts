import { localDate, type Pillar } from './context';
import { type UserBioProfile } from './profile';

export const healthFlags = {
  pcos: 'PCOS / PCOD',
  thyroid: 'Thyroid condition',
  diabetes: 'Diabetes / insulin resistance',
  hypertension: 'High blood pressure',
  joints: 'Knee, joint or back pain',
  pregnancy: 'Pregnant / nursing',
  acne: 'Severe or painful cystic acne',
  eczema: 'Eczema / impaired skin barrier',
} as const;
export type HealthFlag = keyof typeof healthFlags;

export function shiftDate(day: string, count: number) {
  const date = new Date(`${day}T12:00:00`);
  date.setDate(date.getDate() + count);
  return localDate(date);
}

export function safetyFor(profile: UserBioProfile | null, today = localDate()) {
  const flags = new Set(profile?.health ?? []);
  const pregnancy = flags.has('pregnancy');
  const diabetes = flags.has('diabetes');
  const hypertension = flags.has('hypertension');
  const lowImpact = flags.has('joints') || hypertension || pregnancy;
  const holdUntil = profile?.skinHoldUntil;
  const barrierHold = holdUntil !== undefined && today < holdUntil;
  const gentleSkin = pregnancy || flags.has('eczema') || flags.has('acne') || barrierHold;
  const generalNutrition = pregnancy || diabetes;
  const steadyEnergy = generalNutrition || flags.has('pcos') || flags.has('thyroid') || hypertension;
  const guidance: { pillar: Pillar; text: string; href?: string; source?: string }[] = [];
  if (diabetes) guidance.push({ pillar: 'diet', text: 'This plan keeps regular meals and flags carbohydrate portions to review. Use your diabetes care team’s carbohydrate, medication and meal-timing plan.', href: 'https://diabetes.org/food-nutrition/eating-healthy', source: 'American Diabetes Association' });
  if (hypertension) guidance.push({ pillar: 'diet', text: 'Check sodium on the label for prepared foods, sauces and drinks. Use your care team’s targets for sodium and fluids.', href: 'https://www.nhlbi.nih.gov/health/dash-eating-plan', source: 'NHLBI DASH eating plan' });
  if (pregnancy) guidance.push({ pillar: 'diet', text: 'Pregnancy and nursing needs vary. This plan uses general meals and leaves calorie, fluid and supplement targets to your care team.', href: 'https://www.acog.org/womens-health/faqs/nutrition-during-pregnancy', source: 'ACOG nutrition guidance' });
  if (steadyEnergy && !generalNutrition) guidance.push({ pillar: 'diet', text: 'Automatic weight-change adjustments are paused. Discuss calorie changes or supplements with your care team.' });
  if (lowImpact) guidance.push({ pillar: 'fitness', text: pregnancy ? 'Check movement choices with your maternity care team. The app uses a gentle, equipment-free option.' : 'High-impact and loaded intervals are replaced with gentle movement. Skip anything that increases pain or symptoms.', href: 'https://www.cdc.gov/arthritis/prevention/', source: 'CDC joint-friendly physical activity' });
  if (flags.has('acne')) guidance.push({ pillar: 'skin', text: 'Deep, painful or scarring breakouts deserve a board-certified dermatologist’s assessment. The routine pauses optional exfoliants and actives.', href: 'https://www.aad.org/public/diseases/acne/derm-treat/severe-acne', source: 'AAD severe acne guidance' });
  if (flags.has('eczema')) guidance.push({ pillar: 'skin', text: 'Gentle cleansing and fragrance-free moisturizer take priority. Discuss persistent flares or worsening symptoms with a clinician.', href: 'https://www.aad.org/public/diseases/eczema/types/atopic-dermatitis/atopic-dermatitis-coping', source: 'AAD eczema skin care' });
  if (pregnancy) guidance.push({ pillar: 'skin', text: 'Optional strong actives are paused in this app. Ask your maternity clinician before changing a treatment or using a retinoid.', href: 'https://www.acog.org/womens-health/faqs/skin-conditions-during-pregnancy', source: 'ACOG skin care guidance' });
  if (barrierHold) guidance.push({ pillar: 'skin', text: `Barrier care is active through ${shiftDate(holdUntil, -1)}. Get advice if irritation persists before resuming a product.` });
  return { lowImpact, gentleSkin, barrierHold, generalNutrition, steadyEnergy, diabetes, hypertension, pregnancy, guidance };
}
