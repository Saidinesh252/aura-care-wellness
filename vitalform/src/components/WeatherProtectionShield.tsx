import {
  AlertTriangle,
  CheckSquare,
  CloudFog,
  CloudRain,
  Compass,
  Dumbbell,
  Globe2,
  Leaf,
  LocateFixed,
  Radio,
  RefreshCw,
  Sliders,
  Snowflake,
  Sparkles,
  Sun,
  Thermometer,
  Wind,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useWorkspace, type WeatherSeason } from '../store';
import { climateMovementNotes, climateSources } from '../climate';
import {
  fetchLiveClimate,
  getDeviceCoordinates,
  PRESET_CITIES,
} from '../services/weatherService';
import './weatherShield.css';

export interface ClimateProtocol {
  name: string;
  seasonKey: WeatherSeason;
  icon: typeof Snowflake;
  themeClass: string;
  metric: string;
  skincare: string;
  movement: string;
  diet: string;
  checklist: string[];
}

export const climateProtocols: Record<WeatherSeason, ClimateProtocol> = {
  winter: {
    name: 'Cold / Dry Winter',
    seasonKey: 'winter',
    icon: Snowflake,
    themeClass: 'winter-theme',
    metric: 'Cold or dry conditions',
    skincare: 'Use a richer fragrance-free barrier cream where skin feels dry. Protect lips and hands, keep showers lukewarm, and clean any humidifier as directed.',
    movement: climateMovementNotes.winter,
    diet: 'Try warm dal, soup or ragi. Add sesame or nuts if tolerated, and check the label for vitamin D in fortified milk or plant drinks.',
    checklist: [
      'Layered thermal/cotton clothing protecting chest & neck',
      'Extended 8-minute joint warm-up before movement',
      'Moisturizer after a short lukewarm wash',
      'A warm drink or meal that fits your dietary needs',
    ],
  },
  summer: {
    name: 'Hot / High-UV Summer',
    seasonKey: 'summer',
    icon: Sun,
    themeClass: 'summer-theme',
    metric: 'High heat or strong UV',
    skincare: 'Choose a lightweight moisturizer and broad-spectrum SPF 50+ when available. Reapply at least every two hours outdoors and after swimming or heavy sweating.',
    movement: climateMovementNotes.summer,
    diet: 'Keep water available. Try cucumber, watermelon, plain chaas or sattu if they fit your diet. Electrolytes can be relevant after prolonged heavy sweating. Follow prescribed fluid and salt limits.',
    checklist: [
      'Sun protection applied and reapplied outdoors',
      'Movement planned for a cooler time or a cool indoor space',
      'Water ready according to your care plan',
    ],
  },
  monsoon: {
    name: 'Humid Monsoon',
    seasonKey: 'monsoon',
    icon: CloudRain,
    themeClass: 'monsoon-theme',
    metric: 'Humidity and rain',
    skincare: 'Use a lightweight, fragrance-free moisturizer when comfortable. Change out of damp clothing, and gently wash and dry the scalp after getting soaked.',
    movement: climateMovementNotes.monsoon,
    diet: 'Choose freshly cooked meals when water or refrigeration is uncertain. Wash whole produce with safe water and skip vendor-cut fruit with uncertain handling.',
    checklist: [
      'Lightweight moisturizer that suits your skin',
      'Clean, dry scalp and clothing',
      'Safe water and freshly cooked food when needed',
      'Dry floor and secure mat for indoor movement',
    ],
  },
  pollution: {
    name: 'High Pollution / Urban Smog',
    seasonKey: 'pollution',
    icon: CloudFog,
    themeClass: 'pollution-theme',
    metric: 'Elevated outdoor particle levels',
    skincare: 'Cleanse gently in the evening. Use an extra makeup or water-resistant sunscreen removal step only if needed and tolerated.',
    movement: climateMovementNotes.pollution,
    diet: 'Choose familiar meals with vegetables, pulses and fruit. Reduce smoke exposure and avoid leaning over hot water for steam inhalation.',
    checklist: [
      'Gentle evening cleanse',
      'Local air quality checked before vigorous activity',
      'Outdoor cardio moved indoors or postponed as needed',
    ],
  },
};

