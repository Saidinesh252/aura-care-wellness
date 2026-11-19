import { Activity, ArrowRight, CalendarDays, Check, ChevronDown, Clock3, Droplets, Footprints, HeartHandshake, HeartPulse, Plus, Share2, ShieldCheck, Soup, Trash2, UserRoundPlus } from 'lucide-react';
import { useId, useState } from 'react';
import { localDate, type Page } from '../context';
import { careMealFilters, careMoods, comfortFor, emptyCareDay, familyMealsFor, familyRelationships, validFamilyMember, type CareDay, type CareMealFilter, type CareReminder, type FamilyMember, type FamilyMeal, type NewFamilyMember } from '../family';
import { createProfile } from '../profile';
import { useWorkspace } from '../store';
import { FamilyAvatar } from './FamilyCircle';
import { ReadAloudButton } from './ReadAloudButton';
import { Modal, SelectField } from './Shared';
import { MistakeGuardrailBanner } from './MistakeGuardrailBanner';
import { inferredSlot } from '../adaptive';
import { cuisineLabels } from '../regionalRecipes';
import '../mealConstraints.css';
import { FamilySyncModal } from './FamilySyncModal';
import './family.css';

const painOptions = Array.from({ length: 11 }, (_, index) => index);
const shortDay = new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
const longDay = new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
const clockTime = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit' });

function MemberEditor({ member, onClose }: { member?: FamilyMember; onClose: () => void }) {
  const { addFamilyMember, updateFamilyMember } = useWorkspace();
  const [name, setName] = useState(member?.name ?? '');
  const [age, setAge] = useState(member ? String(member.age) : '');
  const [relationship, setRelationship] = useState<FamilyMember['relationship']>(member?.relationship ?? 'Parent');
  const [feedback, setFeedback] = useState('');
  const input: NewFamilyMember = { name: name.trim(), age: Number(age), relationship };
  const valid = validFamilyMember(input);

  function save() {
    if (!valid) return;
    if (member) updateFamilyMember(member.id, input);
    else {
      const count = useWorkspace.getState().familyMembers.length;
      addFamilyMember(input);
      if (useWorkspace.getState().familyMembers.length === count) {
        setFeedback('This Family Circle has reached its profile limit.');
        return;
      }
    }
    onClose();
  }

  return <Modal title={member ? 'Edit family member' : 'Add a family member'} onClose={onClose} variant="wizard">
    <div className="family-form-layout">
      <p className="muted">Use a first name or nickname. Each member gets a separate plan and care log on this device.</p>
      <form className="family-form" onSubmit={event => { event.preventDefault(); save(); }}>
        <label className="form-field"><span>Display name</span>
          <input name="displayName" type="text" placeholder="Name or nickname" value={name} maxLength={50} onChange={event => setName(event.currentTarget.value)} required />
        </label>
        <div className="family-form-pair">
          <label className="form-field"><span>Age</span>
            <input name="age" type="number" min={14} max={110} step={1} inputMode="numeric" value={age}
              onChange={event => setAge(event.currentTarget.value)} required />
          </label>
          <label className="form-field"><span>Relationship</span>
            <SelectField value={relationship} onChange={event => setRelationship(event.currentTarget.value as FamilyMember['relationship'])}>
              {familyRelationships.map(value => <option key={value}>{value}</option>)}
            </SelectField>
          </label>
        </div>
        {feedback && <p className="form-error" role="status">{feedback}</p>}
        <div className="wizard-footer">
          <button type="button" className="button secondary" onClick={onClose}>Cancel</button>
          <button className="button primary" type="submit" disabled={!valid}>{member ? 'Save changes' : 'Add and switch'}</button>
        </div>
      </form>
    </div>
  </Modal>;
}

