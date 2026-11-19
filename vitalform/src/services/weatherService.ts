import type { WeatherSeason } from '../climate';

export interface SupportedCity {
  id: string;
  name: string;
  region: 'India' | 'Global';
  latitude: number;
  longitude: number;
  country: string;
}

export const PRESET_CITIES: SupportedCity[] = [
  // India
  { id: 'hyderabad', name: 'Hyderabad', region: 'India', latitude: 17.3850, longitude: 78.4867, country: 'IN' },
  { id: 'bengaluru', name: 'Bengaluru', region: 'India', latitude: 12.9716, longitude: 77.5946, country: 'IN' },
  { id: 'delhi', name: 'Delhi / NCR', region: 'India', latitude: 28.6139, longitude: 77.2090, country: 'IN' },
  { id: 'mumbai', name: 'Mumbai', region: 'India', latitude: 19.0760, longitude: 72.8777, country: 'IN' },
  { id: 'chennai', name: 'Chennai', region: 'India', latitude: 13.0827, longitude: 80.2707, country: 'IN' },
  { id: 'kolkata', name: 'Kolkata', region: 'India', latitude: 22.5726, longitude: 88.3639, country: 'IN' },
  { id: 'pune', name: 'Pune', region: 'India', latitude: 18.5204, longitude: 73.8567, country: 'IN' },
  { id: 'ahmedabad', name: 'Ahmedabad', region: 'India', latitude: 23.0225, longitude: 72.5714, country: 'IN' },
  { id: 'jaipur', name: 'Jaipur', region: 'India', latitude: 26.9124, longitude: 75.7873, country: 'IN' },
  { id: 'chandigarh', name: 'Chandigarh', region: 'India', latitude: 30.7333, longitude: 76.7794, country: 'IN' },
  // Global
  { id: 'london', name: 'London', region: 'Global', latitude: 51.5074, longitude: -0.1278, country: 'UK' },
  { id: 'newyork', name: 'New York', region: 'Global', latitude: 40.7128, longitude: -74.0060, country: 'US' },
  { id: 'sanfrancisco', name: 'San Francisco', region: 'Global', latitude: 37.7749, longitude: -122.4194, country: 'US' },
  { id: 'dubai', name: 'Dubai', region: 'Global', latitude: 25.2048, longitude: 55.2708, country: 'AE' },
  { id: 'singapore', name: 'Singapore', region: 'Global', latitude: 1.3521, longitude: 103.8198, country: 'SG' },
  { id: 'tokyo', name: 'Tokyo', region: 'Global', latitude: 35.6762, longitude: 139.6503, country: 'JP' },
  { id: 'sydney', name: 'Sydney', region: 'Global', latitude: -33.8688, longitude: 151.2093, country: 'AU' },
  { id: 'toronto', name: 'Toronto', region: 'Global', latitude: 43.6532, longitude: -79.3832, country: 'CA' },
];

export interface LiveClimateReport {
  city: string;
  latitude: number;
  longitude: number;
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  uvIndex: number;
  weatherCode: number;
  windSpeed: number;
  pm25: number | null;
  usAqi: number | null;
  mappedSeason: WeatherSeason;
  metricSummary: string;
  rationale: string[];
  fetchedAt: string;
  isGeolocation: boolean;
}

// Weather code mapping according to WMO
function getWeatherCodeDescription(code: number): string {
  if (code === 0) return 'Clear sky';
  if (code === 1 || code === 2) return 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if ([45, 48].includes(code)) return 'Foggy / Hazy';
  if ([51, 53, 55].includes(code)) return 'Drizzle';
  if ([61, 63, 65].includes(code)) return 'Rain showers';
  if ([71, 73, 75].includes(code)) return 'Snowfall';
  if ([80, 81, 82].includes(code)) return 'Heavy rain showers';
  if ([95, 96, 99].includes(code)) return 'Thunderstorm';
  return 'Variable conditions';
}

/**
 * Smart Clinical Climate Mapping:
 * Evaluates live physical telemetry and dynamically maps it to the 4 Protection Shield Pillars
 */
