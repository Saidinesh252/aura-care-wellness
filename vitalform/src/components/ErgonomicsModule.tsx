import { ArrowUpRight, Check, Eye, Monitor, Pause, Play } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { environments, type Page } from '../context';
import { comfortFor } from '../familyTypes';
import { exerciseLibrary, type Exercise } from '../fitness';
import { biomechanicalSpecs } from '../biomechanics';
import { useWorkspace } from '../store';
import { BiomechanicalExercisePlayer, type PlaybackSpeed } from './BiomechanicalExercisePlayer';
import { EyeBreakTimer } from './EyeBreakTimer';
import { EyeExercisePlayer } from './EyeExercisePlayer';
import { MistakeGuardrailBanner } from './MistakeGuardrailBanner';
import './ergonomics.css';

const deskExercises = (['neck-glide', 'seated-roll', 'chair-yoga', 'ankle-pump'] as const).map(motion => {
  const exercise = exerciseLibrary.find(item => item.motion === motion)!;
  return motion === 'neck-glide' ? { ...exercise, name: 'Seated chin tucks' } : exercise;
});

const auditQuestions = [
  {
    id: 'screen-eye-level',
    title: 'Screen directly ahead',
    detail: 'Place the top of the screen at or slightly below eye level where you can read without leaning or twisting.',
    alternative: 'Use a stable riser for a laptop only if you can type comfortably on a separate keyboard.',
  },
  {
    id: 'elbow-support',
    title: 'Relaxed shoulders and wrists',
    detail: 'Keep your keyboard and pointer close so your elbows rest comfortably and your wrists stay straight.',
    alternative: 'Move the keyboard and mouse closer and clear the area under your desk.',
  },
  {
    id: 'feet-grounded',
    title: 'Both feet supported',
    detail: 'Rest both feet firmly on the floor or a sturdy footrest.',
    alternative: 'Use a wide, non-slip support that stays put when you shift position.',
  },
  {
    id: 'back-supported',
    title: 'Back supported',
    detail: 'Rest against your seat back and change position regularly.',
    alternative: 'Try a small rolled towel for support if it feels comfortable.',
  },
  {
    id: 'separate-peripherals',
    title: 'Comfortable typing and screen height',
    detail: 'For longer laptop sessions, separate the screen and keyboard when possible to adjust them independently.',
    alternative: 'If separate equipment is unavailable, vary your position and take frequent breaks.',
  },
] as const;

function DeskChecklist() {
  const { ergonomicsChecks, setErgonomicsChecks } = useWorkspace();
  const labelId = useId();
  const selected = ergonomicsChecks.filter(id => auditQuestions.some(question => question.id === id));
  const total = auditQuestions.length;

  return <article className="card ergo-card" id="audit" aria-labelledby={labelId}>
    <header className="ergo-card-title"><Check size={16} className="w-4 h-4" aria-hidden /><h3 id={labelId}>Workstation checklist</h3></header>
    <div className="ergo-audit-progress">
      <div><strong>{selected.length} of {total} checked</strong><span>Review each setup point.</span></div>
      <progress aria-label="Workstation checklist completion" max={total} value={selected.length} />
    </div>
    <div className="ergo-checklist">
      {auditQuestions.map(({ id, title, detail, alternative }) => {
        const checked = selected.includes(id);
        return <label className="ergo-check-row" key={id} data-checked={checked}>
          <input type="checkbox" checked={checked} onChange={event => {
            setErgonomicsChecks(event.currentTarget.checked ? [...selected, id] : selected.filter(item => item !== id));
          }} />
          <span><strong>{title}</strong><span>{detail}</span>{!checked && <small>{alternative}</small>}</span>
        </label>;
      })}
    </div>
  </article>;
}

