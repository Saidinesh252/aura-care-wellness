import { Activity, Check, ChevronRight, Clock3, Dumbbell, Minus, Pause, Play, Plus, RotateCcw, ShieldCheck, VolumeX } from 'lucide-react';
import { useEffect, useReducer, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { biomechanicalSpecs } from '../biomechanics';
import { climateMovement } from '../climate';
import { environments, price } from '../context';
import { comfortFor } from '../familyTypes';
import { exerciseLibrary, familyWorkouts, seatedExercises, supportedExercises, workoutMinutes, type Exercise, type Muscle, type Workout } from '../fitness';
import { safetyFor } from '../safety';
import { movementOptions, rampWeek } from '../weeklyMovement';
import { AnimatedExercisePlayer, type PlaybackSpeed } from './AnimatedExercisePlayer';
import { PinnedRoutine } from './PinnedRoutine';
import { EvidenceInfo, SafetyBanner } from './Evidence';
import { useWorkspace } from '../store';
import { IconBadge, Ring } from './Shared';
import { MistakeGuardrailBanner } from './MistakeGuardrailBanner';
import { WeatherFitnessAlert } from './WeatherProtectionShield';

function exerciseGuardrail(move: Exercise) {
  const { faultCue, fixCue } = biomechanicalSpecs[move.motion].mistake;
  return [{ mistake: faultCue, correction: fixCue }];
}

type Phase = 'work' | 'rest' | 'done';
interface Session { phase: Phase; step: number; left: number; deadline: number | null; reps: number; sets: number[]; movementMs: number }
type Action = { type: 'toggle' | 'advance' | 'tick'; now: number } | { type: 'reset' } | { type: 'reps'; change: number };
const initial = (workout: Workout): Session => ({ phase: 'work', step: 0, left: workout.work * 1000, deadline: null, reps: 0, sets: [], movementMs: 0 });

function advance(state: Session, workout: Workout, at: number): Session {
  const running = state.deadline !== null;
  if (state.phase === 'rest') {
    return { ...state, phase: 'work', step: state.step + 1, left: workout.work * 1000, deadline: running ? at + workout.work * 1000 : null };
  }
  const sets = [...state.sets, state.reps];
  if (state.step + 1 === workout.exercises.length * workout.rounds) return { ...state, phase: 'done', left: 0, deadline: null, sets };
  return { ...state, sets, phase: 'rest', reps: 0, left: workout.rest * 1000, deadline: running ? at + workout.rest * 1000 : null };
}

function countDown(state: Session, left: number): Session {
  const movementMs = state.phase === 'work' ? state.movementMs + Math.max(0, state.left - left) : state.movementMs;
  return { ...state, movementMs, left };
}

function updateSession(state: Session, action: Action, workout: Workout): Session {
  if (action.type === 'reset') return initial(workout);
  if (state.phase === 'done') return state;
  if (action.type === 'reps') return state.phase === 'work' ? { ...state, reps: Math.max(0, state.reps + action.change) } : state;
  let current = state;
  while (current.deadline !== null && current.deadline <= action.now) current = advance(countDown(current, 0), workout, current.deadline);
  if (current.phase === 'done') return current;
  if (current.deadline !== null) current = countDown(current, current.deadline - action.now);
  if (action.type === 'toggle') return { ...current, deadline: current.deadline === null ? action.now + current.left : null };
  if (action.type === 'advance' && current.step === state.step && current.phase === state.phase) return advance(current, workout, action.now);
  return current;
}

const muscleLabels: Muscle[] = ['Shoulders', 'Chest', 'Back', 'Core', 'Glutes', 'Legs'];
function Heatmap({ muscles }: { muscles: Muscle[] }) {
  return <div className="heatmap">
    <div className="heatmap-body" aria-hidden="true">
      <span className="body-head" />
      {muscleLabels.map(muscle => <span key={muscle} className={`body-part body-${muscle.toLowerCase()} ${muscles.includes(muscle) ? 'active' : ''}`} />)}
    </div>
    <div><h3>Muscle focus</h3><div className="muscle-list">{muscleLabels.map(muscle => <span key={muscle} className={muscles.includes(muscle) ? 'active' : ''}>{muscle}</span>)}</div></div>
  </div>;
}

function WorkoutPlayer({ workout, slow, instructions, memberId }: { workout: Workout; slow: boolean; instructions: boolean; memberId: string }) {
  const [session, dispatch] = useReducer((state: Session, action: Action) => updateSession(state, action, workout), workout, initial);
  const [speed, setSpeed] = useState<PlaybackSpeed>(slow ? .5 : 1);
  const [focus, setFocus] = useState(false);
  const recorded = useRef(false);
  const running = session.deadline !== null;
  useEffect(() => {
    if (!running) return;
    const interval = window.setInterval(() => dispatch({ type: 'tick', now: performance.now() }), 150);
    return () => window.clearInterval(interval);
  }, [running]);
  useEffect(() => {
    if (session.phase !== 'done' || recorded.current) return;
    recorded.current = true;
    const state = useWorkspace.getState();
    if (state.activeMemberId !== memberId) return;
    state.setHabit('workout', true);
    if (session.movementMs > 0) state.addMovementMinutes(session.movementMs / 60_000);
  }, [memberId, session.phase, session.movementMs]);

  function reset() {
    recorded.current = false;
    dispatch({ type: 'reset' });
  }

  const exerciseIndex = session.step % workout.exercises.length;
  const exercise = workout.exercises[exerciseIndex];
  const upcoming = workout.exercises[(exerciseIndex + 1) % workout.exercises.length];
  const total = workout.exercises.length * workout.rounds;
  const round = Math.floor(session.step / workout.exercises.length) + 1;
  const seconds = Math.ceil(session.left / 1000);
  const clock = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  const completed = session.phase === 'done';
  const resting = session.phase === 'rest';
  const phaseDuration = (resting ? workout.rest : workout.work) * 1000;
  const move = resting ? upcoming : exercise;

  return <div className="player-layout">
    <div className="card workout-player">
      <div className="player-heading"><div><span className="page-eyebrow tone-fitness"><Activity size={16} /> Workout player</span><h2>{workout.name}</h2></div><button className="icon-button" aria-label="Reset workout timer and sets" onClick={reset}><RotateCcw size={17} /></button></div>
      {completed ? <div className="workout-success" aria-live="polite"><IconBadge pillar="fitness"><Check size={23} /></IconBadge><h3>Workout complete</h3><p>{total} sets finished. {session.movementMs > 0 ? `${(session.movementMs / 60_000).toFixed(1)} minutes logged in your daily tracker.` : 'Your workout is marked complete.'}</p><button className="button secondary" onClick={reset}>Start again</button></div> : <>
        <div className="workout-main exercise-player-main">
          <AnimatedExercisePlayer key={`${move.motion}-${session.step + (resting ? 1 : 0)}`} exercise={move} playing={running && !resting} speed={speed} onSpeed={setSpeed} focus={focus} onFocus={setFocus} readAloud={instructions} />
          <div className="timer-panel">
            <span className="timer-phase">{resting ? 'Rest' : `Round ${round} of ${workout.rounds}`}</span>
            <Ring tone="fitness" size={112} value={session.left / phaseDuration * 100} label="Interval time remaining"><strong>{clock}</strong></Ring>
            <div className="timer-buttons">
              <button className="button primary" onClick={() => dispatch({ type: 'toggle', now: performance.now() })}>{running ? <Pause size={16} /> : <Play size={16} />} {running ? 'Pause' : session.left === phaseDuration ? 'Play' : 'Resume'}</button>
              <button className="button secondary" onClick={() => dispatch({ type: 'advance', now: performance.now() })}>{resting ? 'Skip rest' : 'Finish set'} <ChevronRight size={15} /></button>
            </div>
          </div>
        </div>
        <div className="cue">
          <div><span className="muted">{resting ? 'Up next' : 'Current movement'}</span><h3>{move.name}</h3><p>{move.cue}</p></div>
          {!resting && exercise.reps > 0 && <div className="rep-tracker">
            <span>{exercise.reps} rep target</span>
            <div><button className="icon-button" aria-label="Remove a rep" disabled={session.reps === 0} onClick={() => dispatch({ type: 'reps', change: -1 })}><Minus size={15} /></button><strong aria-live="polite">{session.reps}</strong><button className="icon-button" aria-label="Add a rep" onClick={() => dispatch({ type: 'reps', change: 1 })}><Plus size={15} /></button></div>
          </div>}
        </div>
        <MistakeGuardrailBanner category="exercise" compact mistakes={exerciseGuardrail(move)} />
      </>}
    </div>
    <aside className="card exercise-list">
      <div className="section-head compact"><h2>Session outline</h2><span>{session.sets.length}/{total} sets</span></div>
      <ol>{workout.exercises.map((move, index) => {
        const logged = session.sets.filter((_, setIndex) => setIndex % workout.exercises.length === index);
        return <li className={exerciseIndex === index && !completed && !resting ? 'active' : ''} key={`${move.name}-${index}`}>
          <span className="move-index">{logged.length === workout.rounds ? <Check size={15} /> : index + 1}</span>
          <div><strong>{move.name}</strong><small>{move.reps ? `${move.reps} rep target` : `${workout.work}s hold`} · {logged.length}/{workout.rounds} sets {move.reps > 0 && logged.length > 0 ? `· ${logged.reduce((a, b) => a + b, 0)} reps logged` : ''}</small></div>
        </li>;
      })}</ol>
      <Heatmap muscles={(resting ? upcoming : exercise).muscles} />
    </aside>
  </div>;
}

function ExerciseDemo({ exercises, slow, readAloud }: { exercises: Exercise[]; slow: boolean; readAloud: boolean }) {
  const [selected, setSelected] = useState(exercises[0].motion);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<PlaybackSpeed>(slow ? .5 : 1);
  const [focus, setFocus] = useState(false);
  const reduced = useReducedMotion();
  const exercise = exercises.find(item => item.motion === selected) ?? exercises[0];
  return <section className="module-section" aria-labelledby="exercise-library-title">
    <div className="section-head"><div><h2 id="exercise-library-title">Exercise form library</h2><p>Preview each movement before starting a timed session.</p></div></div>
    <div className="card exercise-demo-layout exercise-demo-frame">
      <AnimatedExercisePlayer key={exercise.motion} exercise={exercise} playing={playing} speed={speed} onSpeed={setSpeed} focus={focus} onFocus={setFocus} readAloud={readAloud} />
      <div className="exercise-demo-menu">
        <label>Exercise <select value={exercise.motion} onChange={event => {
          const next = exercises.find(item => item.motion === event.target.value);
          if (!next) return;
          setSelected(next.motion);
          setPlaying(false);
        }}>
          {exercises.map(item => <option key={item.motion} value={item.motion}>{item.name}</option>)}
        </select></label>
        <h3>{exercise.name}</h3><p>{exercise.cue}</p>
        <MistakeGuardrailBanner category="exercise" compact mistakes={exerciseGuardrail(exercise)} />
        {!reduced && <button className="button secondary" type="button" onClick={() => setPlaying(!playing)}>{playing ? <Pause size={16} /> : <Play size={16} />} {playing ? 'Pause demo' : 'Play demo'}</button>}
      </div>
    </div>
  </section>;
}

export function FitnessModule({ target, today }: { target?: string; today: string }) {
  const { environment, budget, currency, profile, workoutRampStart, easyDay, activeMemberId, comfortPreference, weatherSeason } = useWorkspace();
  const easy = easyDay === today;
  const senior = (profile?.age ?? 0) >= 60;
  const comfort = comfortFor(profile?.age, comfortPreference);
  const adjusted = safetyFor(profile, today).lowImpact;
  const workouts = movementOptions(profile, environment, budget, workoutRampStart, today, easy, weatherSeason);
  if (!easy && target === 'family-mobility' && !workouts.some(item => item.id === target)) workouts.push(...familyWorkouts(adjusted).map(item => climateMovement(item, weatherSeason)));
  const demos = adjusted || easy ? seatedExercises : senior ? [...seatedExercises, ...supportedExercises] : exerciseLibrary;
  const ramp = rampWeek(workoutRampStart, today);
  const [selected, setSelected] = useState(target);
  const workout = workouts.find(item => item.id === selected) ?? workouts[0];
  return <>
    <div className="page-intro"><div><span className="page-eyebrow tone-fitness"><Dumbbell size={15} /> Body &amp; Fitness</span><h1>Movement Hub</h1><p>Find a session that fits your space, equipment, and time.</p></div><IconBadge pillar="fitness"><Dumbbell size={26} /></IconBadge></div>
    <SafetyBanner pillar="fitness" today={today} />
    <div className="context-strip tone-fitness"><ShieldCheck size={21} /><div><strong>{environments[environment].label} movement plan</strong><p>{environments[environment].detail}. {environment === 'pg' ? 'Every session is silent and has no jumps.' : 'Choose a session to load its interval timer.'}</p></div></div>
    <WeatherFitnessAlert />
    <section className="module-section">
      <div className="section-head"><div><h2>Choose a session</h2><p>{easy ? 'Minimum routine for today' : ramp ? `21-day movement ramp-up · Week ${ramp} of 3` : 'Start with a comfortable pace and adjust the reps to your ability.'}</p></div></div>
      <div className="workout-options">{workouts.map(item => <div className="workout-choice" key={item.id}><button className={`card workout-option ${item.id === workout.id ? 'active' : ''}`} onClick={() => setSelected(item.id)} aria-pressed={item.id === workout.id}>
        <span className="workout-option-top"><IconBadge pillar="fitness" /><span><Clock3 size={15} /> {workoutMinutes(item)} min</span></span>
        <strong>{item.name}</strong><span className="muted">{item.description}</span>
        <span className="workout-tags">{item.quiet && <span><VolumeX size={13} /> Silent / Neighbor-Friendly</span>}<span>{item.gear}</span>{item.cost > 0 && <span>{price(item.cost, currency)} est.</span>}</span>
      </button><EvidenceInfo rule={/band/i.test(item.gear) ? 'bands' : /mobility|warm-up|stretch/i.test(item.name) ? 'mobility' : 'progression'} compact /></div>)}</div>
    </section>
    <section className="module-section"><WorkoutPlayer key={`${activeMemberId}-${workout.id}-${budget}-${workout.rounds}-${workout.work}`} workout={workout} slow={senior} instructions={comfort} memberId={activeMemberId} />{!easy && <PinnedRoutine pillar="fitness" slot="Workout" />}</section>
    <ExerciseDemo key={`${activeMemberId}-${senior}-${adjusted}-${easy}`} exercises={demos} slow={senior} readAloud={comfort} />
    <MistakeGuardrailBanner category="exercise" />
    <p className="fine-print">{senior || adjusted || target === 'family-mobility' ?
      <><a href="https://www.nhs.uk/live-well/exercise/sitting-exercises/" target="_blank" rel="noreferrer">NHS seated exercises</a>{' · '}<a href="https://www.nhs.uk/live-well/exercise/balance-exercises/" target="_blank" rel="noreferrer">NHS balance exercises</a></> :
      <><a href="https://www.mayoclinic.org/healthy-lifestyle/fitness/multimedia/squat/vid-20084663" target="_blank" rel="noreferrer">Mayo Clinic squat form</a>{' · '}<a href="https://www.mayoclinic.org/healthy-lifestyle/fitness/in-depth/core-strength/art-20546851" target="_blank" rel="noreferrer">Mayo Clinic core exercises</a></>}
    </p>
  </>;
}