export function mapClimateToSeason(
  temp: number,
  humidity: number,
  uvIndex: number,
  weatherCode: number,
  pm25: number | null,
  usAqi: number | null
): { season: WeatherSeason; metricSummary: string; rationale: string[] } {
  const rationale: string[] = [];

  // 1. High Pollution / Urban Smog Check
  // US AQI >= 150 (Unhealthy) or PM2.5 >= 60 µg/m³
  if ((usAqi !== null && usAqi >= 150) || (pm25 !== null && pm25 >= 60)) {
    rationale.push(`Elevated particle readings. PM2.5 ${pm25 ?? 'unavailable'} µg/m³ and US AQI ${usAqi ?? 'unavailable'}.`);
    rationale.push('Use a gentler outdoor effort, reschedule, or exercise indoors in cleaner air depending on local guidance.');
    return {
      season: 'pollution',
      metricSummary: `AQI ${usAqi ?? 'unavailable'} · PM2.5 ${pm25 ?? 'unavailable'} µg/m³ · ${temp.toFixed(1)}°C`,
      rationale,
    };
  }

  // 2. Monsoon / Humid Rainy Weather Check
  // Drizzle/rain codes (51-67, 80-82, 95-99) OR High Humidity (>= 78%) with warm temp (>= 22°C)
  const isRainCode = [51, 53, 55, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(weatherCode);
  if (isRainCode || (humidity >= 78 && temp >= 21)) {
    rationale.push(`High atmospheric moisture: ${humidity}% relative humidity (${getWeatherCodeDescription(weatherCode)}).`);
    rationale.push('Keep skin and scalp comfortable and choose a dry, stable surface for movement.');
    return {
      season: 'monsoon',
      metricSummary: `${temp.toFixed(1)}°C · ${humidity}% humidity · ${getWeatherCodeDescription(weatherCode)}`,
      rationale,
    };
  }

  // 3. Hot / High-UV Summer Check
  // UV Index >= 6.0 (High to Extreme) OR Temperature >= 32°C
  if (uvIndex >= 6.0 || temp >= 32) {
    rationale.push(`Intense solar radiation: UV Index ${uvIndex.toFixed(1)} and ${temp.toFixed(1)}°C ambient heat.`);
    rationale.push('Plan cooler movement breaks, water access, and sun protection as needed.');
    return {
      season: 'summer',
      metricSummary: `${temp.toFixed(1)}°C · UV index ${uvIndex.toFixed(1)}`,
      rationale,
    };
  }

  // 4. Cold / Dry Winter Barrier Defense (Default fallback)
  // Low temp (<= 20°C) or Low Humidity (<= 42%)
  rationale.push(`Temperature ${temp.toFixed(1)}°C with ${humidity}% humidity. You can change the suggested preset manually.`);
  return {
    season: 'winter',
    metricSummary: `${temp.toFixed(1)}°C · ${humidity}% humidity`,
    rationale,
  };
}

/**
 * Fetch live weather from free Open-Meteo Weather API + Air Quality API (zero-key required)
 */
export async function fetchLiveClimate(
  latitude: number,
  longitude: number,
  cityName: string,
  isGeolocation = false
): Promise<LiveClimateReport> {
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,uv_index,wind_speed_10m`;
  const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=pm2_5,us_aqi`;

  // Fetch weather and air quality in parallel with fault tolerance
  const [weatherRes, aqiRes] = await Promise.allSettled([
    fetch(weatherUrl, { signal: AbortSignal.timeout(9000) }),
    fetch(aqiUrl, { signal: AbortSignal.timeout(6500) }),
  ]);

  if (weatherRes.status !== 'fulfilled' || !weatherRes.value.ok) {
    throw new Error(`Failed to fetch weather from Open-Meteo for ${cityName}`);
  }

  const weatherData = await weatherRes.value.json();
  const current = weatherData.current;
  if (!current || !Number.isFinite(current.temperature_2m) || !Number.isFinite(current.relative_humidity_2m)) {
    throw new Error('Current weather is unavailable');
  }

  let pm25: number | null = null;
  let usAqi: number | null = null;

  if (aqiRes.status === 'fulfilled' && aqiRes.value.ok) {
    try {
      const aqiData = await aqiRes.value.json();
      pm25 = aqiData.current?.pm2_5 ?? null;
      usAqi = aqiData.current?.us_aqi ?? null;
    } catch {
      // AQI optional fallback
    }
  }

  const temperature = current.temperature_2m ?? 24;
  const apparentTemperature = current.apparent_temperature ?? temperature;
  const humidity = current.relative_humidity_2m ?? 50;
  const uvIndex = current.uv_index ?? 4.0;
  const weatherCode = current.weather_code ?? 0;
  const windSpeed = current.wind_speed_10m ?? 8;

  const { season, metricSummary, rationale } = mapClimateToSeason(
    temperature,
    humidity,
    uvIndex,
    weatherCode,
    pm25,
    usAqi
  );

  return {
    city: cityName,
    latitude,
    longitude,
    temperature,
    apparentTemperature,
    humidity,
    uvIndex,
    weatherCode,
    windSpeed,
    pm25,
    usAqi,
    mappedSeason: season,
    metricSummary,
    rationale,
    fetchedAt: new Date().toISOString(),
    isGeolocation,
  };
}

/**
 * Request Browser Geolocation with timeout and error handling
 */
export function getDeviceCoordinates(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Browser Geolocation is not supported by this device.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: Number(position.coords.latitude.toFixed(2)),
          longitude: Number(position.coords.longitude.toFixed(2)),
        });
      },
      (error) => {
        reject(error);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    );
  });
}
