import { tiers, type Budget, type DiscoveryItem, type Environment, type Macros, type Preference } from './context';
import { sumMacros } from './store';

// Sample nutrient values and INR costs per 100 g in the edible/prepared form.
const foods = {
  oats: ['Rolled oats', 13, 68, 7, 379, 18],
  banana: ['Bananas', 1.1, 23, 0.3, 89, 7],
  milk: ['Milk', 3.4, 4.9, 2, 50, 8],
  soy: ['Unsweetened soy milk', 3.3, 2, 1.8, 37, 15],
  curd: ['Plain curd', 3.5, 4.7, 3.3, 61, 11],
  greek: ['Plain Greek yogurt', 10, 3.6, 2, 73, 42],
  peanut: ['Peanut butter', 25, 20, 50, 588, 47],
  almonds: ['Almonds', 21, 22, 50, 579, 90],
  pumpkin: ['Pumpkin seeds', 30, 11, 49, 559, 82],
  berries: ['Seasonal berries', 0.8, 12, 0.4, 50, 115],
  apple: ['Apples', 0.3, 14, 0.2, 52, 16],
  dates: ['Dates', 1.8, 75, 0.2, 277, 26],
  rice: ['Cooked brown rice', 2.7, 25.6, 1, 123, 7],
  ricePack: ['Ready-to-eat rice', 2.7, 28, 0.5, 132, 28],
  quinoa: ['Cooked quinoa', 4.4, 21, 1.9, 120, 22],
  chicken: ['Cooked chicken breast', 31, 0, 3.6, 165, 38],
  tuna: ['Tinned tuna, drained', 25, 0, 1, 116, 100],
  eggs: ['Hard-boiled eggs', 12.6, 1.1, 10.6, 155, 16],
  paneer: ['Paneer', 18, 2, 21, 265, 39],
  tofu: ['Firm tofu', 17, 3, 9, 144, 37],
  chana: ['Cooked chickpeas', 8.9, 27.4, 2.6, 164, 11],
  pouch: ['Ready-to-eat chickpeas', 8.1, 22, 2.2, 139, 23],
  sprouts: ['Cooked moong sprouts', 3, 6, 0.2, 30, 14],
  dal: ['Cooked lentils', 9, 20, 0.4, 116, 8],
  veg: ['Mixed seasonal vegetables', 2, 9, 0.4, 43, 10],
  cucumber: ['Cucumber and tomato', 0.8, 3.8, 0.2, 18, 9],
  greens: ['Leafy greens', 2, 4, 0.3, 23, 27],
  roti: ['Whole-wheat roti', 8, 45, 4, 248, 13],
  bread: ['Whole-grain bread', 12, 43, 4, 247, 16],
  oil: ['Cooking oil', 0, 0, 100, 884, 18],
  avocado: ['Avocado', 2, 8.5, 14.7, 160, 85],
  chanaSnack: ['Roasted chana', 21, 59, 6, 370, 16],
  hummus: ['Hummus', 8, 14, 10, 166, 55],
  lemon: ['Lemon juice', 0.4, 7, 0.2, 22, 18],
  murmura: ['Puffed rice', 7, 86, 0.5, 380, 15],
  whites: ['Cooked egg whites', 10.9, 0.7, 0.2, 52, 19],
  seeds: ['Sunflower kernels', 20.8, 20, 51.5, 584, 54],
  whiteBeans: ['Ready-to-eat white beans', 8, 20, 0.5, 114, 28],
  ragi: ['Ragi flour', 7.3, 72, 1.3, 336, 13],
  moong: ['Plain cooked moong dal', 7, 19, 0.45, 105, 13],
  idli: ['Plain steamed idlis', 4.6, 32, 0.8, 149, 17],
  flax: ['Ground flaxseed', 18.3, 29, 42, 534, 30],
  walnuts: ['Walnuts', 15.2, 13.7, 65.2, 654, 98],
  gourd: ['Cooked bottle gourd', 0.6, 3.7, 0.1, 15, 9],
  spinach: ['Cooked spinach', 3, 3.8, 0.3, 23, 16],
  fortifiedSoy: ['Unsweetened fortified soy drink', 3.3, 2.4, 1.8, 39, 21],
} as const;

export type Food = keyof typeof foods;
export type Portion = [Food, number];
export type Slot = 'Breakfast' | 'Lunch' | 'Snack' | 'Dinner';
export interface Recipe { name: string; ingredients: Portion[]; method: string; minutes: number; constraintMatch?: boolean }
export interface Meal extends Recipe { id: string; slot: Slot; macros: Macros; amount: number }
export const foodLabel = (food: Food) => foods[food][0];

