import { Activity, ArrowRight, CalendarCheck, Check, ChevronRight, Droplets, Dumbbell, Fingerprint, Pencil, Printer, RefreshCw, Salad, ShieldCheck, Sparkles, Target } from 'lucide-react';
import { useMemo, useState } from 'react';
import { carbPortionNotice, inferredSlot } from '../adaptive';
import { budgets, environments, price, tiers, type Page } from '../context';
import { metricFormula, stepEvidence, type EvidenceKey } from '../evidence';
import { foodLabel } from '../nutrition';
import { mealAdjustment, personalizedMealPlan, type PersonalizedMealPlan } from '../personalizedNutrition';
import { calculateProfile, fitnessGoals, hasBiometrics, type CalculatedMacros, type UserBioProfile } from '../profile';
import { safetyFor } from '../safety';
import { customSkincareProtocol, workspaceSkin } from '../skincare';
import { scheduledFormulas } from '../skinSchedule';
import { emptyJournal, sumMacros, useWorkspace } from '../store';
import { movementSchedule, rampWeek } from '../weeklyMovement';
import { climateHydrationBonus } from '../climate';
import { MistakeGuardrailBanner } from './MistakeGuardrailBanner';
import { WeatherDietAlert, WeatherFitnessAlert, WeatherSkincareAlert } from './WeatherProtectionShield';
import { cuisineLabels } from '../regionalRecipes';
import '../mealConstraints.css';
import { EvidenceInfo, SafetyBanner } from './Evidence';
import { PinnedRoutine } from './PinnedRoutine';
import { MealRecoveryNote } from './RecoveryTools';
import { IconBadge, MacroValues, Ring, SelectField } from './Shared';

const blueprintTabs = [
  { id: 'nutrition', label: 'Nutrition', icon: Salad },
  { id: 'skin', label: 'Skin & hair', icon: Sparkles },
  { id: 'movement', label: 'Movement', icon: Dumbbell },
] as const;
type BlueprintTab = typeof blueprintTabs[number]['id'];
type Navigate = (page: Page, target?: string) => void;

function NutritionTargets({ metrics, today, profile }: { metrics: CalculatedMacros | null; today: string; profile: UserBioProfile }) {
  const { days, addWater, weatherSeason } = useWorkspace();
  const { water, meals } = days[today] ?? emptyJournal;
  const totals = sumMacros(Object.values(meals).map(meal => meal.macros));
  if (!metrics?.targets || !metrics.hydrationMl) return <div className="context-strip tone-diet"><ShieldCheck size={20} /><div><strong>Your food plan</strong><p>{metrics?.energyNote ?? 'Your meal ideas use your age and food preferences. Daily targets are available after you complete your bio-profile where appropriate.'}</p></div></div>;
  const { targets, hydrationMl } = metrics;
  const details = [
    { rule: 'calories', label: 'Calories', target: targets.calories, unit: 'kcal', logged: totals.calories },
    { rule: 'protein', label: 'Protein', target: targets.protein, unit: 'g', logged: totals.protein },
    { rule: 'carbs', label: 'Carbs', target: targets.carbs, unit: 'g', logged: totals.carbs },
    { rule: 'fats', label: 'Fats', target: targets.fat, unit: 'g', logged: totals.fat },
    { rule: 'water', label: 'Water', target: (hydrationMl + climateHydrationBonus(hydrationMl, profile, weatherSeason)) / 1000, unit: 'L', logged: water / 1000 },
  ] satisfies { rule: EvidenceKey; label: string; target: number; unit: string; logged: number }[];
  return <div className="blueprint-targets">
    {details.map(({ rule, label, target, unit, logged }) => <article className="card blueprint-target" key={label}>
      <Ring label={`${label} target progress`} value={logged / target * 100} tone={label === 'Water' ? 'water' : 'diet'} size={87}>
        <strong>{target.toLocaleString()}</strong><small>{unit}</small>
      </Ring><h3>{label}</h3><span>{Math.round(logged * 100) / 100} {unit} logged</span>
      <EvidenceInfo rule={rule} formula={metricFormula(profile, rule)} compact />
      {label === 'Water' && <button className="tracker-action" onClick={() => addWater(250)}><Droplets size={14} /> +250 ml</button>}
    </article>)}
  </div>;
}

