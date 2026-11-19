import { digestionOptions, mealSlots, skinReactions, type Journal, type LoggedMeal, type WeeklyCheckIn } from './adaptive';
import { places, preferences, skinTypes, tiers, type Macros } from './context';
import { activeLabels, skinTimingLabels, type SkinRoutineEntry, type SkinTiming } from './formulas';
import { careMealFilters, careMoods, selfMember, validFamilyMember, type FamilyMember, type NewFamilyMember } from './familyTypes';
import { weatherSeasons } from './climate';
import { activityLevels, approaches, exclusions, exposures, fitnessGoals, hasBiometrics, skinConcerns, type UserBioProfile } from './profile';
import { healthFlags } from './safety';
import { initialPersonWorkspace, initialWorkspace, personSnapshot, workspaceSnapshot, type PersonWorkspace, type WorkspaceData } from './store';

export const maximumBackupBytes = 5_000_000;
const iterations = 600_000;
const version = 1;
const format = 'vitalform-encrypted';
const encoder = new TextEncoder();

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const someValue = (value: unknown, values: readonly string[]) => typeof value === 'string' && values.includes(value);
const isDate = (value: unknown): value is string => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.valueOf()) && date.toISOString().startsWith(value);
};
const num = (value: unknown, max: number, min = 0): value is number => typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
const str = (value: unknown, max = 200): value is string => typeof value === 'string' && value.length > 0 && value.length <= max;
const nullableDate = (value: unknown) => value === null || isDate(value);
const safeKey = (key: string) => str(key, 250) && !['__proto__', 'prototype', 'constructor'].includes(key);
const validList = (value: unknown, values: readonly string[]) => Array.isArray(value) && value.length <= values.length && value.every(entry => someValue(entry, values));
const mapValid = (value: unknown, validate: (entry: unknown) => boolean, keyCheck = safeKey) =>
  isRecord(value) && Object.entries(value).every(([key, entry]) => keyCheck(key) && validate(entry));

function validProfile(value: unknown): value is UserBioProfile {
  if (!isRecord(value)) return false;
  const hasEnums = someValue(value.sex, ['private', 'female', 'male']) && someValue(value.heightUnit, ['cm', 'imperial']) &&
    someValue(value.weightUnit, ['kg', 'lb']) && someValue(value.activity, Object.keys(activityLevels)) &&
    someValue(value.goal, Object.keys(fitnessGoals)) && someValue(value.approach, Object.keys(approaches)) &&
    someValue(value.environment, places) && someValue(value.budget, tiers) && someValue(value.diet, preferences) && someValue(value.skin, skinTypes);
  const hasSelections = validList(value.exclusions, exclusions) && validList(value.concerns, skinConcerns) && validList(value.exposures, exposures) &&
    (value.health === undefined || validList(value.health, Object.keys(healthFlags))) &&
    (value.skinHoldUntil === undefined || isDate(value.skinHoldUntil));
  const basicProfile = num(value.age, 110, 14) && Number.isInteger(value.age) && value.heightCm === 0 && value.weightKg === 0 && value.targetKg === 0;
  const fullProfile = num(value.heightCm, 230, 120) && num(value.weightKg, 300, 30) &&
    num(value.targetKg, 300, 30) && hasBiometrics(value as unknown as UserBioProfile);
  return hasEnums && hasSelections && (basicProfile || fullProfile);
}

function validMacros(value: unknown): value is Macros {
  return isRecord(value) && num(value.calories, 15000) && num(value.protein, 2000) && num(value.carbs, 2000) && num(value.fat, 2000);
}
function validMeal(value: unknown): value is LoggedMeal {
  return isRecord(value) && str(value.name) && validMacros(value.macros) &&
    (value.slot === undefined || someValue(value.slot, mealSlots)) && (value.unplanned === undefined || typeof value.unplanned === 'boolean');
}
function validJournal(value: unknown): value is Journal {
  return isRecord(value) && num(value.water, 500000) && mapValid(value.meals, validMeal) &&
    mapValid(value.habits, entry => typeof entry === 'boolean', key => someValue(key, ['am', 'pm', 'workout']));
}
function validCheckIn(value: unknown): value is WeeklyCheckIn {
  return isRecord(value) && isDate(value.date) && num(value.weightKg, 300, 30) &&
    num(value.energy, 5, 1) && Number.isInteger(value.energy) && someValue(value.digestion, digestionOptions) && someValue(value.skin, skinReactions);
}
const validTiming = (value: unknown): value is SkinTiming => someValue(value, Object.keys(skinTimingLabels));
function validSkinEntry(value: unknown): value is SkinRoutineEntry {
  return isRecord(value) && typeof value.id === 'string' && safeKey(value.id) && str(value.name) &&
    someValue(value.active, Object.keys(activeLabels)) && validTiming(value.timing);
}

