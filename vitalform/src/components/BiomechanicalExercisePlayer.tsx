import { useAnimationFrame, useReducedMotion } from 'framer-motion';
import { Activity, AlertTriangle, CheckCircle2, ChevronRight, Focus, Gauge, Volume2, VolumeX, Wind } from 'lucide-react';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { type MotionSequence, type Point, type RigPose } from '../exerciseMotion';
import { type Exercise, type Muscle } from '../fitness';
import { biomechanicalSpecs, demoFrame, getMistakePose, jointAngleGuide, motionPhases, motionTrajectories, sequenceForView, type ViewAngle } from '../biomechanics';
import { ReadAloudButton } from './ReadAloudButton';
import './animatedExercise.css';
import './biomechanical.css';

export type PlaybackSpeed = 0.5 | 1;

const degrees = (first: Point, second: Point) => Math.atan2(second[1] - first[1], second[0] - first[0]) * 180 / Math.PI;
const distance = (first: Point, second: Point) => Math.hypot(second[0] - first[0], second[1] - first[1]);
const center = (first: Point, second: Point): Point => [(first[0] + second[0]) / 2, (first[1] + second[1]) / 2];

function ArticulatedLimb({
  joints,
  toe,
  side,
  kind,
}: {
  joints: RigPose['arms'][number];
  toe?: Point;
  side: 'near' | 'far';
  kind: 'arm' | 'leg';
}) {
  const [first, hinge, end] = joints;
  const firstAngle = degrees(first, hinge);
  const nextAngle = degrees(hinge, end);
  const firstLength = distance(first, hinge);
  const nextLength = distance(hinge, end);

  return (
    <g className={`exercise-limb exercise-${kind}`} transform={`translate(${first.join(' ')}) rotate(${firstAngle})`}>
      <line className={`limb-${side}-upper`} x2={firstLength} />
      <g transform={`translate(${firstLength} 0) rotate(${nextAngle - firstAngle})`}>
        <line className={`limb-${side}-lower`} x2={nextLength} />
        <circle className={`limb-${side}-hinge`} r={kind === 'arm' ? 3.5 : 4.4} />
        {toe && (
          <g transform={`translate(${nextLength} 0) rotate(${degrees(end, toe) - nextAngle})`}>
            <line className={`limb-${side}-foot`} x2={distance(end, toe)} />
          </g>
        )}
      </g>
    </g>
  );
}

function SpineAlignmentLine({
  pose,
  isMistake,
  view,
}: {
  pose: RigPose;
  isMistake: boolean;
  view: ViewAngle;
}) {
  const shoulder = center(pose.arms[0][0], pose.arms[1][0]);
  const hips = center(pose.legs[0][0], pose.legs[1][0]);
  const lumbar: Point = [(shoulder[0] + hips[0] * 2) / 3 + (isMistake && view === 'side' ? 12 : 0), (shoulder[1] + hips[1] * 2) / 3];
  const thoracic: Point = [(shoulder[0] * 2 + hips[0]) / 3, (shoulder[1] * 2 + hips[1]) / 3];
  const cervical: Point = [(shoulder[0] + pose.head[0]) / 2, (shoulder[1] + pose.head[1]) / 2];

  const path = `M${hips[0]} ${hips[1] - 4} Q${lumbar[0]} ${lumbar[1]} ${thoracic[0]} ${thoracic[1]} Q${cervical[0]} ${cervical[1]} ${pose.head[0]} ${pose.head[1] + 6}`;

  return (
    <g className="bio-spine-group">
      <path className={`bio-spine-line ${isMistake ? 'spine-mistake' : ''}`} d={path} />
      {[hips, lumbar, thoracic, cervical].map((pt, i) => (
        <circle
          key={i}
          className={`bio-vertebra-dot ${isMistake ? 'vertebra-mistake' : ''}`}
          cx={pt[0]}
          cy={pt[1]}
          r={2.2}
        />
      ))}
    </g>
  );
}

