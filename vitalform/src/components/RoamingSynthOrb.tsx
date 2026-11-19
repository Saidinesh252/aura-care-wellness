import { useEffect, useRef, useState } from 'react';
import { Anchor, Compass, Move, Volume2, VolumeX } from 'lucide-react';
import {
  getChordMood,
  getSynthFrequencyData,
  moodConfigs,
  setChordMood,
  type ChordMood,
} from '../ProceduralSynth';
import './roamingSynth.css';

interface Props {
  enabled: boolean;
  onToggle: () => void;
  busy?: boolean;
  error?: boolean;
}

interface TrailPoint {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
  size: number;
}

const colorStops = [
  { speed: 0, r: 16, g: 185, b: 129 },   // Emerald #10B981
  { speed: 3.5, r: 59, g: 130, b: 246 }, // Cobalt #3B82F6
  { speed: 7.5, r: 139, g: 92, b: 246 }, // Violet #8B5CF6
];

function getVelocityColor(speed: number, alpha: number): string {
  let r = colorStops[0].r;
  let g = colorStops[0].g;
  let b = colorStops[0].b;

  if (speed <= colorStops[1].speed) {
    const t = Math.max(0, speed / colorStops[1].speed);
    r = Math.round(colorStops[0].r + (colorStops[1].r - colorStops[0].r) * t);
    g = Math.round(colorStops[0].g + (colorStops[1].g - colorStops[0].g) * t);
    b = Math.round(colorStops[0].b + (colorStops[1].b - colorStops[0].b) * t);
  } else {
    const t = Math.min(1, Math.max(0, (speed - colorStops[1].speed) / (colorStops[2].speed - colorStops[1].speed)));
    r = Math.round(colorStops[1].r + (colorStops[2].r - colorStops[1].r) * t);
    g = Math.round(colorStops[1].g + (colorStops[2].g - colorStops[1].g) * t);
    b = Math.round(colorStops[1].b + (colorStops[2].b - colorStops[1].b) * t);
  }

  return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
}