function validCareDay(value: unknown) {
  return isRecord(value) && num(value.movementMinutes, 1440) &&
    (value.pain === null || (num(value.pain, 10) && Number.isInteger(value.pain))) &&
    (value.mood === null || someValue(value.mood, careMoods)) && Array.isArray(value.completedReminderIds) &&
    value.completedReminderIds.every(id => typeof id === 'string' && safeKey(id));
}

function validCareReminder(value: unknown) {
  return isRecord(value) && typeof value.id === 'string' && safeKey(value.id) && str(value.label, 100) &&
    typeof value.time === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value.time);
}

function validMember(value: unknown): value is FamilyMember {
  return isRecord(value) && typeof value.id === 'string' && value.id !== selfMember && safeKey(value.id) &&
    validFamilyMember(value as unknown as NewFamilyMember);
}

function validatePerson(value: Record<string, unknown>, member?: FamilyMember): PersonWorkspace {
  const data = { ...initialPersonWorkspace, ...value };
  const valid = someValue(data.environment, places) && someValue(data.budget, tiers) && someValue(data.skin, skinTypes) &&
    someValue(data.diet, preferences) &&
    num(data.planIndex, 1_000_000) && Number.isInteger(data.planIndex) && mapValid(data.days, validJournal, isDate) &&
    mapValid(data.groceries, entry => typeof entry === 'boolean') && (data.profile === null || validProfile(data.profile)) &&
    mapValid(data.mealSwaps, entry => num(entry, 999) && Number.isInteger(entry)) &&
    Array.isArray(data.pinnedProducts) && data.pinnedProducts.every(entry => typeof entry === 'string' && safeKey(entry)) &&
    (data.monthlyLimit === null || num(data.monthlyLimit, 1_000_000)) &&
    nullableDate(data.easyDay) && nullableDate(data.profileStarted) && nullableDate(data.workoutRampStart) &&
    Array.isArray(data.checkIns) && data.checkIns.every(validCheckIn) && mapValid(data.skinSchedule, validTiming) &&
    Array.isArray(data.ownSkincare) && data.ownSkincare.every(validSkinEntry) && mapValid(data.skinRamps, isDate) && mapValid(data.rampChecks, isDate) &&
    (data.comfortPreference === null || typeof data.comfortPreference === 'boolean') && mapValid(data.careDays, validCareDay, isDate) &&
    Array.isArray(data.careReminders) && data.careReminders.length <= 35 && data.careReminders.every(validCareReminder) &&
    validList(data.careMealFilters, Object.keys(careMealFilters)) && (!member || data.profile?.age === member.age) &&
    someValue(data.weatherSeason, weatherSeasons) && someValue(data.weatherMode, ['auto', 'manual']) &&
    typeof data.selectedCity === 'string' && data.selectedCity.trim().length > 0 && data.selectedCity.length <= 80 &&
    validClimateReport(data.liveClimate) && someValue(data.defaultCuisine, ['south-indian', 'north-indian', 'pan-indian']) &&
    someValue(data.measurementUnits, ['metric', 'imperial']) &&
    Array.isArray(data.ergonomicsChecks) && data.ergonomicsChecks.length <= 5 &&
    validList(data.ergonomicsChecks, ['screen-eye-level', 'elbow-support', 'feet-grounded', 'back-supported', 'separate-peripherals']);
  if (!valid) throw new Error('This file contains invalid Vitalform data.');
  const snapshot = personSnapshot(data);
  if (snapshot.profile) {
    snapshot.profile = { ...snapshot.profile, environment: snapshot.environment, budget: snapshot.budget, diet: snapshot.diet, skin: snapshot.skin };
  }
  return snapshot;
}