function BlueprintNutrition({ plan, metrics, today, onNavigate, profile, onMeal }: { plan: PersonalizedMealPlan; metrics: CalculatedMacros | null; today: string; onNavigate: Navigate; profile: UserBioProfile; onMeal: () => void }) {
  const { swapMeal, toggleMeal, days, defaultCuisine } = useWorkspace();
  const logged = (days[today] ?? emptyJournal).meals;
  const safety = safetyFor(profile, today);
  return <section className="module-section blueprint-content">
    <div className="section-head"><div><h2>Daily nutrition targets</h2><p>Rings update as you log meals and water.</p></div><button className="button secondary" onClick={() => onNavigate('diet')}>Meal log & groceries <ArrowRight size={15} /></button></div>
    <SafetyBanner pillar="diet" today={today} />
    <WeatherDietAlert />
    <NutritionTargets metrics={metrics} today={today} profile={profile} />
    <MealRecoveryNote today={today} onMeal={onMeal} />
    {metrics?.targets && <p className="fine-print">{metrics.energyNote} <a href="https://pubmed.ncbi.nlm.nih.gov/2305711/" target="_blank" rel="noreferrer">Mifflin–St Jeor study</a></p>}
    <div className="section-head blueprint-meal-head"><div><h2>Your four-meal schedule</h2><p>{cuisineLabels[defaultCuisine]} · Portions follow each slot’s estimated targets where the ingredients allow.</p></div></div>
    <div className="blueprint-meals">{plan.meals.map(meal => {
      const group = plan.groups[meal.slot];
      const isLogged = !!logged[meal.id];
      const loggedSlot = Object.entries(logged).find(([id, entry]) => id !== meal.id && inferredSlot(id, entry) === meal.slot)?.[1];
      const name = meal.slot === 'Snack' ? 'Evening snack' : meal.slot;
      return <article className="card blueprint-meal" key={meal.slot}>
        <span className="page-eyebrow tone-diet"><Salad size={15} /> {name} · {meal.minutes} min</span>
        {meal.constraintMatch && <span className="constraint-match">Best Match for Your Constraints</span>}
        <h3>{meal.name}</h3><MacroValues macros={meal.macros} />
        <div className="ingredient-evidence"><EvidenceInfo rule="plate" compact />{safety.diabetes && carbPortionNotice(meal) && <span className="carb-notice">Carbohydrate portion to review</span>}</div>
        {group.target && <p className="fine-print">Slot target {group.target.calories} kcal · {group.target.protein} g protein{group.withinTolerance ? '' : ' · Closest match available'}</p>}
        <details className="meal-instructions"><summary>Ingredients & prep</summary><p>{meal.method}</p>
          <ul>{meal.ingredients.map(([food, grams]) => <li key={food}>{foodLabel(food)} <strong>{grams} g</strong></li>)}</ul>
        </details>
        <div className="blueprint-meal-actions">
          <button className="button secondary" disabled={group.choices.length <= 1 || isLogged || !!loggedSlot} title={group.choices.length <= 1 ? 'No interchangeable meal meets the serving and macro tolerances' : undefined} onClick={() => swapMeal(meal.slot, group.choices.length)}>
            <RefreshCw size={15} /> {group.choices.length > 1 ? 'Swap meal' : 'No close swap'}
          </button>
          <button className={`button ${isLogged || loggedSlot ? 'secondary' : 'primary'}`} disabled={!isLogged && !!loggedSlot} aria-pressed={isLogged || !!loggedSlot} onClick={() => toggleMeal(meal.id, { name: meal.name, macros: meal.macros, slot: meal.slot })}>{isLogged && <Check size={15} />}{isLogged ? 'Logged' : loggedSlot?.unplanned ? 'Outside meal logged' : loggedSlot ? 'Slot logged' : 'Log meal'}</button>
        </div>
        {(meal.slot === 'Breakfast' || meal.slot === 'Snack') && <PinnedRoutine pillar="diet" slot={meal.slot} today={today} />}
      </article>;
    })}</div>
    <PinnedRoutine pillar="diet" slot="Hydration" today={today} />
    <MistakeGuardrailBanner category="diet" compact defaultExpanded={false} />
    <p className="fine-print">Swaps are offered when the available meal is within 35 kcal, 3 g protein, 6 g carbs and 3 g fat of the current choice. <a href="https://www.fda.gov/food/nutrition-food-labeling-and-critical-foods/food-allergies" target="_blank" rel="noreferrer">Food allergy and cross-contact guidance</a></p>
  </section>;
}

