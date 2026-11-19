import { activityLevels, type UserBioProfile } from './profile';

export interface Evidence {
  tier: 1 | 2 | 3 | null;
  title: string; summary: string; source?: string; href?: string;
}
export const evidence = {
  bmi: { tier: null, title: 'BMI screening estimate', summary: 'BMI is weight in kg divided by height in meters squared. The app uses adult reference categories from age 20. Younger users need an age- and sex-specific interpretation.', source: 'CDC adult BMI categories', href: 'https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html' },
  bmr: { tier: 2, title: 'Resting energy estimate', summary: 'The Mifflin–St Jeor equation estimates resting energy expenditure from age, height and weight.', source: 'Mifflin et al., American Journal of Clinical Nutrition', href: 'https://pubmed.ncbi.nlm.nih.gov/2305711/' },
  tdee: { tier: null, title: 'Daily energy expenditure estimate', summary: 'Vitalform multiplies estimated resting energy by an activity factor. The factor is a planning assumption and the result varies with actual activity.', source: 'Mifflin et al., resting energy equation', href: 'https://pubmed.ncbi.nlm.nih.gov/2305711/' },
  calories: { tier: 1, title: 'Energy balance and weight goals', summary: 'Energy intake and expenditure affect weight over time. The app applies a conservative change to the estimate only when age, health settings and target weight support it.', source: 'CDC healthy weight guidance', href: 'https://www.cdc.gov/healthy-weight-growth/losing-weight/index.html' },
  protein: { tier: 2, title: 'Protein and resistance training', summary: 'Research in healthy adults suggests protein can support strength training adaptations. Vitalform uses its own capped planning formula.', source: 'Morton et al., British Journal of Sports Medicine', href: 'https://pubmed.ncbi.nlm.nih.gov/28698222/' },
  carbs: { tier: null, title: 'Carbohydrate estimate', summary: 'Carbohydrates receive the energy remaining after protein and fat are allocated. Diet composition varies with food preferences, exercise demands and clinical needs.', source: 'ADA nutrition and wellness', href: 'https://professional.diabetes.org/clinical-support/nutrition-wellness' },
  fats: { tier: null, title: 'Fat distribution estimate', summary: 'The planner estimates fat grams by allocating 28% of energy, then dividing by 9 kcal per gram. This is a planning choice.' },
  water: { tier: null, title: 'Hydration planning estimate', summary: 'Vitalform uses a body-weight estimate plus an activity allowance. Fluid needs vary with environment, foods, activity and health conditions.' },
  plate: { tier: 1, title: 'Balanced meal planning', summary: 'A meal can combine vegetables, protein and a portion of carbohydrate-rich food. Ingredient portions and macro values in Vitalform are estimates.', source: 'American Diabetes Association plate guide', href: 'https://professional.diabetes.org/sites/dpro/files/2024-01/plan_your_plate.pdf' },
  mobility: { tier: 1, title: 'Low-impact movement', summary: 'Comfortable, low-impact activity can help people stay active with joint symptoms. Adjust the range and pace to how you feel.', source: 'CDC joint-friendly physical activity', href: 'https://www.cdc.gov/arthritis/prevention/' },
  progression: { tier: 1, title: 'Progressive resistance training', summary: 'Regular resistance training supports strength. Increase challenge gradually while keeping movements controlled and recovery manageable.', source: 'ACSM resistance training position stand', href: 'https://acsm.org/resistance-training-guidelines-update-2026/' },
  bands: { tier: 2, title: 'Elastic resistance training', summary: 'Elastic bands can improve strength. Tension, repetitions and setup vary with the individual and the exercise.', source: 'Lopes et al., systematic review and meta-analysis', href: 'https://pubmed.ncbi.nlm.nih.gov/30815258/' },
  skin: { tier: 1, title: 'Gentle barrier care', summary: 'Gentle cleansing and regular moisturizing support the skin barrier. Fragrance-free products can be a good starting point for sensitive skin.', source: 'AAD eczema skin care', href: 'https://www.aad.org/public/diseases/eczema/types/atopic-dermatitis/atopic-dermatitis-coping' },
  spf: { tier: 1, title: 'Broad-spectrum sun protection', summary: 'Use a broad-spectrum sunscreen with SPF 30 or higher as directed, together with shade and protective clothing. Product SPF and PA markings are label claims.', source: 'AAD sunscreen guidance', href: 'https://www.aad.org/public/everyday-care/sun-protection/shade-clothing-sunscreen/how-to-select-sunscreen' },
  active: { tier: 2, title: 'Optional targeted skincare actives', summary: 'The evidence varies by ingredient, formulation and purpose. The AAD acne guideline gives a conditional recommendation for topical salicylic acid.', source: 'AAD acne clinical guideline', href: 'https://www.aad.org/member/clinical-quality/guidelines/acne' },
  diy: { tier: 3, title: 'Traditional or limited-evidence skin care', summary: 'Botanical or home-care ingredients can be used as cosmetic options. Patch test new products and avoid known irritants.', source: 'AAD product patch-testing guidance', href: 'https://www.aad.org/public/everyday-care/skin-care-secrets/prevent-skin-problems/test-skin-care-products' },
  patch: { tier: 1, title: 'Patch testing and irritation checks', summary: 'The AAD suggests testing a new product on a small area for 7–10 days. Follow the label or prescription instructions and stop if irritation develops.', source: 'AAD product patch-testing guidance', href: 'https://www.aad.org/public/everyday-care/skin-care-secrets/prevent-skin-problems/test-skin-care-products' },
  label: { tier: null, title: 'Label specification', summary: 'This is a product label or manufacturer specification. Check the exact pack, serving size and full ingredients in the retailer listing.' },
} satisfies Record<string, Evidence>;

