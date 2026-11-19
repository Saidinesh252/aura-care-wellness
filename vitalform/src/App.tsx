import {
  ArrowUpRight,
  Bell,
  Building2,
  CalendarDays,
  ChevronRight,
  Download,
  Eye,
  Fingerprint,
  HeartHandshake,
  House,
  LayoutGrid,
  Leaf,
  LockKeyhole,
  MapPin,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShoppingBag,
  Sun,
  User,
  Wallet,
  X,
} from 'lucide-react';
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { budgetRange, budgets, environments, localDate, pillars, type DiscoveryItem, type Page } from './context';
import { fitnessDiscovery } from './fitness';
import { dietDiscovery } from './nutrition';
import { workspaceMeals } from './personalizedNutrition';
import { calculateProfile, createProfile, hasBiometrics, poundsPerKg } from './profile';
import { comfortFor } from './familyTypes';
import { productDiscovery } from './products';
import { skinDiscovery } from './skincare';
import { useWorkspace } from './store';
import { movementOptions } from './weeklyMovement';
import { scheduledFormulas } from './skinSchedule';
import { Dashboard } from './components/Dashboard';
import { FamilyCircle } from './components/FamilyCircle';
import { defaultFilters, filterDiscovery, SearchFilterBar, SearchResults, type SearchFilters } from './components/SearchFilterBar';
import { pillarIcons } from './components/Shared';
import { WeatherShieldButton } from './components/WeatherProtectionShield';
import { StickyGlobalContextBar } from './components/StickyGlobalContextBar';
import { CheckInModal, OutsideMealModal } from './components/RecoveryTools';
import { PWAInstallBanner, usePWA } from './components/PWAInstallBanner';
import { PWAInstallModal } from './components/PWAInstallModal';
import { AuthGate } from './components/AuthGate';
import { sendLocalNotification } from './services/notificationService';
import { playSynthBlip, setSynthEnabled } from './ProceduralSynth';
import { InteractiveAvatarBot } from './components/InteractiveAvatarBot';
import { getStoredSession, isSupabaseConfigured } from './storage/supabaseClient';
import './experienceEntry.css';

const SkincareModule = lazy(() => import('./components/SkincareModule').then(module => ({ default: module.SkincareModule })));
const FitnessModule = lazy(() => import('./components/FitnessModule').then(module => ({ default: module.FitnessModule })));
const DietModule = lazy(() => import('./components/DietModule').then(module => ({ default: module.DietModule })));
const BlueprintModule = lazy(() => import('./components/BlueprintModule').then(module => ({ default: module.BlueprintModule })));
const GearModule = lazy(() => import('./components/GearModule').then(module => ({ default: module.GearModule })));
const ProfileWizard = lazy(() => import('./components/ProfileWizard').then(module => ({ default: module.ProfileWizard })));
const HealthVault = lazy(() => import('./components/HealthVault').then(module => ({ default: module.HealthVault })));
const FamilyCareHub = lazy(() => import('./components/FamilyCareHub').then(module => ({ default: module.FamilyCareHub })));
const NotificationModal = lazy(() => import('./components/NotificationModal').then(module => ({ default: module.NotificationModal })));
const FamilySyncModal = lazy(() => import('./components/FamilySyncModal').then(module => ({ default: module.FamilySyncModal })));
const AuraCoachDrawer = lazy(() => import('./components/AuraCoachDrawer').then(module => ({ default: module.AuraCoachDrawer })));
const SettingsView = lazy(() => import('./components/SettingsView').then(module => ({ default: module.SettingsView })));
const ErgonomicsModule = lazy(() => import('./components/ErgonomicsModule').then(module => ({ default: module.ErgonomicsModule })));
const PipAssistant = lazy(() => import('./components/PipAssistant').then(module => ({ default: module.PipAssistant })));