function BlueprintSkin({ profile, today, onNavigate }: { profile: UserBioProfile; today: string; onNavigate: Navigate }) {
  const { currency, days, setHabit, easyDay, pinnedProducts, ownSkincare, skinSchedule, weatherSeason } = useWorkspace();
  const [time, setTime] = useState<'am' | 'pm'>('am');
  const [compare, setCompare] = useState<UserBioProfile['budget'] | ''>('');
  const savedActives = scheduledFormulas(pinnedProducts, ownSkincare, skinSchedule).length > 0;
  const protocol = customSkincareProtocol(profile, time, profile.budget, today);
  const routine = workspaceSkin(profile.skin, profile.environment, profile.budget, time, profile, today, easyDay === today, savedActives, weatherSeason);
  const alternate = compare ? workspaceSkin(profile.skin, profile.environment, compare, time, profile, today, easyDay === today, savedActives, weatherSeason) : null;
  const done = !!(days[today] ?? emptyJournal).habits[time];
  return <section className="module-section blueprint-content">
    <div className="section-head"><div><h2>Your skincare protocol</h2><p>{profile.skin} skin · {routine.care}</p></div>
      <div className="segmented" role="group" aria-label="Blueprint skincare routine time">
        <button aria-pressed={time === 'am'} onClick={() => setTime('am')}>AM</button><button aria-pressed={time === 'pm'} onClick={() => setTime('pm')}>PM</button>
      </div></div>
    <SafetyBanner pillar="skin" today={today} />
    <WeatherSkincareAlert />
    <div className="skin-compare-controls"><SelectField value={compare} aria-label="Compare skincare budget tier" onChange={event => setCompare(event.target.value as typeof compare)}>
      <option value="">Compare another budget tier</option>{tiers.filter(tier => tier !== profile.budget).map(tier => <option key={tier} value={tier}>{budgets[tier].short}</option>)}
    </SelectField><button className="button secondary" onClick={() => setHabit(time, !done)} aria-pressed={done}><Check size={16} /> {done ? 'Routine complete' : 'Mark routine complete'}</button></div>
    <div className="blueprint-skin-list">{routine.steps.map((step, index) => {
      const other = alternate?.steps.find(item => item.label === step.label);
      const slot = step.label as 'Cleanse' | 'Hydrate' | 'Treat' | 'Moisturize' | 'Protect' | 'LipCare';
      return <article className="card blueprint-skin-step" key={step.label}>
        <span className="routine-step-number">{index + 1}</span>
        <div><span>{step.label === 'LipCare' ? 'Lips' : step.label}</span><h3>{step.product}</h3><p>{step.note}</p><strong>{step.price ? `Est. ${price(step.price, currency)}` : 'No extra cost'}</strong>
          <div className="ingredient-evidence"><EvidenceInfo rule={stepEvidence(step.label, step.product)} compact /></div>
          <PinnedRoutine pillar="skin" slot={slot} today={today} time={time} />
        </div>
        {other && compare && <div className="skin-alt"><span>{budgets[compare].short}</span><h3>{other.product}</h3><strong>{other.price ? `Est. ${price(other.price, currency)}` : 'No extra cost'}</strong></div>}
      </article>;
    })}</div>
    <div className="blueprint-callouts">
      <div className="context-strip tone-skin"><Sparkles size={21} /><div><strong>Haircare & environment</strong><p>{routine.hair} {routine.description}</p><PinnedRoutine pillar="skin" slot="Haircare" /></div></div>
      <div className="context-strip tone-skin"><ShieldCheck size={21} /><div><strong>Active-ingredient spacing</strong><p>{protocol.guardrail}</p><button className="button text-button" onClick={() => onNavigate('skin', 'formulas')}>Review saved actives <ArrowRight size={15} /></button></div></div>
    </div>
    {!routine.steps.some(step => step.label === 'LipCare') && <PinnedRoutine pillar="skin" slot="LipCare" />}
    <MistakeGuardrailBanner category="skin" compact defaultExpanded={false} />
  </section>;
}

