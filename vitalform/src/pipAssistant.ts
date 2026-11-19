import { budgets, environments, localDate, type Page } from './context';
import { inferredSlot } from './adaptive';
import { personalizedMealPlan, mealAdjustment, profileAllowsFood } from './personalizedNutrition';
import { createProfile } from './profile';
import type { PersonWorkspace } from './store';
import type { Meal } from './nutrition';

export interface PipAction { page: Page; target?: string; label: string }
export interface PipReply {
  text: string;
  action?: PipAction;
  source?: { label: string; href: string };
  dinnerChoices?: number;
}

export const pipGreeting = 'WELCOME BACK. NOW WE FALL FOREVER...';
export const pipTips = [
  'New quest. Check your movement form before you start the timer.',
  'No stove? Ready-to-eat grains and fully cooked beans are useful pantry items for your PG kitchen.',
  'Local storage keeps your logs on this browser. Your Health Vault can give them a second home.',
  'One small task is still a completed quest. Pick something you can do comfortably today.',
  'Audio hint: Toggle the 🔊 SYNTH button in the corner to generate real-time ambient chords with the Web Audio API.',
  'Knee comfort: Preview a supported move and use a range that feels comfortable.',
];

const plans = {
  dinner: { page: 'diet', target: 'Dinner', label: 'Open dinner recipe' },
  movement: { page: 'fitness', target: 'family-mobility', label: 'See gentle mobility' },
  skincare: { page: 'skin', label: 'Open Skincare Studio' },
  family: { page: 'family', label: 'Open Family & Elder Care' },
  gear: { page: 'gear', label: 'Open Gear & Essentials' },
  blueprint: { page: 'blueprint', label: 'Open personal plan' },
  settings: { page: 'settings', label: 'Open Settings' },
} satisfies Record<string, PipAction>;

function dinnerReply(query: string, workspace: PersonWorkspace, today: string): PipReply {
  const profile = workspace.profile ?? createProfile(workspace);
  const journal = workspace.days[today];
  const pgProfile = { ...profile, environment: 'pg' } as const;
  const group = personalizedMealPlan(pgProfile, workspace.planIndex, workspace.mealSwaps, mealAdjustment(pgProfile, journal), workspace.careMealFilters, { cuisine: workspace.defaultCuisine, weather: workspace.weatherSeason }).groups.Dinner;
  const suitable = (meal: Meal) => meal.slot === 'Dinner' && /fully cooked|ready.to.eat|from the mess|mess-prepared/.test(meal.method.toLowerCase()) &&
    meal.ingredients.every(([food]) => profileAllowsFood(food, pgProfile));
  const suggestion = group.choices.find(suitable);
  const wantsSwap = /\b(?:swap|replace|change|switch)\b/.test(query);

  if (!suggestion) return { text: 'I could not find a PG no-cook dinner in your current plan. Open Diet & Hydration to browse recipes by equipment and diet.', action: { page: 'diet', label: 'Browse diet and recipes' } };
  if (workspace.environment !== 'pg') {
    return { text: `PG dinner idea: ${suggestion.name}. ${suggestion.method}\n\nYour current kitchen is ${environments[workspace.environment].label}. Select PG / Hostel under Kitchen access before swapping a dinner in the PG plan.`, action: { page: 'diet', label: 'Open kitchen settings' } };
  }
  if (!wantsSwap) return { text: `${suggestion.name}. ${suggestion.method}`, action: plans.dinner };
  if (Object.entries(journal?.meals ?? {}).some(([id, meal]) => inferredSlot(id, meal) === 'Dinner' || id === group.selected.id)) {
    return { text: 'Dinner is already logged today. Open your dinner log to review the entry before changing it.', action: plans.dinner };
  }

  const next = group.choices[((workspace.mealSwaps.Dinner ?? 0) + 1) % group.choices.length];
  if (!next || next.id === group.selected.id || !suitable(next)) {
    return { text: `Your current PG dinner is ${group.selected.name}. I couldn't find a different no-cook option within your meal plan's swap limits. Open Diet & Hydration to browse the regional library.`, action: plans.dinner };
  }
  return { text: `Dinner swapped to ${next.name}. ${next.method}`, action: plans.dinner, dinnerChoices: group.choices.length };
}