const pages = [
  { id: 'dashboard', label: 'Overview', mobile: 'Overview', icon: LayoutGrid },
  { id: 'blueprint', label: 'My Personal Plan', mobile: 'My plan', icon: Fingerprint },
  { id: 'skin', label: pillars.skin, mobile: 'Skincare', icon: pillarIcons.skin },
  { id: 'fitness', label: pillars.fitness, mobile: 'Movement', icon: pillarIcons.fitness },
  { id: 'diet', label: pillars.diet, mobile: 'Nutrition', icon: pillarIcons.diet },
  { id: 'ergonomics', label: 'Posture & Eye Care', mobile: 'Posture', icon: Eye },
  { id: 'gear', label: 'Gear & Essentials', mobile: 'Gear', icon: ShoppingBag },
  { id: 'family', label: 'Family & Elder Care', mobile: 'Family', icon: HeartHandshake },
] as const;

interface Route { page: Page; target?: string; syncCode?: string }
function readRoute(): Route {
  const hash = window.location.hash.slice(1);
  if (hash.startsWith('family-sync/')) {
    const syncCode = hash.replace('family-sync/', '');
    return { page: 'family', target: undefined, syncCode };
  }
  const [page, target] = hash.split('/');
  if (page === 'settings') {
    return { page: 'settings', target };
  }
  const match = pages.find(nav => nav.id === page);
  return { page: match?.id ?? 'dashboard', target };
}

function Navigation({
  page,
  onNavigate,
  collapsed = false,
  mobile = false,
}: {
  page: Page;
  onNavigate: (page: Page) => void;
  collapsed?: boolean;
  mobile?: boolean;
}) {
  return (
    <nav
      className={mobile ? 'mobile-nav' : `side-nav ${collapsed ? 'collapsed-nav' : ''}`}
      aria-label={mobile ? 'Mobile navigation' : 'Workspace navigation'}
    >
      {pages.map(({ id, label, mobile: short, icon: Icon }) => (
        <a
          key={id}
          aria-current={page === id ? 'page' : undefined}
          href={`#${id}`}
          title={collapsed ? label : undefined}
          aria-label={collapsed ? label : undefined}
          className={collapsed ? 'side-nav-collapsed-item' : ''}
          onClick={event => {
            if (
              event.button === 0 &&
              !event.metaKey &&
              !event.ctrlKey &&
              !event.shiftKey &&
              !event.altKey
            ) {
              event.preventDefault();
              onNavigate(id);
            }
          }}
        >
          {page === id && <motion.span aria-hidden className="audit-nav-active" layoutId={mobile ? 'active-mobile-route' : 'active-sidebar-route'} transition={{ type: 'spring', stiffness: 380, damping: 35 }} />}
          <Icon size={18} strokeWidth={1.9} aria-hidden />
          {!collapsed && <span>{mobile ? short : label}</span>}
          {!mobile && !collapsed && page === id && <span className="nav-active-dot" />}
        </a>
      ))}
    </nav>
  );
}

