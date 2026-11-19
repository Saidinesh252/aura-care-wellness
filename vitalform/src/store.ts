import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { localDate, zeroMacros, type Budget, type Currency, type Environment, type Macros, type Preference, type SkinType } from './context';
import { createProfile, type UserBioProfile } from './profile';
import { inferredSlot, type Journal, type LoggedMeal, type WeeklyCheckIn } from './adaptive';
import { type SkinRoutineEntry, type SkinTiming } from './formulas';
import { shiftDate } from './safety';
import { careMealFilters, emptyCareDay, selfMember, validFamilyMember, type CareDay, type CareMealFilter, type CareMood, type CareReminder, type FamilyMember, type NewFamilyMember } from './familyTypes';
import { type LiveClimateReport } from './services/weatherService';
import { type NotificationConfig, defaultNotificationConfig } from './services/notificationService';
import { type WeatherSeason } from './climate';
export type { WeatherSeason } from './climate';

export type Habit = 'am' | 'pm' | 'workout';
export type WeatherMode = 'auto' | 'manual';
export type ThemeMode = 'light' | 'dark' | 'elder';
export type AuthMode = 'guest' | 'authenticated';
export type MeasurementUnit = 'metric' | 'imperial';
export type DefaultCuisine = 'south-indian' | 'north-indian' | 'pan-indian';
export const deskCheckKeys = ['screen-eye-level', 'elbow-support', 'feet-grounded', 'back-supported', 'separate-peripherals'] as const;
export const cuisines = ['south-indian', 'north-indian', 'pan-indian'] as const;

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
}

export const emptyJournal: Journal = { water: 0, habits: {}, meals: {} };

export interface PersonWorkspace {
  environment: Environment;
  budget: Budget;
  skin: SkinType;
  diet: Preference;
  weatherSeason: WeatherSeason;
  weatherMode: WeatherMode;
  selectedCity: string;
  liveClimate: LiveClimateReport | null;
  planIndex: number;
  days: Record<string, Journal>;
  groceries: Record<string, boolean>;
  profile: UserBioProfile | null;
  mealSwaps: Record<string, number>;
  pinnedProducts: string[];
  monthlyLimit: number | null;
  easyDay: string | null;
  profileStarted: string | null;
  workoutRampStart: string | null;
  checkIns: WeeklyCheckIn[];
  skinSchedule: Record<string, SkinTiming>;
  ownSkincare: SkinRoutineEntry[];
  skinRamps: Record<string, string>;
  rampChecks: Record<string, string>;
  comfortPreference: boolean | null;
  careDays: Record<string, CareDay>;
  careReminders: CareReminder[];
  careMealFilters: CareMealFilter[];
  defaultCuisine: DefaultCuisine;
  measurementUnits: MeasurementUnit;
  ergonomicsChecks: string[];
}

export interface WorkspaceData extends PersonWorkspace {
  currency: Currency;
  theme: ThemeMode;
  familyMembers: FamilyMember[];
  activeMemberId: string;
  memberWorkspaces: Record<string, PersonWorkspace>;
  notificationConfig: NotificationConfig;
  authUser: AuthUser | null;
  authMode: AuthMode;
  displayName: string;
  userEmail: string;
  soundEffectsEnabled: boolean;
  voiceReadAloudEnabled: boolean;
  ergonomicsAuditScore: number | null;
}

