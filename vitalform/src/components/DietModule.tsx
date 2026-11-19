import { Apple, Check, ChefHat, ChevronDown, Clock3, CookingPot, Flame, MapPin, RefreshCw, Salad, ShoppingBasket, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { carbPortionNotice, inferredSlot } from '../adaptive';
import { comfortFor } from '../familyTypes';
import { environments, preferences, price, type Environment, type Preference } from '../context';
import { foodLabel, groceryList } from '../nutrition';
import { workspaceMeals } from '../personalizedNutrition';
import { safetyFor } from '../safety';
import { emptyJournal, sumMacros, useWorkspace } from '../store';
import { IconBadge, MacroValues, SelectField } from './Shared';
import { PinnedRoutine } from './PinnedRoutine';
import { EvidenceInfo, SafetyBanner } from './Evidence';
import { MealRecoveryNote } from './RecoveryTools';
import { ReadAloudButton } from './ReadAloudButton';
import { RegionalRecipeEngine } from './RegionalRecipeEngine';
import { MistakeGuardrailBanner } from './MistakeGuardrailBanner';
import { WeatherDietAlert } from './WeatherProtectionShield';
import { cuisineLabels } from '../regionalRecipes';
import '../mealConstraints.css';

const setups: Record<Environment, string> = {
  home: 'Full kitchen', pg: 'Kettle / no-cook PG', office: 'Portable office or travel meals', gym: 'Portable gym meals',
};
const mealIcons = { Breakfast: ChefHat, Lunch: Salad, Snack: Apple, Dinner: CookingPot };

export function DietModule({ today, target, onMeal }: { today: string; target?: string; onMeal: () => void }) {
  const { environment, budget, diet, setEnvironment, setDiet, currency, planIndex, rotatePlan, groceries, days, toggleGrocery, toggleMeal, profile, mealSwaps, careMealFilters, comfortPreference, defaultCuisine, weatherSeason } = useWorkspace();
  const comfort = comfortFor(profile?.age, comfortPreference);
  const [selected, setSelected] = useState<string | undefined>(target);
  const context = { cuisine: defaultCuisine, weather: weatherSeason };
  const plan = workspaceMeals(environment, budget, diet, planIndex, profile, mealSwaps, days[today], careMealFilters, context);
  const total = sumMacros(plan.map(meal => meal.macros));
  const logged = (days[today] ?? emptyJournal).meals;
  const loggedTotal = sumMacros(Object.values(logged).map(meal => meal.macros));
  const grocery = groceryList(workspaceMeals(environment, budget, diet, planIndex, profile, mealSwaps, undefined, careMealFilters, context), budget);
  const safety = safetyFor(profile, today);
  const weeklyCost = grocery.reduce((sum, item) => sum + item.cost, 0);
  const checked = grocery.filter(item => groceries[item.id]).length;

  return <>
    <div className="page-intro"><div><span className="page-eyebrow tone-diet"><Salad size={15} /> Diet &amp; Hydration</span><h1>Nutrition Planner</h1><p>Build a day of meals that fits your preferences and kitchen access.</p></div><IconBadge pillar="diet"><Salad size={26} /></IconBadge></div>
    <SafetyBanner pillar="diet" today={today} />
    <div className="context-strip tone-diet"><MapPin size={21} /><div><strong>{environments[environment].label} meal plan</strong><p>{environment === 'home' ? 'Prepare Indian and global staples with a full kitchen.' : 'Every meal uses ready-to-eat or cold-prep ingredients, so you can put it together without a stove.'}</p></div></div>
    <WeatherDietAlert />
    <MealRecoveryNote today={today} onMeal={onMeal} />
    <section className="module-section" id="smart-meals">
      <div className="section-head"><div><h2>Smart meal generator</h2><p>{cuisineLabels[defaultCuisine]} · Four meals with portions, prep steps, and estimated macros.</p></div><button className="button primary" onClick={() => { rotatePlan(); setSelected(undefined); }}><RefreshCw size={16} /> Generate new plan</button></div>
      <div className="card diet-settings">
        <label><span>Diet preference</span><SelectField icon={<Salad size={16} />} value={diet} onChange={event => setDiet(event.target.value as Preference)}>{preferences.map(item => <option key={item}>{item}</option>)}</SelectField></label>
        <label><span>Kitchen access</span><SelectField icon={<CookingPot size={16} />} value={environment} onChange={event => setEnvironment(event.target.value as Environment)}>{Object.entries(setups).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</SelectField></label>
        <div className="plan-totals"><span><Flame size={16} /> Planned daily totals</span><MacroValues macros={total} /></div>
      </div>
      <div className="meal-grid">
        {plan.map(meal => {
          const Icon = mealIcons[meal.slot];
          const opened = selected === meal.slot;
          const isLogged = !!logged[meal.id];
          const loggedSlot = Object.entries(logged).find(([id, entry]) => id !== meal.id && inferredSlot(id, entry) === meal.slot)?.[1];
          return <article className={`card meal-card ${opened ? 'highlighted' : ''}`} key={meal.slot}>
            <div className="meal-top"><IconBadge pillar="diet"><Icon size={19} /></IconBadge><span>{meal.slot}</span><span><Clock3 size={14} /> {meal.minutes} min</span></div>
            {meal.constraintMatch && <span className="constraint-match">Best Match for Your Constraints</span>}
            <h3>{meal.name}</h3><MacroValues macros={meal.macros} />
            <div className="ingredient-evidence"><EvidenceInfo rule="plate" compact />{safety.diabetes && carbPortionNotice(meal) && <span className="carb-notice">Carbohydrate portion to review</span>}</div>
            <div className="meal-actions">
              <button className="button secondary" aria-expanded={opened} aria-controls={`recipe-${meal.slot}`} onClick={() => setSelected(opened ? undefined : meal.slot)}>Recipe <ChevronDown size={15} className={opened ? 'rotated' : ''} /></button>
              <button className={`button ${isLogged || loggedSlot ? 'secondary logged' : 'primary'}`} disabled={!isLogged && !!loggedSlot} aria-pressed={isLogged || !!loggedSlot} onClick={() => toggleMeal(meal.id, { name: meal.name, macros: meal.macros, slot: meal.slot })}>{isLogged && <Check size={16} />}{isLogged ? 'Logged' : loggedSlot?.unplanned ? 'Outside meal logged' : loggedSlot ? 'Slot logged' : 'Log meal'}</button>
            </div>
            {(meal.slot === 'Breakfast' || meal.slot === 'Snack') && <PinnedRoutine pillar="diet" slot={meal.slot} today={today} />}
            <div className="recipe" id={`recipe-${meal.slot}`} hidden={!opened}>
              <p>{meal.method}</p>
              <ul>{meal.ingredients.map(([food, grams]) => <li key={food}>{foodLabel(food)} <strong>{grams} g</strong></li>)}</ul>
              <p>Estimated portion cost <strong>{price(meal.amount, currency, true)}</strong></p>
              {comfort && opened && <ReadAloudButton text={`${meal.name}. ${meal.method}`} label="Read recipe directions" />}
            </div>
            <MistakeGuardrailBanner category="diet" compact defaultExpanded={false} />
          </article>;
        })}
      </div>
      <MistakeGuardrailBanner category="diet" />
      <RegionalRecipeEngine today={today} />
      <PinnedRoutine pillar="diet" slot="Hydration" today={today} />
      <p className="fine-print">Sample nutrition values and serving sizes vary by brand and preparation. <a href="https://fdc.nal.usda.gov/" target="_blank" rel="noreferrer">USDA FoodData Central</a></p>
    </section>
    {Object.keys(logged).length > 0 && <section className="module-section">
      <div className="section-head"><div><h2>Logged today</h2><MacroValues macros={loggedTotal} /></div></div>
      <div className="card journal-list">{Object.entries(logged).map(([id, meal]) => <div key={id}><span><strong>{meal.name}</strong><small>{meal.macros.calories} kcal</small></span><button className="icon-button" aria-label={`Remove ${meal.name} from today's log`} onClick={() => toggleMeal(id, meal)}><Trash2 size={17} /></button></div>)}</div>
    </section>}
    <section className="module-section">
      <div className="section-head"><div><h2><ShoppingBasket size={22} /> Grocery essentials</h2><p>Quantities for seven days of your regular menu.</p></div><div className="grocery-total"><strong>{price(weeklyCost, currency, true)}</strong><span>estimated weekly cost</span></div></div>
      <div className="card grocery-card"><div className="grocery-head"><strong>{checked} of {grocery.length} items checked</strong><span>Quantity · est. cost</span></div>
        {grocery.map(item => <label className={`grocery-row ${groceries[item.id] ? 'checked' : ''}`} key={item.id}>
          <input type="checkbox" checked={!!groceries[item.id]} onChange={() => toggleGrocery(item.id)} /><span>{item.name}</span>
          <span>{item.grams >= 1000 ? `${(item.grams / 1000).toFixed(2)} kg` : `${item.grams} g`}</span><strong>{item.cost > 0 ? price(item.cost, currency, true) : 'Pantry'}</strong>
        </label>)}
      </div>
      <p className="fine-print">Grocery prices are illustrative estimates. USD display uses a fixed reference of ₹93.50 per $1.</p>
    </section>
  </>;
}