const round = (number: number) => Math.round(number * 10) / 10;
const pantryFoods = new Set<Food>(['oats', 'rice', 'dal', 'oil', 'roti', 'lemon']);

function ingredientCost([food, grams]: Portion, budget: Budget) {
  return budget === 'zero' && pantryFoods.has(food) ? 0 : foods[food][5] * grams / 100;
}

export function portionMacros(ingredients: Portion[]): Macros {
  return sumMacros(ingredients.map(([food, grams]) => {
    const [, protein, carbs, fat, calories] = foods[food];
    const factor = grams / 100;
    return { protein: protein * factor, carbs: carbs * factor, fat: fat * factor, calories: calories * factor };
  }));
}

export function makeMeal(recipe: Recipe, slot: Slot, budget: Budget, environment: Environment, preference: Preference, variant: number, id?: string): Meal {
  const macros = portionMacros(recipe.ingredients);
  return {
    ...recipe, slot, id: id ?? `${environment}-${budget}-${preference}-${variant}-${slot}`,
    macros: { protein: round(macros.protein), carbs: round(macros.carbs), fat: round(macros.fat), calories: Math.round(macros.calories) },
    amount: recipe.ingredients.reduce((cost, ingredient) => cost + ingredientCost(ingredient, budget), 0),
  };
}

