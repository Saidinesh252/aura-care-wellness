import { Eye, Pause, Play } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { MistakeGuardrailBanner } from './MistakeGuardrailBanner';

const routines = {
  'figure-8': {
    label: 'Figure-eight preview', short: 'Figure eight',
    cue: 'This is a visual preview. If you try the movement, trace an imagined figure eight gently, with your head still.',
    mistake: 'Chasing the dot quickly, twisting your neck, or pushing through discomfort.',
    correction: 'Use small, comfortable eye movements and rest if you feel any strain or dizziness.',
  },
  'near-far': {
    label: 'Near-to-far focus', short: 'Near to far',
    cue: 'Look briefly at a real nearby object, then a real distant object. The two markers explain the idea of changing focus.',
    mistake: 'Keeping your eyes on the screen for both visual targets.',
    correction: 'Use objects at two actual distances. For the 20-20-20 break, choose only a distant target.',
  },
  'slow-blink': {
    label: 'Gentle blinking', short: 'Gentle blinking',
    cue: 'Close your eyes gently and reopen without squeezing. Keep your jaw and shoulders relaxed.',
    mistake: 'Squeezing your eyelids shut or holding your breath.',
    correction: 'Let your eyelids close comfortably, then reopen and breathe normally.',
  },
  'eyes-rest': {
    label: 'Screen-free eye rest', short: 'Eyes at rest',
    cue: 'Look away from the screen or close your eyes briefly in a safe seated position.',
    mistake: 'Pressing or rubbing your eyes with your palms.',
    correction: 'Keep your hands relaxed in your lap. Let your eyes close on their own if that feels comfortable.',
  },
} as const;
type EyeRoutine = keyof typeof routines;
type Camera = 'front' | 'side';