function FamilyProfiles({ onAdd, onEdit, onEditProfile }: { onAdd: () => void; onEdit: (member: FamilyMember) => void; onEditProfile: () => void }) {
  const { familyMembers, activeMemberId, switchFamilyMember, profile, comfortPreference, setComfortPreference } = useWorkspace();
  const active = familyMembers.find(member => member.id === activeMemberId);
  const comfort = comfortFor(profile?.age, comfortPreference);
  return <section className="family-section" aria-labelledby="profile-chooser-title">
    <div className="section-head">
      <div><h2 id="profile-chooser-title">People in your circle</h2><p>Choose whose plan and activity you want to see.</p></div>
      <button className="button secondary" type="button" onClick={onEditProfile}>Open bio-profile <ArrowRight size={15} aria-hidden /></button>
    </div>
    <div className="family-member-grid">
      <button type="button" className="family-member-card card" aria-pressed={activeMemberId === 'self'} onClick={() => switchFamilyMember('self')}>
        <FamilyAvatar /><span><strong>My profile</strong><small>Your own plan</small></span>
        {activeMemberId === 'self' && <Check size={18} aria-hidden />}
      </button>
      {familyMembers.map(member => <button type="button" key={member.id} className="family-member-card card" aria-pressed={activeMemberId === member.id} onClick={() => switchFamilyMember(member.id)}>
        <FamilyAvatar name={member.name} /><span><strong>{member.name}</strong><small>{member.relationship} · {member.age} years</small></span>
        {activeMemberId === member.id && <Check size={18} aria-hidden />}
      </button>)}
      <button type="button" className="family-member-card family-member-add card" onClick={onAdd}><span><Plus size={19} aria-hidden /> Add person</span></button>
    </div>
    <div className="family-display card">
      <div><strong>Comfort readability</strong><p>{comfort ? 'Larger text and stronger contrast are on.' : 'Standard text and contrast are on.'}</p></div>
      <SelectField aria-label="Comfort readability for this profile" value={comfortPreference === null ? 'auto' : comfortPreference ? 'on' : 'off'}
        onChange={event => setComfortPreference(event.currentTarget.value === 'auto' ? null : event.currentTarget.value === 'on')}>
        <option value="auto">Automatic by age</option><option value="on">Always on</option><option value="off">Always off</option>
      </SelectField>
      {active && <button className="button secondary" type="button" onClick={() => onEdit(active)}>Edit member</button>}
    </div>
  </section>;
}

function CareHabits({ today, onNavigate }: { today: string; onNavigate: (page: Page, target?: string) => void }) {
  const { careDays, days, addWater, addMovementMinutes, setCareCheckIn } = useWorkspace();
  const entry = careDays[today] ?? emptyCareDay;
  const water = days[today]?.water ?? 0;
  return <section className="family-section" aria-labelledby="care-today-title">
    <div className="section-head">
      <div><h2 id="care-today-title">Today’s check-in</h2><p>{longDay.format(new Date(`${today}T12:00:00`))}</p></div>
      <ReadAloudButton text="Use the plus buttons to log water and movement. Pick a joint pain rating and an energy level if you would like to record how you feel today." />
    </div>
    <div className="family-action-grid">
      <article className="family-log card water-log">
        <div className="family-log-heading"><span className="family-tile-icon"><Droplets size={21} aria-hidden /></span><h3>Water</h3></div>
        <p className="family-number" aria-live="polite">{water.toLocaleString('en-IN')} <span>ml logged</span></p>
        <div className="family-action-row">
          <button className="button primary" type="button" onClick={() => addWater(250)}><Plus size={16} aria-hidden />250 ml</button>
          <button className="button secondary" type="button" onClick={() => addWater(-250)} disabled={!water} aria-label="Remove 250 millilitres of water">−250 ml</button>
        </div>
      </article>
      <article className="family-log card movement-log">
        <div className="family-log-heading"><span className="family-tile-icon"><Footprints size={21} aria-hidden /></span><h3>Walk or movement</h3></div>
        <p className="family-number" aria-live="polite">{entry.movementMinutes} <span>min logged</span></p>
        <div className="family-action-row">
          <button className="button primary" type="button" onClick={() => addMovementMinutes(5)}><Plus size={16} aria-hidden />5 min</button>
          <button className="button secondary" type="button" onClick={() => addMovementMinutes(10)}>+10 min</button>
          <button className="button secondary" type="button" onClick={() => addMovementMinutes(-5)} disabled={!entry.movementMinutes} aria-label="Remove five movement minutes">−5 min</button>
        </div>
      </article>
      <article className="family-log card feelings-log">
        <div className="family-log-heading"><span className="family-tile-icon"><HeartPulse size={21} aria-hidden /></span><h3>How are you feeling?</h3></div>
        <div className="family-feelings">
          <label><span>Joint pain</span><SelectField value={entry.pain ?? ''} onChange={event => setCareCheckIn(event.currentTarget.value === '' ? null : Number(event.currentTarget.value), entry.mood)}>
            <option value="">Select rating</option>
            {painOptions.map(value => <option key={value} value={value}>{value === 0 ? '0 · No pain' : value === 10 ? '10 · Worst pain' : value}</option>)}
          </SelectField></label>
          <label><span>Mood or energy</span><SelectField value={entry.mood ?? ''} onChange={event => setCareCheckIn(entry.pain, event.currentTarget.value === '' ? null : event.currentTarget.value as CareDay['mood'])}>
            <option value="">Select feeling</option>
            {careMoods.map(value => <option key={value}>{value}</option>)}
          </SelectField></label>
        </div>
      </article>
    </div>
    <div className="family-mobility card">
      <span className="family-tile-icon" aria-hidden><Activity size={24} /></span>
      <div><h3>Gentle mobility</h3><p>Explore chair-supported movement, wall push-ups, and steady balance practice.</p></div>
      <button className="button secondary" type="button" onClick={() => onNavigate('fitness', 'family-mobility')}>Open mobility track <ArrowRight size={17} aria-hidden /></button>
    </div>
  </section>;
}

