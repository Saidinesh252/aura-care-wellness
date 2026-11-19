import { type Budget, type Environment, type Macros, type Preference, macroGoals, tiers } from './context';
import { type DayAdjustment, type Journal, rebalanceDay } from './adaptive';
import { familyRecipesFor, requiredCareFilters, type CareMealFilter, type MealContext } from './family';
import { foodLabel, makeMeal, mealPlan, portionMacros, type Food, type Meal, type Portion, type Slot } from './nutrition';
import { calculateProfile, createProfile, type Exclusion, type UserBioProfile } from './profile';
import { safetyFor } from './safety';

const schedule: { slot: Slot; share: number }[] = [
  { slot: 'Breakfast', share: .24 }, { slot: 'Lunch', share: .30 },
  { slot: 'Snack', share: .16 }, { slot: 'Dinner', share: .30 },
];
const foodExclusions: Partial<Record<Exclusion, Food[]>> = {
  'Dairy / lactose': ['milk', 'curd', 'greek', 'paneer'],
  Gluten: ['oats', 'roti', 'bread', 'idli'],
  Nuts: ['peanut', 'almonds', 'walnuts'],
  Soy: ['soy', 'tofu', 'fortifiedSoy'],
  Seafood: ['tuna'],
};
const dairy: Food[] = ['milk', 'curd', 'greek', 'paneer'];
const animal: Food[] = ['chicken', 'tuna', 'eggs', 'whites'];
const jain: Food[] = ['veg', 'sprouts', 'bread', 'hummus', 'idli', 'tofu'];
const metricKeys = ['calories', 'protein', 'carbs', 'fat'] as const;
type Bounds = [food: Food, base: number, min: number, max: number];
interface MealGroup { target: Macros | null; choices: Meal[]; selected: Meal; withinTolerance: boolean; fallback: boolean }
export interface PersonalizedMealPlan { meals: Meal[]; groups: Record<Slot, MealGroup> }

export function profileAllowsFood(food: Food, profile: UserBioProfile) {
  if (profile.exclusions.some(item => foodExclusions[item]?.includes(food))) return false;
  const { diet } = profile;
  if (diet === 'Omnivore') return true;
  if (food === 'chicken' || food === 'tuna') return false;
  if (diet === 'Eggetarian') return true;
  if (animal.includes(food)) return false;
  if (diet === 'Vegan') return !dairy.includes(food);
  return diet !== 'Jain / Satvik' || !jain.includes(food);
}

function portionsFor(bounds: Bounds[], target: Macros | null): Portion[] {
  const grams = bounds.map(([, base]) => base);
  if (!target) return bounds.map(([food, base]) => [food, base]);
  const nutrientVectors = bounds.map(([food]) => portionMacros([[food, 1]]));
  const weights = { calories: 1.3, protein: 2.2, carbs: .8, fat: .8 };
  const denominators = { calories: Math.max(target.calories, 200), protein: Math.max(target.protein, 10), carbs: Math.max(target.carbs, 20), fat: Math.max(target.fat, 8) };
  const totals = portionMacros(bounds.map(([food, base]) => [food, base]));
  // Bounded least squares keeps each ingredient within sensible serving sizes.
  for (let sweep = 0; sweep < 28; sweep++) {
    bounds.forEach(([, base, min, max], index) => {
      const vector = nutrientVectors[index];
      const regularization = .006 / Math.max(base, 20) ** 2;
      let numerator = regularization * (base - grams[index]);
      let denominator = regularization;
      for (const key of metricKeys) {
        const weight = weights[key] / denominators[key] ** 2;
        numerator += weight * (target[key] - totals[key]) * vector[key];
        denominator += weight * vector[key] ** 2;
      }
      const next = Math.max(min, Math.min(max, grams[index] + numerator / denominator));
      for (const key of metricKeys) totals[key] += (next - grams[index]) * vector[key];
      grams[index] = next;
    });
  }
  return bounds.map(([food], index) => [food, Math.round(grams[index])]);
}

function closeMacros(actual: Macros, desired: Macros) {
  return Math.abs(actual.calories - desired.calories) <= 35 &&
    Math.abs(actual.protein - desired.protein) <= 3 &&
    Math.abs(actual.carbs - desired.carbs) <= 6 &&
    Math.abs(actual.fat - desired.fat) <= 3;
}

function lossFrom(actual: Macros, desired: Macros) {
  return metricKeys.reduce((score, key) => score + (key === 'protein' ? 2 : 1) *
    ((actual[key] - desired[key]) / Math.max(desired[key], 5)) ** 2, 0);
}