function BlueprintMovement({ profile, onNavigate, today }: { profile: UserBioProfile; onNavigate: Navigate; today: string }) {
  const { workoutRampStart, easyDay, weatherSeason } = useWorkspace();
  const week = movementSchedule(profile, workoutRampStart, today, weatherSeason);
  const count = week.filter(day => day.target).length;
  const ramp = rampWeek(workoutRampStart, today);
  return <section className="module-section blueprint-content">
    <div className="section-head"><div><h2>Your weekly split</h2><p>{count} movement days · {environments[profile.environment].label} · {fitnessGoals[profile.goal]}</p></div></div>
    <SafetyBanner pillar="fitness" today={today} />
    <WeatherFitnessAlert />
    {ramp > 0 && <p className="fine-print">21-day introduction · Week {ramp} of 3. Start with shorter sets and increase gradually.</p>}
    {easyDay === today && <button className="button secondary" onClick={() => onNavigate('fitness')}>Open today’s minimum routine <ArrowRight size={15} /></button>}
    <div className="blueprint-week card">{week.map(({ day, title, detail, target, duration }) => <div className="week-row" key={day}>
      <span>{day}</span><div><h3>{title}</h3><p>{detail}{duration ? ` · ${duration} min` : ''}</p></div>
      {target && <button className="button secondary" onClick={() => onNavigate('fitness', target)}>Open workout <ChevronRight size={15} /></button>}
    </div>)}</div>
    <PinnedRoutine pillar="fitness" slot="Workout" />
    <MistakeGuardrailBanner category="exercise" compact defaultExpanded={false} />
  </section>;
}

function PrintBlueprint({ profile, plan, metrics, today }: { profile: UserBioProfile; plan: PersonalizedMealPlan; metrics: CalculatedMacros | null; today: string }) {
  const { easyDay, workoutRampStart, pinnedProducts, ownSkincare, skinSchedule, weatherSeason } = useWorkspace();
  const savedActives = scheduledFormulas(pinnedProducts, ownSkincare, skinSchedule).length > 0;
  return <div className="print-blueprint">
    <h1>Vitalform · My Custom Blueprint</h1>
    <p>{today} · {environments[profile.environment].label} · {profile.diet} · {budgets[profile.budget].short}</p>
    <h2>Nutrition and hydration</h2>
    {metrics?.targets && <p>{metrics.targets.calories} kcal · {metrics.targets.protein} g protein · {metrics.targets.carbs} g carbs · {metrics.targets.fat} g fats{metrics.hydrationMl && ` · ${(metrics.hydrationMl + climateHydrationBonus(metrics.hydrationMl, profile, weatherSeason)) / 1000} L water`}</p>}
    <p>{metrics?.energyNote}</p>
    {plan.meals.map(meal => <section key={meal.slot}><h3>{meal.slot} · {meal.name}</h3><p>{meal.macros.calories} kcal · {meal.macros.protein} g protein</p>
      <p>{meal.ingredients.map(([food, grams]) => `${foodLabel(food)} ${grams} g`).join(' · ')}</p><p>{meal.method}</p></section>)}
    <h2>Skincare and haircare</h2>
    {(['am', 'pm'] as const).map(time => {
      const protocol = customSkincareProtocol(profile, time, profile.budget, today);
      const routine = workspaceSkin(profile.skin, profile.environment, profile.budget, time, profile, today, easyDay === today, savedActives, weatherSeason);
      return <section key={time}><h3>{time.toUpperCase()} routine</h3><ol>{routine.steps.map(step => <li key={step.label}>{step.label} · {step.product}</li>)}</ol>
        {time === 'pm' && <p>{protocol.guardrail} {routine.hair}</p>}</section>;
    })}
    <h2>Weekly movement</h2>
    <ul>{movementSchedule(profile, workoutRampStart, today, weatherSeason).map(day => <li key={day.day}>{day.day} · {day.title}{day.duration ? ` · ${day.duration} min` : ''}</li>)}</ul>
  </div>;
}