export type EvidenceKey = keyof typeof evidence;
export const tierLabels = { 1: 'Tier 1 · Guideline consensus', 2: 'Tier 2 · Research support', 3: 'Tier 3 · Traditional / limited' };

export function metricFormula(profile: UserBioProfile, key: EvidenceKey) {
  const activity = activityLevels[profile.activity];
  const offset = profile.sex === 'private' ? '− 78 (midpoint of −161 and +5)' : profile.sex === 'female' ? '− 161' : '+ 5';
  const formulas: Partial<Record<EvidenceKey, string>> = {
    bmi: `${profile.weightKg} kg ÷ (${profile.heightCm} cm ÷ 100)²`,
    bmr: `10 × ${profile.weightKg} kg + 6.25 × ${profile.heightCm} cm − 5 × ${profile.age} years ${offset}`,
    tdee: `Unrounded resting energy × ${activity.factor} (${activity.label})`,
    calories: 'TDEE plus a goal adjustment, rounded to 10 kcal with a 1,200 kcal display floor. Eligible loss uses the lower of 300 kcal and 12% of TDEE. Eligible gain uses the lower of 250 kcal and 10% of TDEE.',
    protein: `Lower of 25% of target energy ÷ 4 and ${profile.goal === 'maintenance' ? '1.2' : '1.5'} g/kg × reference weight. Reference weight is the lower of current weight and the weight at a BMI of 27.5.`,
    carbs: '(Target kcal − 4 × protein grams − 9 × fat grams) ÷ 4, rounded to whole grams.',
    fats: 'Target kcal × 0.28 ÷ 9, rounded to whole grams.',
    water: `35 ml × ${profile.weightKg} kg + ${activity.water} ml for activity. Cap at 3,500 ml and round to the nearest 50 ml.`,
  };
  return formulas[key];
}

export function stepEvidence(label: string, product: string): EvidenceKey {
  if (label === 'Protect') return 'spf';
  if (label === 'Treat' && /acid|niacinamide|peptide/i.test(product)) return 'active';
  return /neem|multani|besan|aloe/i.test(product) ? 'diy' : 'skin';
}
