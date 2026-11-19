import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { budgets, environments, type Page } from '../context';
import { answerPip, pipGreeting, pipTips, type PipReply } from '../pipAssistant';
import { pipOnlineEligible, pipQuestionLimit } from '../pipOnlinePolicy';
import { drawPip, drawPipHand, type PipExpression, type PipHandFrame } from '../PipMascot';
import { useWorkspace } from '../store';
import '../pip.css';

interface Props {
  onNavigate: (page: Page, target?: string) => void;
  onOpenCoach?: () => void;
  synthEnabled?: boolean;
  onBlip?: () => void;
  initialOpen?: boolean;
}

function PipMascotView({ speaking = false, waving = false }: { speaking?: boolean; waving?: boolean }) {
  const body = useRef<HTMLCanvasElement>(null);
  const hand = useRef<HTMLCanvasElement>(null);
  const [blinking, setBlinking] = useState(false);

  useEffect(() => {
    const blinkInterval = window.setInterval(() => {
      setBlinking(true);
      window.setTimeout(() => setBlinking(false), 170);
    }, 3600);
    return () => window.clearInterval(blinkInterval);
  }, []);

  const expression: PipExpression = blinking ? 'blink' : speaking ? 'talk' : 'idle';
  const handFrame: PipHandFrame = waving ? 'side' : 'up';

  useEffect(() => {
    if (body.current) drawPip(body.current, expression);
    if (hand.current) drawPipHand(hand.current, handFrame);
  }, [expression, handFrame]);

  return (
    <span className="pip-mascot" aria-hidden="true">
      <span className="pip-shadow" />
      <span className="pip-sprite">
        <canvas ref={body} width={16} height={16} className="pip-body" />
        <canvas ref={hand} width={8} height={8} className="pip-hand" />
      </span>
    </span>
  );
}

function PipText({
  text,
  onBlip,
  onTypingChange,
}: {
  text: string;
  onBlip?: () => void;
  onTypingChange?: (typing: boolean) => void;
}) {
  const letters = useMemo(() => Array.from(text), [text]);
  const [visibleLength, setVisibleLength] = useState(0);
  const [finished, finish] = useState(false);
  const blip = useRef(onBlip);
  blip.current = onBlip;
  const typingChange = useRef(onTypingChange);
  typingChange.current = onTypingChange;

  useEffect(() => {
    typingChange.current?.(true);
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let length = 0;
    let tone = 0;
    let timer: ReturnType<typeof setTimeout>;
    const stride = Math.max(1, Math.ceil(letters.length / 135));
    const step = () => {
      length = Math.min(letters.length, length + stride);
      setVisibleLength(length);
      if (!/\s/.test(letters[length - 1]) && ++tone % 2 === 0) blip.current?.();
      if (length < letters.length) {
        timer = setTimeout(step, 20);
      } else {
        finish(true);
        typingChange.current?.(false);
      }
    };
    const reduce = () => {
      if (motion.matches) {
        clearTimeout(timer);
        finish(true);
        typingChange.current?.(false);
      }
    };
    if (finished) {
      typingChange.current?.(false);
      return;
    }
    if (motion.matches) reduce();
    else timer = setTimeout(step, 22);
    motion.addEventListener('change', reduce);
    return () => {
      clearTimeout(timer);
      motion.removeEventListener('change', reduce);
      typingChange.current?.(false);
    };
  }, [finished, letters]);

  const typed = finished || visibleLength >= letters.length;
  return <>
    <p className="pip-reply" aria-hidden="true">
      {typed ? text : letters.slice(0, visibleLength).join('')}{!typed && <span className="pip-cursor" />}
    </p>
    {!typed && <button className="pip-skip" type="button" onClick={() => { finish(true); typingChange.current?.(false); }}>Show full reply</button>}
    <span className="pip-sr-only" role="status">{typed ? text : ''}</span>
  </>;
}

