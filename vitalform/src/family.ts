import { type Environment, type Macros, type Preference } from './context';
import { type Food, type Portion, type Recipe, type Slot, foodLabel, portionMacros } from './nutrition';
import { type Exclusion, type UserBioProfile } from './profile';
import { type CareMealFilter } from './familyTypes';
import type { WeatherSeason } from './climate';
import type { DefaultCuisine } from './store';
export * from './familyTypes';

export interface FamilyMeal {
  id: string; name: string; slot: Slot; ingredients: string[]; directions: string; minutes: number; filters: CareMealFilter[]; notes: string; macros: Macros;
  cuisine?: DefaultCuisine;
}
export interface MealContext { cuisine?: DefaultCuisine; weather?: WeatherSeason }
interface FamilyRecipe extends Recipe {
  id: string;
  slot: Slot;
  filters: CareMealFilter[];
  portable?: { instructions: string; ingredients?: Portion[]; filters?: CareMealFilter[] };
  notes: string;
}

const soft = 'gentle';
const low = 'lowSodium';
const carb = 'carbAware';
const bone = 'calciumProtein';
const careCuisine: Record<string, DefaultCuisine> = {
  'ragi-yogurt': 'south-indian',
  'oat-soy': 'pan-indian',
  'idli-sambar': 'south-indian',
  'moong-khichdi': 'north-indian',
  'soft-lentils-rice': 'pan-indian',
  'curd-rice': 'south-indian',
  'curd-fruit': 'north-indian',
  'soft-nuts': 'north-indian',
  'fortified-banana': 'pan-indian',
  'paneer-bhurji': 'north-indian',
  'tofu-bhurji': 'pan-indian',
  'white-bean-supper': 'pan-indian',
  'ragi-moong': 'south-indian',
  'chana-vegetable-bowl': 'north-indian',
  'roasted-chana-apple': 'north-indian',
  'lemon-rice-dal': 'south-indian',
  'southern-sundal': 'south-indian',
  'north-chana-breakfast': 'north-indian',
};
const seasonalMeals: Record<WeatherSeason, readonly string[]> = {
  winter: ['ragi-yogurt', 'ragi-moong', 'oat-soy', 'moong-khichdi', 'white-bean-supper', 'paneer-bhurji', 'lemon-rice-dal'],
  summer: ['curd-rice', 'curd-fruit', 'southern-sundal', 'fortified-banana', 'roasted-chana-apple', 'soft-lentils-rice'],
  monsoon: ['ragi-moong', 'idli-sambar', 'moong-khichdi', 'chana-vegetable-bowl', 'paneer-bhurji', 'white-bean-supper', 'lemon-rice-dal'],
  pollution: ['soft-lentils-rice', 'southern-sundal', 'chana-vegetable-bowl', 'roasted-chana-apple', 'tofu-bhurji'],
};
const recipes: FamilyRecipe[] = [
  {
    id: 'ragi-yogurt', name: 'Ragi porridge with curd', slot: 'Breakfast',
    ingredients: [['ragi', 45], ['milk', 200], ['curd', 120], ['banana', 60], ['flax', 8]],
    method: 'Whisk the ragi into milk and cook according to the flour label. Stir until smooth. Serve warm with plain curd and mashed banana.',
    minutes: 12, filters: [low, carb, bone, soft],
    notes: 'Ragi and dairy contribute calcium. Check the milk carton for vitamin D fortification and use plain, unsweetened curd.',
  },
  {
    id: 'oat-soy', name: 'Soft oats with fortified soy drink', slot: 'Breakfast',
    ingredients: [['oats', 46], ['fortifiedSoy', 230], ['banana', 75], ['flax', 8]],
    method: 'Cook until the oats are soft. Stir in mashed banana and ground flax, then serve warm.',
    minutes: 10, filters: [low, carb, bone, soft],
    portable: { instructions: 'Choose oats labeled suitable for soaking. Soak in a fridge or use a mess-prepared plain oat bowl. Stir in a freshly opened fortified drink and eat promptly.' },
    notes: 'Oats and flax contribute fiber. Compare calcium and vitamin D on the soy drink label.',
  },
  {
    id: 'idli-sambar', name: 'Steamed idli with soft moong sambar', slot: 'Breakfast',
    ingredients: [['idli', 100], ['moong', 160], ['gourd', 85]],
    method: 'Steam the idlis. Simmer the cooked dal with diced bottle gourd until soft. Serve the sambar warm and season to preference.',
    minutes: 22, filters: [low, soft],
    portable: { instructions: 'Order plain steamed idlis and a soft dal or sambar from the mess. Ask about salt and ingredients and have them fresh.', filters: [soft] },
    notes: 'Moong contributes protein and fiber. Sodium depends on the batter, seasonings, and kitchen. Check prepared batter for allergens.',
  },
  {
    id: 'moong-khichdi', name: 'Moong dal & brown rice khichdi', slot: 'Lunch',
    ingredients: [['moong', 185], ['rice', 110], ['gourd', 125], ['spinach', 60], ['oil', 7]],
    method: 'Simmer plain cooked moong, brown rice and vegetables with water until the grains are soft. Add your preferred plain seasoning.',
    minutes: 28, filters: [low, carb, soft],
    portable: { instructions: 'Request a plain khichdi from the mess, with a little extra dal and soft cooked vegetables. Ask the kitchen about salt and seasonings.', filters: [soft] },
    notes: 'Lentils and greens add fiber and potassium. The lower-sodium tag applies to the home preparation without added salt.',
  },
  {
    id: 'soft-lentils-rice', name: 'Soft moong and greens rice bowl', slot: 'Lunch',
    ingredients: [['moong', 170], ['rice', 105], ['spinach', 90], ['gourd', 125], ['oil', 8]],
    method: 'Combine the cooked moong, rice and greens. Add a little warm water if you prefer a softer consistency.',
    minutes: 17, filters: [low, carb, soft],
    portable: { instructions: 'Use ready-to-eat plain rice, and fully cooked plain dal and vegetables from the mess or a ready-to-eat pack. For lower sodium, confirm unsalted portions. Eat promptly.' },
    notes: 'Choose unsalted components for the lower-sodium option. Confirm preparation with a shared kitchen.',
  },
  {
    id: 'curd-rice', name: 'Soft curd rice with ground flax', slot: 'Lunch',
    ingredients: [['rice', 105], ['curd', 230], ['flax', 10], ['cucumber', 95]],
    method: 'Cook the rice until soft. Serve with fresh plain curd, finely chopped cucumber, and ground flax. Refrigerate promptly if making ahead.',
    minutes: 20, filters: [low, carb, soft],
    portable: { instructions: 'Assemble with plain ready-to-eat rice, freshly opened refrigerated pasteurized curd, and ground flax. Eat promptly.' },
    notes: 'Curd contributes calcium and some protein. Check fish, nut and dairy cross-contact in shared kitchens.',
  },
  {
    id: 'curd-fruit', name: 'Plain curd and soft fruit bowl', slot: 'Snack',
    ingredients: [['greek', 180], ['banana', 90], ['flax', 8]],
    method: 'Stir mashed or thinly sliced fruit into plain yogurt and top with ground flax. Keep chilled until serving.',
    minutes: 5, filters: [low, carb, bone, soft],
    portable: { instructions: 'Use a freshly opened, chilled plain yogurt cup. Add mashed fruit and ground flax just before eating.' },
    notes: 'Greek yogurt contributes calcium and protein. Use unsweetened and pasteurized products.',
  },
  {
    id: 'soft-nuts', name: 'Soft fruit with almond & walnut crumble', slot: 'Snack',
    ingredients: [['banana', 105], ['almonds', 17], ['walnuts', 14]],
    method: 'Finely grind the unsalted nuts and fold them into mashed banana. If soaking nuts for texture, do so in the refrigerator and use them promptly.',
    minutes: 6, filters: [low, carb, soft],
    portable: { instructions: 'Carry plain ground nuts and mash a fresh banana at serving. Use only if nuts and this texture fit the person’s needs.' },
    notes: 'Unsalted nuts provide fiber and unsaturated fats. Choose a clinician-approved consistency for swallowing difficulties.',
  },
  {
    id: 'fortified-banana', name: 'Banana & fortified soy drink', slot: 'Snack',
    ingredients: [['fortifiedSoy', 250], ['banana', 90], ['flax', 8]],
    method: 'Serve a small cup of plain fortified soy drink with mashed banana and a little ground flax.',
    minutes: 4, filters: [low, carb, bone, soft],
    portable: { instructions: 'Open a single-serve carton and eat a freshly mashed banana alongside it. Choose an unsweetened drink with calcium listed on the label.' },
    notes: 'Fortified soy can add protein and calcium. Vitamin D content depends on the brand.',
  },
  {
    id: 'paneer-bhurji', name: 'Soft paneer bhurji & greens', slot: 'Dinner',
    ingredients: [['paneer', 110], ['spinach', 135], ['rice', 90], ['oil', 6]],
    method: 'Crumble pasteurized paneer into soft cooked greens and warm through. Serve with steamed rice and season to taste.',
    minutes: 17, filters: [low, carb, bone, soft],
    portable: { instructions: 'Get freshly prepared, lightly seasoned paneer and greens with cooked rice from the mess. Ask about salt and ingredients.', filters: [carb, bone, soft] },
    notes: 'Paneer contributes calcium and protein. For no-added-salt preparation, compare the paneer label.',
  },
  {
    id: 'tofu-bhurji', name: 'Calcium-set tofu bhurji & soft greens', slot: 'Dinner',
    ingredients: [['tofu', 155], ['spinach', 120], ['quinoa', 105], ['oil', 7]],
    method: 'Crumble the tofu, warm through with soft cooked greens, and serve with cooked quinoa.',
    minutes: 19, filters: [low, carb, bone, soft],
    portable: { ingredients: [['tofu', 155], ['spinach', 120], ['rice', 100], ['oil', 7]], instructions: 'Use tofu explicitly labeled ready to eat and freshly cooked greens and rice from the mess. Follow refrigeration instructions. Confirm no added salt if needed.' },
    notes: 'Tofu contributes protein. Look for calcium-set tofu or a calcium amount on the nutrition label.',
  },
  {
    id: 'white-bean-supper', name: 'Soft white beans with steamed greens', slot: 'Dinner',
    ingredients: [['whiteBeans', 180], ['spinach', 110], ['gourd', 120], ['rice', 95], ['oil', 7]],
    method: 'Use no-salt-added beans or plain cooked beans. Warm with greens and gourd, and partly mash for a softer texture.',
    minutes: 14, filters: [low, carb, soft],
    portable: { instructions: 'Use no-salt-added beans labeled ready to eat with freshly cooked plain greens and rice. Assemble just before eating.' },
    notes: 'Beans and greens contribute fiber and potassium. Use the texture and portions that fit the person’s care plan.',
  },
  {
    id: 'ragi-moong', name: 'Ragi mudde with soft moong dal', slot: 'Breakfast',
    ingredients: [['ragi', 30], ['moong', 145], ['spinach', 60], ['oil', 4]],
    method: 'Cook ragi flour with water according to the package. Serve warm with plain cooked moong and softened spinach.',
    minutes: 16, filters: [low, carb, soft],
    portable: { instructions: 'Get plain, freshly cooked ragi and moong from the mess. Confirm no added salt if required and ask for thoroughly cooked greens. Serve promptly.' },
    notes: 'This uses plain, unsalted components. Choose portions that fit your care plan.',
  },
  {
    id: 'north-chana-breakfast', name: 'Cumin chana & greens breakfast bowl', slot: 'Breakfast',
    ingredients: [['chana', 140], ['spinach', 90], ['oil', 4], ['lemon', 10]],
    method: 'Lightly mash unsalted cooked chickpeas. Combine with soft cooked spinach, lemon and a little cumin.',
    minutes: 8, filters: [low, carb, soft],
    portable: { instructions: 'Use freshly served soft spinach and fully cooked no-salt-added chickpeas. Mash and season before serving.' },
    notes: 'Check the pack and use plain, cooked components.',
  },
  {
    id: 'chana-vegetable-bowl', name: 'North Indian warm chana & spinach bowl', slot: 'Lunch',
    ingredients: [['chana', 145], ['rice', 75], ['spinach', 110], ['oil', 6], ['lemon', 10]],
    method: 'Warm fully cooked unsalted chickpeas, plain cooked brown rice and spinach. Season lightly with ground cumin and lemon.',
    minutes: 12, filters: [low, carb, soft],
    portable: { instructions: 'Use plain rice, no-salt-added chickpeas, and fresh, thoroughly cooked spinach from the mess. Mash the chickpeas if desired and serve promptly.' },
    notes: 'Choose plain components if limiting sodium and use portions that suit your care plan.',
  },
  {
    id: 'southern-sundal', name: 'Soft lemon sundal with cooked greens', slot: 'Snack',
    ingredients: [['chana', 105], ['spinach', 45], ['lemon', 12], ['oil', 4]],
    method: 'Toss fully cooked chickpeas and soft greens with lemon, measured oil and roasted cumin.',
    minutes: 7, filters: [low, carb, soft],
    portable: { instructions: 'Use no-salt-added cooked chickpeas and a fresh portion of plain cooked greens. Toss in the bowl just before serving.' },
    notes: 'Mash the chickpeas if needed. Follow any prescribed texture guidance.',
  },
  {
    id: 'roasted-chana-apple', name: 'Soft apple & roasted chana crumble', slot: 'Snack',
    ingredients: [['chanaSnack', 22], ['apple', 105], ['flax', 6]],
    method: 'Finely grind unsalted roasted chana and fold it with ground flax into soft stewed apple.',
    minutes: 10, filters: [low, carb, soft],
    portable: { instructions: 'Fold finely ground unsalted chana and flax into pasteurized, unsweetened apple purée. Open the pack just before serving.' },
    notes: 'This is a snack estimate. Use the texture and portions in your individual care plan.',
  },
  {
    id: 'lemon-rice-dal', name: 'South Indian lemon rice with soft dal', slot: 'Dinner',
    ingredients: [['rice', 90], ['moong', 170], ['spinach', 110], ['oil', 6], ['lemon', 12]],
    method: 'Warm plain cooked rice, moong and greens. Season with lemon juice, curry leaves and measured oil.',
    minutes: 12, filters: [low, carb, soft],
    portable: { instructions: 'Combine ready-to-eat plain rice with fresh fully cooked moong and greens. Ask for unsalted components if needed and eat promptly.' },
    notes: 'Top with lemon without increasing salt. Use portions that fit your care plan.',
  },
];

