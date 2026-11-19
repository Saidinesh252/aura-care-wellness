import { Building2, Eye, House, MapPin, Sparkles, User, Utensils, Wallet } from 'lucide-react';
import { budgets, environments, type Budget, type Environment, type Page } from '../context';
import { climateProtocols } from './WeatherProtectionShield';
import { comfortFor } from '../familyTypes';
import { useWorkspace, type WeatherSeason } from '../store';
import './stickyContextBar.css';

const envKeys: Environment[] = ['home', 'pg', 'office', 'gym'];
const budgetKeys: Budget[] = ['zero', 'student', 'mid', 'luxury'];
const weatherKeys: WeatherSeason[] = ['winter', 'summer', 'monsoon', 'pollution'];

export function StickyGlobalContextBar({ onNavigate, onProfile }: { onNavigate: (page: Page, target?: string) => void; onProfile: () => void }) {
  const {
    environment,
    setEnvironment,
    budget,
    setBudget,
    weatherSeason,
    setWeatherSeason,
    weatherMode,
    selectedCity,
    liveClimate,
    profile,
    familyMembers,
    activeMemberId,
    switchFamilyMember,
    comfortPreference,
    setComfortPreference,
  } = useWorkspace();

  const activeMember = familyMembers.find((m) => m.id === activeMemberId);
  const currentAge = profile?.age ?? activeMember?.age;
  const isComfortActive = comfortFor(currentAge, comfortPreference);

  // Cycling Handlers
  const cycleEnvironment = () => {
    const nextIdx = (envKeys.indexOf(environment) + 1) % envKeys.length;
    setEnvironment(envKeys[nextIdx]);
  };

  const cycleBudget = () => {
    const nextIdx = (budgetKeys.indexOf(budget) + 1) % budgetKeys.length;
    setBudget(budgetKeys[nextIdx]);
  };

  const cycleWeather = () => {
    const nextIdx = (weatherKeys.indexOf(weatherSeason ?? 'winter') + 1) % weatherKeys.length;
    setWeatherSeason(weatherKeys[nextIdx]);
  };

  const cycleProfile = () => {
    if (familyMembers.length === 0) {
      onProfile();
      return;
    }
    const allIds = ['self', ...familyMembers.map((m) => m.id)];
    const currentIdx = allIds.indexOf(activeMemberId);
    const nextId = allIds[(currentIdx + 1) % allIds.length];
    switchFamilyMember(nextId);
  };

  const toggleComfort = () => {
    setComfortPreference(!isComfortActive);
  };

  const weatherProto = climateProtocols[weatherSeason ?? 'winter'];
  const WeatherIcon = weatherProto.icon;

  const EnvIcon = environment === 'home' ? House : environment === 'pg' ? Building2 : MapPin;

  return (
    <div className="sticky-context-bar" role="toolbar" aria-label="AURA-CARE Global Context Control Bar">
      <div className="context-pills-row">
        {/* 1. Active Profile / Life Stage */}
        <button
          type="button"
          className="context-bar-pill pill-profile"
          onClick={cycleProfile}
          title="Click to switch active family circle profile or open wizard"
          aria-label={`Active Profile: ${activeMember?.name ?? 'My Profile'}, Age ${currentAge ?? 28}. Click to switch.`}
        >
          <User size={13} />
          <span>
            <strong>{activeMember ? activeMember.name : 'Me'}</strong>
            {currentAge ? ` (${currentAge}y${currentAge >= 60 ? ' · Senior' : currentAge >= 40 ? ' · 40+' : ''})` : ''}
          </span>
        </button>

        {/* 2. Living Environment */}
        <button
          type="button"
          className="context-bar-pill pill-environment"
          onClick={cycleEnvironment}
          title="Click to cycle living environment: Home, PG Hostel, Office, Gym"
          aria-label={`Living Setup: ${environments[environment].label}. Click to cycle.`}
        >
          <EnvIcon size={13} />
          <span>{environments[environment].short}</span>
        </button>

        {/* 3. Budget Tier */}
        <button
          type="button"
          className="context-bar-pill pill-budget"
          onClick={cycleBudget}
          title="Click to cycle budget tier: Zero, Student, Mid-Range, Luxury"
          aria-label={`Budget Tier: ${budgets[budget].short}. Click to cycle.`}
        >
          <Wallet size={13} />
          <span>{budgets[budget].short}</span>
        </button>

        {/* 4. Weather & Season Shield */}
        <button
          type="button"
          className="context-bar-pill pill-weather"
          onClick={cycleWeather}
          title={`Climate Shield: ${weatherProto.name} (${weatherMode === 'auto' ? `Auto: ${selectedCity}` : 'Manual'}). Click to cycle.`}
          aria-label={`Climate Shield: ${weatherProto.name}. Click to cycle.`}
        >
          <WeatherIcon size={13} />
          <span>
            {weatherProto.name.split('/')[0].trim()}
            {liveClimate ? ` (${Math.round(liveClimate.temperature)}°C)` : ''}
          </span>
          {weatherMode === 'auto' && (
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
          )}
        </button>

        {/* 5. Regional Cuisine Quick Navigation */}
        <button
          type="button"
          className="context-bar-pill"
          onClick={() => onNavigate('diet')}
          title="Open Regional Recipe Library & Meal Planner"
          aria-label="Open Regional Recipes"
        >
          <Utensils size={13} />
          <span>Regional Kitchen</span>
        </button>

        {/* 6. Middle-Age & Senior Comfort Readability Mode Toggle */}
        {(currentAge !== undefined && currentAge >= 40) && (
          <button
            type="button"
            className={`context-bar-pill pill-comfort`}
            onClick={toggleComfort}
            title="Toggle Elder Comfort Readability (large fonts, high contrast)"
            aria-pressed={isComfortActive}
          >
            <Eye size={13} />
            <span>{isComfortActive ? '👓 Comfort: ON' : '👓 Comfort: OFF'}</span>
          </button>
        )}
      </div>

      <div className="context-bar-right">
        <button
          type="button"
          className="context-bar-pill"
          onClick={() => onNavigate('blueprint')}
          style={{ background: 'transparent', borderStyle: 'dashed' }}
          title="Open My Personal Plan Blueprint"
        >
          <Sparkles size={12} />
          <span>Blueprint</span>
        </button>
      </div>
    </div>
  );
}