function EyeDiagram({ routine, camera, mistake, id }: { routine: EyeRoutine; camera: Camera; mistake: boolean; id: string }) {
  const front = camera === 'front';
  const sightTarget = routine === 'near-far';
  const closing = routine === 'slow-blink';
  const resting = routine === 'eyes-rest';
  const stroke = mistake ? '#ff8696' : '#9aead5';
  return <svg className="ergo-eye-diagram" width="360" height="164" viewBox="0 0 360 164" role="img" aria-labelledby={id}>
    <title id={id}>{`${routines[routine].label}. ${front ? 'Front' : 'Side'} diagram. ${mistake ? 'Common mistake.' : 'Guided form.'}`}</title>
    <circle cx="180" cy="82" r="68" fill="#133c43" opacity=".4" />
    <path d="M36 82H324M180 15V148" stroke="#78a5ad" strokeDasharray="2 6" opacity=".35" />
    {front ? <g className={closing && !mistake ? 'ergo-lids' : undefined}>
      {[117, 243].map(x => <g key={x}>
        <path d={resting || (closing && mistake) ? `M${x - 30} 82q30 22 60 0` : `M${x - 31} 82q31-37 62 0q-31 37-62 0Z`} fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
        {!resting && !(closing && mistake) && <circle className={routine === 'figure-8' && !mistake ? 'ergo-gaze-orbit' : undefined} cx={x} cy="82" r="7" fill="#defdf5" />}
      </g>)}
    </g> : <g fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M53 127c11-8 16-14 13-22-2-5-8-12-8-26 0-26 19-44 45-44 20 0 37 10 42 31l13 16-13 4-2 21c-1 8-7 12-16 12h-12v11" />
      <g className={closing && !mistake ? 'ergo-lids' : undefined}>
        <path d={resting || (closing && mistake) ? 'M126 75q7 7 14 0' : 'M126 75q7-7 14 0q-7 7-14 0Z'} />
        {!resting && !(closing && mistake) && <circle cx="135" cy="75" r="2.5" fill="#defdf5" />}
      </g>
      {!closing && !resting && <path d={mistake ? 'M153 78 203 115' : sightTarget ? 'M153 75H309' : 'M153 75Q258 41 305 78Q258 111 153 75'} strokeDasharray="3 6" opacity=".8" />}
    </g>}
    {sightTarget && <g className={mistake ? 'ergo-visual-fault' : undefined}>
      <circle className={mistake ? undefined : 'ergo-target-near'} cx={front ? 162 : 205} cy={front ? 119 : 75} r="7" fill={stroke} />
      {!mistake && <circle className="ergo-target-far" cx={front ? 207 : 305} cy={front ? 34 : 75} r="8" stroke={stroke} strokeWidth="2" fill="none" />}
      <text x={front ? 162 : 205} y={front ? 141 : 104} textAnchor="middle" className="ergo-diagram-text">{mistake ? 'Same distance' : 'Near target'}</text>
      {!mistake && <text x={front ? 207 : 305} y={front ? 20 : 104} textAnchor="middle" className="ergo-diagram-text">Far target</text>}
    </g>}
    {routine === 'figure-8' && !front && !mistake && <circle className="ergo-side-trace" cx="255" cy="76" r="6" fill="#defdf5" />}
    {resting && mistake && <path d={front ? 'M98 61l16 21-16 18m164-39-16 21 16 18' : 'M186 62l-32 13 31 13'} stroke="#ff8696" fill="none" strokeWidth="3" strokeLinecap="round" />}
    {routine === 'figure-8' && mistake && <path d={front ? 'M179 109v-45l-9 9m9-9 9 9' : 'M166 57l35 34m0 0h-17m17 0V76'} fill="none" stroke="#ff8696" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
  </svg>;
}

export function EyeExercisePlayer({ slow, breakRunning }: { slow: boolean; breakRunning: boolean }) {
  const id = useId();
  const reduced = useReducedMotion();
  const stage = useRef<HTMLDivElement>(null);
  const [routine, setRoutine] = useState<EyeRoutine>('near-far');
  const [view, setView] = useState<Camera>('front');
  const [speed, setSpeed] = useState(slow ? .5 : 1);
  const [playing, setPlaying] = useState(false);
  const [mistake, setMistake] = useState(false);
  const [visible, setVisible] = useState(true);
  const current = routines[routine];
  const animate = playing && !reduced && !mistake && !breakRunning && visible;

  useEffect(() => {
    const element = stage.current;
    if (!element || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: .05 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    stage.current?.getAnimations?.({ subtree: true }).forEach(animation => animation.updatePlaybackRate?.(speed));
  }, [speed, routine, view, mistake]);

  return <article className="card ergo-card eye-player-card" id="eye-exercises" aria-labelledby={`${id}-heading`}>
    <header className="ergo-card-title"><Eye size={16} className="w-4 h-4" aria-hidden /><h3 id={`${id}-heading`}>Eye movement previews</h3></header>
    <div className="ergo-routine-tabs" role="group" aria-label="Eye exercise">
      {(Object.keys(routines) as EyeRoutine[]).map(key => <button type="button" key={key} className="ergo-tab-btn" aria-pressed={routine === key} onClick={() => { setRoutine(key); setMistake(false); }}>{routines[key].short}</button>)}
    </div>
    <div className="ergo-eye-stage" ref={stage} data-playing={animate}>
      <EyeDiagram routine={routine} camera={view} mistake={mistake} id={`${id}-diagram`} />
    </div>
    <div className="ergo-player-controls">
      <div className="segmented" role="group" aria-label="Eye demonstration view">
        <button type="button" aria-pressed={view === 'front'} onClick={() => setView('front')}>Front</button>
        <button type="button" aria-pressed={view === 'side'} onClick={() => setView('side')}>Side</button>
      </div>
      <div className="segmented" role="group" aria-label="Eye demonstration speed">
        <button type="button" aria-pressed={speed === .5} onClick={() => setSpeed(.5)}>0.5× <span>Slow</span></button>
        <button type="button" aria-pressed={speed === 1} onClick={() => setSpeed(1)}>1× <span>Normal</span></button>
      </div>
      <button type="button" className="button secondary" aria-pressed={mistake} onClick={() => setMistake(value => !value)}>{mistake ? 'Show guided form' : 'Show common mistake'}</button>
      {!reduced && <button type="button" className="button secondary" disabled={mistake || breakRunning || routine === 'eyes-rest'} onClick={() => setPlaying(value => !value)}>
        {playing ? <Pause size={16} className="w-4 h-4" aria-hidden /> : <Play size={16} className="w-4 h-4" aria-hidden />} {playing ? 'Pause preview' : 'Play preview'}
      </button>}
    </div>
    <p className="ergo-player-cue">{breakRunning ? 'Preview paused for your look-away break.' : mistake ? current.correction : current.cue}</p>
    <MistakeGuardrailBanner category="general" compact mistakes={[{ mistake: current.mistake, correction: current.correction }]} />
  </article>;
}
