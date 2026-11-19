import { type Budget, type DiscoveryItem, type Environment, type SkinType, budgets, localDate, tiers } from './context';
import { type UserBioProfile } from './profile';
import { safetyFor } from './safety';
import type { WeatherSeason } from './climate';

export type RoutineTime = 'am' | 'pm';
export const skinEnvironment: Record<Environment, string> = {
  home: 'Keep your daily products together near your sink. Apply moisturizer while skin is still slightly damp.',
  pg: 'Pack a small cleanser and moisturizer in a washable caddy. If the tap water feels irritating, keep washing brief and moisturize afterward.',
  office: 'Carry a travel-size moisturizer and sunscreen stick for midday touch-ups. Cleanse when you return.',
  gym: 'Keep travel sizes in your gym bag. Gently cleanse after a sweaty session and reapply sunscreen before going outdoors.',
};

const clean: Record<SkinType, string> = {
  Oily: 'Light gel cleanser', Dry: 'Cream cleanser', Combination: 'Gentle balancing cleanser', Normal: 'Gentle non-stripping cleanser', Sensitive: 'Fragrance-free gentle cleanser',
};
const hydrate: Record<SkinType, string> = {
  Oily: 'Light non-comedogenic gel', Dry: 'Ceramide-rich cream', Combination: 'Lightweight barrier moisturizer', Normal: 'Light daily moisturizer', Sensitive: 'Plain fragrance-free moisturizer',
};
const treatment: Record<SkinType, string> = {
  Oily: 'Optional salicylic acid', Dry: 'Optional hydrating serum', Combination: 'Optional niacinamide serum', Normal: 'Optional hydrating serum', Sensitive: 'Skip actives if irritated',
};

export const concerns = ['Oil & blemishes', 'Dryness & barrier', 'Dullness & uneven tone'] as const;
export type Concern = typeof concerns[number];
type Option = { name: string; note: string; cost: number };
export const comparison: Record<Concern, [Option, Option, Option]> = {
  'Oil & blemishes': [
    { name: 'Gentle wash with what you own', note: 'Use a mild cleanser and a clean fingertip wash. Keep friction and scrubbing low.', cost: 0 },
    { name: 'Salicylic acid cleanser', note: 'Try a labeled rinse-off formula if tolerated. Start slowly and follow the label.', cost: 349 },
    { name: 'Dermatologist-led acne routine', note: 'Budget for a skin consultation and targeted routine based on your skin history.', cost: 2600 },
  ],
  'Dryness & barrier': [
    { name: 'Damp-skin moisture routine', note: 'Use your existing plain moisturizer after a short lukewarm wash.', cost: 0 },
    { name: 'Fragrance-free ceramide cream', note: 'Apply a small amount to damp skin. Choose a texture you will use regularly.', cost: 465 },
    { name: 'Lipid-rich barrier cream', note: 'Choose a richer texture with ceramides and other barrier lipids if preferred.', cost: 2290 },
  ],
  'Dullness & uneven tone': [
    { name: 'Shade and sun-protective clothing', note: 'Use a hat, clothing and shade where possible, alongside sunscreen on exposed skin.', cost: 0 },
    { name: 'Broad-spectrum SPF 30+', note: 'Pick a pharmacy sunscreen you can apply generously and reapply outdoors.', cost: 499 },
    { name: 'Tinted broad-spectrum face SPF', note: 'Consider a tone-matched tinted formula for a preferred finish and daily wear.', cost: 2550 },
  ],
};

export function skinRoutine(skin: SkinType, environment: Environment, budget: Budget, time: RoutineTime) {
  const tier = tiers.indexOf(budget);
  const portable = environment !== 'home';
  const care = ['Use what you own', 'Pharmacy pick', 'Targeted formula', 'Premium texture'][tier];
  const steps = [
    { label: 'Cleanse', product: clean[skin], note: 'Massage lightly with lukewarm water and rinse. Pat dry with a clean towel.', price: [0, 239, 590, 1390][tier], time: '1 min' },
    {
      label: 'Treat', product: budget === 'zero' ? 'Keep it simple' : treatment[skin],
      note: budget === 'zero' || skin === 'Sensitive' ? 'Keep this step optional. Skip extra products when skin feels uncomfortable.' : 'Introduce one product at a time and follow its label. Skip irritating products.',
      price: skin === 'Sensitive' ? 0 : [0, 329, 690, 1890][tier], time: '1 min',
    },
    { label: 'Moisturize', product: hydrate[skin], note: 'Apply a light layer to damp skin. Use a little more over dry patches.', price: [0, 399, 790, 2190][tier], time: '1 min' },
  ];
  if (time === 'am') steps.push({
    label: 'Protect', product: portable ? 'Travel-size broad-spectrum SPF 30+' : 'Broad-spectrum SPF 30+',
    note: 'Apply to exposed skin. Reapply every two hours outdoors and after sweating or swimming.', price: [299, 449, 799, 1990][tier], time: '2 min',
  });
  return { steps, care, description: skinEnvironment[environment] };
}