function validClimateReport(report: unknown) {
  if (report === null) return true;
  return isRecord(report) && typeof report.city === 'string' && report.city.length <= 80 &&
    typeof report.fetchedAt === 'string' && report.fetchedAt.length <= 45 &&
    typeof report.isGeolocation === 'boolean' && someValue(report.mappedSeason, weatherSeasons) &&
    typeof report.metricSummary === 'string' && Array.isArray(report.rationale) && report.rationale.length <= 12 &&
    report.rationale.every(text => typeof text === 'string' && text.length <= 500) &&
    ['latitude', 'longitude', 'temperature', 'apparentTemperature', 'humidity', 'uvIndex', 'weatherCode', 'windSpeed']
      .every(key => typeof report[key] === 'number' && Number.isFinite(report[key])) &&
    ['pm25', 'usAqi'].every(key => report[key] === null || (typeof report[key] === 'number' && Number.isFinite(report[key])));
}

export function validateBackup(value: unknown): WorkspaceData {
  if (!isRecord(value)) throw new Error('This file contains invalid Vitalform data.');
  const data = { ...initialWorkspace, ...value };
  if (!someValue(data.currency, ['INR', 'USD']) || !someValue(data.theme, ['light', 'dark', 'elder']) ||
    !Array.isArray(data.familyMembers) || data.familyMembers.length > 20 || !data.familyMembers.every(validMember) ||
    !isRecord(data.memberWorkspaces)) throw new Error('This file contains invalid Vitalform data.');
  const members = new Map(data.familyMembers.map(member => [member.id, member]));
  const memberIds = new Set([selfMember, ...members.keys()]);
  if (members.size !== data.familyMembers.length || !memberIds.has(data.activeMemberId) ||
    Object.keys(data.memberWorkspaces).length !== memberIds.size - 1) throw new Error('This file contains invalid family profiles.');
  const stored = Object.entries(data.memberWorkspaces).map(([id, person]) => {
    if (!memberIds.has(id) || id === data.activeMemberId || !isRecord(person)) throw new Error('This file contains invalid family profiles.');
    return [id, validatePerson(person, members.get(id))];
  });
  const preferences = {
    soundEffectsEnabled: typeof data.soundEffectsEnabled === 'boolean' ? data.soundEffectsEnabled : initialWorkspace.soundEffectsEnabled,
    voiceReadAloudEnabled: typeof data.voiceReadAloudEnabled === 'boolean' ? data.voiceReadAloudEnabled : initialWorkspace.voiceReadAloudEnabled,
    displayName: typeof data.displayName === 'string' ? data.displayName.slice(0, 60) : initialWorkspace.displayName,
  };
  return workspaceSnapshot({
    ...data, ...preferences, ...validatePerson(value, members.get(data.activeMemberId)),
    authUser: null, authMode: 'guest', userEmail: '',
    memberWorkspaces: Object.fromEntries(stored),
  });
}

function toBase64(bytes: Uint8Array) {
  const chunks: string[] = [];
  for (let i = 0; i < bytes.length; i += 8192) chunks.push(String.fromCharCode(...bytes.subarray(i, i + 8192)));
  return btoa(chunks.join(''));
}

function fromBase64(value: string) {
  return Uint8Array.from(atob(value), char => char.charCodeAt(0));
}

async function backupKey(password: string, salt: Uint8Array<ArrayBuffer>) {
  const material = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

export async function encryptBackup(data: WorkspaceData, password: string) {
  if (password.length < 10) throw new Error('Use a passphrase with at least 10 characters.');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await backupKey(password, salt);
  const plaintext = encoder.encode(JSON.stringify(workspaceSnapshot(data)));
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext));
  return JSON.stringify({ format, version, iterations, salt: toBase64(salt), iv: toBase64(iv), ciphertext: toBase64(ciphertext) });
}

export async function decryptBackup(text: string, password: string) {
  if (text.length > maximumBackupBytes) throw new Error('The backup is above the 5 MB import limit.');
  const envelope: unknown = JSON.parse(text);
  if (!isRecord(envelope) || envelope.format !== format || envelope.version !== version || envelope.iterations !== iterations ||
    typeof envelope.salt !== 'string' || typeof envelope.iv !== 'string' || typeof envelope.ciphertext !== 'string') {
    throw new Error('Select a Vitalform encrypted backup file.');
  }
  let plain: ArrayBuffer;
  try {
    const salt = fromBase64(envelope.salt);
    const iv = fromBase64(envelope.iv);
    if (salt.length !== 16 || iv.length !== 12) throw new Error();
    const key = await backupKey(password, salt);
    plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, fromBase64(envelope.ciphertext));
  } catch {
    throw new Error('Could not unlock the backup. Check your passphrase and file.');
  }
  return validateBackup(JSON.parse(new TextDecoder().decode(plain)));
}