async function onlineQuestion(question: string, signal: AbortSignal) {
  const response = await fetch('/api/assistant', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ question }), signal,
  });
  if (!response.ok) return;
  const result: { answer?: unknown } = await response.json();
  if (typeof result.answer === 'string' && result.answer.trim()) return result.answer;
}

function PipDock({ onNavigate, onOpenCoach, synthEnabled, onBlip, initialOpen }: Props) {
  const environment = useWorkspace(state => state.environment);
  const budget = useWorkspace(state => state.budget);
  const profileId = useWorkspace(state => state.activeMemberId);
  const name = useWorkspace(state => state.familyMembers.find(member => member.id === profileId)?.name) ?? 'My profile';
  const [open, setOpen] = useState(initialOpen ?? false);
  const [reply, setReply] = useState<PipReply>({ text: pipGreeting });
  const [prompt, setPrompt] = useState('');
  const [lastPrompt, setLastPrompt] = useState('');
  const [asked, setAsked] = useState(0);
  const [configured, setConfigured] = useState(false);
  const [online, setOnline] = useState(false);
  const [onlineReply, setOnlineReply] = useState(false);
  const [pending, setPending] = useState(false);
  const [tip, setTip] = useState(0);
  const [waving, setWaving] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const request = useRef<AbortController | undefined>(undefined);
  const launcher = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const transcript = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const headingId = useId();

  useEffect(() => () => request.current?.abort(), []);

  useEffect(() => {
    if (!open) return;
    input.current?.focus({ preventScroll: true });
    const controller = new AbortController();
    fetch('/api/assistant', { headers: { Accept: 'application/json' }, signal: controller.signal })
      .then(response => response.ok && response.headers.get('Content-Type')?.includes('application/json') ? response.json() : null)
      .then((status: { configured?: unknown } | null) => {
        if (!controller.signal.aborted) setConfigured(status?.configured === true);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [open]);

  useEffect(() => {
    if (transcript.current) transcript.current.scrollTop = 0;
  }, [asked]);

  function show(next: PipReply, source: 'local' | 'online' = 'local') {
    setReply(next);
    setOnlineReply(source === 'online');
    setAsked(count => count + 1);
  }

  function close() {
    request.current?.abort();
    setPending(false);
    setOpen(false);
    launcher.current?.focus();
  }

  function triggerBounce() {
    setWaving(true);
    if (synthEnabled) onBlip?.();
    window.setTimeout(() => setWaving(false), 520);
  }

  function toggle() {
    triggerBounce();
    if (open) close();
    else setOpen(true);
  }

  function cycleTip() {
    triggerBounce();
    setLastPrompt('');
    show({ text: pipTips[tip] });
    setTip((tip + 1) % pipTips.length);
  }

  async function ask(question: string) {
    const trimmed = question.trim().slice(0, pipQuestionLimit);
    if (!trimmed || pending) return;
    setLastPrompt(trimmed);
    setPrompt('');
    const workspace = useWorkspace.getState();
    const localReply = answerPip(trimmed, workspace);
    if (localReply.dinnerChoices) workspace.swapMeal('Dinner', localReply.dinnerChoices);
    if (!configured || !online || !pipOnlineEligible(trimmed)) {
      show(localReply);
      return;
    }
    const controller = new AbortController();
    request.current = controller;
    setPending(true);
    try {
      const answer = await onlineQuestion(trimmed, controller.signal);
      if (!controller.signal.aborted) show(answer ? { text: answer } : localReply, answer ? 'online' : 'local');
    } catch {
      if (!controller.signal.aborted) show(localReply);
    } finally {
      if (request.current === controller) {
        request.current = undefined;
        setPending(false);
      }
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void ask(prompt);
  }

  return <div className="pip-dock" data-waving={waving} onKeyDown={event => {
    if (open && event.key === 'Escape') {
      event.stopPropagation();
      close();
    }
  }}>
    {open && <section className="pip-panel" id={panelId} role="dialog" aria-labelledby={headingId}>
      <header className="pip-panel-head">
        <button type="button" className="pip-panel-mascot" onClick={cycleTip} disabled={pending} aria-label="Ask PIP.EXE for a tip" title="Click PIP for a tip!">
          <PipMascotView speaking={speaking} waving={waving} />
        </button>
        <div className="pip-title">
          <h2 id={headingId}>PIP.EXE</h2>
          <p><span /> {onlineReply ? 'Online AI reply' : 'Zero-dependency local engine'}</p>
        </div>
        <button className="pip-close" type="button" onClick={close} aria-label="Close PIP.EXE">×</button>
      </header>
      <div className="pip-context" aria-label={`Active profile: ${name}`}>
        <span>{name}</span><span>{environments[environment].short}</span><span>{budgets[budget].short}</span>
      </div>
      <div className="pip-dialogue" ref={transcript} tabIndex={0} aria-label="Assistant message">
        {lastPrompt && <p className="pip-last-prompt"><span>You</span> {lastPrompt}</p>}
        {pending ? <p role="status" className="pip-reply">Thinking… connecting to neural core…</p> : <>
          <PipText key={asked} text={reply.text} onBlip={synthEnabled ? onBlip : undefined} onTypingChange={setSpeaking} />
          {reply.action && <button type="button" className="pip-action" onClick={() => { const action = reply.action; if (action) { close(); onNavigate(action.page, action.target); } }}>{reply.action.label} <span aria-hidden="true">↗</span></button>}
          {reply.source && <a className="pip-source" href={reply.source.href} target="_blank" rel="noreferrer">{reply.source.label} <span aria-hidden="true">↗</span></a>}
        </>}
      </div>
      <div className="pip-shortcuts" aria-label="Quick prompts">
        {[
          ['PG dinner', 'Swap my dinner for a PG no-cook meal'],
          ['Squat comfort', 'Modify squats for knee pain'],
          ['Tech stack', 'Show your tech stack'],
          ['Hydration', 'How much water should I drink?'],
          ['Audio synth', 'How does the procedural synth audio work?'],
        ].map(([label, question]) => <button type="button" key={label} disabled={pending} onClick={() => void ask(question)}>{label}</button>)}
      </div>
      <form className="pip-form" onSubmit={submit}>
        <label className="pip-sr-only" htmlFor={`${panelId}-question`}>Ask PIP.EXE</label>
        <input ref={input} id={`${panelId}-question`} required placeholder="Ask PIP (e.g. PG dinner, squats, tech stack)…" autoComplete="off" spellCheck="true" maxLength={pipQuestionLimit} value={prompt} onChange={event => setPrompt(event.currentTarget.value)} />
        <button type="submit" disabled={!prompt.trim() || pending} aria-label="Send question">↵</button>
      </form>
      {(configured || onOpenCoach) && <div className="pip-panel-footer">
        {configured && <label title="With your permission, site questions go to the configured provider. Only the text you type is sent."><input type="checkbox" checked={online} onChange={event => setOnline(event.currentTarget.checked)} /> Online site questions</label>}
        {onOpenCoach && <button type="button" onClick={() => { close(); onOpenCoach(); }}>Open Aura Coach <span aria-hidden="true">↗</span></button>}
        {configured && online && <p>Site questions go to the configured provider. Keep personal details out of the message.</p>}
      </div>}
    </section>}
    <button type="button" ref={launcher} className="pip-launcher" data-waving={waving} aria-expanded={open} aria-controls={open ? panelId : undefined}
      aria-label={open ? 'Collapse PIP.EXE assistant' : 'Open PIP.EXE assistant'} onClick={toggle}>
      <PipMascotView speaking={speaking} waving={waving} /><span className="pip-launcher-label">PIP.EXE<small>{open ? 'Close chat' : 'Ask assistant'}</small></span>
    </button>
  </div>;
}

export function PipAssistant(props: Props) {
  const active = useWorkspace(state => state.activeMemberId);
  return <PipDock key={active} {...props} />;
}