function JointPivotDots({
  pose,
  isMistake,
  faultJoints = [],
}: {
  pose: RigPose;
  isMistake: boolean;
  faultJoints?: string[];
}) {
  const nearJoints = [
    { pt: pose.arms[0][0], name: 'shoulder' },
    { pt: pose.arms[0][1], name: 'elbow' },
    { pt: pose.arms[0][2], name: 'wrist' },
    { pt: pose.legs[0][0], name: 'hip' },
    { pt: pose.legs[0][1], name: 'knee' },
    { pt: pose.legs[0][2], name: 'ankle' },
  ];

  const farJoints = [
    { pt: pose.arms[1][0], name: 'shoulder' },
    { pt: pose.arms[1][1], name: 'elbow' },
    { pt: pose.arms[1][2], name: 'wrist' },
    { pt: pose.legs[1][0], name: 'hip' },
    { pt: pose.legs[1][1], name: 'knee' },
    { pt: pose.legs[1][2], name: 'ankle' },
  ];

  return (
    <g className="bio-joints-overlay">
      {farJoints.map(({ pt, name }, i) => (
        <circle
          key={`far-${i}`}
          className={`bio-joint-dot far ${isMistake && faultJoints.includes(name) ? 'fault-active' : ''}`}
          cx={pt[0]}
          cy={pt[1]}
          r={3.8}
        />
      ))}
      {nearJoints.map(({ pt, name }, i) => (
        <circle
          key={`near-${i}`}
          className={`bio-joint-dot ${isMistake && faultJoints.includes(name) ? 'fault-active' : ''}`}
          cx={pt[0]}
          cy={pt[1]}
          r={4.2}
        />
      ))}
    </g>
  );
}

function GroundReferenceLine({ pose }: { pose: RigPose }) {
  const floorY = 182;

  return (
    <g className="bio-ground-datum">
      <line className="bio-ground-line" x1="40" y1={floorY} x2="320" y2={floorY} />
      {Array.from({ length: 15 }, (_, i) => 50 + i * 18).map((x) => (
        <line key={x} className="bio-ground-hash" x1={x} y1={floorY} x2={x} y2={floorY + 4} />
      ))}
      {pose.toes.map(([x, y], index) => y >= 180 && <circle key={index} className="bio-heel-contact" cx={x} cy={floorY} r={3} />)}
    </g>
  );
}

function ExerciseEquipment({ equipment, pose, view }: { equipment: MotionSequence['equipment']; pose: RigPose; view: ViewAngle }) {
  if (view === 'front' && equipment === 'wall') return <rect className="bio-wall-plane" x="106" y="30" width="148" height="150" rx="4" />;
  if (view === 'front' && equipment === 'counter') return <path className="exercise-equipment" d="M122 149h116m-105 0v31m94-31v31" />;
  if (view === 'front' && equipment === 'chair') return <path className="exercise-equipment" d="M147 128V85h66v43m-71 2h76m-68 0v51m59-51v51" />;
  if (view === 'front' && equipment === 'rail') return <path className="exercise-equipment" d="M128 108h104m-98 0v73m92-73v73" />;
  if (view === 'front' && equipment === 'bench') return <><path className="exercise-equipment" d="M160 151h66m-58 0v29m50-29v29" /><rect className="exercise-weight" x={pose.arms[0][2][0] - 8} y={pose.arms[0][2][1] - 4} width="16" height="8" rx="3" /></>;
  if (view === 'front' && equipment === 'chest-machine') return <path className="exercise-equipment" d="M128 181V74h28m76 107V74h-28m-55 79h62m-54 0v28m46-28v28" />;
  if (view === 'front' && equipment === 'leg-machine') return <path className="exercise-equipment" d="M135 181v-69h90v69m-76-20h62" />;
  if (view === 'front' && equipment === 'band') return <path className="exercise-accessory" d={`M180 78L${pose.arms[0][2].join(' ')}M180 78L${pose.arms[1][2].join(' ')}`} />;
  switch (equipment) {
    case 'chair': return <path className="exercise-equipment" d="M129 75v54h64M137 130v51m44-51v51" />;
    case 'wall': return <path className="exercise-equipment" d="M232 34v149m8-132v132" />;
    case 'counter': return <path className="exercise-equipment" d="M237 130h54m-41 0v52m32-52v52" />;
    case 'mat': return <path className="exercise-mat" d="M79 187h188" />;
    case 'rail': return <path className="exercise-equipment" d="M217 103h52m-29 0v77m28-77v77" />;
    case 'band': {
      const hand = pose.arms[0][2];
      return <><path className="exercise-equipment" d="M274 46v137" /><path className="exercise-accessory" d={`M274 80 L${hand.join(' ')}`} /></>;
    }
    case 'bench': {
      const hand = pose.arms[0][2];
      return <><path className="exercise-equipment" d="M212 151h62m-48 0v32m36-32v32" /><rect className="exercise-weight" x={hand[0] - 8} y={hand[1] - 4} width="16" height="8" rx="3" /></>;
    }
    case 'chest-machine': return <path className="exercise-equipment" d="M121 183V67h18v62h54v52m62 0V79h-31" />;
    case 'leg-machine': {
      const foot = pose.toes[1];
      return <><path className="exercise-equipment" d="M107 117l57 49h37m-73-34v50m58-17v17m37 0l38-75" /><path className="exercise-accessory" d={`M${foot[0] - 1} ${foot[1] - 14}l17 34`} /></>;
    }
    case 'kettlebell': {
      const hand = center(pose.arms[0][2], pose.arms[1][2]);
      return <circle className="exercise-weight" cx={hand[0] + 6} cy={hand[1] + 8} r="8" />;
    }
    default: return null;
  }
}

