export const eyeBreakWorkMs = 20 * 60 * 1000;
export const eyeBreakRestMs = 20 * 1000;

export interface EyeBreakSession {
  phase: 'work' | 'break';
  remainingMs: number;
  deadline: number | null;
  completed: number;
}

export const initialEyeBreakSession: EyeBreakSession = {
  phase: 'work', remainingMs: eyeBreakWorkMs, deadline: null, completed: 0,
};

export type EyeBreakAction =
  | { type: 'tick' | 'toggle' | 'start-break'; now: number }
  | { type: 'reset' };

export function eyeBreakReducer(session: EyeBreakSession, action: EyeBreakAction): EyeBreakSession {
  if (action.type === 'reset') return { ...initialEyeBreakSession, completed: session.completed };
  const { now } = action;
  if (action.type === 'start-break') {
    if (session.phase === 'break' && session.deadline !== null) return session;
    return { ...session, phase: 'break', remainingMs: eyeBreakRestMs, deadline: now + eyeBreakRestMs };
  }
  if (session.deadline === null) {
    return action.type === 'toggle' ? { ...session, deadline: now + session.remainingMs } : session;
  }
  const remainingMs = Math.max(0, session.deadline - now);
  if (remainingMs > 0) {
    if (action.type === 'toggle') return { ...session, remainingMs, deadline: null };
    return Math.ceil(remainingMs / 1000) === Math.ceil(session.remainingMs / 1000) ? session : { ...session, remainingMs };
  }
  if (session.phase === 'work') {
    // Await acknowledgement so the app cannot count a look-away break the user never started.
    return { ...session, phase: 'break', remainingMs: eyeBreakRestMs, deadline: null };
  }
  return { ...initialEyeBreakSession, completed: session.completed + 1 };
}

export function eyeBreakTime(ms: number) {
  const total = Math.ceil(ms / 1000);
  return `${Math.floor(total / 60).toString().padStart(2, '0')}:${(total % 60).toString().padStart(2, '0')}`;
}