export function RoamingSynthOrb({ enabled, onToggle, busy, error }: Props) {
  const [docked, setDocked] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [mood, setMood] = useState<ChordMood>(getChordMood);
  const [isDragging, setIsDragging] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const trailCanvasRef = useRef<HTMLCanvasElement>(null);
  const visualizerCanvasRef = useRef<HTMLCanvasElement>(null);

  // Physics and interaction refs
  const posRef = useRef({ x: 40, y: typeof window !== 'undefined' ? window.innerHeight - 100 : 500 });
  const velRef = useRef({ x: 0, y: 0 });
  const pointerPosRef = useRef<{ x: number; y: number } | null>(null);
  const isHoveredRef = useRef(false);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, orbX: 0, orbY: 0, time: 0 });
  const dragVelocityRef = useRef({ vx: 0, vy: 0 });
  const trailRef = useRef<TrailPoint[]>([]);
  const timeRef = useRef(0);
  const lastTimeRef = useRef(0);
  const scrollSpeedRef = useRef(0);
  const lastScrollYRef = useRef(typeof window !== 'undefined' ? window.scrollY : 0);

  // Sync mood change
  function handleMoodSelect(nextMood: ChordMood) {
    setMood(nextMood);
    setChordMood(nextMood);
  }

  // Pointer repulsion tracking
  useEffect(() => {
    function handlePointerMove(e: PointerEvent) {
      pointerPosRef.current = { x: e.clientX, y: e.clientY };
    }
    function handleScroll() {
      const currentY = window.scrollY;
      const deltaY = Math.abs(currentY - lastScrollYRef.current);
      lastScrollYRef.current = currentY;
      scrollSpeedRef.current = Math.min(10, deltaY * 0.15);
      window.setTimeout(() => {
        scrollSpeedRef.current *= 0.7;
      }, 100);
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Main 60fps Physics & Visualizer Loop
  useEffect(() => {
    let animId = 0;
    const trailCanvas = trailCanvasRef.current;
    const visCanvas = visualizerCanvasRef.current;
    const trailCtx = trailCanvas?.getContext('2d');
    const visCtx = visCanvas?.getContext('2d');

    function resizeCanvases() {
      if (trailCanvas) {
        trailCanvas.width = window.innerWidth;
        trailCanvas.height = window.innerHeight;
      }
      if (visCanvas) {
        visCanvas.width = 76 * (window.devicePixelRatio || 1);
        visCanvas.height = 76 * (window.devicePixelRatio || 1);
        visCtx?.setTransform(window.devicePixelRatio || 1, 0, 0, window.devicePixelRatio || 1, 0, 0);
      }
    }

    resizeCanvases();
    window.addEventListener('resize', resizeCanvases);

    function step(now: number) {
      if (!lastTimeRef.current) lastTimeRef.current = now;
      const dt = Math.min(0.06, (now - lastTimeRef.current) / 1000);
      lastTimeRef.current = now;

      const innerWidth = window.innerWidth;
      const innerHeight = window.innerHeight;
      const isMobile = innerWidth < 760;

      // Safe bounds (24px padding, bottom clears mobile navigation bar)
      const orbW = expanded ? 220 : 56;
      const orbH = expanded ? 122 : 56;
      const minX = 24;
      const maxX = Math.max(minX, innerWidth - orbW - 24);
      const minY = 24;
      const maxY = Math.max(minY, innerHeight - orbH - (isMobile ? 86 : 24));

      const pos = posRef.current;
      const vel = velRef.current;

      if (docked) {
        // Docked Mode: smoothly glides to bottom-left corner anchor
        const dockX = 24;
        const dockY = innerHeight - (isMobile ? 128 : 84);
        pos.x += (dockX - pos.x) * 0.14;
        pos.y += (dockY - pos.y) * 0.14;
        vel.x = 0;
        vel.y = 0;
      } else if (isDraggingRef.current) {
        // Dragging: position locked to pointer
        // Momentum tracking is computed on pointermove
      } else if (isHoveredRef.current) {
        // Hover Magnet: dampens motion to a gentle pause so controls are easy to click
        vel.x *= 0.82;
        vel.y *= 0.82;
        pos.x += vel.x * dt * 60;
        pos.y += vel.y * dt * 60;
      } else {
        // Autonomous Roaming Mode: Smooth Lissajous Drift Path
        timeRef.current += dt * (0.85 + scrollSpeedRef.current * 0.15);
        const t = timeRef.current;

        // Figure-eight Lissajous calculation spanning pleasant outer perimeter
        const cx = (minX + maxX) * 0.5;
        const cy = (minY + maxY) * 0.5;
        const rx = (maxX - minX) * 0.42;
        const ry = (maxY - minY) * 0.38;

        const targetX = cx + Math.sin(t * 0.38) * rx + Math.sin(t * 0.88) * (rx * 0.2);
        const targetY = cy + Math.sin(t * 0.27 + 1.2) * ry + Math.cos(t * 0.65) * (ry * 0.18);

        // Spring acceleration toward organic trajectory
        let ax = (targetX - pos.x) * 0.038;
        let ay = (targetY - pos.y) * 0.038;

        // Smart Center Modal Avoidance:
        // Center exclusion bubble (radius: 170px) so the roaming orb stays out of dialogs
        const centerDist = Math.hypot(pos.x - cx, pos.y - cy);
        if (centerDist < 170) {
          const pushForce = (1 - centerDist / 170) * 1.8;
          ax += ((pos.x - cx) / Math.max(1, centerDist)) * pushForce * 32;
          ay += ((pos.y - cy) / Math.max(1, centerDist)) * pushForce * 32;
        }

        // Pointer Repulsion:
        // If cursor approaches quickly, smoothly glide away so clicks are never blocked
        if (pointerPosRef.current && !isHoveredRef.current) {
          const px = pointerPosRef.current.x;
          const py = pointerPosRef.current.y;
          const pDist = Math.hypot(pos.x + 28 - px, pos.y + 28 - py);
          if (pDist < 135) {
            const repel = (1 - pDist / 135) * 2.2;
            const dx = pos.x + 28 - px;
            const dy = pos.y + 28 - py;
            ax += (dx / Math.max(1, pDist)) * repel * 44;
            ay += (dy / Math.max(1, pDist)) * repel * 44;
          }
        }

        // Apply inertia & velocity damping
        vel.x = (vel.x + ax) * 0.93;
        vel.y = (vel.y + ay) * 0.93;

        pos.x += vel.x * dt * 60;
        pos.y += vel.y * dt * 60;
      }

      // Viewport Edge Containment with soft bounce
      if (pos.x < minX) {
        pos.x = minX;
        vel.x = Math.abs(vel.x) * 0.65;
      } else if (pos.x > maxX) {
        pos.x = maxX;
        vel.x = -Math.abs(vel.x) * 0.65;
      }
      if (pos.y < minY) {
        pos.y = minY;
        vel.y = Math.abs(vel.y) * 0.65;
      } else if (pos.y > maxY) {
        pos.y = maxY;
        vel.y = -Math.abs(vel.y) * 0.65;
      }

      // GPU-accelerated transform: translate3d
      if (wrapperRef.current) {
        wrapperRef.current.style.setProperty('--orb-x', `${pos.x.toFixed(1)}px`);
        wrapperRef.current.style.setProperty('--orb-y', `${pos.y.toFixed(1)}px`);
      }

      // Velocity & Trail
      const currentSpeed = Math.hypot(vel.x, vel.y) + scrollSpeedRef.current;
      const speedColor = getVelocityColor(currentSpeed, 1);

      if (wrapperRef.current) {
        wrapperRef.current.style.setProperty('--orb-accent', speedColor);
        wrapperRef.current.style.setProperty(
          '--orb-glow',
          getVelocityColor(currentSpeed, enabled ? 0.38 : 0.12),
        );
      }

      // Add point to fading ribbon / particle trail
      if (!docked && (currentSpeed > 0.4 || isDraggingRef.current)) {
        trailRef.current.push({
          x: pos.x + 28,
          y: pos.y + 28,
          vx: vel.x * 0.15,
          vy: vel.y * 0.15,
          alpha: 0.65,
          color: speedColor,
          size: Math.min(8, 2.5 + currentSpeed * 0.75),
        });
      }

      // Render Trail Canvas
      if (trailCtx && trailCanvas) {
        trailCtx.clearRect(0, 0, trailCanvas.width, trailCanvas.height);
        const trail = trailRef.current;

        for (let i = trail.length - 1; i >= 0; i--) {
          const pt = trail[i];
          pt.alpha -= dt * 1.5;
          pt.size *= 0.97;
          pt.x += pt.vx;
          pt.y += pt.vy;

          if (pt.alpha <= 0 || pt.size <= 0.4) {
            trail.splice(i, 1);
            continue;
          }

          trailCtx.save();
          trailCtx.beginPath();
          trailCtx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
          trailCtx.fillStyle = pt.color.replace(/[\d.]+\)$/, `${pt.alpha.toFixed(3)})`);
          trailCtx.shadowColor = pt.color;
          trailCtx.shadowBlur = 8;
          trailCtx.fill();
          trailCtx.restore();
        }
      }

      // Render Circular Frequency Spectrum Ring
      if (visCtx && visCanvas) {
        visCtx.clearRect(0, 0, 76, 76);
        const centreX = 38;
        const centreY = 38;
        const freq = getSynthFrequencyData();

        visCtx.save();

        if (enabled && freq && freq.length >= 16) {
          // Average bass energy (bins 0 to 5) to pulse inner glow
          let bassSum = 0;
          for (let i = 0; i < 6; i++) bassSum += freq[i];
          const bassEnergy = bassSum / (6 * 255);
          const coreRadius = 19 + bassEnergy * 4;

          // Glowing circular frequency spectrum ring
          const barCount = 24;
          const stepAngle = (Math.PI * 2) / barCount;

          for (let i = 0; i < barCount; i++) {
            const freqIdx = Math.floor((i / barCount) * Math.min(28, freq.length));
            const amplitude = (freq[freqIdx] || 0) / 255;
            const barHeight = Math.max(2, amplitude * 12 + bassEnergy * 3);
            const angle = i * stepAngle;

            const startX = centreX + Math.cos(angle) * (coreRadius + 1);
            const startY = centreY + Math.sin(angle) * (coreRadius + 1);
            const endX = centreX + Math.cos(angle) * (coreRadius + 1 + barHeight);
            const endY = centreY + Math.sin(angle) * (coreRadius + 1 + barHeight);

            visCtx.beginPath();
            visCtx.moveTo(startX, startY);
            visCtx.lineTo(endX, endY);
            visCtx.strokeStyle = getVelocityColor(currentSpeed, 0.5 + amplitude * 0.5);
            visCtx.lineWidth = 1.8;
            visCtx.lineCap = 'round';
            visCtx.stroke();
          }

          // Pulsing halo
          visCtx.beginPath();
          visCtx.arc(centreX, centreY, coreRadius + 0.5, 0, Math.PI * 2);
          visCtx.strokeStyle = getVelocityColor(currentSpeed, 0.4 + bassEnergy * 0.5);
          visCtx.lineWidth = 1.2;
          visCtx.stroke();
        } else {
          // Idle breathing pulse ring when paused / muted
          const idlePulse = Math.sin(now * 0.003) * 2;
          visCtx.beginPath();
          visCtx.arc(centreX, centreY, 20 + idlePulse, 0, Math.PI * 2);
          visCtx.strokeStyle = 'rgba(101, 243, 207, 0.32)';
          visCtx.setLineDash([3, 4]);
          visCtx.lineWidth = 1;
          visCtx.stroke();
        }

        visCtx.restore();
      }

      animId = requestAnimationFrame(step);
    }

    animId = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resizeCanvases);
    };
  }, [docked, expanded, enabled]);

  // Drag-and-Toss pointer gesture handling
  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    // Prevent drag when clicking buttons inside the expanded HUD
    if ((e.target as HTMLElement).closest('button')) return;

    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    isDraggingRef.current = true;
    setIsDragging(true);

    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      orbX: posRef.current.x,
      orbY: posRef.current.y,
      time: performance.now(),
    };
    dragVelocityRef.current = { vx: 0, vy: 0 };
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDraggingRef.current) return;

    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    const now = performance.now();
    const dt = Math.max(0.008, (now - dragStartRef.current.time) / 1000);

    posRef.current.x = dragStartRef.current.orbX + dx;
    posRef.current.y = dragStartRef.current.orbY + dy;

    // Track toss velocity
    dragVelocityRef.current = {
      vx: (dx / dt) * 0.018,
      vy: (dy / dt) * 0.018,
    };

    dragStartRef.current.time = now;
    dragStartRef.current.x = e.clientX;
    dragStartRef.current.y = e.clientY;
    dragStartRef.current.orbX = posRef.current.x;
    dragStartRef.current.orbY = posRef.current.y;
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDraggingRef.current) return;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if already released
    }

    isDraggingRef.current = false;
    setIsDragging(false);

    // Apply toss momentum vector on release
    velRef.current = {
      x: Math.max(-14, Math.min(14, dragVelocityRef.current.vx)),
      y: Math.max(-14, Math.min(14, dragVelocityRef.current.vy)),
    };
  }

  return (
    <>
      {/* Background Trail Canvas */}
      <canvas ref={trailCanvasRef} className="roaming-synth-canvas" aria-hidden="true" />

      {/* Floating Roaming Synth Capsule */}
      <div
        ref={wrapperRef}
        className="roaming-synth-wrapper"
        data-docked={docked}
        data-dragging={isDragging}
        onMouseEnter={() => {
          isHoveredRef.current = true;
          setExpanded(true);
        }}
        onMouseLeave={() => {
          isHoveredRef.current = false;
          if (!isDraggingRef.current) setExpanded(false);
        }}
      >
        <aside
          className="roaming-synth-capsule"
          data-expanded={expanded}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          aria-label="Roaming Web Audio Synth Companion"
        >
          {/* Circular Core with Real-Time Frequency Ring */}
          <div className="roaming-orb-core">
            <canvas ref={visualizerCanvasRef} className="roaming-visualizer-canvas" aria-hidden="true" />
            <button
              type="button"
              className="roaming-orb-icon-btn"
              data-active={enabled}
              disabled={busy}
              onClick={onToggle}
              aria-label={enabled ? 'Mute ambient synth' : 'Start ambient synth'}
              title={enabled ? 'Mute Ambient Synth (Click to toggle)' : 'Play Ambient Synth (Click to toggle)'}
            >
              {enabled ? <Volume2 size={18} strokeWidth={2.2} /> : <VolumeX size={18} strokeWidth={2.2} />}
            </button>
          </div>

          {/* Liquid Glass HUD Expanded Controls */}
          {expanded && (
            <div className="roaming-hud-body">
              <header className="roaming-hud-head">
                <span className="roaming-hud-title">
                  <span className="roaming-hud-status-dot" />
                  {moodConfigs[mood].name}
                </span>
                <button
                  type="button"
                  className="roaming-dock-toggle-btn"
                  onClick={() => setDocked(!docked)}
                  title={docked ? 'Release to Roam across the screen' : 'Dock & Pin to corner'}
                  aria-label={docked ? 'Roam screen' : 'Dock to corner'}
                >
                  {docked ? (
                    <>
                      <Compass size={12} /> Roam
                    </>
                  ) : (
                    <>
                      <Anchor size={12} /> Dock
                    </>
                  )}
                </button>
              </header>

              {/* Mood Switcher Pills */}
              <div className="roaming-mood-row" role="radiogroup" aria-label="Synth chord mood">
                {(['space', 'synthwave', 'zen'] as const).map(key => {
                  const item = moodConfigs[key];
                  const selected = mood === key;
                  return (
                    <button
                      type="button"
                      key={key}
                      className="roaming-mood-btn"
                      aria-pressed={selected}
                      onClick={() => handleMoodSelect(key)}
                    >
                      <span>{item.tag}</span>
                      <small>{key === 'space' ? 'Am9 Pad' : key === 'synthwave' ? '80s Dm' : 'Dmaj9'}</small>
                    </button>
                  );
                })}
              </div>

              {/* Drag Hint Footer */}
              <footer className="roaming-hud-footer">
                <span className="roaming-drag-hint">
                  <Move size={11} /> Grab &amp; flick to toss
                </span>
                {error && <span style={{ color: '#ff8a8a' }}>Audio blocked</span>}
              </footer>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