export interface CustomSkincareProtocol {
  steps: ReturnType<typeof skinRoutine>['steps'];
  care: string;
  description: string;
  hair: string;
  guardrail: string;
}

export function customSkincareProtocol(profile: UserBioProfile, time: RoutineTime, budget = profile.budget, today = localDate()): CustomSkincareProtocol {
  const { skin, environment, concerns, exposures, approach, age } = profile;
  const base = skinRoutine(skin, environment, budget, time);
  const tier = tiers.indexOf(budget);
  const safety = safetyFor(profile, today);
  const gentle = safety.gentleSkin || skin === 'Sensitive' || approach === 'natural' || budget === 'zero' || age < 20;
  const acne = concerns.includes('Acne & breakouts') && (skin === 'Oily' || skin === 'Combination');
  const spots = concerns.includes('Dark spots / hyperpigmentation') || concerns.includes('Dullness & uneven texture');
  const fineLines = concerns.includes('Fine lines');
  const darkCircles = concerns.includes('Dark circles');
  const sun = concerns.includes('Tanning / sun damage') || exposures.includes('High outdoor sun / UV');
  const hydrateStep = {
    label: 'Hydrate',
    product: budget === 'zero' || approach === 'natural' ? 'Damp-skin hydration' : skin === 'Oily' ? 'Optional light glycerin layer' : 'Optional glycerin or hyaluronic hydrator',
    note: 'Apply a plain, fragrance-free hydrator to damp skin if useful, then follow with moisturizer.',
    price: budget === 'zero' || approach === 'natural' ? 0 : [0, 299, 650, 1590][tier], time: '1 min',
  };
  const active = acne ? 'Optional salicylic acid' : spots ? 'Optional niacinamide' : fineLines ? 'Optional fragrance-free peptide serum' : '';
  const useActive = time === 'pm' && !gentle && Boolean(active);
  const treat = {
    ...base.steps[1],
    product: useActive ? active : 'Keep this step optional',
    price: useActive ? base.steps[1].price : 0,
    note: useActive ? 'Choose one targeted formula, patch test and follow its label. Skip it if your skin feels irritated.'
      : darkCircles ? 'Use gentle care around the eyes. Dark circles can have several causes, so avoid applying exfoliating acids near the eyes.'
      : 'Use a simple cleanser and moisturizer while you establish tolerance. You can skip masks and extra actives.',
  };
  const protect = base.steps.find(step => step.label === 'Protect');
  if (protect && sun) protect.note += ' Pack a hat or seek shade during extended outdoor time.';
  const moisturizer = base.steps[2];
  if (safety.gentleSkin) {
    base.steps[0].product = 'Gentle fragrance-free cleanser';
    moisturizer.product = 'Fragrance-free ceramide moisturizer';
    moisturizer.note = 'Use a plain cream on slightly damp skin. A tolerated hyaluronic hydrator is optional.';
  }
  if (exposures.includes('High AC / dry air')) moisturizer.note += ' Pay extra attention to dry patches after long stretches in air conditioning.';
  const skinTips = [
    base.description,
    exposures.includes('Urban pollution') ? 'Use a gentle evening cleanse after a commute.' : '',
    exposures.includes('Hard water') ? 'Keep rinses brief if your skin feels tight and moisturize afterward.' : '',
  ].filter(Boolean).join(' ');
  const hair = safety.gentleSkin ? 'Choose a gentle fragrance-free shampoo that suits your scalp. Ask a clinician about persistent irritation or flaking.' : exposures.includes('Hard water')
    ? approach === 'natural'
      ? 'Wash with a gentle shampoo, condition the lengths and consider a final rinse with potable low-mineral water if available.'
      : 'If mineral buildup is a concern, consider a label-directed chelating shampoo on wash days. Follow with conditioner and space it out if your scalp feels dry.'
    : 'Wash as needed with a gentle shampoo and condition the lengths. Choose a compact bottle for a shared bathroom or gym bag.';
  return {
    steps: safety.gentleSkin ? [base.steps[0], moisturizer, ...(protect ? [protect] : [])] :
      [base.steps[0], hydrateStep, treat, moisturizer, ...(protect ? [protect] : [])],
    care: safety.barrierHold ? 'Barrier Repair Mode' : budgets[budget].short, description: skinTips, hair,
    guardrail: 'Use one targeted active at a time and review any retinoid and AHA/BHA overlap. Follow prescription and product directions.',
  };
}

