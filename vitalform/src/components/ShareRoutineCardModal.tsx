import {
  Check,
  Copy,
  Download,
  Droplets,
  Flame,
  Share2,
  Smartphone,
  X,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { useWorkspace } from '../store';
import { calculateProfile } from '../profile';
import { climateProtocols } from './WeatherProtectionShield';
import { localDate } from '../context';
import { computeLocalAnalytics } from '../analytics/localAnalytics';

export function ShareRoutineCardModal({
  today = localDate(),
  onClose,
}: {
  today?: string;
  onClose: () => void;
}) {
  const {
    profile,
    environment,
    budget,
    currency,
    weatherSeason,
    days,
    profileStarted,
  } = useWorkspace();

  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const protocol = climateProtocols[weatherSeason ?? 'winter'];
  const analytics = computeLocalAnalytics(days, budget, currency, profileStarted, today);

  const metrics = profile && calculateProfile(profile);
  const journal = days[today] || { water: 0, habits: {}, meals: {} };
  const waterMl = journal.water || 0;
  const amDone = Boolean(journal.habits.am);
  const pmDone = Boolean(journal.habits.pm);
  const workoutDone = Boolean(journal.habits.workout);

  const dateFormatted = new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${today}T12:00:00`));

  // Formatted share text for WhatsApp & Telegram
  const shareText = `✨ *My AURA-CARE Daily Wellness Blueprint* ✨
🗓️ ${dateFormatted} · ${environment === 'pg' ? '🏢 PG Hostel Setup' : '🏠 Home Setup'}

🔥 *Consistency Streak:* ${analytics.currentStreak} Days Active
💧 *Hydration:* ${waterMl} ml logged
${metrics?.targets ? `🎯 *Nutrition Target:* ${metrics.targets.calories.toLocaleString()} kcal · ${metrics.targets.protein}g Protein` : ''}

☀️ *AM Morning:* Gentle Cleanser → Antioxidant → SPF 50+ Barrier [${amDone ? '✓ Completed' : 'Pending'}]
🌙 *PM Recovery:* Double Cleanse → Ceramide Occlusive [${pmDone ? '✓ Completed' : 'Scheduled'}]
🏋️ *Movement:* Biomechanical Workout [${workoutDone ? '✓ Done' : 'Today\'s Goal'}]
🌤️ *Climate Shield:* ${protocol.name} Active

🛡️ Tracked 100% privately via AURA-CARE PWA
https://aura-care.vercel.app/`;

  const handleCopyText = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsAppShare = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({
          title: 'My AURA-CARE Daily Blueprint',
          text: shareText,
          url: 'https://aura-care.vercel.app/',
        });
      } catch {}
    } else {
      handleCopyText();
    }
  };

  // High-Resolution 2D Canvas Image Exporter
  const handleDownloadPNG = () => {
    setDownloading(true);
    const canvas = canvasRef.current;
    if (!canvas) {
      setDownloading(false);
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setDownloading(false);
      return;
    }

    // Set canvas dimensions: 720 x 1140 (high-DPI 2x scaling for 360x570)
    canvas.width = 720;
    canvas.height = 1140;

    // Background Gradient: #064e3b to #0f766e
    const bgGrad = ctx.createLinearGradient(0, 0, 720, 1140);
    bgGrad.addColorStop(0, '#064e3b');
    bgGrad.addColorStop(0.5, '#086045');
    bgGrad.addColorStop(1, '#022c22');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 720, 1140);

    // Subtle Outer Border
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, 680, 1100);

    // Header Brand
    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('AURA-CARE', 50, 80);

    ctx.fillStyle = '#a7f3d0';
    ctx.font = '22px sans-serif';
    ctx.fillText('Daily Wellness Blueprint', 50, 115);

    // Date & Setup pill
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.roundRect(50, 145, 620, 50, 12);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(`🗓️ ${dateFormatted}  ·  ${environment === 'pg' ? '🏢 PG Hostel Mode' : '🏠 Home Mode'}`, 70, 178);

    // Stats Grid Box
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.roundRect(50, 220, 295, 120, 16);
    ctx.roundRect(375, 220, 295, 120, 16);
    ctx.fill();

    // Streak
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 44px sans-serif';
    ctx.fillText(`🔥 ${analytics.currentStreak} Days`, 75, 280);
    ctx.fillStyle = '#d1d5db';
    ctx.font = '20px sans-serif';
    ctx.fillText('Consistency Streak', 75, 315);

    // Water
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 44px sans-serif';
    ctx.fillText(`💧 ${waterMl} ml`, 400, 280);
    ctx.fillStyle = '#d1d5db';
    ctx.font = '20px sans-serif';
    ctx.fillText('Daily Hydration Logged', 400, 315);

    // Macro Target Bar
    if (metrics?.targets) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.roundRect(50, 365, 620, 95, 16);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('🎯 Daily Macro Targets', 75, 405);

      ctx.fillStyle = '#6ee7b7';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText(`${metrics.targets.calories.toLocaleString()} kcal  ·  ${metrics.targets.protein}g Protein  ·  ${metrics.targets.carbs}g Carbs`, 75, 440);
    }

    // Routines Checklist Section
    const drawRoutineRow = (y: number, title: string, desc: string, isDone: boolean, icon: string) => {
      ctx.fillStyle = isDone ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.08)';
      ctx.roundRect(50, y, 620, 90, 14);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(`${icon} ${title} ${isDone ? '✓' : ''}`, 75, y + 40);

      ctx.fillStyle = '#9ca3af';
      ctx.font = '20px sans-serif';
      ctx.fillText(desc, 75, y + 70);
    };

    drawRoutineRow(485, 'AM Skincare & SPF 50+ Barrier', 'Gentle Cleanse → Antioxidant Serum → UV Shield', amDone, '☀️');
    drawRoutineRow(595, 'PM Active Barrier Recovery', 'Double Cleanse → Active Treatment → Ceramide Occlusive', pmDone, '🌙');
    drawRoutineRow(705, 'Biomechanical Movement Session', 'Silent Zero-Jump posture drills & joint mobility', workoutDone, '🏋️');
    drawRoutineRow(815, `Climate Shield: ${protocol.name}`, protocol.skincare.slice(0, 52) + '...', true, '🌤️');

    // Bottom Watermark & Privacy Guarantee
    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('AURA-CARE · 100% Local-First Health & Biohacking', 50, 960);

    ctx.fillStyle = '#9ca3af';
    ctx.font = '18px sans-serif';
    ctx.fillText('Zero tracking · Zero ads · Pure self-directed wellness longevity', 50, 995);

    // Export to Image download
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `auracare-routine-${today}.png`;
    link.href = dataUrl;
    link.click();
    setDownloading(false);
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="share-card-title">
      <div className="modal" style={{ maxWidth: 440, padding: 18 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header" style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="brand-icon" style={{ width: 32, height: 32, background: '#086045' }}>
              <Share2 size={16} />
            </span>
            <div>
              <h2 id="share-card-title" style={{ margin: 0, fontSize: 16 }}>Share My Daily Blueprint</h2>
              <small style={{ color: 'var(--muted)', fontSize: 11 }}>Private, sanitized routine card export</small>
            </div>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close dialog">
            <X size={16} />
          </button>
        </div>

        {/* Visual Routine Card Preview */}
        <div
          ref={cardRef}
          style={{
            borderRadius: 16,
            background: 'linear-gradient(135deg, #064e3b 0%, #086045 60%, #022c22 100%)',
            color: '#ffffff',
            padding: 16,
            display: 'grid',
            gap: 12,
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
          }}
        >
          {/* Card Top */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: 10 }}>
            <div>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#34d399', letterSpacing: '-0.02em' }}>
                AURA-CARE
              </span>
              <div style={{ fontSize: 11, opacity: 0.85 }}>Daily Bio-Blueprint</div>
            </div>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: 20,
                background: 'rgba(255,255,255,0.15)',
                color: '#ffffff',
              }}
            >
              {environment === 'pg' ? '🏢 PG Hostel' : '🏠 Home'}
            </span>
          </div>

          {/* Quick Metrics Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{ padding: '8px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#fbbf24', fontSize: 11, fontWeight: 700 }}>
                <Flame size={13} /> Streak
              </div>
              <strong style={{ fontSize: 17, display: 'block', marginTop: 2 }}>{analytics.currentStreak} Days</strong>
            </div>

            <div style={{ padding: '8px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#38bdf8', fontSize: 11, fontWeight: 700 }}>
                <Droplets size={13} /> Hydration
              </div>
              <strong style={{ fontSize: 17, display: 'block', marginTop: 2 }}>{waterMl} ml</strong>
            </div>
          </div>

          {/* Macro Target */}
          {metrics?.targets && (
            <div style={{ padding: '7px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.08)', fontSize: 11.5 }}>
              <span style={{ color: '#a7f3d0', fontWeight: 700 }}>🎯 Nutrition Target: </span>
              <strong>{metrics.targets.calories.toLocaleString()} kcal</strong> · {metrics.targets.protein}g Protein
            </div>
          )}

          {/* Habits Status */}
          <div style={{ display: 'grid', gap: 6, fontSize: 11.5 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 8px', borderRadius: 6, background: amDone ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)' }}>
              <span>☀️ AM Skincare &amp; SPF 50+</span>
              <span style={{ fontWeight: 700, color: amDone ? '#6ee7b7' : '#9ca3af' }}>{amDone ? '✓ Done' : 'Pending'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 8px', borderRadius: 6, background: pmDone ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)' }}>
              <span>🌙 PM Active Barrier Recovery</span>
              <span style={{ fontWeight: 700, color: pmDone ? '#6ee7b7' : '#9ca3af' }}>{pmDone ? '✓ Done' : 'Scheduled'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 8px', borderRadius: 6, background: workoutDone ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)' }}>
              <span>🏋️ Movement &amp; Biomechanics</span>
              <span style={{ fontWeight: 700, color: workoutDone ? '#6ee7b7' : '#9ca3af' }}>{workoutDone ? '✓ Done' : 'Planned'}</span>
            </div>
          </div>

          {/* Climate Shield */}
          <div style={{ fontSize: 10.5, color: '#a7f3d0', borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: 6 }}>
            🌤️ Climate Shield: <strong>{protocol.name}</strong>
          </div>
        </div>

        {/* Hidden Canvas for High-Resolution PNG export */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Sharing Action Buttons */}
        <div style={{ display: 'grid', gap: 8, marginTop: 14 }}>
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              type="button"
              className="button primary-button"
              onClick={handleNativeShare}
              style={{
                width: '100%',
                minHeight: 38,
                background: '#086045',
                color: '#ffffff',
                fontSize: 12.5,
                fontWeight: 700,
              }}
            >
              <Smartphone size={15} /> Share via Phone / Apps
            </button>
          )}

          <button
            type="button"
            className="button primary-button"
            onClick={handleWhatsAppShare}
            style={{
              width: '100%',
              minHeight: 38,
              background: '#25D366',
              color: '#ffffff',
              fontSize: 12.5,
              fontWeight: 750,
            }}
          >
            <Share2 size={15} /> Share to WhatsApp
          </button>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="button secondary-button"
              onClick={handleCopyText}
              style={{ flex: 1, minHeight: 36, fontSize: 12 }}
            >
              {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy Text'}
            </button>

            <button
              type="button"
              className="button secondary-button"
              onClick={handleDownloadPNG}
              disabled={downloading}
              style={{ flex: 1, minHeight: 36, fontSize: 12 }}
            >
              <Download size={14} />
              {downloading ? 'Rendering...' : 'Download PNG'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
