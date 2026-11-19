export const familyRelationships = ['Parent', 'Grandparent', 'Partner', 'Sibling', 'Other'] as const;
export const careMoods = ['Low', 'Steady', 'Good'] as const;
export type CareMood = typeof careMoods[number];
export const selfMember = 'self';

export interface FamilyMember { id: string; name: string; age: number; relationship: typeof familyRelationships[number] }
export type NewFamilyMember = Omit<FamilyMember, 'id'>;
export interface CareReminder { id: string; label: string; time: string }
export interface CareDay {
  movementMinutes: number;
  pain: number | null;
  mood: CareMood | null;
  completedReminderIds: string[];
}
export const emptyCareDay: CareDay = { movementMinutes: 0, pain: null, mood: null, completedReminderIds: [] };

export const careMealFilters = {
  lowSodium: 'Lower sodium',
  carbAware: 'Carb awareness',
  calciumProtein: 'Calcium & protein',
  gentle: 'Soft / gentle prep',
} as const;
export type CareMealFilter = keyof typeof careMealFilters;

export function comfortFor(age?: number, preference?: boolean | null) {
  return preference ?? (age !== undefined && age >= 40);
}

export function validFamilyMember(input: NewFamilyMember) {
  return typeof input.name === 'string' && input.name.trim().length > 0 && input.name.trim().length <= 50 &&
    Number.isInteger(input.age) && input.age >= 14 && input.age <= 110 && familyRelationships.includes(input.relationship);
}