function ReminderEditor({ onClose }: { onClose: () => void }) {
  const { addCareReminder } = useWorkspace();
  const [label, setLabel] = useState('');
  const [time, setTime] = useState('08:00');
  const [feedback, setFeedback] = useState('');
  return <Modal title="Add a daily reminder" onClose={onClose}>
    <form className="family-form family-form-layout" onSubmit={event => {
      event.preventDefault();
      if (!label.trim() || !time) return;
      const count = useWorkspace.getState().careReminders.length;
      addCareReminder(label.trim(), time);
      if (useWorkspace.getState().careReminders.length === count) {
        setFeedback('This profile has reached its daily reminder limit.');
        return;
      }
      onClose();
    }}>
      <p className="muted">Add a medicine, supplement or check you already use. Follow the schedule from your clinician or pharmacist.</p>
      <label className="form-field"><span>Reminder</span><input type="text" value={label} maxLength={100} placeholder="e.g. Morning blood pressure check" onChange={event => setLabel(event.currentTarget.value)} required /></label>
      <label className="form-field"><span>Time of day</span><input type="time" value={time} onChange={event => setTime(event.currentTarget.value)} required /></label>
      {feedback && <p className="form-error" role="status">{feedback}</p>}
      <div className="wizard-footer">
        <button type="button" className="button secondary" onClick={onClose}>Cancel</button>
        <button className="button primary" type="submit" disabled={!label.trim() || !time}>Save reminder</button>
      </div>
    </form>
  </Modal>;
}

function CareReminders({ today }: { today: string }) {
  const { careReminders, careDays, toggleCareReminder, removeCareReminder } = useWorkspace();
  const checked = careDays[today]?.completedReminderIds ?? [];
  const reminders = [...careReminders].sort((first, second) => first.time.localeCompare(second.time) || first.label.localeCompare(second.label));
  const completed = reminders.filter(item => checked.includes(item.id)).length;
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<CareReminder | null>(null);

  return <section className="family-section family-reminders card" aria-labelledby="care-reminders-title">
    <div className="section-head">
      <div><h2 id="care-reminders-title">Daily reminders</h2><p>{reminders.length ? `${completed} of ${reminders.length} checked today` : 'Add your existing medicine, supplement or health-check schedule.'}</p></div>
      <button className="button secondary" type="button" onClick={() => setAdding(true)}><Plus size={17} aria-hidden /> Add reminder</button>
    </div>
    {reminders.length > 0 && <ul className="family-reminder-list">
      {reminders.map(reminder => {
        const done = checked.includes(reminder.id);
        const label = clockTime.format(new Date(`${today}T${reminder.time}:00`));
        return <li className="family-reminder-row" key={reminder.id}>
          <button className="family-reminder-check" type="button" aria-pressed={done} onClick={() => toggleCareReminder(reminder.id)}>
            <span aria-hidden>{done && <Check size={17} />}</span>
            <span><strong>{reminder.label}</strong><small><time dateTime={reminder.time}>{label}</time>{done && ' · Checked'}</small></span>
          </button>
          <button type="button" className="icon-button" aria-label={`Remove reminder for ${reminder.label}`} onClick={() => setRemoving(reminder)}>
            <Trash2 size={16} aria-hidden />
          </button>
        </li>;
      })}
    </ul>}
    <p className="family-note">Check off reminders here when completed. <a href="https://www.nia.nih.gov/health/medicines-and-medication-management/taking-medicines-safely-you-age" target="_blank" rel="noreferrer">Taking medicines safely</a></p>
    {adding && <ReminderEditor onClose={() => setAdding(false)} />}
    {removing && <Modal title="Remove this daily reminder?" onClose={() => setRemoving(null)}>
      <div className="family-form-layout"><p className="muted">{removing.label} will be removed from the active checklist.</p>
        <div className="wizard-footer"><button className="button secondary" type="button" onClick={() => setRemoving(null)}>Keep reminder</button>
          <button className="button primary" type="button" onClick={() => { removeCareReminder(removing.id); setRemoving(null); }}>Remove reminder</button></div>
      </div>
    </Modal>}
  </section>;
}

