import { Clock3, Pause, Play, RotateCcw, ScanEye } from 'lucide-react';
import { useEffect, useReducer, useRef } from 'react';
import { eyeBreakReducer, eyeBreakTime, initialEyeBreakSession } from '../eyeBreakTimer';
import { MistakeGuardrailBanner } from './MistakeGuardrailBanner';

const timerGuardrails = [{
  mistake: 'Switching from your computer to a phone during the break.',
  correction: 'Turn away from every screen and look at a real object about 6 metres (20 feet) away for 20 seconds. Blink naturally.',
}];

export function EyeBreakTimer({ sounds, onBreak }: { sounds: boolean; onBreak: (active: boolean) => void }) {
  const [session, dispatch] = useReducer(eyeBreakReducer, initialEyeBreakSession);
  const context = useRef<AudioContext | undefined>(undefined);
  const previousPhase = useRef(session.phase);
  const { deadline, phase, completed, remainingMs } = session;
  const running = deadline !== null;

  useEffect(() => {
    if (deadline === null) return;
    const tick = () => dispatch({ type: 'tick', now: performance.now() });
    const interval = window.setInterval(tick, 150);
    document.addEventListener('visibilitychange', tick);
    window.addEventListener('focus', tick);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', tick);
      window.removeEventListener('focus', tick);
    };
  }, [deadline]);

  useEffect(() => { onBreak(phase === 'break' && running); }, [onBreak, phase, running]);
  useEffect(() => {
    if (previousPhase.current === phase) return;
    previousPhase.current = phase;
    const audio = context.current;
    if (!sounds || audio?.state !== 'running') return;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    const now = audio.currentTime;
    oscillator.frequency.value = phase === 'break' ? 587 : 740;
    gain.gain.setValueAtTime(.042, now);
    gain.gain.exponentialRampToValueAtTime(.0001, now + .34);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(now);
    oscillator.stop(now + .35);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  }, [phase, sounds]);
  useEffect(() => () => { void context.current?.close().catch(() => undefined); }, []);

  function activate(type: 'toggle' | 'start-break') {
    if (sounds && !running) {
      try {
        context.current ??= new AudioContext();
        void context.current.resume().catch(() => undefined);
      } catch { /* Visual timer still works. */ }
    }
    dispatch({ type, now: performance.now() });
  }

  return <article className="card ergo-card timer-card" id="timer">
    <header className="ergo-card-title"><Clock3 size={16} className="w-4 h-4" aria-hidden /><h3>20-20-20 focus timer</h3></header>
    <div className="ergo-timer-display">
      <div className={`ergo-timer-ring${phase === 'break' ? ' is-break' : ''}`}>
        <span className="ergo-timer-digits" role="timer" aria-live="off">{eyeBreakTime(remainingMs)}</span>
        <span className="ergo-timer-phase">{phase === 'work' ? 'Screen work' : 'Look into the distance'}</span>
      </div>
    </div>
    <p role="status" className="ergo-timer-cue">{phase === 'work'
      ? running ? 'Focus timer running. Take a break whenever you need one.' : completed > 0 ? 'Break complete. Start another focus session when ready.' : 'Start the focus timer, or take a look-away break now.'
      : running ? 'Look away now. Pick a real object at least 6 metres away.' : 'Ready for a look-away break. Start when you can leave the screen.'}</p>
    <div className="ergo-timer-controls">
      <button type="button" className={`button ${running ? 'secondary' : 'primary'}`} onClick={() => activate('toggle')}>
        {running ? <Pause size={16} className="w-4 h-4" aria-hidden /> : <Play size={16} className="w-4 h-4" aria-hidden />}
        {running ? 'Pause timer' : phase === 'break' ? 'Start eye break' : 'Start focus timer'}
      </button>
      {phase === 'work' && <button type="button" className="button secondary" onClick={() => activate('start-break')}><ScanEye size={16} className="w-4 h-4" aria-hidden /> Break now</button>}
      <button type="button" className="icon-button" aria-label="Reset focus timer" onClick={() => dispatch({ type: 'reset' })}><RotateCcw size={16} className="w-4 h-4" aria-hidden /></button>
    </div>
    <div className="ergo-timer-footer"><span>Completed this session</span><strong>{completed} {completed === 1 ? 'break' : 'breaks'}</strong></div>
    <MistakeGuardrailBanner category="general" compact mistakes={timerGuardrails} />
  </article>;
}