export function workspaceSkin(skin: SkinType, environment: Environment, budget: Budget, time: RoutineTime, profile: UserBioProfile | null, today: string, easy = false, savedActives = false, season?: WeatherSeason) {
  const base = profile ? customSkincareProtocol(profile, time, budget, today) : skinRoutine(skin, environment, budget, time);
  const selected = easy ? base.steps.filter(step => ['Cleanse', 'Moisturize', 'Protect'].includes(step.label)) : base.steps.map(step =>
    step.label === 'Treat' && savedActives ? { ...step, product: 'Use your saved active schedule', price: 0, note: 'Check the formula schedule for timing and any pauses before use.' } : step);
  const dryOrSensitive = skin === 'Dry' || skin === 'Sensitive';
  const barrierFirst = safetyFor(profile, today).gentleSkin;
  const budgetMoisturizer = budget === 'zero';
  const steps = selected.map(step => {
    if (step.label === 'Moisturize' && season === 'winter') return {
      ...step, product: budgetMoisturizer ? 'Your richest tolerated barrier cream' : 'Fragrance-free ceramide barrier cream',
      note: 'Apply after a short lukewarm wash. Use a richer layer on dry areas and a lighter layer where you tend to break out.',
    };
    if (step.label === 'Moisturize' && !barrierFirst && (season === 'summer' || season === 'monsoon')) return {
      ...step, product: dryOrSensitive ? 'Light fragrance-free barrier lotion' : 'Lightweight non-comedogenic gel moisturizer',
      note: 'Use a thin layer of a formula you tolerate. Keep your usual richer cream for any dry patches.',
    };
    if (step.label === 'Protect' && season === 'summer') return {
      ...step, product: 'Broad-spectrum SPF 50+ with strong UVA protection',
      note: 'Look for PA++++ where labeled. Reapply at least every two hours outdoors and after swimming or heavy sweating. Use shade and protective clothing too.',
    };
    if (step.label === 'Cleanse' && season === 'pollution' && time === 'pm') return {
      ...step, note: 'Cleanse gently after returning indoors. If makeup or water-resistant sunscreen remains, use a tolerated remover first. Avoid over-washing.',
    };
    return step;
  });
  if (season === 'winter' && !easy) {
    steps.push(
      { label: 'LipCare', product: 'Plain lip balm or petrolatum', note: 'Use a thin layer on dry lips. Choose an SPF lip balm for outdoor daylight.', price: budgetMoisturizer ? 0 : 99, time: '1 min' },
      { label: 'Hands', product: 'Existing cream or plain ointment', note: 'Moisturize hands after washing and before bed if they feel dry.', price: 0, time: '1 min' },
    );
  }
  const hair = 'hair' in base && typeof base.hair === 'string' ? base.hair : '';
  return { ...base, steps, care: easy ? 'Minimum routine' : base.care,
    hair: season === 'monsoon' ? `${hair} If your scalp gets soaked, wash gently as needed and dry it before putting on a hat or tying hair back.`.trim() : hair,
  };
}

export function skinDiscovery(skin: SkinType, environment: Environment, budget: Budget, profile: UserBioProfile | null = null, today = localDate(), easy = false, savedActives = false, season?: WeatherSeason): DiscoveryItem[] {
  const am = workspaceSkin(skin, environment, budget, 'am', profile, today, easy, savedActives, season);
  const pm = workspaceSkin(skin, environment, budget, 'pm', profile, today, easy, savedActives, season);
  const protect = am.steps.find(step => step.label === 'Protect')!;
  const moisturizer = pm.steps.find(step => step.label === 'Moisturize')!;
  const name: Record<Environment, [string, string]> = {
    home: ['Morning Barrier Ritual', 'Evening Skin Reset'],
    pg: ['Shared-Bathroom AM Kit', 'Compact Evening Reset'],
    office: ['Pocket-Sized SPF Routine', 'Post-Commute Skin Reset'],
    gym: ['Gym Bag Skin Essentials', 'Post-Workout Gentle Cleanse'],
  };
  return [
    { id: 'skin-am', target: 'am', pillar: 'skin', title: easy ? 'Minimum morning routine' : name[environment][0], description: `${am.steps[0].product} · ${protect.product}`, minutes: am.steps.length + 1, amount: protect.price, tags: ['Acne / Glow'] },
    { id: 'skin-pm', target: 'pm', pillar: 'skin', title: name[environment][1], description: `${pm.steps[0].product} · ${moisturizer.product}`, minutes: pm.steps.length, amount: moisturizer.price, tags: ['Acne / Glow'] },
    ...[...am.steps, ...(profile ? pm.steps.filter(step => step.label === 'Treat' && step.price > 0) : [])].filter(step => step.price > 0).map(step => ({
      id: `skin-${step.label}`, target: `product-${step.label}`, pillar: 'skin' as const, title: step.product, description: `${am.care} · ${step.label}`, minutes: Number.parseInt(step.time), amount: step.price, tags: ['Acne / Glow' as const],
    })),
  ];
}