function CareWeek({ today }: { today: string }) {
  const { days, careDays, careReminders } = useWorkspace();
  const displayed = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(`${today}T12:00:00`);
    date.setDate(date.getDate() - (6 - index));
    return { date, key: localDate(date) };
  });
  const checkedToday = careReminders.filter(reminder => careDays[today]?.completedReminderIds.includes(reminder.id)).length;
  return <section className="family-section family-week card" aria-labelledby="care-week-title">
    <div className="section-head"><div><h2 id="care-week-title"><CalendarDays size={21} aria-hidden /> This week’s care log</h2><p>Review the last seven days together.</p></div></div>
    <div className="family-table-scroll" role="region" aria-label="Weekly care table" tabIndex={0}>
      <table>
        <thead><tr><th scope="col">Date</th><th scope="col">Water</th><th scope="col">Movement</th><th scope="col">Joint pain</th><th scope="col">Energy</th><th scope="col">Reminders checked</th></tr></thead>
        <tbody>{displayed.map(({ date, key }) => {
          const entry = careDays[key];
          const water = days[key]?.water;
          return <tr key={key} className={key === today ? 'family-week-today' : undefined}>
            <th scope="row"><time dateTime={key}>{key === today ? 'Today' : shortDay.format(date)}</time></th>
            <td>{water ? `${water.toLocaleString('en-IN')} ml` : '—'}</td>
            <td>{entry?.movementMinutes ? `${entry.movementMinutes} min` : '—'}</td>
            <td>{entry?.pain === null || entry?.pain === undefined ? '—' : `${entry.pain}/10`}</td>
            <td>{entry?.mood ?? '—'}</td>
            <td>{key === today && careReminders.length ? `${checkedToday}/${careReminders.length}` : entry?.completedReminderIds.length || '—'}</td>
          </tr>;
        })}</tbody>
      </table>
    </div>
  </section>;
}

function CareMealCard({ meal, today, fallback }: { meal: FamilyMeal; today: string; fallback: boolean }) {
  const { days, toggleMeal } = useWorkspace();
  const entryId = `family-meal-${meal.id}`;
  const meals = days[today]?.meals ?? {};
  const logged = !!meals[entryId];
  const slotOccupied = !logged && Object.entries(meals).some(([id, entry]) => inferredSlot(id, entry) === meal.slot);
  return <article className="family-meal-card card">
    <div className="family-meal-heading"><span className="family-tile-icon"><Soup size={21} aria-hidden /></span><p><Clock3 size={15} aria-hidden /> {meal.minutes} min</p></div>
    <h3>{meal.name}</h3>
    {fallback && <span className="constraint-match">Best Match for Your Constraints</span>}
    <p className="family-meal-macros">About {Math.round(meal.macros.protein)} g protein per serving</p>
    <ul className="family-meal-tags" aria-label="Meal characteristics">{meal.filters.map(filter => <li key={filter}>{careMealFilters[filter]}</li>)}</ul>
    <details className="family-recipe">
      <summary>Ingredients and preparation <ChevronDown aria-hidden size={16} /></summary>
      <ul>{meal.ingredients.map(ingredient => <li key={ingredient}>{ingredient}</li>)}</ul>
      <p>{meal.directions}</p>
      {meal.notes && <p className="family-note">{meal.notes}</p>}
      <div className="family-action-row">
        <ReadAloudButton text={`${meal.name}. ${meal.directions}`} label="Read preparation" />
        <button className={`button ${logged ? 'secondary' : 'primary'}`} type="button" aria-pressed={logged} disabled={slotOccupied}
          onClick={() => toggleMeal(entryId, { name: meal.name, macros: meal.macros, slot: meal.slot })}>
          {logged ? <Check size={16} aria-hidden /> : <Plus size={16} aria-hidden />} {logged ? 'Meal logged' : slotOccupied ? 'Meal slot logged' : 'Log one serving'}
        </button>
      </div>
    </details>
  </article>;
}