const exclusionsByFood: Partial<Record<Food, Exclusion>> = {
  milk: 'Dairy / lactose', curd: 'Dairy / lactose', greek: 'Dairy / lactose', paneer: 'Dairy / lactose',
  fortifiedSoy: 'Soy', tofu: 'Soy', oats: 'Gluten', idli: 'Gluten', almonds: 'Nuts', walnuts: 'Nuts',
};
const affordableOrder = ['fortifiedSoy', 'tofu', 'greek', 'walnuts', 'quinoa'];

function allowed(food: Food, diet: Preference, exclusions: Exclusion[]) {
  const type = exclusionsByFood[food];
  if (type && exclusions.includes(type)) return false;
  if (diet === 'Vegan' && type === 'Dairy / lactose') return false;
  if (diet === 'Jain / Satvik' && (food === 'idli' || food === 'tofu')) return false;
  return true;
}

export function requiredCareFilters(profile: UserBioProfile | null): CareMealFilter[] {
  const filters: CareMealFilter[] = [];
  if (profile?.health?.includes('hypertension')) filters.push('lowSodium');
  if (profile?.health?.includes('diabetes')) filters.push('carbAware');
  return filters;
}

function curatedRecipes(profile: UserBioProfile | null, filters: readonly CareMealFilter[], slot?: Slot, context: MealContext = {}) {
  const environment: Environment = profile?.environment ?? 'home';
  const budget = profile?.budget ?? 'student';
  const diet = profile?.diet ?? 'Omnivore';
  const exclusions = profile?.exclusions ?? [];
  const home = environment === 'home';
  const options = recipes.flatMap(recipe => {
    if (slot && recipe.slot !== slot) return [];
    if (!home && !recipe.portable) return [];
    const ingredients = (home ? undefined : recipe.portable?.ingredients) ?? recipe.ingredients;
    const tags = (home ? undefined : recipe.portable?.filters) ?? recipe.filters;
    if (!ingredients.every(([food]) => allowed(food, diet, exclusions)) || !filters.every(filter => tags.includes(filter))) return [];
    return [{
      ...recipe, ingredients, filters: tags,
      method: home ? recipe.method : recipe.portable!.instructions,
      minutes: home ? recipe.minutes : Math.min(recipe.minutes, 8),
    }];
  });
  const priority = (recipe: FamilyRecipe) => {
    const matchesCuisine = context.cuisine === careCuisine[recipe.id];
    const matchesSeason = context.weather && seasonalMeals[context.weather].includes(recipe.id);
    const estimatedCost = recipe.ingredients.filter(([food]) => affordableOrder.includes(food)).length;
    return Number(matchesCuisine) * 3 + Number(Boolean(matchesSeason)) * 2 - (budget === 'zero' || budget === 'student' ? estimatedCost * 2 : 0);
  };
  return options.sort((a, b) => priority(b) - priority(a));
}

export function familyRecipesFor(profile: UserBioProfile, slot: Slot, filters: readonly CareMealFilter[], context: MealContext = {}) {
  return curatedRecipes(profile, filters, slot, context).map(recipe => ({ ...recipe, cuisine: careCuisine[recipe.id] }));
}

export function familyMealsFor(profile: UserBioProfile | null, filters: readonly CareMealFilter[], context: MealContext = {}): FamilyMeal[] {
  return curatedRecipes(profile, [...new Set([...requiredCareFilters(profile), ...filters])], undefined, context).map(recipe => {
    const macros = portionMacros(recipe.ingredients);
    return {
      id: recipe.id, name: recipe.name, slot: recipe.slot, notes: recipe.notes, minutes: recipe.minutes, filters: recipe.filters,
      ingredients: recipe.ingredients.map(([food, quantity]) => `${quantity} g ${foodLabel(food).toLowerCase()}`),
      directions: recipe.method, cuisine: careCuisine[recipe.id],
      macros: { calories: Math.round(macros.calories), protein: Math.round(macros.protein * 10) / 10, carbs: Math.round(macros.carbs * 10) / 10, fat: Math.round(macros.fat * 10) / 10 },
    };
  });
}