interface Workspace extends WorkspaceData {
  setEnvironment: (environment: Environment) => void;
  setBudget: (budget: Budget) => void;
  setSkin: (skin: SkinType) => void;
  setDiet: (diet: Preference) => void;
  toggleCurrency: () => void;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  setAuthMode: (mode: AuthMode) => void;
  setAuthUser: (user: AuthUser | null) => void;
  signOut: () => void;
  setDisplayName: (name: string) => void;
  setUserEmail: (email: string) => void;
  setMeasurementUnits: (units: MeasurementUnit) => void;
  setDefaultCuisine: (cuisine: DefaultCuisine) => void;
  setErgonomicsChecks: (checks: string[]) => void;
  restoreWorkspace: (data: WorkspaceData) => void;
  setSoundEffectsEnabled: (val: boolean) => void;
  setVoiceReadAloudEnabled: (val: boolean) => void;
  setErgonomicsAuditScore: (score: number) => void;
  resetAllData: () => void;
  rotatePlan: () => void;
  setHabit: (habit: Habit, value: boolean) => void;
  addWater: (amount: number) => void;
  toggleMeal: (id: string, meal: LoggedMeal) => void;
  toggleGrocery: (id: string) => void;
  saveProfile: (profile: UserBioProfile) => void;
  swapMeal: (slot: string, numberOfOptions: number) => void;
  toggleProduct: (id: string, replaces?: string[], startRamp?: boolean) => void;
  setMonthlyLimit: (limit: number | null) => void;
  toggleEasyDay: (today: string) => void;
  saveCheckIn: (checkIn: WeeklyCheckIn) => void;
  updateSkinSchedule: (schedule: Record<string, SkinTiming>) => void;
  addSkinEntry: (entry: SkinRoutineEntry, startRamp: boolean) => void;
  removeSkinEntry: (id: string) => void;
  saveOutsideMeal: (meal: LoggedMeal & { slot: NonNullable<LoggedMeal['slot']> }) => void;
  saveRampCheck: (id: string, today: string, irritated: boolean) => void;
  addFamilyMember: (input: NewFamilyMember) => void;
  updateFamilyMember: (id: string, input: NewFamilyMember) => void;
  switchFamilyMember: (id: string) => void;
  setComfortPreference: (value: boolean | null) => void;
  addMovementMinutes: (minutes: number) => void;
  setCareCheckIn: (pain: number | null, mood: CareMood | null) => void;
  addCareReminder: (label: string, time: string) => void;
  removeCareReminder: (id: string) => void;
  toggleCareReminder: (id: string) => void;
  setCareMealFilters: (filters: CareMealFilter[]) => void;
  setWeatherSeason: (season: WeatherSeason) => void;
  setWeatherMode: (mode: WeatherMode) => void;
  setSelectedCity: (city: string) => void;
  setLiveClimate: (climate: LiveClimateReport) => void;
  updateNotificationConfig: (update: Partial<NotificationConfig>) => void;
}

export const initialPersonWorkspace: PersonWorkspace = {
  environment: 'home', budget: 'student',
  skin: 'Combination', diet: 'Omnivore', weatherSeason: 'winter', planIndex: 0, days: {}, groceries: {},
  weatherMode: 'manual', selectedCity: 'Hyderabad', liveClimate: null,
  profile: null, mealSwaps: {}, pinnedProducts: [], monthlyLimit: null,
  easyDay: null, profileStarted: null, workoutRampStart: null, checkIns: [],
  skinSchedule: {}, ownSkincare: [], skinRamps: {}, rampChecks: {},
  comfortPreference: null, careDays: {}, careReminders: [], careMealFilters: [],
  defaultCuisine: 'south-indian', measurementUnits: 'metric', ergonomicsChecks: [],
};

export const initialWorkspace: WorkspaceData = {
  ...initialPersonWorkspace,
  currency: 'INR',
  theme: 'dark',
  familyMembers: [],
  activeMemberId: selfMember,
  memberWorkspaces: {},
  notificationConfig: defaultNotificationConfig,
  authUser: null,
  authMode: 'guest',
  displayName: 'Biohacker Me',
  userEmail: '',
  soundEffectsEnabled: true,
  voiceReadAloudEnabled: false,
  ergonomicsAuditScore: null,
};

export function personSnapshot(state: PersonWorkspace): PersonWorkspace {
  return Object.fromEntries(Object.keys(initialPersonWorkspace).map(key => [key, state[key as keyof PersonWorkspace]])) as unknown as PersonWorkspace;
}

export function workspaceSnapshot(state: WorkspaceData): WorkspaceData {
  return {
    ...personSnapshot(state),
    currency: state.currency,
    theme: state.theme,
    familyMembers: state.familyMembers,
    activeMemberId: state.activeMemberId,
    memberWorkspaces: state.memberWorkspaces,
    notificationConfig: state.notificationConfig,
    authUser: state.authUser,
    authMode: state.authMode,
    displayName: state.displayName,
    userEmail: state.userEmail,
    soundEffectsEnabled: state.soundEffectsEnabled,
    voiceReadAloudEnabled: state.voiceReadAloudEnabled,
    ergonomicsAuditScore: state.ergonomicsAuditScore,
  };
}