function FamilyMeals({ today, onNavigate }: { today: string; onNavigate: (page: Page, target?: string) => void }) {
  const { profile, environment, budget, diet, skin, defaultCuisine, weatherSeason, careMealFilters: filters, setCareMealFilters } = useWorkspace();
  const activeProfile = profile ?? createProfile({ environment, budget, diet, skin });
  const context = { cuisine: defaultCuisine, weather: weatherSeason };
  const compatible = familyMealsFor(activeProfile, filters, context);
  const exact = compatible.filter(meal => meal.cuisine === defaultCuisine);
  const meals = exact.length ? exact : compatible.length ? compatible : familyMealsFor(activeProfile, [], context).slice(0, 4);
  return <section className="family-section" aria-labelledby="family-meals-title">
    <div className="section-head">
      <div><h2 id="family-meals-title">Home-style meal ideas</h2><p>Filter by the meal qualities you’re looking for.</p></div>
    </div>
    <div className="family-meal-filters" aria-label="Family meal filters">
      <button type="button" className="button secondary" aria-pressed={!filters.length} onClick={() => setCareMealFilters([])}>All meals</button>
      {(Object.entries(careMealFilters) as [CareMealFilter, string][]).map(([key, value]) => <button key={key} type="button" className="button secondary"
        aria-pressed={filters.includes(key)} onClick={() => setCareMealFilters(filters.includes(key) ? filters.filter(filter => filter !== key) : [...filters, key])}>{value}</button>)}
    </div>
    <p className="family-note">Ingredients and portions determine sodium and carbohydrate amounts. Follow your own care plan for dietary restrictions. <a href="https://www.nia.nih.gov/health/publication/whats-your-plate/shopping-food-thats-good-you" target="_blank" rel="noreferrer">Meal planning for older adults</a></p>
    {!meals.length && <div className="family-empty card">
      <h3>No meals match these preferences yet</h3><p>Try fewer filters to see more options for this profile.</p>
      {filters.length > 0 && <button className="button secondary" type="button" onClick={() => setCareMealFilters([])}>Clear meal filters</button>}
    </div>}
    <p className="family-note">{cuisineLabels[defaultCuisine]}{!exact.length && meals.length > 0 && ' · Alternatives may differ from your cuisine or optional meal filters.'}</p>
    {!meals.length && <button className="button secondary" type="button" onClick={() => onNavigate('diet')}>Open daily meal plan</button>}
    <div className="family-meal-grid">{meals.map(meal => <CareMealCard key={meal.id} meal={meal} today={today} fallback={!exact.length} />)}</div>
  </section>;
}

export function FamilyCareHub({ today, onNavigate, onEditProfile }: {
  today: string;
  onNavigate: (page: Page, target?: string) => void;
  onEditProfile: () => void;
}) {
  const { familyMembers, activeMemberId, profile } = useWorkspace();
  const active = familyMembers.find(member => member.id === activeMemberId);
  const [memberEditor, setMemberEditor] = useState<FamilyMember | 'new' | null>(null);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const headingId = useId();
  const age = profile?.age ?? active?.age;
  return <div className="family-hub">
    <section className="family-hero" aria-labelledby={headingId}>
      <div className="family-hero-copy">
        <span className="family-hero-icon"><HeartHandshake size={23} aria-hidden /></span>
        <h1 id={headingId}>Family &amp; Elder Care</h1>
        <p>Simple care routines you can keep up with together.</p>
      </div>
      <div className="family-hero-tools">
        <div className="family-hero-active"><FamilyAvatar name={active?.name} /><div><small>Active profile</small><strong>{active?.name ?? 'My profile'}</strong>
          {!!age && <span>{age >= 60 ? 'Senior care' : age >= 40 ? 'Middle-age care' : age >= 18 ? 'Adult care' : 'Teen profile'}</span>}</div></div>
        <button className="button secondary" type="button" onClick={() => setShowSyncModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Share2 size={16} aria-hidden /> Caregiver Link &amp; Sync
        </button>
        <button className="button primary" type="button" onClick={() => setMemberEditor('new')}><UserRoundPlus size={18} aria-hidden /> Add family member</button>
      </div>
    </section>
    <FamilyProfiles onAdd={() => setMemberEditor('new')} onEdit={setMemberEditor} onEditProfile={onEditProfile} />
    <MistakeGuardrailBanner category="senior" title="⚠️ Elder Care & Fall Prevention Guardrails" />
    <CareHabits today={today} onNavigate={onNavigate} />
    <CareReminders key={activeMemberId} today={today} />
    <CareWeek today={today} />
    <FamilyMeals today={today} onNavigate={onNavigate} />
    <p className="family-privacy"><ShieldCheck size={19} aria-hidden /> Family profiles and care logs are stored in this browser with optional caregiver sync.</p>
    {memberEditor && <MemberEditor member={memberEditor === 'new' ? undefined : memberEditor} onClose={() => setMemberEditor(null)} />}
    {showSyncModal && <FamilySyncModal initialMemberId={activeMemberId} onClose={() => setShowSyncModal(false)} />}
  </div>;
}