function DeskMovementPlayer({ slow, readAloud }: { slow: boolean; readAloud: boolean }) {
  const [exercise, setExercise] = useState<Exercise>(deskExercises[0]);
  const [speed, setSpeed] = useState<PlaybackSpeed>(slow ? .5 : 1);
  const [playing, setPlaying] = useState(false);
  const [focus, setFocus] = useState(false);
  const reduced = useReducedMotion();
  const { faultCue, fixCue } = biomechanicalSpecs[exercise.motion].mistake;

  return <article className="card ergo-card" id="desk-exercises" aria-labelledby="desk-movement-heading">
    <header className="ergo-card-title"><Monitor size={16} className="w-4 h-4" aria-hidden /><h3 id="desk-movement-heading">Seated movement break</h3></header>
    <label className="ergo-exercise-picker">Movement <select value={exercise.motion} onChange={event => {
      const selected = deskExercises.find(item => item.motion === event.currentTarget.value);
      if (!selected) return;
      setExercise(selected);
      setPlaying(false);
    }}>{deskExercises.map(item => <option key={item.motion} value={item.motion}>{item.name}</option>)}</select></label>
    <BiomechanicalExercisePlayer key={exercise.motion} exercise={exercise} playing={playing} speed={speed} onSpeed={setSpeed} focus={focus} onFocus={setFocus} readAloud={readAloud} />
    {!reduced && <button type="button" className="button secondary ergo-play-action" onClick={() => setPlaying(value => !value)}>
      {playing ? <Pause size={16} className="w-4 h-4" aria-hidden /> : <Play size={16} className="w-4 h-4" aria-hidden />} {playing ? 'Pause movement' : 'Play movement'}
    </button>}
    <MistakeGuardrailBanner category="exercise" compact mistakes={[{ mistake: faultCue, correction: fixCue }]} />
  </article>;
}

export function ErgonomicsModule({ target }: { target?: string; onNavigate?: (page: Page, target?: string) => void }) {
  const { environment, budget, weatherSeason, profile, comfortPreference, soundEffectsEnabled, activeMemberId } = useWorkspace();
  const comfort = comfortFor(profile?.age, comfortPreference);
  const [breakRunning, setBreakRunning] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!target) return;
    document.getElementById(target)?.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth', block: 'start' });
  }, [target, reduced]);

  return <div className="ergo-container" id="ergonomics">
    <header className="ergo-header">
      <div><span className="page-eyebrow tone-fitness"><Eye size={16} className="w-4 h-4" aria-hidden /> Digital wellness</span>
        <h1>Posture &amp; Eye Care</h1><p>Take screen breaks, reset at your desk and adjust your workstation.</p></div>
      <span className="ergo-chip"><Monitor size={16} className="w-4 h-4" aria-hidden /> {environments[environment].short}{comfort ? ' · Comfort mode' : ''}</span>
    </header>
    <div className="ergo-context">
      <strong>{environment === 'pg' ? 'Small-space desk setup' : environments[environment].label + ' setup'}</strong>
      <p>{budget === 'zero' || budget === 'student' ? 'Start with changes you can make with the chair and surface you already use.' : 'Adjust your display and chair if you can, and take regular breaks.'} {weatherSeason === 'winter' ? 'Dry indoor air can make your eyes feel uncomfortable. Blink naturally and take screen breaks.' : 'If glare makes the screen difficult to read, adjust its position or the lighting.'}</p>
    </div>
    <section className="ergo-section" aria-labelledby="heading-eye-relief">
      <div className="section-head"><div><h2 id="heading-eye-relief">Screen breaks</h2><p>Every 20 minutes, look about 6 metres away for 20 seconds.</p></div>
        <a className="ergo-source" href="https://www.aao.org/eye-health/tips-prevention/what-is-eye-strain" target="_blank" rel="noreferrer">Eye strain guidance <ArrowUpRight size={16} className="w-4 h-4" aria-hidden /></a></div>
      <div className="ergo-bento-grid">
        <EyeBreakTimer key={`timer-${activeMemberId}`} sounds={soundEffectsEnabled} onBreak={setBreakRunning} />
        <EyeExercisePlayer key={`preview-${activeMemberId}`} slow={comfort} breakRunning={breakRunning} />
      </div>
    </section>
    <section className="ergo-section" aria-labelledby="heading-posture">
      <div className="section-head"><div><h2 id="heading-posture">Posture and setup</h2><p>Find a supported position, then change it regularly.</p></div>
        <a className="ergo-source" href="https://www.osha.gov/etools/computer-workstations/positions/" target="_blank" rel="noreferrer">Workstation guidance <ArrowUpRight size={16} className="w-4 h-4" aria-hidden /></a></div>
      <div className="ergo-bento-grid">
        <DeskMovementPlayer key={activeMemberId} slow={comfort} readAloud={comfort} /><DeskChecklist />
      </div>
    </section>
  </div>;
}