function MuscleFocus({ pose, muscles }: { pose: RigPose; muscles: Muscle[] }) {
  const shoulder = center(pose.arms[0][0], pose.arms[1][0]);
  const hips = center(pose.legs[0][0], pose.legs[1][0]);
  const torso = center(shoulder, hips);
  const points: Record<Muscle, Point[]> = {
    Shoulders: [pose.arms[0][0], pose.arms[1][0]],
    Chest: [center(shoulder, torso)],
    Back: [torso],
    Core: [center(torso, hips)],
    Glutes: [pose.legs[0][0], pose.legs[1][0]],
    Legs: [pose.legs[0][1], pose.legs[1][1]],
  };

  return (
    <g className="exercise-focus-points">
      {muscles.flatMap((muscle) =>
        points[muscle].map((point, index) => (
          <circle key={`${muscle}-${index}`} cx={point[0]} cy={point[1]} r="13" />
        ))
      )}
    </g>
  );
}

function PlaybackClock({ onFrame }: { onFrame: (_: number, delta: number) => void }) {
  useAnimationFrame(onFrame);
  return null;
}

export function BiomechanicalExercisePlayer({
  exercise,
  playing,
  speed,
  onSpeed,
  focus,
  onFocus,
  readAloud = false,
}: {
  exercise: Exercise;
  playing: boolean;
  speed: PlaybackSpeed;
  onSpeed: (speed: PlaybackSpeed) => void;
  focus: boolean;
  onFocus: (focused: boolean) => void;
  readAloud?: boolean;
}) {
  const playerId = useId();
  const reduced = useReducedMotion();
  const motion = exercise.motion;
  const spec = biomechanicalSpecs[motion];
  const [view, setView] = useState<ViewAngle>('side');
  const [showMistake, setShowMistake] = useState(false);
  const [audioOn, setAudioOn] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [visible, setVisible] = useState(true);
  const container = useRef<HTMLDivElement>(null);
  const clock = useRef(0);
  const audio = useRef<AudioContext | null>(null);

  const sequence = useMemo(() => sequenceForView(motion, view), [motion, view]);
  const phases = useMemo(() => motionPhases(sequence, motion), [sequence, motion]);
  const duration = phases.reduce((seconds, phase) => seconds + phase.seconds, 0);
  const trajectories = useMemo(() => motionTrajectories(sequence), [sequence]);
  const sample = demoFrame(sequence, phases, elapsed);
  const pose = showMistake ? getMistakePose(motion, view, sequence) : sample.pose;
  const shoulder = center(pose.arms[0][0], pose.arms[1][0]);
  const hips = center(pose.legs[0][0], pose.legs[1][0]);
  const angle = view === 'side' && spec.angle ? jointAngleGuide(pose, spec.angle, motion) : undefined;
  const animate = playing && !reduced && !showMistake && visible;

  useEffect(() => {
    const element = container.current;
    if (!element || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.05 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => () => { void audio.current?.close().catch(() => {}); }, []);

  async function toggleAudio() {
    if (audioOn) {
      setAudioOn(false);
      return;
    }
    try {
      audio.current ??= new AudioContext();
      await audio.current.resume();
      setAudioOn(audio.current.state === 'running');
    } catch {
      setAudioOn(false);
    }
  }

  const advance = useCallback((_: number, delta: number) => {
    const previous = clock.current;
    const next = (previous + Math.min(delta, 120) * speed / 1000) % duration;
    clock.current = next;
    setElapsed(next);
    const ctx = audio.current;
    if (!audioOn || ctx?.state !== 'running' || (next >= previous && Math.floor(next / speed) === Math.floor(previous / speed))) return;

    const tone = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = ctx.currentTime;
    tone.frequency.value = next < previous ? 620 : 420;
    gain.gain.setValueAtTime(0.018, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.045);
    tone.connect(gain);
    gain.connect(ctx.destination);
    tone.start(start);
    tone.stop(start + 0.045);
    tone.onended = () => { tone.disconnect(); gain.disconnect(); };
  }, [speed, duration, audioOn]);

  function nextPose() {
    const next = (sample.phaseIndex + 1) % phases.length;
    const seconds = phases.slice(0, next).reduce((total, phase) => total + phase.seconds, 0);
    clock.current = seconds;
    setElapsed(seconds);
  }

  const breath = sample.phase.breath ?? sample.cue.breath;
  const speech = showMistake
    ? [exercise.name, spec.mistake.faultCue, spec.mistake.fixCue].join(' ')
    : [exercise.name, exercise.cue, sample.cue.cue, breath].join(' ');
  const angleLabel = spec.angle === 'trunk' ? 'Shoulder–hip–foot' : spec.angle === 'elbow' ? 'Elbow' : spec.angle === 'knee' ? 'Knee' : 'Hip';
  const tempoLabels = [...new Set(phases.map(phase => phase.label))];
  const compactTempo = tempoLabels.slice(0, 5).map(label => {
    const phase = phases.find(item => item.label === label)!;
    return Number.isInteger(phase.seconds) ? label + ' ' + phase.seconds / speed + 's' : label;
  }).join(' · ');

  return <div className="biomechanical-exercise-container" ref={container}>
    {animate && <PlaybackClock onFrame={advance} />}
    <div className={'exercise-stage bio-stage-wrapper' + (showMistake ? ' mistake-mode' : '')} data-playing={animate}>
      <div className="bio-stage-badges absolute top-3 left-3 right-3 flex justify-between items-center pointer-events-none z-10">
        <span className={`bio-hud-chip ${showMistake ? 'red-warning bg-rose-950/80 border-rose-500/30 text-rose-300' : 'green-zone bg-emerald-950/80 border-emerald-500/30 text-emerald-300'} px-2.5 py-1 text-xs rounded-full border backdrop-blur-md inline-flex items-center gap-1.5 font-bold shadow-sm`}>
          {showMistake ? <AlertTriangle size={14} className="w-3.5 h-3.5 shrink-0" aria-hidden /> : <CheckCircle2 size={14} className="w-3.5 h-3.5 shrink-0" aria-hidden />}
          <span>{showMistake ? 'Common mistake' : 'Guided form'}</span>
        </span>
        {angle && <span className="bio-hud-chip px-2.5 py-1 text-xs rounded-full border border-slate-700/50 bg-slate-900/80 text-slate-300 backdrop-blur-md inline-flex items-center gap-1.5 font-bold" title="This angle is measured from the illustration.">{angleLabel} <strong>{angle.degrees}°</strong></span>}
      </div>
      <svg width="360" height="212" viewBox="0 0 360 212" className="bio-stage-svg" role="img" aria-labelledby={playerId + '-title ' + playerId + '-description'}>
        <title id={playerId + '-title'}>{exercise.name + (showMistake ? ' common form mistake' : ' form illustration')}</title>
        <desc id={playerId + '-description'}>{view === 'front' ? 'Front schematic. Blue is the right side of the body. Violet is the left. Dots mark the major joints. Use the side view to see movement toward or away from the body.' : 'Side schematic. The spine line and joint dots follow the mannequin. Dotted paths trace movement through the current view.'}</desc>
        <circle className="exercise-halo" cx="180" cy="107" r="84" />
        <circle className="exercise-halo-inner" cx="180" cy="107" r="62" />
        <ellipse className="exercise-shadow" cx="180" cy="188" rx="104" ry="5.5" />
        <GroundReferenceLine pose={pose} />
        <ExerciseEquipment equipment={sequence.equipment} pose={pose} view={view} />
        {!showMistake && trajectories.map(({ path, side }, index) =>
          <path key={index} className={'bio-motion-arc ' + side} d={path} />
        )}
        <ArticulatedLimb joints={pose.legs[1]} toe={pose.toes[1]} side="far" kind="leg" />
        <ArticulatedLimb joints={pose.arms[1]} side="far" kind="arm" />
        <line className="bio-torso-core" x1={shoulder[0]} y1={shoulder[1] + 5} x2={hips[0]} y2={hips[1] - 3} />
        <ArticulatedLimb joints={pose.legs[0]} toe={pose.toes[0]} side="near" kind="leg" />
        <ArticulatedLimb joints={pose.arms[0]} side="near" kind="arm" />
        <circle className="bio-head-sphere" cx={pose.head[0]} cy={pose.head[1]} r="12.5" />
        <SpineAlignmentLine pose={pose} isMistake={showMistake && spec.mistake.affectedJoints.includes('spine')} view={view} />
        {focus && !showMistake && <MuscleFocus pose={pose} muscles={exercise.muscles} />}
        <JointPivotDots pose={pose} isMistake={showMistake} faultJoints={spec.mistake.affectedJoints} />
        {angle && <path className={'bio-angle-arc' + (showMistake ? ' is-fault' : '')} d={angle.arc} />}
      </svg>
      <div className="bio-stage-caption">
        <div className="bio-limb-legend">
          <span className="bio-legend-pill"><span className="dot-near" /> Right</span>
          <span className="bio-legend-pill"><span className="dot-far" /> Left</span>
        </div>
        <span>{angle ? 'Angle of this illustration' : view === 'front' ? 'Use the side view for depth' : 'Guided illustration'}</span>
      </div>
    </div>

    <div className="bio-controls-bar">
      <div className="bio-control-group">
        <div className="segmented" role="group" aria-label="Camera view">
          <button type="button" className="bio-toggle-btn" aria-pressed={view === 'side'} onClick={() => setView('side')}>Side profile</button>
          <button type="button" className="bio-toggle-btn" aria-pressed={view === 'front'} onClick={() => setView('front')}>Front view</button>
        </div>
        <button type="button" className="bio-toggle-btn mistake-toggle" aria-pressed={showMistake} onClick={() => setShowMistake(!showMistake)}>
          <AlertTriangle size={14} className="w-4 h-4 shrink-0 inline-block" aria-hidden /> {showMistake ? 'Return to guided form' : 'See common form mistake'}
        </button>
      </div>
      <div className="bio-control-group">
        <div className="exercise-speed" role="group" aria-label="Demonstration playback speed">
          <button type="button" aria-pressed={speed === 0.5} onClick={() => onSpeed(0.5)} aria-label="0.5 times, slow pace">0.5× <span>Slow</span></button>
          <button type="button" aria-pressed={speed === 1} onClick={() => onSpeed(1)} aria-label="1 times, normal pace">1× <span>Normal</span></button>
        </div>
        <button className="exercise-focus" type="button" aria-pressed={focus} onClick={() => onFocus(!focus)}>
          <Focus size={14} className="w-4 h-4 shrink-0 inline-block" aria-hidden /><span>{focus ? 'Hide muscle focus' : 'Show muscle focus'}</span>
        </button>
        {playing && !reduced && !showMistake && <button className="exercise-focus" type="button" aria-pressed={audioOn} onClick={() => { void toggleAudio(); }} aria-label="Demonstration metronome">
          {audioOn ? <Volume2 size={14} className="w-4 h-4 shrink-0" aria-hidden /> : <VolumeX size={14} className="w-4 h-4 shrink-0" aria-hidden />}
        </button>}
        {!animate && !showMistake && phases.length > 1 && <button className="exercise-focus" type="button" onClick={nextPose}>Next pose <ChevronRight size={14} className="w-4 h-4 shrink-0" aria-hidden /></button>}
      </div>
    </div>

    {showMistake ? <div className="bio-mistake-card" aria-live="polite">
      <h4><AlertTriangle size={16} className="w-4 h-4 shrink-0" aria-hidden /> {spec.mistake.title}</h4>
      <p>{spec.mistake.faultCue}</p>
      <p><strong>Try this instead</strong> {spec.mistake.fixCue}</p>
    </div> : <>
      <div className="bio-tempo-panel">
        <div className="bio-tempo-header">
          <span className="bio-phase-pill"><Gauge size={13} className="w-3.5 h-3.5 shrink-0" aria-hidden /> {sample.phase.label} · {Math.ceil(sample.secondsLeft / speed)}s</span>
          <span className="muted">{compactTempo}</span>
        </div>
        <div className="bio-tempo-track" aria-hidden="true"><div className="bio-tempo-bar" style={{ transform: 'scaleX(' + elapsed / duration + ')' }} /></div>
      </div>
      <div className="exercise-form-steps">
        <div><Activity size={15} className="w-4 h-4 shrink-0" aria-hidden /><strong>Form</strong><span>{sample.cue.cue}</span></div>
        <div><Wind size={15} className="w-4 h-4 shrink-0" aria-hidden /><strong>Breathing</strong><span>{breath}</span></div>
        {focus && <p className="exercise-focus-label">{exercise.muscles.join(' · ')}</p>}
      </div>
    </>}
    {readAloud && <ReadAloudButton text={speech} />}
  </div>;
}
