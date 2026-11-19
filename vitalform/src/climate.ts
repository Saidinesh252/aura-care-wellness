import type { Workout } from './fitness';
import type { UserBioProfile } from './profile';

export const weatherSeasons = ['winter', 'summer', 'monsoon', 'pollution'] as const;
export type WeatherSeason = typeof weatherSeasons[number];

export const climateSources = {
  winterSkin: { name: 'AAD cold-weather skin care', href: 'https://www.aad.org/news/cold-weather-and-your-skin' },
  summer: { name: 'CDC heat and exercise guidance', href: 'https://www.cdc.gov/extreme-heat/risk-factors/extreme-heat-and-athletes.html' },
  monsoon: { name: 'FDA produce safety', href: 'https://www.fda.gov/food/buy-store-serve-safe-food/selecting-and-serving-produce-safely' },
  pollution: { name: 'AirNow particle pollution guide', href: 'https://www.airnow.gov/sites/default/files/2023-03/air-quality-guide-for-particle-pollution_0.pdf' },
  steam: { name: 'NHS steam inhalation guidance', href: 'https://www.newcastle-hospitals.nhs.uk/news/burns-warning-risks-of-steam-inhalation/' },
  vitaminD: { name: 'NIH vitamin D food sources', href: 'https://ods.od.nih.gov/factsheets/VitaminD-Consumer/' },
};

export const climateMovementNotes: Record<WeatherSeason, string> = {
  winter: 'Start with an eight-minute indoor warm-up at a comfortable effort. Dress in breathable layers and remove a layer as you warm up.',
  summer: 'Choose a cool indoor session, or move outdoor activity to a cooler part of the day. Keep water nearby and take breaks.',
  monsoon: 'Move indoors if the ground is wet. Check that the floor, mat and footwear are dry and secure before starting.',
  pollution: 'Use an indoor space with cleaner air. If there is no suitable indoor space, postpone strenuous movement until air quality improves.',
};

export function climateMovement(workout: Workout, season?: WeatherSeason): Workout {
  if (!season) return workout;
  return { ...workout, description: `${workout.description} ${climateMovementNotes[season]}` };
}

export function climateHydrationBonus(base: number | null | undefined, profile: UserBioProfile | null, season: WeatherSeason) {
  if (!base || season !== 'summer' || !profile || profile.age < 20 || profile.age >= 60 || profile.health?.length) return 0;
  return Math.max(0, Math.min(500, 3500 - base));
}