export function BlueprintModule({ today, onEdit, onNavigate, target, onMeal, onCheckIn }: { today: string; onEdit: () => void; onNavigate: Navigate; target?: string; onMeal: () => void; onCheckIn: () => void }) {
  const { profile, planIndex, mealSwaps, days, careMealFilters, defaultCuisine, weatherSeason } = useWorkspace();
  const [tab, setTab] = useState<BlueprintTab>(blueprintTabs.some(item => item.id === target) ? target as BlueprintTab : 'nutrition');
  const journal = days[today];
  const plan = useMemo(() => profile && personalizedMealPlan(profile, planIndex, mealSwaps, mealAdjustment(profile, journal), careMealFilters, { cuisine: defaultCuisine, weather: weatherSeason }), [profile, planIndex, mealSwaps, journal, careMealFilters, defaultCuisine, weatherSeason]);
  const metrics = profile && calculateProfile(profile);
  if (!profile || !plan) return <div className="blueprint-onboarding">
    <span className="page-eyebrow"><Fingerprint size={17} /> My personal plan</span>
    <h1>Your routine, built around you.</h1>
    <p>Add your measurements, goals, kitchen access and skincare preferences to create your custom blueprint.</p>
    <button className="button primary" onClick={onEdit}>Build my blueprint <ArrowRight size={17} /></button>
    <div className="blueprint-start-grid">{blueprintTabs.map(({ id, label, icon: Icon }) => <div key={id}><Icon size={20} /><strong>{label}</strong></div>)}</div>
  </div>;
  return <>
    <div className="page-intro"><div><span className="page-eyebrow tone-diet"><Fingerprint size={16} /> My personal plan</span><h1>My Custom Blueprint</h1><p>{fitnessGoals[profile.goal]} · {profile.diet} · {environments[profile.environment].label}</p></div>
      <div className="blueprint-header-actions"><button className="button secondary" onClick={onEdit}><Pencil size={15} /> Edit profile</button>
        <button className="button secondary" onClick={hasBiometrics(profile) ? onCheckIn : onEdit}><CalendarCheck size={15} /> {hasBiometrics(profile) ? 'Check in now' : 'Complete bio-profile'}</button>
        <button className="button primary" onClick={() => window.print()}><Printer size={15} /> Print / save PDF</button></div>
    </div>
    <div className="blueprint-summary">
      <div><Activity size={18} /><span><small>BMI</small><strong>{metrics?.bmi.toFixed(1) ?? '—'}</strong><small>{metrics?.bmiBand ?? 'Age-based reference'}</small></span><EvidenceInfo rule="bmi" formula={metricFormula(profile, 'bmi')} compact /></div>
      <div><Target size={18} /><span><small>Resting energy</small><strong>{metrics?.bmr?.toLocaleString() ?? '—'} {metrics?.bmr && 'kcal'}</strong><small>BMR estimate</small></span>{metrics?.bmr && <EvidenceInfo rule="bmr" formula={metricFormula(profile, 'bmr')} compact />}</div>
      <div><IconBadge pillar="fitness"><Activity size={18} /></IconBadge><span><small>Daily expenditure</small><strong>{metrics?.tdee?.toLocaleString() ?? '—'} {metrics?.tdee && 'kcal'}</strong><small>TDEE estimate</small></span>{metrics?.tdee && <EvidenceInfo rule="tdee" formula={metricFormula(profile, 'tdee')} compact />}</div>
    </div>
    <nav className="blueprint-tabs" aria-label="Blueprint sections">
      {blueprintTabs.map(({ id, label, icon: Icon }) => <button key={id} aria-pressed={tab === id} onClick={() => setTab(id)}><Icon size={17} /> {label}</button>)}
    </nav>
    {tab === 'nutrition' && <BlueprintNutrition plan={plan} metrics={metrics} today={today} onNavigate={onNavigate} profile={profile} onMeal={onMeal} />}
    {tab === 'skin' && <BlueprintSkin profile={profile} today={today} onNavigate={onNavigate} />}
    {tab === 'movement' && <BlueprintMovement profile={profile} onNavigate={onNavigate} today={today} />}
    <PrintBlueprint profile={profile} plan={plan} metrics={metrics} today={today} />
  </>;
}