export function mealPlan(environment: Environment, budget: Budget, preference: Preference, index: number) {
  const tier = tiers.indexOf(budget);
  const variant = index % 3;
  const vegan = preference === 'Vegan';
  const omni = preference === 'Omnivore';
  const eggs = omni || preference === 'Eggetarian';
  const kitchen = environment === 'home';
  const milk: Food = vegan ? 'soy' : 'milk';
  const yogurt: Food = vegan ? 'soy' : tier >= 2 ? 'greek' : 'curd';
  const fruit: Food = tier === 3 ? 'berries' : variant === 1 ? 'apple' : 'banana';
  const fruitName = { berries: 'Berry', apple: 'Apple', banana: 'Banana' }[fruit];
  const topper: Food = tier === 3 ? 'almonds' : tier === 2 ? 'pumpkin' : 'peanut';
  const protein: Food = tier === 0 ? (eggs ? 'eggs' : 'chana') : omni ? 'chicken' : preference === 'Eggetarian' ? 'eggs' : vegan ? 'tofu' : 'paneer';
  const proteinName = { chicken: 'Grilled Chicken', eggs: 'Egg', paneer: 'Paneer', chana: 'Chickpea', tofu: 'Tofu' }[protein];
  const grain: Food = tier >= 2 ? 'quinoa' : 'rice';
  const grainName = grain === 'quinoa' ? 'Quinoa' : 'Brown Rice';
  const portableProtein: Food = eggs ? (omni && tier >= 2 && variant === 2 ? 'tuna' : 'eggs') : vegan || tier === 0 ? 'pouch' : 'paneer';
  const portableName = { eggs: 'Boiled Egg', tuna: 'Tuna', pouch: 'Chickpea', paneer: 'Paneer' }[portableProtein];
  const readyLegume: Food = tier === 0 ? 'chana' : 'pouch';
  const portableExtra: Portion = portableProtein === 'pouch' ? ['greens', 55] : [readyLegume, 140];

  const breakfast: Recipe = variant === 2
    ? { name: `${fruitName} & ${eggs ? 'Egg' : 'Peanut Butter'} Toast`, ingredients: [['bread', 90], [eggs ? 'eggs' : 'peanut', eggs ? 100 : 30], [fruit, 140], [milk, 200]], method: 'Top sliced bread, and serve with fruit and milk. Use pre-boiled eggs if preparing away from a kitchen.', minutes: 5 }
    : { name: `${fruitName} ${variant === 1 ? 'Bircher Oats' : 'Protein Oat Bowl'}`, ingredients: [['oats', 65], [milk, 200], [fruit, 140], [topper, 26]], method: 'Use oats labeled suitable for cold soaking. Mix with milk, top with fruit and keep chilled if soaking ahead.', minutes: 5 };

  let lunch: Recipe;
  if (kitchen) {
    lunch = {
      name: variant === 1 ? `${proteinName} & Seasonal Vegetable Rice Bowl` : `${proteinName} & ${grainName}`,
      ingredients: [[protein, 145], [variant === 1 ? 'rice' : grain, 200], ['veg', 175], ['oil', 10], ['lemon', 15]],
      method: 'Cook the rice or quinoa. Prepare the protein and vegetables, then assemble with oil and lemon. Use fully cooked chicken or eggs.',
      minutes: variant === 1 ? 30 : 26,
    };
  } else if (environment === 'pg' && variant !== 1) {
    lunch = {
      name: `No-Cook Sprout Chaat & ${portableName} Bowl`,
      ingredients: [['sprouts', 120], [portableProtein, portableProtein === 'pouch' ? 215 : 115], portableExtra, ['cucumber', 130], [tier === 3 ? 'avocado' : 'lemon', tier === 3 ? 75 : 20]],
      method: 'Use chilled, fully cooked moong sprouts and ready-to-eat protein. Toss with the remaining ingredients and eat promptly.',
      minutes: 8,
    };
  } else {
    lunch = {
      name: `${portableName} ${environment === 'gym' ? 'Recovery' : 'On-the-Go'} Wrap`,
      ingredients: [[portableProtein, portableProtein === 'pouch' ? 200 : 140], ['roti', 110], ['cucumber', 120], tier >= 2 ? ['hummus', 55] : portableExtra, ['lemon', 15]],
      method: 'Fill a ready-to-eat wrap with the cooked protein and vegetables. Keep chilled until you eat.',
      minutes: 7,
    };
  }
  const snack: Recipe = {
    name: tier >= 2 ? `${vegan ? 'Soy Milk' : 'Greek Yogurt'} & ${fruitName} Snack` : 'Roasted Chana & Fruit',
    ingredients: tier >= 2 ? [[yogurt, 200], [fruit, 110], [topper, 18]] : [['chanaSnack', 53], [variant === 2 ? 'dates' : fruit, variant === 2 ? 40 : 150]],
    method: 'Portion into a small container. Keep yogurt and opened soy milk chilled.',
    minutes: 3,
  };
  const dinner: Recipe = kitchen ? {
    name: variant === 2 ? 'Lentil & Greens Dinner Plate' : 'Moong Dal, Vegetables & Roti',
    ingredients: [['dal', 220], ['roti', 125], [tier >= 2 ? 'greens' : 'veg', 170], ['oil', 12], [yogurt, 100]],
    method: 'Simmer lentils until tender, warm the roti and cook vegetables. Serve with yogurt or soy milk alongside.',
    minutes: 34,
  } : {
    name: variant === 1 ? 'Chickpea Toast & Cucumber Salad' : `${environment === 'pg' ? 'Mess-Style' : 'Portable'} Chickpea Bowl`,
    ingredients: [[readyLegume, 240], [variant === 1 ? 'bread' : tier === 0 ? 'roti' : 'ricePack', variant === 1 ? 90 : 145], ['cucumber', 145], [tier >= 2 ? 'avocado' : 'lemon', tier >= 2 ? 90 : 20], [topper, 30]],
    method: 'Use only cooked, ready-to-eat ingredients. Assemble just before eating, or carry in an insulated bag with an ice pack.',
    minutes: 8,
  };
  const recipes: [Recipe, Slot][] = [[breakfast, 'Breakfast'], [lunch, 'Lunch'], [snack, 'Snack'], [dinner, 'Dinner']];
  return recipes.map(([recipe, slot]) => makeMeal(recipe, slot, budget, environment, preference, variant));
}

export function groceryList(plan: Meal[], budget: Budget) {
  const portions = new Map<Food, number>();
  plan.forEach(meal => meal.ingredients.forEach(([food, grams]) => {
    portions.set(food, (portions.get(food) ?? 0) + grams * 7);
  }));
  return [...portions].map(([food, grams]) => ({
    id: food, name: foodLabel(food), grams, cost: ingredientCost([food, grams], budget),
  }));
}

export function dietDiscovery(plan: Meal[]): DiscoveryItem[] {
  return plan.map(meal => ({
    id: meal.id, target: meal.slot, pillar: 'diet', title: meal.name, minutes: meal.minutes,
    description: `${meal.slot} · ${meal.macros.protein} g protein · ${meal.macros.calories} kcal`,
    amount: meal.amount, tags: meal.macros.protein >= 20 ? ['Muscle Gain', 'Sustained Energy'] : ['Sustained Energy'],
  }));
}
