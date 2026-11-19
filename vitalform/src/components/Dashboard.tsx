import { ArrowDown, ArrowRight, ArrowUpRight, Clock, Clock3, Eye, Fingerprint, HeartHandshake, MapPin, Monitor, Share2, ShoppingBag } from 'lucide-react';
import { useEffect, useState } from 'react';
import { environments, type DiscoveryItem, type Page } from '../context';
import { useWorkspace } from '../store';
import { DailyTracker } from './DailyTracker';
import { EnvironmentSwitcher } from './EnvironmentSwitcher';
import { PillarLabel } from './Shared';
import { SafetyBanner } from './Evidence';
import { RecoveryPanel } from './RecoveryTools';
import { WeatherProtectionShield } from './WeatherProtectionShield';
import { LocalUsageInsights } from './LocalUsageInsights';
import { ShareRoutineCardModal } from './ShareRoutineCardModal';

export function Dashboard({ today, target, recommendations, onNavigate, onProfile, onMeal, onCheckIn }: {
  today: string; target?: string; recommendations: DiscoveryItem[]; onNavigate: (page: Page, target?: string) => void;
  onProfile: () => void; onMeal: () => void; onCheckIn: () => void;
}) {
  const { environment, profile, pinnedProducts } = useWorkspace();
  const [showShareModal, setShowShareModal] = useState(false);
  useEffect(() => {
    if (target === 'weather') document.getElementById('weather-shield')?.scrollIntoView();
  }, [target]);
  return <>
    <div className="page-intro dashboard-intro">
      <div><h1>Wellness overview</h1><p>Your daily space for skin, movement, and nourishment.</p></div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <button
          className="button secondary"
          type="button"
          onClick={() => setShowShareModal(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 33, fontSize: 12, padding: '0 12px' }}
        >
          <Share2 size={14} /> Share Routine Card
        </button>
        <EnvironmentSwitcher />
      </div>
    </div>
    <section className="hero" aria-label="Your wellness plan">
      <div className="hero-content">
        <span className="hero-tag"><MapPin size={13} /> {environments[environment].label} plan</span>
        <h2>Wellness that fits<br />your real life.</h2>
        <p>Skincare, workouts, and meals that adapt to where you are and what you can spend.</p>
        <div className="hero-actions"><button className="button hero-button" onClick={() => profile ? onNavigate('blueprint') : onProfile()}>{profile ? 'Open my blueprint' : 'Build my blueprint'} <ArrowRight size={16} /></button>
        <a className="button hero-secondary" href="#your-plan" onClick={event => {
          event.preventDefault();
          document.getElementById('your-plan')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
        }}>Explore recommendations <ArrowDown size={16} /></a></div>
      </div>
    </section>
    <SafetyBanner today={today} />
    <WeatherProtectionShield />
    <RecoveryPanel today={today} onMeal={onMeal} onCheckIn={onCheckIn} onProfile={onProfile} />
    <DailyTracker today={today} onNavigate={onNavigate} />

    {/* Digital Wellness & Ergonomics Dashboard Quick-Action Widget */}
    <section className="dashboard-section" aria-label="Digital Wellness & Ergonomics Quick Action">
      <div className="card ergo-dash-card">
        <div className="ergo-dash-left">
          <span className="ergo-dash-icon"><Eye size={22} className="text-emerald-400" /></span>
          <div>
            <div className="ergo-dash-tag">Digital Wellness &amp; Ergonomics</div>
            <h3>Desk Posture &amp; Eye Strain Relief</h3>
            <p>Combat tech-neck, dry eyes in AC rooms, and laptop slouch with guided 20-20-20 vision resets.</p>
          </div>
        </div>
        <div className="ergo-dash-actions">
          <button type="button" className="button secondary" onClick={() => onNavigate('ergonomics', 'timer')}>
            <Clock size={14} /> Start 20-20-20 Timer
          </button>
          <button type="button" className="button primary" onClick={() => onNavigate('ergonomics')}>
            Open Studio <ArrowUpRight size={14} />
          </button>
        </div>
      </div>
    </section>

    <LocalUsageInsights today={today} />
    <section className="dashboard-section planning-section" aria-label="Explore your workspace">
      <button className="card planning-card" onClick={() => onNavigate('blueprint')}><span><Fingerprint size={23} /></span><div><strong>My Personal Plan</strong><small>{profile ? 'Open your nutrition, skincare and movement blueprint' : 'Build a plan around your goals and daily setup'}</small></div><ArrowUpRight size={19} /></button>
      <button className="card planning-card" onClick={() => onNavigate('ergonomics')}><span><Monitor size={23} /></span><div><strong>Posture &amp; Eye Care</strong><small>20-20-20 screen timer, tech-neck fixes &amp; desk audit</small></div><ArrowUpRight size={19} /></button>
      <button className="card planning-card" onClick={() => onNavigate('gear')}><span><ShoppingBag size={23} /></span><div><strong>Top-Reviewed Gear &amp; Essentials</strong><small>{pinnedProducts.length ? `${pinnedProducts.length} pinned to your wellness budget` : 'Compare reviewed products for your profile'}</small></div><ArrowUpRight size={19} /></button>
      <button className="card planning-card" onClick={() => onNavigate('family')}><span><HeartHandshake size={23} /></span><div><strong>Family &amp; Elder Care</strong><small>Profiles, gentle movement, and daily care logs</small></div><ArrowUpRight size={19} /></button>
    </section>
    <section id="your-plan" className="dashboard-section recommendations">
      <div className="section-head"><h2>Made for your setup</h2></div>
      <div className="recommendation-grid">
        {recommendations.map(item => <button key={item.id} className="recommendation card" onClick={() => onNavigate(item.pillar, item.target)}>
          <div className={`pillar-photo photo-${item.pillar}`} aria-hidden="true" />
          <span className="recommendation-body"><PillarLabel pillar={item.pillar} /><strong>{item.title}</strong><span className="muted">{item.description}</span><span className="recommendation-footer"><span><Clock3 size={14} /> {item.minutes} min</span><span>Open plan <ArrowUpRight size={16} /></span></span></span>
        </button>)}
      </div>
    </section>
    <footer className="app-footer"><span>Vitalform</span><a href="#daily-tracker" onClick={event => { event.preventDefault(); document.getElementById('daily-tracker')?.scrollIntoView(); }}>Back to tracker <ArrowRight size={13} /></a></footer>
    {showShareModal && <ShareRoutineCardModal today={today} onClose={() => setShowShareModal(false)} />}
  </>;
}
