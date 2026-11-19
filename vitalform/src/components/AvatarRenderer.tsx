import { useEffect, useRef, useState } from 'react';
import { drawPip, drawPipHand, type PipExpression } from '../PipMascot';

export type AvatarStyle = 'bot' | 'pip' | 'halo';
export type AvatarExpression = 'idle' | 'listening' | 'thinking' | 'speaking' | 'celebrating';

interface Props {
  style: AvatarStyle;
  expression: AvatarExpression;
  size?: number;
  pointerPos?: { x: number; y: number } | null;
  audioLevel?: number; // 0 to 1 for live mouth waveform
  isHovered?: boolean;
  className?: string;
}

interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
}

const CONFETTI_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#65f3cf'];

export function AvatarRenderer({
  style,
  expression,
  size = 64,
  pointerPos,
  audioLevel = 0,
  isHovered = false,
  className = '',
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pipBodyRef = useRef<HTMLCanvasElement>(null);
  const pipHandRef = useRef<HTMLCanvasElement>(null);
  const confettiCanvasRef = useRef<HTMLCanvasElement>(null);

  const [pupilOffset, setPupilOffset] = useState({ x: 0, y: 0 });
  const [blinking, setBlinking] = useState(false);
  const confettiRef = useRef<ConfettiParticle[]>([]);

  // Periodic natural blinking in idle and listening states
  useEffect(() => {
    if (expression === 'celebrating' || expression === 'thinking') return;
    const interval = window.setInterval(() => {
      setBlinking(true);
      window.setTimeout(() => setBlinking(false), 160);
    }, 3800 + Math.random() * 1500);
    return () => window.clearInterval(interval);
  }, [expression]);

  // Smooth pupil tracking following pointer
  useEffect(() => {
    if (expression === 'celebrating') {
      setPupilOffset({ x: 0, y: 0 });
      return;
    }
    if (expression === 'thinking') {
      setPupilOffset({ x: 1.5, y: -2.8 }); // Looking up thoughtfully
      return;
    }
    if (!pointerPos || !containerRef.current) {
      setPupilOffset({ x: 0, y: 0 });
      return;
    }

    const bounds = containerRef.current.getBoundingClientRect();
    const centerX = bounds.left + bounds.width / 2;
    const centerY = bounds.top + bounds.height / 2;
    const dx = pointerPos.x - centerX;
    const dy = pointerPos.y - centerY;
    const dist = Math.hypot(dx, dy);
    const maxOffset = 3.5;
    const offset = Math.min(maxOffset, dist * 0.015);
    const angle = Math.atan2(dy, dx);

    setPupilOffset({
      x: Math.cos(angle) * offset,
      y: Math.sin(angle) * offset,
    });
  }, [pointerPos, expression]);

  // Micro-confetti burst animation when celebrating
  useEffect(() => {
    if (expression !== 'celebrating') return;
    const count = 28;
    confettiRef.current = Array.from({ length: count }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      return {
        x: size / 2,
        y: size / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        size: 2.5 + Math.random() * 3,
        alpha: 1,
      };
    });

    let animId = 0;
    const canvas = confettiCanvasRef.current;
    const ctx = canvas?.getContext('2d');

    function drawConfetti() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const particles = confettiRef.current;

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12; // gravity
        p.alpha -= 0.022;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
        ctx.restore();
      }

      if (particles.length > 0) {
        animId = requestAnimationFrame(drawConfetti);
      }
    }

    animId = requestAnimationFrame(drawConfetti);
    return () => cancelAnimationFrame(animId);
  }, [expression, size]);

  // 8-Bit Pip Canvas Rendering
  useEffect(() => {
    if (style !== 'pip') return;
    const pipFrame: PipExpression =
      blinking || expression === 'celebrating'
        ? 'blink'
        : expression === 'speaking'
        ? 'talk'
        : 'idle';
    if (pipBodyRef.current) drawPip(pipBodyRef.current, pipFrame);
    if (pipHandRef.current) {
      drawPipHand(
        pipHandRef.current,
        expression === 'celebrating' || expression === 'listening' ? 'side' : 'up',
      );
    }
  }, [style, expression, blinking]);

  // Mouth waveform dynamic height bars
  const mouthBars = [0.35, 0.7, 1, 0.65, 0.4].map(scale =>
    expression === 'speaking'
      ? Math.max(2, (audioLevel || 0.6) * 12 * scale)
      : 2,
  );

  return (
    <div
      ref={containerRef}
      className={`avatar-renderer avatar-${style} avatar-state-${expression} ${className}`}
      style={{ width: size, height: size }}
      aria-label={`AI Companion Avatar (${style} style, ${expression} state)`}
    >
      {/* Confetti canvas overlay */}
      {expression === 'celebrating' && (
        <canvas
          ref={confettiCanvasRef}
          width={size}
          height={size}
          className="avatar-confetti-canvas"
          aria-hidden="true"
        />
      )}

      {/* Style 1: Cyber-Wellness Bot (Vector SVG Character) */}
      {style === 'bot' && (
        <svg
          viewBox="0 0 64 64"
          width={size}
          height={size}
          className="avatar-svg-bot"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="botChassis" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="60%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#080e1a" />
            </linearGradient>
            <linearGradient id="botVisor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0a1926" />
              <stop offset="100%" stopColor="#050e17" />
            </linearGradient>
            <radialGradient id="antennaGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>

          {/* Halo / Antennae Ring */}
          <g
            className="bot-antennae"
            transform={expression === 'listening' ? 'translate(0, 1)' : ''}
          >
            {/* Center Halo Ring */}
            <circle
              cx="32"
              cy="8"
              r="4.5"
              fill="none"
              stroke={expression === 'listening' ? '#10b981' : '#65f3cf'}
              strokeWidth="1.6"
              className={expression === 'listening' ? 'bot-halo-listening' : ''}
            />
            {/* Antenna connector stem */}
            <line x1="32" y1="12" x2="32" y2="16" stroke="#475569" strokeWidth="1.8" strokeLinecap="round" />
            {/* Left & Right Cyber Sensors */}
            <path
              d="M12 28 L7 24 L7 32 Z"
              fill={expression === 'listening' ? '#10b981' : '#334155'}
              stroke="#65f3cf"
              strokeWidth="0.8"
              className="bot-ear-left"
            />
            <path
              d="M52 28 L57 24 L57 32 Z"
              fill={expression === 'listening' ? '#10b981' : '#334155'}
              stroke="#65f3cf"
              strokeWidth="0.8"
              className="bot-ear-right"
            />
          </g>

          {/* Main Bot Head Capsule */}
          <rect
            x="11"
            y="16"
            width="42"
            height="38"
            rx="19"
            fill="url(#botChassis)"
            stroke="rgba(255, 255, 255, 0.22)"
            strokeWidth="1.2"
          />

          {/* Digital LED Visor */}
          <rect
            x="15"
            y="22"
            width="34"
            height="22"
            rx="9"
            fill="url(#botVisor)"
            stroke="rgba(101, 243, 207, 0.35)"
            strokeWidth="1"
          />

          {/* Soft Expanding Pulse Ring on Hover / Celebrating */}
          {(isHovered || expression === 'celebrating') && (
            <circle
              cx="32"
              cy="32"
              r="30"
              fill="none"
              stroke="#10b981"
              strokeWidth="1.5"
              className="bot-pulse-ring"
            />
          )}

          {/* Eyes (State-Driven: Idle, Blinking, Thinking, Celebrating, or Hover Squint) */}
          {blinking || expression === 'celebrating' || isHovered ? (
            /* Happy Eye-Arc Squint (^ ^) on Hover, Click or Blink */
            <g stroke="#65f3cf" strokeWidth="2.5" strokeLinecap="round" fill="none">
              <path d="M20 33 Q25 26 30 33" />
              <path d="M34 33 Q39 26 44 33" />
            </g>
          ) : (
            /* Digital LED Eyes with Smooth Pupil Tracking toward Cursor */
            <g className="bot-eyes">
              {/* Left Eye Socket & Pupil */}
              <circle cx="25" cy="32" r="5" fill="#08231c" stroke="#10b981" strokeWidth="1" />
              <circle
                cx={25 + pupilOffset.x}
                cy={32 + pupilOffset.y}
                r="2.4"
                fill="#65f3cf"
                className="bot-pupil"
              />
              <circle
                cx={24.2 + pupilOffset.x}
                cy={31.2 + pupilOffset.y}
                r="0.8"
                fill="#ffffff"
              />

              {/* Right Eye Socket & Pupil */}
              <circle cx="39" cy="32" r="5" fill="#08231c" stroke="#10b981" strokeWidth="1" />
              <circle
                cx={39 + pupilOffset.x}
                cy={32 + pupilOffset.y}
                r="2.4"
                fill="#65f3cf"
                className="bot-pupil"
              />
              <circle
                cx={38.2 + pupilOffset.x}
                cy={31.2 + pupilOffset.y}
                r="0.8"
                fill="#ffffff"
              />
            </g>
          )}

          {/* Rosy Cheeks when celebrating or hovered */}
          {(expression === 'celebrating' || isHovered) && (
            <g fill="#ff7d99" opacity="0.85">
              <ellipse cx="18" cy="38" rx="2.5" ry="1.4" />
              <ellipse cx="46" cy="38" rx="2.5" ry="1.4" />
            </g>
          )}

          {/* Friendly Wave Cyber Hand/Arm when hovered or celebrating */}
          {(isHovered || expression === 'celebrating') && (
            <g className="bot-wave-arm">
              <path d="M53 38 Q58 33 60 25" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" fill="none" />
              <circle cx="60" cy="24" r="2.5" fill="#65f3cf" />
              <line x1="59" y1="22" x2="57" y2="20" stroke="#65f3cf" strokeWidth="1.3" strokeLinecap="round" />
              <line x1="61" y1="22" x2="63" y2="20" stroke="#65f3cf" strokeWidth="1.3" strokeLinecap="round" />
            </g>
          )}

          {/* Thinking Orbit Ring */}
          {expression === 'thinking' && (
            <circle
              cx="32"
              cy="25"
              r="14"
              fill="none"
              stroke="#65f3cf"
              strokeWidth="1"
              strokeDasharray="4 6"
              className="bot-thinking-ring"
            />
          )}

          {/* Mouth: Waveform Equalizer (Speaking) vs Smile (Idle/Celebrating) */}
          {expression === 'speaking' ? (
            <g className="bot-mouth-waveform" fill="#65f3cf">
              {mouthBars.map((h, i) => (
                <rect
                  key={i}
                  x={26 + i * 2.8}
                  y={46 - h / 2}
                  width="1.8"
                  height={h}
                  rx="0.9"
                />
              ))}
            </g>
          ) : (
            <path
              d={
                expression === 'celebrating'
                  ? 'M26 44 Q32 49 38 44'
                  : 'M27 45 Q32 48 37 45'
              }
              fill="none"
              stroke={expression === 'celebrating' ? '#10b981' : '#65f3cf'}
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          )}

          {/* Subtle Cyber Chin Mark */}
          <line x1="30" y1="50" x2="34" y2="50" stroke="#334155" strokeWidth="1" strokeLinecap="round" />
        </svg>
      )}

      {/* Style 2: 8-Bit Retro Pip Mascot (Pixel Art Canvas) */}
      {style === 'pip' && (
        <div className="avatar-pip-wrapper">
          <canvas ref={pipBodyRef} width={16} height={16} className="avatar-pip-body" />
          <canvas ref={pipHandRef} width={8} height={8} className="avatar-pip-hand" />
        </div>
      )}

      {/* Style 3: Minimalist Bio-Halo (Glowing Core & Rings) */}
      {style === 'halo' && (
        <svg
          viewBox="0 0 64 64"
          width={size}
          height={size}
          className="avatar-svg-halo"
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="haloCore" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="35%" stopColor="#65f3cf" />
              <stop offset="70%" stopColor="#10b981" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>

          {/* Concentric Orbital Rings */}
          <ellipse
            cx="32"
            cy="32"
            rx="24"
            ry="11"
            fill="none"
            stroke="rgba(101, 243, 207, 0.45)"
            strokeWidth="1.2"
            strokeDasharray="4 4"
            className="halo-ring-1"
          />
          <ellipse
            cx="32"
            cy="32"
            rx="20"
            ry="9"
            fill="none"
            stroke="rgba(59, 130, 246, 0.35)"
            strokeWidth="1"
            className="halo-ring-2"
          />

          {/* Glowing Luminous Nucleus */}
          <circle
            cx="32"
            cy="32"
            r={13 + (expression === 'speaking' ? (audioLevel || 0.5) * 4 : 0)}
            fill="url(#haloCore)"
            className="halo-core"
          />

          {/* Minimalist Digital Pupil Tracking */}
          <circle
            cx={32 + pupilOffset.x}
            cy={32 + pupilOffset.y}
            r={blinking || expression === 'celebrating' ? 0.5 : 2.5}
            fill="#061a14"
          />
        </svg>
      )}
    </div>
  );
}