export function WeatherProtectionShield() {
  const {
    weatherSeason,
    activeMemberId,
    setWeatherSeason,
    weatherMode,
    setWeatherMode,
    selectedCity,
    setSelectedCity,
    liveClimate,
    setLiveClimate,
  } = useWorkspace();

  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const protocol = climateProtocols[weatherSeason ?? 'winter'];
  const Icon = protocol.icon;

  // Fetch weather for city or coordinates
  const syncWeather = async (cityName: string, coords?: { latitude: number; longitude: number }, isGeo = false) => {
    setIsLoading(true);
    setLoadError(null);
    try {
      let lat = coords?.latitude;
      let lon = coords?.longitude;

      if (lat === undefined || lon === undefined) {
        const found = PRESET_CITIES.find((c) => c.name === cityName) ?? PRESET_CITIES[0];
        lat = found.latitude;
        lon = found.longitude;
      }

      const report = await fetchLiveClimate(lat, lon, cityName, isGeo);
      if (useWorkspace.getState().activeMemberId === activeMemberId && useWorkspace.getState().selectedCity === cityName) setLiveClimate(report);
    } catch {
      if (useWorkspace.getState().activeMemberId === activeMemberId) setLoadError('Weather data is unavailable. Your selected mode still works.');
    } finally {
      setIsLoading(false);
    }
  };

  // Sync on initial mount if not fetched yet
  useEffect(() => {
    if (weatherMode === 'auto' && selectedCity !== 'My Location' && (!liveClimate || !Number.isFinite(Date.parse(liveClimate.fetchedAt)) || Date.now() - Date.parse(liveClimate.fetchedAt) > 60 * 60 * 1000)) {
      syncWeather(selectedCity);
    }
  }, [weatherMode]);

  // Handle city select
  const handleCityChange = (cityName: string) => {
    setSelectedCity(cityName);
    if (cityName !== 'My Location') syncWeather(cityName);
  };

  // Handle Geolocation request
  const handleUseDeviceLocation = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const coords = await getDeviceCoordinates();
      if (useWorkspace.getState().activeMemberId !== activeMemberId) return;
      setSelectedCity('My Location');
      await syncWeather('My Location', coords, true);
    } catch (err: any) {
      setLoadError(err?.message || 'Could not access browser location.');
      setIsLoading(false);
    }
  };

  const toggleCheck = (item: string) => {
    setCheckedItems((prev) => ({ ...prev, [item]: !prev[item] }));
  };

  return (
    <section id="weather-shield" className={`weather-shield-widget ${protocol.themeClass}`} aria-label="Adaptive Weather & Season Shield">
      {/* Top Banner */}
      <div className="weather-shield-top">
        <div className="weather-shield-title">
          <Icon size={28} />
          <div>
            <h3>
              Weather &amp; Season Shield: <strong>{protocol.name}</strong>
            </h3>
            <p>{liveClimate ? liveClimate.metricSummary : protocol.metric}</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className={`weather-pulse-badge ${weatherMode === 'auto' ? 'live' : 'manual'}`}>
            <span className="pulse-dot" /> {weatherMode === 'auto' ? liveClimate ? 'Weather-driven' : 'Waiting for weather' : 'Manual mode'}
          </span>
        </div>
      </div>

      {/* Live Automation & City Selector Bar */}
      <div className="weather-automation-bar">
        <div className="weather-city-selector-group">
          <label htmlFor="city-select" className="weather-bar-label">
            <Globe2 size={14} /> City:
          </label>
          <select
            id="city-select"
            value={selectedCity}
            onChange={(e) => handleCityChange(e.target.value)}
            className="weather-city-select"
            aria-label="Select City for Live Open-Meteo Weather"
          >
            <optgroup label="Indian Metro & Regional Cities">
              {PRESET_CITIES.filter((c) => c.region === 'India').map((city) => (
                <option key={city.id} value={city.name}>
                  {city.name} (IN)
                </option>
              ))}
            </optgroup>
            <optgroup label="Global Hubs">
              {PRESET_CITIES.filter((c) => c.region === 'Global').map((city) => (
                <option key={city.id} value={city.name}>
                  {city.name} ({city.country})
                </option>
              ))}
            </optgroup>
            {selectedCity === 'My Location' && <option value="My Location">📍 Device Location (GPS)</option>}
          </select>

          <button
            type="button"
            className="weather-gps-btn"
            onClick={handleUseDeviceLocation}
            title="Detect live coordinates via browser GPS"
            disabled={isLoading}
          >
            <LocateFixed size={14} /> GPS
          </button>

          <button
            type="button"
            className="weather-sync-btn"
            onClick={() => selectedCity === 'My Location' ? handleUseDeviceLocation() : syncWeather(selectedCity)}
            disabled={isLoading}
            title="Refresh live telemetry from Open-Meteo"
          >
            <RefreshCw size={13} className={isLoading ? 'spinning' : ''} /> {isLoading ? 'Syncing...' : 'Sync Live'}
          </button>
        </div>

        {/* Auto vs Manual Toggle */}
        <div className="weather-mode-toggle-group">
          <button
            type="button"
            className={`weather-mode-pill ${weatherMode === 'auto' ? 'active' : ''}`}
            onClick={() => setWeatherMode('auto')}
            title="Automatically switch season shield using live Open-Meteo weather"
          >
            <Radio size={13} /> Auto-Sync Weather
          </button>
          <button
            type="button"
            className={`weather-mode-pill ${weatherMode === 'manual' ? 'active' : ''}`}
            onClick={() => setWeatherMode('manual')}
            title="Manually choose your preferred season shield"
          >
            <Sliders size={13} /> Manual Override
          </button>
        </div>
      </div>

      {loadError && (
        <div className="weather-alert-banner warning">
          <AlertTriangle size={15} /> <span>{loadError}</span>
        </div>
      )}

      {/* Live Telemetry Data Cards */}
      {liveClimate && (
        <div className="live-telemetry-grid">
          <div className="telemetry-pill">
            <Thermometer size={16} color="#ef4444" />
            <div>
              <span className="telemetry-label">Temperature</span>
              <strong className="telemetry-value">
                {liveClimate.temperature}°C <small>(Feels {liveClimate.apparentTemperature}°C)</small>
              </strong>
            </div>
          </div>

          <div className="telemetry-pill">
            <CloudRain size={16} color="#0284c7" />
            <div>
              <span className="telemetry-label">Humidity</span>
              <strong className="telemetry-value">{liveClimate.humidity}% RH</strong>
            </div>
          </div>

          <div className="telemetry-pill">
            <Sun size={16} color="#f59e0b" />
            <div>
              <span className="telemetry-label">UV Index</span>
              <strong className="telemetry-value">
                {liveClimate.uvIndex.toFixed(1)}{' '}
                <small>({liveClimate.uvIndex >= 6 ? 'High/Extreme' : liveClimate.uvIndex >= 3 ? 'Moderate' : 'Low'})</small>
              </strong>
            </div>
          </div>

          <div className="telemetry-pill">
            <CloudFog size={16} color="#64748b" />
            <div>
              <span className="telemetry-label">Air Quality (AQI)</span>
              <strong className="telemetry-value">
                {liveClimate.usAqi !== null ? `AQI ${liveClimate.usAqi}` : 'Unavailable'}{' '}
                {liveClimate.pm25 !== null && <small>(PM2.5: {liveClimate.pm25})</small>}
              </strong>
            </div>
          </div>

          <div className="telemetry-pill">
            <Wind size={16} color="#0d9488" />
            <div>
              <span className="telemetry-label">Wind Velocity</span>
              <strong className="telemetry-value">{liveClimate.windSpeed} km/h</strong>
            </div>
          </div>
        </div>
      )}

      {/* Climate Automation Rationale Explanation */}
      {liveClimate && (
        <div className="climate-rationale-box">
          <span className="climate-rationale-header">
            <Compass size={14} /> Weather conditions for {liveClimate.city}
          </span>
          <ul>
            {liveClimate.rationale.map((reason, idx) => (
              <li key={idx}>{reason}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Season Selector Tabs (Allows manual override or visual selection) */}
      <div className="weather-season-selector-wrapper">
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>
          {weatherMode === 'auto' ? 'Current Active Shield (Auto-Mapped):' : 'Select Target Season Shield:'}
        </span>
        <div className="weather-season-selector" role="radiogroup" aria-label="Select Local Season">
          {(['winter', 'summer', 'monsoon', 'pollution'] as const).map((key) => {
            const item = climateProtocols[key];
            const TabIcon = item.icon;
            const isActive = weatherSeason === key;

            return (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={isActive}
                className={`season-tab-btn ${isActive ? 'active' : ''}`}
                onClick={() => setWeatherSeason(key)}
              >
                <TabIcon size={14} /> {item.name}
              </button>
            );
          })}
        </div>
      </div>
      <p className="fine-print"><a href={climateSources[weatherSeason === 'winter' ? 'winterSkin' : weatherSeason].href} target="_blank" rel="noreferrer">{climateSources[weatherSeason === 'winter' ? 'winterSkin' : weatherSeason].name}</a>{weatherSeason === 'pollution' && <> · <a href={climateSources.steam.href} target="_blank" rel="noreferrer">{climateSources.steam.name}</a></>} · <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Weather data from Open-Meteo</a></p>

      {/* 3 Pillars Adaptation Grid */}
      <div className="weather-pillars-grid">
        <div className="weather-pillar-card">
          <span className="weather-pillar-header">
            <Sparkles size={16} /> Skincare Adaptation
          </span>
          <p>{protocol.skincare}</p>
        </div>

        <div className="weather-pillar-card">
          <span className="weather-pillar-header">
            <Dumbbell size={16} /> Movement &amp; Warm-up
          </span>
          <p>{protocol.movement}</p>
        </div>

        <div className="weather-pillar-card">
          <span className="weather-pillar-header">
            <Leaf size={16} /> Nutrition &amp; Hydration
          </span>
          <p>{protocol.diet}</p>
        </div>
      </div>

      {/* Interactive Protection Checklist */}
      <div className="weather-checklist">
        <strong>
          <CheckSquare size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
          {protocol.name} Action Checklist:
        </strong>
        {protocol.checklist.map((item) => (
          <label key={item}>
            <input
              type="checkbox"
              checked={Boolean(checkedItems[item])}
              onChange={() => toggleCheck(item)}
            />
            <span style={{ textDecoration: checkedItems[item] ? 'line-through' : 'none', opacity: checkedItems[item] ? 0.7 : 1 }}>
              {item}
            </span>
          </label>
        ))}
      </div>
    </section>
  );
}

// Subcomponents for inline inclusion in Skincare, Fitness, Diet modules
export function WeatherSkincareAlert() {
  const { weatherSeason } = useWorkspace();
  const protocol = climateProtocols[weatherSeason ?? 'winter'];
  const Icon = protocol.icon;

  return (
    <div className={`weather-module-banner ${protocol.seasonKey}`}>
      <Icon size={20} style={{ flexShrink: 0, marginTop: 2 }} />
      <div>
        <strong>Climate-Smart Skincare Shield ({protocol.name}):</strong> {protocol.skincare}
      </div>
    </div>
  );
}

export function WeatherFitnessAlert() {
  const { weatherSeason } = useWorkspace();
  const protocol = climateProtocols[weatherSeason ?? 'winter'];
  const Icon = protocol.icon;

  return (
    <div className={`weather-module-banner ${protocol.seasonKey}`}>
      <Icon size={20} style={{ flexShrink: 0, marginTop: 2 }} />
      <div>
        <strong>Climate-Smart Movement Advisory ({protocol.name}):</strong> {protocol.movement}
      </div>
    </div>
  );
}

export function WeatherDietAlert() {
  const { weatherSeason } = useWorkspace();
  const protocol = climateProtocols[weatherSeason ?? 'winter'];
  const Icon = protocol.icon;

  return (
    <div className={`weather-module-banner ${protocol.seasonKey}`}>
      <Icon size={20} style={{ flexShrink: 0, marginTop: 2 }} />
      <div>
        <strong>Climate-Smart Nutrition &amp; Hydration ({protocol.name}):</strong> {protocol.diet}
      </div>
    </div>
  );
}

export function WeatherShieldButton({ onOpen }: { onOpen?: () => void }) {
  const { weatherSeason, setWeatherSeason, weatherMode, selectedCity } = useWorkspace();
  const protocol = climateProtocols[weatherSeason ?? 'winter'];
  const Icon = protocol.icon;

  const cycleSeason = () => {
    const list: WeatherSeason[] = ['winter', 'summer', 'monsoon', 'pollution'];
    const nextIdx = (list.indexOf(weatherSeason ?? 'winter') + 1) % list.length;
    setWeatherSeason(list[nextIdx]);
  };

  return (
    <button
      className="currency-button weather-header-control"
      style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
      onClick={onOpen ?? cycleSeason}
      title={`Climate: ${protocol.name} (${weatherMode === 'auto' ? `Auto: ${selectedCity}` : 'Manual'}). Click to inspect.`}
      aria-label={`Current Climate: ${protocol.name}. Click to change`}
    >
      <Icon size={14} /> <strong>{protocol.name.split(' ')[0]}</strong>
      {weatherMode === 'auto' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />}
    </button>
  );
}