function recipes(profile: UserBioProfile, slot: Slot, target: Macros | null) {
  const { environment, budget, diet } = profile;
  const home = environment === 'home';
  const tier = tiers.indexOf(budget);
  const breakfast = slot === 'Breakfast';
  const snack = slot === 'Snack';
  const small = breakfast || snack;
  const pick = (items: Food[], index: number): Food => {
    const valid = items.filter(food => profileAllowsFood(food, profile));
    if (valid.length > 0) return valid[Math.abs(index) % valid.length];
    const anyAllowed = (['rice', 'banana', 'chana', 'sprouts', 'curd', 'tofu', 'dal', 'apple', 'oats', 'cucumber'] as Food[]).filter(food => profileAllowsFood(food, profile));
    return anyAllowed.length > 0 ? anyAllowed[Math.abs(index) % anyAllowed.length] : 'rice';
  };
  const pulse: Food = home ? 'dal' : 'pouch';
  const mainProtein: Food[] = home
    ? tier === 0 ? ['chana', 'eggs', 'dal', 'chicken', 'tofu'] : ['chicken', 'tofu', 'whites', 'paneer', 'dal', 'chana', 'eggs']
    : tier < 2 ? ['eggs', 'pouch', 'whiteBeans', 'chanaSnack'] : ['tuna', 'tofu', 'paneer', 'whiteBeans', 'eggs', 'pouch'];
  const snackProtein: Food[] = tier < 2
    ? ['chanaSnack', 'soy', 'curd', 'pouch'] : ['greek', 'soy', 'chanaSnack', 'curd', 'pouch'];
  const fruits: Food[] = tier === 3 ? ['berries', 'banana', 'apple'] : ['banana', 'apple', 'dates'];
  const grain: Food[] = small ? ['oats', 'murmura', 'bread'] : home
    ? tier >= 2 ? ['quinoa', 'rice', 'roti'] : ['rice', 'roti', 'quinoa']
    : ['ricePack', 'roti', 'murmura'];
  const fats: Food[] = small ? tier >= 2 ? ['pumpkin', 'almonds', 'seeds', 'peanut'] : ['peanut', 'seeds', 'pumpkin']
    : tier >= 2 ? ['avocado', 'oil', 'pumpkin'] : ['oil', 'seeds', 'peanut'];
  const options = new Map<string, Meal>();
  for (let variant = 0; variant < 9; variant++) {
    const protein = pick(small ? snackProtein : mainProtein, (slot === 'Dinner' ? 1 : 0) + variant);
    const starch = pick(grain, Math.floor(variant / 2));
    const fat = pick(fats, Math.floor(variant / 3));
    const produce = small ? pick(fruits, variant) : pick(['cucumber', 'greens', 'veg'], variant);
    const extra = small ? undefined : protein === pulse ? pick(['whiteBeans', 'chana'], variant) : pulse;
    const proteinBounds: Bounds = protein === 'chanaSnack' ? [protein, 55, 22, 95] : [protein, small ? 145 : 150, 45, small ? 280 : 285];
    const baseGrain = small ? snack ? 24 : 52 : 155;
    const fatIsOil = fat === 'oil';
    const bounds: Bounds[] = [
      proteinBounds, [starch, baseGrain, 12, small ? 105 : 290],
      [fat, fatIsOil ? 9 : 22, fatIsOil ? 1 : 6, fatIsOil ? 23 : fat === 'avocado' ? 110 : 50],
      [produce, small ? 115 : 105, produce === 'dates' ? 15 : 65, produce === 'dates' ? 65 : 190],
    ];
    if (extra) bounds.push([extra, 75, 20, 160]);
    const ingredients = portionsFor(bounds, target);
    const name = small ? `${foodLabel(produce)} & ${foodLabel(protein).toLowerCase()} ${snack ? 'snack' : 'breakfast bowl'}`
      : `${foodLabel(protein)} & ${foodLabel(starch).toLowerCase()} ${slot === 'Dinner' ? 'plate' : 'bowl'}`;
    const oatsNote = starch === 'oats' ? ' Choose oats labeled suitable for cold soaking, or use puffed rice.' : '';
    const method = home && !small
      ? 'Prepare the grain and fully cook any raw protein. Use plain prepared ingredients and assemble with the listed produce and topping.'
      : `Assemble with washed produce and only plain, fully cooked or ready-to-eat ingredients. Keep perishables chilled until serving, or get fresh portions from your mess and eat promptly.${oatsNote}`;
    const signature = ingredients.map(([food]) => food).join('-');
    const id = `blueprint-${environment}-${budget}-${diet}-${slot}-${signature}-${ingredients.map(([, grams]) => grams).join('.')}`;
    options.set(signature, makeMeal({ name, ingredients, method, minutes: home && !small ? 30 : 7 }, slot, budget, environment, diet, variant, id));
  }
  return [...options.values()];
}