export function answerPip(question: string, workspace: PersonWorkspace, today = localDate()): PipReply {
  const query = question.toLowerCase().trim();
  if (/knee|squat|lunge|joint pain/.test(query)) {
    return {
      text: 'Pause any squat or lunge that hurts. If comfortable, try a smaller, supported movement with a stable chair and no added load. Stop if discomfort increases. Get urgent medical advice if you cannot put weight on the knee, it is badly swollen or misshapen, or it locks or gives way.',
      action: plans.movement,
      source: { label: 'NHS knee pain guidance', href: 'https://www.nhs.uk/symptoms/knee-pain/' },
    };
  }
  if (/\bdinner\b|no.cook|kettle meal/.test(query)) return dinnerReply(query, workspace, today);
  if (/stack|made with|built with|typescript|dependencies|framework|tech/.test(query)) {
    return {
      text: 'AURA-CARE is crafted with React 19, TypeScript, and Vite, using Zustand for browser-local state. My sprite and animations use zero-dependency native Canvas, SVG, and CSS. Ambient sound is synthesized with the Web Audio API without audio files.',
      action: plans.blueprint,
    };
  }
  if (/synth|audio|sound|music|web audio|song|mp3|wav/.test(query)) {
    return {
      text: 'The audio uses procedural Web Audio API synthesis with zero external MP3 or WAV files. It blends detuned sine/triangle oscillators, dynamic Biquad lowpass sweeps, and gain envelopes.',
      action: plans.settings,
    };
  }
  if (/who are you|what are you|pip\.exe|mascot/.test(query)) {
    return {
      text: 'I am your bio-companion living inside your browser! I help with PG kitchen swaps, knee comfort modifications, hydration quests, and biohacking protocols.',
      action: plans.blueprint,
    };
  }
  if (/\bwater\b|hydrat|\bdrink\b/.test(query)) {
    const amount = workspace.days[today]?.water ?? 0;
    return { text: `This profile has logged ${amount.toLocaleString('en-IN')} ml of water today. Open Diet & Hydration to see your plan and add a drink. If you have a prescribed fluid limit, follow that plan.`, action: { page: 'diet', label: 'Open hydration tracker' } };
  }
  if (/\bprofile\b|\bbudget\b|\bsetup\b|\bclimate\b|\bseason\b|\bweather\b/.test(query)) {
    return { text: `Your active setup is ${environments[workspace.environment].label} with ${budgets[workspace.budget].short}, a ${workspace.diet.toLowerCase()} diet, and the ${workspace.weatherSeason} weather shield. Update the settings in your workspace to adjust recommendations.`, action: plans.blueprint };
  }
  if (/skincare|sunscreen|skin care|\bacne\b|retinol|cleanser/.test(query)) {
    return { text: `Your active profile has ${workspace.skin.toLowerCase()} skin. Skincare Studio adapts the AM and PM steps to your budget, weather shield and active products. Inspect the routine guardrails before adding an exfoliant or retinoid.`, action: plans.skincare };
  }
  if (/\bworkout\b|\bfitness\b|\bstretch\b|\bexercise\b|low.impact|mobility/.test(query)) {
    return { text: `Open Movement Hub to preview your current form guides. ${workspace.environment === 'pg' ? 'Your PG sessions are quiet and jump-free.' : 'You can switch to a seated session when you need a gentler option.'}`, action: plans.movement };
  }
  if (/\bfamily\b|elder|senior|caregiver|reminder/.test(query)) return { text: 'Use Family Circle to switch the active member before logging water, movement, mood or a medication check-in. Each member has a separate care log.', action: plans.family };
  if (/\bproduct\b|\bgear\b|\bstore\b|shop/.test(query)) return { text: 'Gear & Essentials lets you compare profile-matched products and see how to use them. Pin a compatible item to update the active routine and monthly budget.', action: plans.gear };
  if (/^(hi|hello|hey|help)[!. ]*$/.test(query)) return { text: 'Ready for the next quest. Ask about your PG dinner, hydration log, Family Circle, or the site’s tech stack.' };
  return { text: 'My offline rules cover dinner swaps, hydration, skincare, movement, family profiles, and how Vitalform was built. Try a shortcut below or ask a question.' };
}
