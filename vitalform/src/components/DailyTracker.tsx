import { ArrowUpRight, Check, ChevronRight, Droplet, Flame, Minus, Moon, Plus, Sun, Zap } from 'lucide-react';
import { macroGoals, waterGoal, type Page } from '../context';
import { calculateProfile } from '../profile';
import { climateHydrationBonus } from '../climate';
import { emptyJournal, sumMacros, useWorkspace, workoutStreak } from '../store';
import { IconBadge, Ring } from './Shared';

export function DailyTracker({ today, onNavigate }: { today: string; onNavigate: (page: Page, target?: string) => void }) {
  const { days, addWater, setHabit, profile, weatherSeason } = useWorkspace();
  const calculated = profile && calculateProfile(profile);
  const targets = profile ? calculated?.targets : macroGoals;
  const baseHydration = profile ? calculated?.hydrationMl : waterGoal;
  const seasonBonus = climateHydrationBonus(baseHydration, profile, weatherSeason);
  const hydrationTarget = baseHydration ? baseHydration + seasonBonus : null;
  const { habits, water, meals } = days[today] ?? emptyJournal;
  const macros = sumMacros(Object.values(meals).map(meal => meal.macros));
  const streak = workoutStreak(days, today);
  const done = Object.values(habits).filter(Boolean).length;
  return <section id="daily-tracker" className="dashboard-section">
    <div className="section-head tracker-heading">
      <h2>Daily tracker</h2>
      <span className="habit-count"><span /> {done} of 3 habits complete</span>
    </div>
    <div className="tracker-grid">
      <article className="card tracker-card">
        <div className="tracker-title"><IconBadge pillar="skin" /><h3>Skincare</h3><button className="plain-icon tracker-link" aria-label="Open skincare studio" onClick={() => onNavigate('skin')}><ArrowUpRight size={17} /></button></div>
        <div className="habit-list">
          {([['am', 'Morning routine', Sun], ['pm', 'Evening routine', Moon]] as const).map(([habit, label, Icon]) =>
            <button key={habit} className="habit-line" aria-pressed={!!habits[habit]} onClick={() => setHabit(habit, !habits[habit])}>
              <Icon size={15} /><span>{label}</span><span className={`habit-check ${habits[habit] ? 'checked' : ''}`}>{habits[habit] && <Check size={12} />}</span>
            </button>
          )}
        </div>
      </article>
      <article className="card tracker-card">
        <div className="tracker-title"><IconBadge pillar="fitness" /><h3>Movement</h3><button className="plain-icon tracker-link" aria-label="Open movement hub" onClick={() => onNavigate('fitness')}><ArrowUpRight size={17} /></button></div>
        <div className="tracker-metric">
          <Ring value={streak / 7 * 100} size={57} tone="fitness" label="Workout streak progress toward seven days"><Flame size={21} /></Ring>
          <div><strong>{streak} {streak === 1 ? 'day' : 'days'}</strong><span>Workout streak</span></div>
        </div>
        <button className={`tracker-action ${habits.workout ? 'complete' : ''}`} aria-pressed={!!habits.workout} onClick={() => setHabit('workout', !habits.workout)}>{habits.workout ? <Check size={14} /> : <Plus size={14} />}{habits.workout ? 'Workout logged' : 'Log workout'}</button>
      </article>
      <article className="card tracker-card">
        <div className="tracker-title"><IconBadge pillar="water" /><h3>Hydration</h3></div>
        <div className="tracker-metric">
          {hydrationTarget ? <Ring value={water / hydrationTarget * 100} size={57} tone="water" label="Hydration goal progress"><Droplet size={18} /></Ring> : <IconBadge pillar="water" />}
          <div aria-live="polite">
            <strong>{water.toLocaleString()} <small>ml</small></strong>
            <span>{hydrationTarget ? `of ${hydrationTarget.toLocaleString()} ml goal` : 'Logged today'}</span>
            {seasonBonus > 0 && (
              <small style={{ display: 'block', fontSize: '10px', color: '#0284c7', fontWeight: 650 }}>
                Includes {seasonBonus} ml heat allowance
              </small>
            )}
          </div>
        </div>
        <div className="water-actions">
          <button className="tracker-action" onClick={() => addWater(250)}><Plus size={14} /> 250 ml</button>
          <button className="tracker-action water-minus" aria-label="Remove 250 ml water" disabled={water <= 0} onClick={() => addWater(-250)}><Minus size={15} /></button>
        </div>
      </article>
      <article className="card tracker-card macro-tracker">
        <div className="tracker-title"><IconBadge pillar="diet" /><h3>Nutrition</h3><button className="plain-icon tracker-link" aria-label="Open meal planner" onClick={() => onNavigate('diet')}><ArrowUpRight size={17} /></button></div>
        <div className="calorie-line">{targets && <Ring value={macros.calories / targets.calories * 100} size={28} tone="diet" label="Daily calorie progress"><Zap size={13} /></Ring>}<div><strong>{macros.calories.toLocaleString()}</strong><span> {targets ? `/ ${targets.calories.toLocaleString()} kcal` : 'kcal logged'}</span></div></div>
        {targets && <div className="macro-bar calorie-bar" role="progressbar" aria-label="Calories" aria-valuenow={Math.min(macros.calories, targets.calories)} aria-valuemin={0} aria-valuemax={targets.calories}><span style={{ width: `${Math.min(100, macros.calories / targets.calories * 100)}%` }} /></div>}
        <div className="macro-mini">
          {([['protein', 'Protein'], ['carbs', 'Carbs'], ['fat', 'Fat']] as const).map(([key, label]) =>
            <div key={key}><span>{label}</span><strong>{Math.round(macros[key])}<small> g</small></strong>{targets && <div className={`macro-bar ${key}`} role="progressbar" aria-label={label} aria-valuenow={Math.min(Math.round(macros[key]), targets[key])} aria-valuemin={0} aria-valuemax={targets[key]}><span style={{ width: `${Math.min(100, macros[key] / targets[key] * 100)}%` }} /></div>}</div>
          )}
        </div>
        <button className="tracker-action macro-log" onClick={() => onNavigate('diet')}>Log a meal <ChevronRight size={14} /></button>
      </article>
    </div>
  </section>;
}