function Sidebar({
  page,
  onNavigate,
  onVault,
  onInstallApp,
  onOpenSettings,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}: {
  page: Page;
  onNavigate: (page: Page) => void;
  onVault: () => void;
  onInstallApp: () => void;
  onOpenSettings: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const { environment, budget, currency } = useWorkspace();
  const LocationIcon = environment === 'home' ? House : environment === 'pg' ? Building2 : MapPin;

  const handleNav = (navPage: Page) => {
    onNavigate(navPage);
    onCloseMobile();
  };

  return (
    <aside id="workspace-navigation" className={`sidebar ${collapsed && !mobileOpen ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`} role={mobileOpen ? 'dialog' : undefined} aria-modal={mobileOpen || undefined} aria-label="Workspace navigation">
      {/* Mobile close button (visible only in mobile slide-over mode) */}
      <button
        type="button"
        className="sidebar-mobile-close-btn"
        onClick={onCloseMobile}
        aria-label="Close navigation sidebar"
      >
        <X size={18} />
      </button>

      {/* Desktop sidebar edge toggle */}
      <button
        type="button"
        className="sidebar-edge-toggle"
        onClick={onToggleCollapse}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
      </button>

      <a
        href="#dashboard"
        className={`brand ${collapsed ? 'brand-collapsed' : ''}`}
        title="AURA-CARE Holistic Biohacking"
        onClick={event => {
          event.preventDefault();
          handleNav('dashboard');
        }}
      >
        <span className="brand-icon">
          <Leaf size={22} strokeWidth={2.1} />
        </span>
        {!collapsed && (
          <span className="brand-text">
            <strong>
              AURA-CARE<span>.</span>
            </strong>
            <small>Holistic Biohacking</small>
          </span>
        )}
      </a>

      <div className="side-content">
        {!collapsed && <span className="side-label">Workspace</span>}
        <Navigation page={page} onNavigate={handleNav} collapsed={collapsed} />
      </div>

      <div className="side-bottom">
        {/* Utility Navigation: Install App & Settings tabs */}
        <div className={`side-utility-nav ${collapsed ? 'collapsed' : ''}`} aria-label="Utility navigation">
          <button
            type="button"
            className="side-utility-btn"
            onClick={() => {
              onInstallApp();
              onCloseMobile();
            }}
            title={collapsed ? 'Install App (Offline Ready)' : 'Install AURA-CARE progressive web app'}
          >
            <Download size={17} strokeWidth={1.9} />
            {!collapsed && <span>Install App</span>}
            {!collapsed && <span className="side-utility-dot" title="Offline ready" />}
          </button>
          <button
            type="button"
            className={`side-utility-btn ${page === 'settings' ? 'active' : ''}`}
            onClick={() => {
              onOpenSettings();
              onCloseMobile();
            }}
            title={collapsed ? 'Settings' : 'Open Settings'}
            aria-current={page === 'settings' ? 'page' : undefined}
          >
            <Settings size={17} strokeWidth={1.9} />
            {!collapsed && <span>Settings</span>}
            {!collapsed && page === 'settings' && <span className="nav-active-dot" />}
          </button>
        </div>

        {!collapsed && (
          <div className="setup-card">
            <span className="setup-title">
              Your setup <span className="setup-indicator" />
            </span>
            <div>
              <span className="setup-icon">
                <LocationIcon size={16} />
              </span>
              <span>
                <strong>{environments[environment].label}</strong>
                <small>Environment</small>
              </span>
            </div>
            <div>
              <span className="setup-icon">
                <Wallet size={16} />
              </span>
              <span>
                <strong>{budgets[budget].short}</strong>
                <small>{budgetRange(budget, currency)} / month</small>
              </span>
            </div>
          </div>
        )}

        <button
          className={`saved-label vault-link ${collapsed ? 'vault-collapsed' : ''}`}
          onClick={() => {
            onVault();
            onCloseMobile();
          }}
          title="Local-first health vault"
        >
          <LockKeyhole size={14} />
          {!collapsed && <span>Local-first health vault</span>}
        </button>
      </div>
    </aside>
  );
}

function Topbar({
  page,
  today,
  onNavigate,
  onEdit,
  onNotifications,
  onOpenAuthGate,
  collapsed,
  onToggleSidebar,
}: {
  page: Page;
  today: string;
  onNavigate: (page: Page, target?: string) => void;
  onEdit: () => void;
  onNotifications: () => void;
  onOpenAuthGate: () => void;
  collapsed: boolean;
  onToggleSidebar: () => void;
}) {
  const {
    theme,
    toggleTheme,
    currency,
    toggleCurrency,
    profile,
    notificationConfig,
    authMode,
    authUser,
    displayName,
  } = useWorkspace();
  const metrics = profile && calculateProfile(profile);
  const ready = profile !== null && hasBiometrics(profile);
  const weight = ready && Math.round(profile.weightKg * (profile.weightUnit === 'lb' ? poundsPerKg : 1));
  const date = new Intl.DateTimeFormat('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(`${today}T12:00:00`));
  const activeLabel = pages.find(item => item.id === page)?.label ?? (page === 'settings' ? 'Settings' : 'Workspace');

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="topbar-left-cluster">
          {/* Sidebar Toggle Button next to breadcrumb */}
          <button
            type="button"
            className="icon-button sidebar-toggle-btn"
            onClick={onToggleSidebar}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>

          <div className="breadcrumbs">
            <span>My workspace</span>
            <ChevronRight size={15} />
            <strong>{activeLabel}</strong>
          </div>
        </div>

        <a
          href="#dashboard"
          className="mobile-brand"
          onClick={event => {
            event.preventDefault();
            onNavigate('dashboard');
          }}
        >
          <span className="brand-icon">
            <Leaf size={19} />
          </span>{' '}
          AURA-CARE<span>.</span>
        </a>

        <div className="header-actions">
          <span className="date-chip">
            <CalendarDays size={16} /> <time dateTime={today}>{date}</time>
          </span>
          <FamilyCircle onOpenHub={() => onNavigate('family')} />
          <WeatherShieldButton
            onOpen={() => {
              if (page === 'dashboard' && document.getElementById('weather-shield'))
                document.getElementById('weather-shield')?.scrollIntoView();
              else onNavigate('dashboard', 'weather');
            }}
          />
          <button
            className="icon-button notification-button"
            onClick={onNotifications}
            aria-label="Notification & Wellness Reminder Settings"
            title="Reminders & Notifications"
          >
            <Bell size={18} />
            {notificationConfig.enabled && <span className="notification-active-dot" />}
          </button>
          <button
            className="profile-summary-pill"
            onClick={onEdit}
            aria-label={ready ? 'Edit active bio-profile' : 'Complete active bio-profile'}
          >
            <Fingerprint size={17} />
            <span className="profile-pill-label">{ready ? 'Bio-profile' : 'Build profile'}</span>
            {profile && (
              <span className="profile-summary-details">
                {profile.age}y
                {weight && ` · ${weight} ${profile.weightUnit}`}
                {metrics?.targets && ` · ${metrics.targets.calories.toLocaleString()} kcal`} ·{' '}
                {profile.skin} · {environments[profile.environment].short} /{' '}
                {budgets[profile.budget].short}
              </span>
            )}
          </button>

          {/* User Account / Auth Status Badge */}
          {authMode === 'authenticated' && authUser ? (
            <button
              type="button"
              className="topbar-account-pill"
              onClick={() => onNavigate('settings')}
              title={`Logged in as ${authUser.email}. Click for Settings`}
            >
              <span className="topbar-account-avatar">{displayName.charAt(0).toUpperCase()}</span>
              <span className="topbar-account-name">{displayName}</span>
              <span className="topbar-account-dot" />
            </button>
          ) : (
            <button
              type="button"
              className="topbar-guest-pill"
              onClick={onOpenAuthGate}
              title="Local-first guest mode. Click to sign in or sync."
            >
              <User size={13} />
              <span>Guest</span>
            </button>
          )}

          <button
            className="currency-button"
            onClick={toggleCurrency}
            aria-label={`Currency ${currency}. Switch to ${currency === 'INR' ? 'USD' : 'INR'}`}
          >
            <strong>{currency === 'INR' ? '₹' : '$'}</strong> {currency}
          </button>
          <button
            className="icon-button theme-button"
            onClick={toggleTheme}
            aria-label={`Current theme: ${theme}. Click to switch theme`}
            title={`Theme: ${theme === 'dark' ? 'Obsidian Dark' : theme === 'light' ? 'Alabaster Light' : 'High-Contrast Elder'}`}
          >
            {theme === 'dark' ? <Sun size={18} /> : theme === 'light' ? <Eye size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>
      <Navigation mobile page={page} onNavigate={onNavigate} />
    </header>
  );
}

function LoadingModule() {
  return <div className="loading-module" role="status" aria-label="Loading workspace"><div /><div /><div /><div /></div>;
}

export function App() {
  const {
    theme,
    environment,
    budget,
    skin,
    diet,
    planIndex,
    profile,
    mealSwaps,
    days,
    easyDay,
    workoutRampStart,
    profileStarted,
    pinnedProducts,
    ownSkincare,
    skinSchedule,
    activeMemberId,
    comfortPreference,
    careMealFilters,
    notificationConfig,
    updateNotificationConfig,
    weatherSeason,
    authUser,
  } = useWorkspace();
  const [today, setToday] = useState(() => localDate());
  const [route, setRoute] = useState(readRoute);
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);
  const [dialog, setDialog] = useState<'profile' | 'outside' | 'check-in' | 'vault' | 'notifications' | null>(null);
  const [showAura, setShowAura] = useState(false);
  const [showPip, setShowPip] = useState(false);
  const [synthEnabled, setSynth] = useState(false);
  const [pwaModalOpen, setPwaModalOpen] = useState(false);

  // Desktop sidebar collapsible rail state persisted to localStorage
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    try { return localStorage.getItem('auracare_sidebar_collapsed') === 'true'; } catch { return false; }
  });

  // Mobile sidebar slide-over drawer state
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setMobileSidebarOpen(prev => !prev);
    } else {
      setSidebarCollapsed(prev => {
        const next = !prev;
        try { localStorage.setItem('auracare_sidebar_collapsed', String(next)); } catch { /* keep the in-memory preference */ }
        return next;
      });
    }
  };

  // Show AuthGate if user hasn't explicitly entered guest mode or logged in yet
  const [authGateOpen, setAuthGateOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    try { return !localStorage.getItem('auracare_auth_mode') && !authUser; } catch { return false; }
  });
  useEffect(() => {
    const state = useWorkspace.getState();
    const session = isSupabaseConfigured && getStoredSession();
    if (state.authUser && (!session || session.user.id !== state.authUser.id)) state.signOut();
  }, []);

  const previousSidebarFocus = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!mobileSidebarOpen) return;
    const nav = document.getElementById('workspace-navigation');
    if (!nav) return;
    previousSidebarFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    nav.querySelector<HTMLElement>('.sidebar-mobile-close-btn')?.focus();
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnDesktop = window.matchMedia('(min-width: 1024px)');
    const onResize = () => { if (closeOnDesktop.matches) setMobileSidebarOpen(false); };
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setMobileSidebarOpen(false); return; }
      if (event.key !== 'Tab') return;
      const items = Array.from(nav.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]')).filter(item => item.getClientRects().length);
      const first = items.at(0);
      const last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    closeOnDesktop.addEventListener('change', onResize);
    nav.addEventListener('keydown', keyboard);
    return () => {
      nav.removeEventListener('keydown', keyboard);
      closeOnDesktop.removeEventListener('change', onResize);
      document.body.style.overflow = oldOverflow;
      previousSidebarFocus.current?.focus();
    };
  }, [mobileSidebarOpen]);

  const reduceMotion = useReducedMotion();
  const searching = filters.query.trim() !== '' || filters.pillar !== 'all' || filters.tag !== '';
  const comfort = comfortFor(profile?.age, comfortPreference);

  // Unified PWA installation handler
  const pwa = usePWA();
  const { isInstallable, isInstalled, installApp } = pwa;

  const handleInstallAppTrigger = async () => {
    setPwaModalOpen(true);
  };

  async function toggleSynth() {
    const next = await setSynthEnabled(!synthEnabled);
    setSynth(next);
  }

  // Background ticker for automated reminders
  useEffect(() => {
    if (!notificationConfig?.enabled) return;

    const checkReminders = () => {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMins = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMins}`;
      const currentDateStr = localDate(now);

      // 1. Hydration Reminder
      if (notificationConfig.hydration) {
        const intervalMs = (notificationConfig.hydrationIntervalMinutes || 120) * 60 * 1000;
        const lastAlert = notificationConfig.lastHydrationAlert ?? 0;
        if (Date.now() - lastAlert >= intervalMs) {
          sendLocalNotification('💧 Hydration Pulse', {
            body: 'Time to drink a fresh glass of water (250ml) to maintain bio-cellular hydration and energy.',
            tag: 'hydration',
          });
          updateNotificationConfig({ lastHydrationAlert: Date.now() });
        }
      }

      // 2. AM Skincare & SPF
      if (notificationConfig.amSkincare && currentTimeStr === notificationConfig.amSkincareTime) {
        if (notificationConfig.lastAmDate !== currentDateStr) {
          sendLocalNotification('☀️ Morning Bio-Defense & SPF Alert', {
            body: 'Time for your morning skincare barrier and broad-spectrum sunscreen before UV exposure!',
            tag: 'am-skincare',
          });
          updateNotificationConfig({ lastAmDate: currentDateStr });
        }
      }

      // 3. PM Skincare & Barrier Repair
      if (notificationConfig.pmSkincare && currentTimeStr === notificationConfig.pmSkincareTime) {
        if (notificationConfig.lastPmDate !== currentDateStr) {
          sendLocalNotification('🌙 Night Active Recovery', {
            body: 'Time for evening double-cleansing and active barrier repair routine.',
            tag: 'pm-skincare',
          });
          updateNotificationConfig({ lastPmDate: currentDateStr });
        }
      }

      // 4. Workout / Movement Reminder
      if (notificationConfig.workout && currentTimeStr === (notificationConfig.workoutTime || '18:00')) {
        if (notificationConfig.lastWorkoutDate !== currentDateStr) {
          sendLocalNotification('🏃 Movement & Workout Reminder', {
            body: 'Time for your scheduled workout, joint mobility, or evening walk!',
            tag: 'workout-reminder',
          });
          updateNotificationConfig({ lastWorkoutDate: currentDateStr });
        }
      }

      // 5. Family & Elder Care Check
      if (notificationConfig.elderCare && currentTimeStr === notificationConfig.elderCareTime) {
        if (notificationConfig.lastElderDate !== currentDateStr) {
          sendLocalNotification('👵 Family & Elder Care Check-In', {
            body: 'Time for elder prescription check, blood pressure review, or morning mobility walk.',
            tag: 'elder-care',
          });
          updateNotificationConfig({ lastElderDate: currentDateStr });
        }
      }
    };

    checkReminders();
    const interval = window.setInterval(checkReminders, 45000);
    return () => window.clearInterval(interval);
  }, [notificationConfig]);

  useEffect(() => {
    if (profile && hasBiometrics(profile) && !profileStarted) useWorkspace.setState({ profileStarted: today });
  }, [profile, profileStarted, today]);
  useEffect(() => setDialog(null), [activeMemberId]);
  useEffect(() => {
    if (comfort) document.documentElement.dataset.comfort = 'true';
    else delete document.documentElement.dataset.comfort;
  }, [comfort]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#FAFAFA' : '#0B0F17');
  }, [theme]);

  // Dynamic SEO Page Title
  useEffect(() => {
    const titles: Record<Page, string> = {
      dashboard: 'AURA-CARE — Holistic Overview & Health Dashboard',
      blueprint: 'AURA-CARE — My Personal Bio-Profile Blueprint',
      skin: 'AURA-CARE — Clinical Skincare Regimen & Formulations',
      fitness: 'AURA-CARE — Biomechanical Movement & Posture Player',
      diet: 'AURA-CARE — Regional Nutrition & Macro Kitchen',
      gear: 'AURA-CARE — Curated Health Gear & Essentials',
      family: 'AURA-CARE — Family Circle & Elder Caregiver Hub',
      settings: 'AURA-CARE — Settings, Preferences & Privacy Vault',
      ergonomics: 'AURA-CARE — Desk, Posture & Eye Care Hub',
    };
    document.title = titles[route.page] || 'AURA-CARE — Holistic Health & Biohacking';
  }, [route.page]);

  useEffect(() => {
    const change = () => {
      setRoute(readRoute());
      setFilters(defaultFilters);
      window.scrollTo(0, 0);
    };
    const refreshDate = () => setToday(localDate());
    const interval = window.setInterval(refreshDate, 15000);
    window.addEventListener('focus', refreshDate);
    window.addEventListener('hashchange', change);
    return () => {
      window.removeEventListener('hashchange', change);
      window.removeEventListener('focus', refreshDate);
      window.clearInterval(interval);
    };
  }, []);

  function navigate(page: Page, target?: string) {
    const hash = `#${page}${target ? `/${target}` : ''}`;
    if (window.location.hash !== hash) window.history.pushState(null, '', hash);
    setRoute({ page, target });
    setFilters(defaultFilters);
    setMobileSidebarOpen(false);
    window.scrollTo(0, 0);
  }

  const easy = easyDay === today;
  const journal = days[today];
  const savedActives = scheduledFormulas(pinnedProducts, ownSkincare, skinSchedule).length > 0;
  const skinItems = skinDiscovery(skin, environment, budget, profile, today, easy, savedActives, weatherSeason);
  const fitnessItems = fitnessDiscovery(environment, budget, movementOptions(profile, environment, budget, workoutRampStart, today, easy, weatherSeason));
  const meals = useMemo(() => dietDiscovery(workspaceMeals(environment, budget, diet, planIndex, profile, mealSwaps, journal, careMealFilters)), [environment, budget, diet, planIndex, profile, mealSwaps, journal, careMealFilters]);
  const productItems = productDiscovery(profile ?? createProfile({ environment, budget, diet, skin }));
  const recommendations = [skinItems[0], fitnessItems[0], meals[1] ?? meals[0]].filter((item): item is DiscoveryItem => !!item);
  const handleResult = (item: DiscoveryItem) => navigate(item.page ?? item.pillar, item.target);

  return (
    <div className="app-shell">
      <a
        className="skip-link"
        href="#main-content"
        onClick={event => {
          event.preventDefault();
          document.getElementById('main-content')?.focus({ preventScroll: true });
        }}
      >
        Skip to content
      </a>

      {/* Mobile Slide-Over Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="mobile-sidebar-backdrop"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Left Sidebar with Workspace pages + Install App & Settings utility tabs (Desktop Rail + Mobile Drawer) */}
      <Sidebar
        page={route.page}
        onNavigate={navigate}
        onVault={() => setDialog('vault')}
        onInstallApp={handleInstallAppTrigger}
        onOpenSettings={() => navigate('settings')}
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebar}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      <div className={`workspace ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`} inert={mobileSidebarOpen || undefined}>
        <Topbar
          page={route.page}
          today={today}
          onNavigate={navigate}
          onEdit={() => setDialog('profile')}
          onNotifications={() => setDialog('notifications')}
          onOpenAuthGate={() => setAuthGateOpen(true)}
          collapsed={sidebarCollapsed}
          onToggleSidebar={toggleSidebar}
        />
        <StickyGlobalContextBar onNavigate={navigate} onProfile={() => setDialog('profile')} />

        {/* Main Content Grid with pb-24 bottom padding so AURA-BOT never overlaps Water (+250ml) card */}
        <main className="main-content audit-main" id="main-content" tabIndex={-1}>
          <PWAInstallBanner state={pwa} onOpenGuide={() => setPwaModalOpen(true)} />
          <div className="search-sticky">
            <SearchFilterBar filters={filters} onChange={setFilters} />
          </div>

          {searching ? (
            <SearchResults
              items={filterDiscovery([...skinItems, ...fitnessItems, ...meals, ...productItems], filters)}
              onOpen={handleResult}
              onClear={() => setFilters(defaultFilters)}
            />
          ) : (
            <motion.div
              className="page-body"
              key={`${activeMemberId}-${route.page}-${route.target ?? ''}`}
              initial={reduceMotion ? false : { opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22 }}
            >
              <Suspense fallback={<LoadingModule />}>
                {route.page === 'dashboard' && (
                  <Dashboard
                    today={today}
                    target={route.target}
                    recommendations={recommendations}
                    onNavigate={navigate}
                    onProfile={() => setDialog('profile')}
                    onMeal={() => setDialog('outside')}
                    onCheckIn={() => setDialog('check-in')}
                  />
                )}
                {route.page === 'skin' && <SkincareModule today={today} target={route.target} />}
                {route.page === 'fitness' && <FitnessModule today={today} target={route.target} />}
                {route.page === 'diet' && <DietModule today={today} target={route.target} onMeal={() => setDialog('outside')} />}
                {route.page === 'ergonomics' && <ErgonomicsModule target={route.target} onNavigate={navigate} />}
                {route.page === 'blueprint' && (
                  <BlueprintModule
                    today={today}
                    target={route.target}
                    onEdit={() => setDialog('profile')}
                    onNavigate={navigate}
                    onMeal={() => setDialog('outside')}
                    onCheckIn={() => setDialog('check-in')}
                  />
                )}
                {route.page === 'gear' && <GearModule target={route.target} onEdit={() => setDialog('profile')} />}
                {route.page === 'family' && (
                  <FamilyCareHub
                    today={today}
                    onNavigate={navigate}
                    onEditProfile={() => setDialog('profile')}
                  />
                )}
                {route.page === 'settings' && (
                  <SettingsView
                    onOpenAuthGate={() => setAuthGateOpen(true)}
                    onOpenVault={() => setDialog('vault')}
                    onOpenPWAInstall={() => setPwaModalOpen(true)}
                    onOpenWeather={() => navigate('dashboard', 'weather')}
                  />
                )}
              </Suspense>
            </motion.div>
          )}

          {route.page !== 'dashboard' && !searching && (
            <footer className="app-footer">
              <span>AURA-CARE</span>
              <button className="button text-button" onClick={() => navigate('dashboard')}>
                Back to overview <ArrowUpRight size={15} />
              </button>
            </footer>
          )}
          <footer className="trust-footer">
            <p>
              AURA-CARE offers general wellness planning. Ask a healthcare professional about symptoms or treatment changes.
            </p>
            <button className="button text-button" onClick={() => setDialog('vault')}>
              <LockKeyhole size={15} /> Local-first health vault
            </button>
          </footer>
        </main>
      </div>

      {/* Anchored Expressive Interactive Avatar Bot */}
      {!mobileSidebarOpen && (showPip ? <Suspense fallback={null}><PipAssistant onNavigate={navigate} synthEnabled={synthEnabled}
        onBlip={playSynthBlip} initialOpen onOpenCoach={() => setShowPip(false)} /></Suspense> : <InteractiveAvatarBot
        key={activeMemberId}
        currentPage={route.page}
        onNavigate={navigate}
        synthEnabled={synthEnabled}
        onToggleSynth={toggleSynth}
        onOpenPip={() => setShowPip(true)}
        onOpenCoach={() => setShowAura(true)}
      />)}

      {/* Modals & Dialogs */}
      <Suspense fallback={null}>
        {dialog === 'profile' && (
          <ProfileWizard
            onClose={() => setDialog(null)}
            onSave={() => {
              setDialog(null);
              if (!profile && route.page !== 'gear') navigate('blueprint');
            }}
          />
        )}
        {dialog === 'outside' && <OutsideMealModal onClose={() => setDialog(null)} />}
        {dialog === 'check-in' && profile && hasBiometrics(profile) && (
          <CheckInModal profile={profile} today={today} onClose={() => setDialog(null)} />
        )}
        {dialog === 'vault' && <HealthVault onClose={() => setDialog(null)} />}
        {dialog === 'notifications' && <NotificationModal onClose={() => setDialog(null)} />}
        {route.syncCode && (
          <FamilySyncModal
            initialSyncCode={route.syncCode}
            onClose={() => {
              window.location.hash = '#family';
              setRoute(readRoute());
            }}
          />
        )}
        {showAura && <AuraCoachDrawer open={showAura} onClose={() => setShowAura(false)} />}
      </Suspense>

      {/* PWA Install Guide Modal */}
      {pwaModalOpen && (
        <PWAInstallModal
          onClose={() => setPwaModalOpen(false)}
          onInstallNative={isInstallable ? installApp : undefined}
          isInstallable={isInstallable}
          isInstalled={isInstalled}
          offlineReady={pwa.offlineReady}
        />
      )}

      {/* Welcome & Authentication Gate Modal */}
      {authGateOpen && (
        <AuthGate
          onClose={() => setAuthGateOpen(false)}
          onContinueGuest={() => {
            setAuthGateOpen(false);
          }}
          onLoginSuccess={() => {
            setAuthGateOpen(false);
            try { localStorage.setItem('auracare_auth_mode', 'authenticated'); } catch { /* session remains usable */ }
          }}
        />
      )}
    </div>
  );
}