export function personalizedMealPlan(profile: UserBioProfile, index: number, swaps: Record<string, number>, adjustment?: DayAdjustment | null, careFilters: readonly CareMealFilter[] = [], context: MealContext = {}): PersonalizedMealPlan {
  const targets = calculateProfile(profile)?.targets ?? null;
  const groups = {} as Record<Slot, MealGroup>;
  const required = requiredCareFilters(profile);
  const filters = [...new Set([...required, ...careFilters])];
  const preferCurated = profile.age >= 40 || filters.length > 0 || context.cuisine !== undefined;
  const meals = schedule.map(({ slot, share }, slotIndex) => {
    const factor = adjustment && slotIndex > adjustment.through ? adjustment.factor : 1;
    const target = targets && {
      calories: Math.round(targets.calories * share * factor), protein: Math.round(targets.protein * share),
      carbs: Math.round(targets.carbs * share * factor), fat: Math.round(targets.fat * share * factor),
    };
    const compatible = (requested: readonly CareMealFilter[]) => familyRecipesFor(profile, slot, requested, context)
      .filter(recipe => recipe.ingredients.every(([food]) => profileAllowsFood(food, profile)));
    const exact = preferCurated ? compatible(filters) : [];
    const available = exact.length || !preferCurated || filters.length === required.length ? exact : compatible(required);
    const preferredIds = new Set<string>();
    const careOptions = available.map((recipe, variant) => {
      const ingredients = portionsFor(recipe.ingredients.map(([food, grams]) => [food, grams, grams * .82, grams * 1.22]), target);
      const id = `care-${profile.environment}-${slot}-${recipe.id}-${ingredients.map(([, grams]) => grams).join('.')}`;
      if (context.cuisine && recipe.cuisine === context.cuisine) preferredIds.add(id);
      return makeMeal({ ...recipe, ingredients, method: `${recipe.method} ${recipe.notes}`, constraintMatch: (!exact.length && filters.length > 0) || (!!context.cuisine && recipe.cuisine !== context.cuisine) }, slot, profile.budget, profile.environment, profile.diet, variant, id);
    });
    const options = careOptions.length > 0 ? careOptions : recipes(profile, slot, target).map(meal => ({
      ...meal, constraintMatch: preferCurated,
      method: required.length > 0 ? `${meal.method} Choose plain, unsalted ingredients and confirm package labels. Use the portions in your care plan.` : meal.method,
    }));
    const ranked = target ? [...options].sort((a, b) => lossFrom(a.macros, target) - lossFrom(b.macros, target)) : options;
    const nearby = target ? ranked.filter(meal => closeMacros(meal.macros, target)) : ranked;
    const preferred = preferredIds.size ? ranked.filter(meal => preferredIds.has(meal.id)) : ranked;
    const preferredNearby = target ? preferred.filter(meal => closeMacros(meal.macros, target)) : preferred;
    const pool = preferredNearby.length ? preferredNearby : preferred;
    const anchor = pool[index % pool.length];
    const choices = [anchor];
    for (const candidate of [...new Set([...pool, ...nearby, ...ranked])]) {
      if (choices.length >= 4) break;
      if (choices.every(meal => meal.id !== candidate.id && (!target || closeMacros(candidate.macros, meal.macros)))) choices.push(candidate);
    }
    const selected = choices[(swaps[slot] ?? 0) % choices.length];
    groups[slot] = { target, choices, selected, fallback: Boolean(selected.constraintMatch), withinTolerance: target !== null && closeMacros(selected.macros, target) };
    return selected;
  });
  return { meals, groups };
}

export function mealAdjustment(profile: UserBioProfile | null, journal: Journal | undefined) {
  const targets = profile ? safetyFor(profile).steadyEnergy ? null : calculateProfile(profile)?.targets ?? null : macroGoals;
  return rebalanceDay(journal, targets);
}

export function workspaceMeals(environment: Environment, budget: Budget, diet: Preference, index: number, profile: UserBioProfile | null, swaps: Record<string, number>, journal?: Journal, careFilters: readonly CareMealFilter[] = [], context: MealContext = {}) {
  const adjustment = mealAdjustment(profile, journal);
  if (profile || context.cuisine) return personalizedMealPlan(profile ?? createProfile({ environment, budget, diet, skin: 'Normal' }), index, swaps, adjustment, careFilters, context).meals;
  const plan = diet === 'Jain / Satvik'
    ? personalizedMealPlan(createProfile({ environment, budget, diet, skin: 'Normal' }), index, swaps).meals
    : mealPlan(environment, budget, diet, index);
  if (!adjustment || Math.abs(adjustment.factor - 1) < .01) return plan;
  return plan.map((meal, slotIndex) => {
    if (slotIndex <= adjustment.through) return meal;
    const ingredients: Portion[] = meal.ingredients.map(([food, grams]) => [food, Math.max(1, Math.round(grams * adjustment.factor))]);
    return makeMeal({ ...meal, ingredients }, meal.slot, budget, environment, diet, index, `${meal.id}-adjusted-${ingredients.map(([, grams]) => grams).join('.')}`);
  });
}