function changeCareDay(careDays: Record<string, CareDay>, update: (day: CareDay) => CareDay) {
  const date = localDate();
  return { ...careDays, [date]: update(careDays[date] ?? emptyCareDay) };
}

export const useWorkspace = create<Workspace>()(persist<Workspace, [], [], WorkspaceData>((set) => ({
  ...initialWorkspace,
  setEnvironment: (environment) => set(({ profile, workoutRampStart }) => ({
    environment, profile: profile && { ...profile, environment },
    workoutRampStart: profile && profile.environment !== environment ? localDate() : workoutRampStart,
  })),
  setBudget: (budget) => set(({ profile, workoutRampStart }) => ({
    budget, profile: profile && { ...profile, budget },
    workoutRampStart: profile && profile.budget !== budget ? localDate() : workoutRampStart,
  })),
  setSkin: (skin) => set(({ profile }) => ({ skin, profile: profile && { ...profile, skin } })),
  setDiet: (diet) => set(({ profile }) => ({ diet, profile: profile && { ...profile, diet }, planIndex: 0, mealSwaps: {} })),
  saveProfile: (profile) => set(state => ({
    profile, environment: profile.environment, budget: profile.budget, skin: profile.skin, diet: profile.diet, mealSwaps: {}, planIndex: 0,
    measurementUnits: profile.weightUnit === 'lb' ? 'imperial' : 'metric',
    familyMembers: state.familyMembers.map(member => member.id === state.activeMemberId ? { ...member, age: profile.age } : member),
    profileStarted: state.profileStarted ?? localDate(),
    workoutRampStart: !state.profile || ['activity', 'environment', 'goal', 'budget'].some(key => state.profile?.[key as keyof UserBioProfile] !== profile[key as keyof UserBioProfile])
      ? localDate() : state.workoutRampStart,
  })),
  swapMeal: (slot, numberOfOptions) => set(({ mealSwaps }) => ({
    mealSwaps: { ...mealSwaps, [slot]: ((mealSwaps[slot] ?? 0) + 1) % Math.max(1, numberOfOptions) },
  })),
  toggleProduct: (id, replaces = [], startRamp = false) => set(({ pinnedProducts, skinRamps }) => ({
    pinnedProducts: pinnedProducts.includes(id) ? pinnedProducts.filter(item => item !== id) : [...pinnedProducts.filter(item => !replaces.includes(item)), id],
    skinRamps: startRamp && !pinnedProducts.includes(id) ? { ...skinRamps, [id]: localDate() } : skinRamps,
  })),
  toggleEasyDay: (today) => set(({ easyDay }) => ({ easyDay: easyDay === today ? null : today })),
  saveCheckIn: (checkIn) => set(({ profile, checkIns }) => {
    if (!profile) return {};
    const hold = checkIn.skin === 'Irritated' || checkIn.skin === 'Dry / tight' ? shiftDate(checkIn.date, 4) : undefined;
    return {
      profile: { ...profile, weightKg: checkIn.weightKg, skinHoldUntil: hold ?? profile.skinHoldUntil },
      checkIns: [...checkIns.filter(item => item.date !== checkIn.date), checkIn].sort((a, b) => a.date.localeCompare(b.date)),
    };
  }),
  updateSkinSchedule: (schedule) => set(({ skinSchedule }) => ({ skinSchedule: { ...skinSchedule, ...schedule } })),
  addSkinEntry: (entry, startRamp) => set(({ ownSkincare, skinRamps }) => ({
    ownSkincare: [...ownSkincare, entry],
    skinRamps: startRamp ? { ...skinRamps, [entry.id]: localDate() } : skinRamps,
  })),
  removeSkinEntry: (id) => set(({ ownSkincare }) => ({ ownSkincare: ownSkincare.filter(item => item.id !== id) })),
  saveRampCheck: (id, today, irritated) => set(({ skinSchedule, profile, rampChecks }) => ({
    rampChecks: { ...rampChecks, [id]: today },
    skinSchedule: irritated ? { ...skinSchedule, [id]: 'paused' } : skinSchedule,
    profile: profile && irritated ? { ...profile, skinHoldUntil: shiftDate(today, 4) } : profile,
  })),
  setMonthlyLimit: (monthlyLimit) => set({ monthlyLimit }),
  addFamilyMember: (input) => set(state => {
    if (!validFamilyMember(input) || state.familyMembers.length >= 20) return {};
    const member = { ...input, name: input.name.trim(), id: crypto.randomUUID() };
    const baseline = { ...initialPersonWorkspace, skin: 'Normal' as const };
    return {
      ...baseline,
      profile: { ...createProfile(baseline), age: member.age },
      familyMembers: [...state.familyMembers, member],
      activeMemberId: member.id,
      memberWorkspaces: { ...state.memberWorkspaces, [state.activeMemberId]: personSnapshot(state) },
    };
  }),
  updateFamilyMember: (id, input) => set(state => {
    if (!validFamilyMember(input) || !state.familyMembers.some(member => member.id === id)) return {};
    const familyMembers = state.familyMembers.map(member => member.id === id ? { ...member, ...input, name: input.name.trim() } : member);
    if (id === state.activeMemberId && state.profile) return { familyMembers, profile: { ...state.profile, age: input.age } };
    const stored = state.memberWorkspaces[id];
    if (!stored?.profile) return { familyMembers };
    return { familyMembers, memberWorkspaces: { ...state.memberWorkspaces, [id]: { ...stored, profile: { ...stored.profile, age: input.age } } } };
  }),
  switchFamilyMember: (id) => set(state => {
    if (id === state.activeMemberId || (id !== selfMember && !state.familyMembers.some(member => member.id === id))) return {};
    const { [id]: stored, ...otherMembers } = state.memberWorkspaces;
    return {
      ...initialPersonWorkspace, ...stored, activeMemberId: id,
      memberWorkspaces: { ...otherMembers, [state.activeMemberId]: personSnapshot(state) },
    };
  }),
  setComfortPreference: (comfortPreference) => set({ comfortPreference }),
  addMovementMinutes: (minutes) => set(({ careDays }) => Number.isFinite(minutes) ? ({
    careDays: changeCareDay(careDays, day => ({ ...day, movementMinutes: Math.max(0, Math.min(1440, Math.round((day.movementMinutes + minutes) * 100) / 100)) })),
  }) : {}),
  setCareCheckIn: (pain, mood) => set(({ careDays }) => pain === null || Number.isFinite(pain) ? ({
    careDays: changeCareDay(careDays, day => ({ ...day, pain: pain === null ? null : Math.max(0, Math.min(10, Math.round(pain))), mood })),
  }) : {}),
  addCareReminder: (label, time) => set(({ careReminders }) => {
    const name = label.trim();
    if (!name || name.length > 100 || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time) || careReminders.length >= 35) return {};
    return { careReminders: [...careReminders, { id: crypto.randomUUID(), label: name, time }] };
  }),
  removeCareReminder: (id) => set(({ careReminders }) => ({ careReminders: careReminders.filter(item => item.id !== id) })),
  toggleCareReminder: (id) => set(({ careDays, careReminders }) => careReminders.some(item => item.id === id) ? ({
    careDays: changeCareDay(careDays, day => ({
      ...day, completedReminderIds: day.completedReminderIds.includes(id) ? day.completedReminderIds.filter(item => item !== id) : [...day.completedReminderIds, id],
    })),
  }) : {}),
  setCareMealFilters: (filters) => set({ careMealFilters: [...new Set(filters.filter(filter => Object.hasOwn(careMealFilters, filter)))] }),
  setWeatherSeason: (weatherSeason) => set({ weatherSeason, weatherMode: 'manual' }),
  setWeatherMode: (weatherMode) => set(state => ({
    weatherMode,
    weatherSeason: weatherMode === 'auto' && state.liveClimate ? state.liveClimate.mappedSeason : state.weatherSeason,
  })),
  setSelectedCity: (selectedCity) => set(state => ({ selectedCity, liveClimate: state.selectedCity === selectedCity ? state.liveClimate : null })),
  setLiveClimate: (climate) => set(state => ({
    liveClimate: climate,
    weatherSeason: state.weatherMode === 'auto' ? climate.mappedSeason : state.weatherSeason,
  })),
  updateNotificationConfig: (update) => set(state => ({
    notificationConfig: { ...state.notificationConfig, ...update },
  })),
  toggleCurrency: () => set(({ currency }) => ({ currency: currency === 'INR' ? 'USD' : 'INR' })),
  toggleTheme: () => set(({ theme }) => ({ theme: theme === 'dark' ? 'light' : theme === 'light' ? 'elder' : 'dark' })),
  setTheme: (theme) => set({ theme }),
  setAuthMode: (authMode) => set({ authMode }),
  setAuthUser: (authUser) => set({
    authUser,
    authMode: authUser ? 'authenticated' : 'guest',
    userEmail: authUser?.email ?? '',
    displayName: authUser?.displayName ?? 'Biohacker Me',
  }),
  signOut: () => set({ authUser: null, authMode: 'guest', userEmail: '' }),
  setDisplayName: (displayName) => set({ displayName }),
  setUserEmail: (userEmail) => set({ userEmail }),
  setMeasurementUnits: (measurementUnits) => set(state => ({
    measurementUnits,
    profile: state.profile ? {
      ...state.profile,
      weightUnit: measurementUnits === 'imperial' ? 'lb' : 'kg',
      heightUnit: measurementUnits === 'imperial' ? 'imperial' : 'cm',
    } : state.profile,
  })),
  setDefaultCuisine: (defaultCuisine) => set(state => state.defaultCuisine === defaultCuisine ? {} : { defaultCuisine, mealSwaps: {} }),
  setErgonomicsChecks: (checks) => set({ ergonomicsChecks: deskCheckKeys.filter(key => checks.includes(key)) }),
  restoreWorkspace: (data) => set(({ authUser, authMode }) => ({ ...data, authUser, authMode })),
  setSoundEffectsEnabled: (soundEffectsEnabled) => set({ soundEffectsEnabled }),
  setVoiceReadAloudEnabled: (voiceReadAloudEnabled) => set({ voiceReadAloudEnabled }),
  setErgonomicsAuditScore: (ergonomicsAuditScore) => set({ ergonomicsAuditScore }),
  resetAllData: () => set(() => ({ ...initialWorkspace })),
  rotatePlan: () => set(({ planIndex }) => ({ planIndex: planIndex + 1, mealSwaps: {} })),
  setHabit: (habit, value) => set(({ days }) => {
    const date = localDate();
    const journal = days[date] ?? emptyJournal;
    return { days: { ...days, [date]: { ...journal, habits: { ...journal.habits, [habit]: value } } } };
  }),
  addWater: (amount) => set(({ days }) => {
    const date = localDate();
    const journal = days[date] ?? emptyJournal;
    return { days: { ...days, [date]: { ...journal, water: Math.max(0, journal.water + amount) } } };
  }),
  toggleMeal: (id, meal) => set(({ days }) => {
    const date = localDate();
    const journal = days[date] ?? emptyJournal;
    const meals = { ...journal.meals };
    if (meals[id]) delete meals[id];
    else {
      if (meal.slot && Object.entries(meals).some(([key, entry]) => inferredSlot(key, entry) === meal.slot)) return {};
      meals[id] = meal;
    }
    return { days: { ...days, [date]: { ...journal, meals } } };
  }),
  saveOutsideMeal: (meal) => set(({ days }) => {
    const today = localDate();
    const journal = days[today] ?? emptyJournal;
    const meals = Object.fromEntries(Object.entries(journal.meals).filter(([id, entry]) => inferredSlot(id, entry) !== meal.slot));
    return { days: { ...days, [today]: { ...journal, meals: { ...meals, [`outside-${meal.slot}`]: { ...meal, unplanned: true } } } } };
  }),
  toggleGrocery: (id) => set(({ groceries }) => ({ groceries: { ...groceries, [id]: !groceries[id] } })),
}), {
  name: 'vitalform-workspace-v1', version: 1, partialize: workspaceSnapshot,
  migrate: (persisted) => workspaceSnapshot({ ...initialWorkspace, ...(persisted as Partial<WorkspaceData>) }),
}));

export function sumMacros(meals: Macros[]): Macros {
  return meals.reduce((total, meal) => ({
    protein: total.protein + meal.protein,
    carbs: total.carbs + meal.carbs,
    fat: total.fat + meal.fat,
    calories: total.calories + meal.calories,
  }), zeroMacros);
}

export function workoutStreak(days: Workspace['days'], today: string) {
  const date = new Date(`${today}T12:00:00`);
  if (!days[today]?.habits.workout) date.setDate(date.getDate() - 1);
  let streak = 0;
  while (days[localDate(date)]?.habits.workout) {
    streak++;
    date.setDate(date.getDate() - 1);
  }
  return streak;
}
