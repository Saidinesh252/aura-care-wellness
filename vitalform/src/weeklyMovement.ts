import { easyMovement, familyWorkouts, workoutsFor, workoutMinutes, type Workout } from './fitness';
import { localDate, type Budget, type Environment } from './context';
import { calculateProfile, type UserBioProfile } from './profile';
import { safetyFor, shiftDate } from './safety';
import { climateMovement, type WeatherSeason } from './climate';

export function profileWorkouts(profile: UserBioProfile): Workout[] {
  const { environment, budget, activity, age, weightKg, targetKg, goal } = profile;
  if (age >= 60) return familyWorkouts(safetyFor(profile).lowImpact);
  if (safetyFor(profile).lowImpact) return [easyMovement(environment, true)];
  const bmi = calculateProfile(profile)?.bmi ?? 0;
  const gentle = age < 20 || activity === 'sedentary' || bmi >= 32 || (bmi > 0 && bmi < 18.5) ||
    (goal === 'loss' && Math.abs(weightKg - targetKg) >= 15);
  const [signature, mobility, strength] = workoutsFor(environment, budget);
  const optionalFamily = age >= 40 ? familyWorkouts() : [];
  if (!gentle) return [signature, mobility, strength, ...optionalFamily];
  const recovery = {
    ...mobility, id: `${environment}-blueprint-recovery`,
    name: environment === 'pg' ? 'Quiet low-impact foundations' : 'Low-impact movement foundations',
    description: 'Use short, quiet intervals to build comfort before adding intensity.',
    rounds: 2, work: 30, rest: 30,
  };
  return [recovery, mobility, { ...strength, rounds: 2, work: 30, rest: 35, description: 'Two controlled rounds with extra time to rest.' }, ...optionalFamily];
}

export function rampWeek(start: string | null, today: string) {
  if (!start || today < start || today >= shiftDate(start, 21)) return 0;
  return today < shiftDate(start, 7) ? 1 : today < shiftDate(start, 14) ? 2 : 3;
}

export function movementOptions(profile: UserBioProfile | null, environment: Environment, budget: Budget, ramp: string | null, today: string, easy: boolean, season?: WeatherSeason) {
  return baseMovementOptions(profile, environment, budget, ramp, today, easy).map(workout => climateMovement(workout, season));
}

function baseMovementOptions(profile: UserBioProfile | null, environment: Environment, budget: Budget, ramp: string | null, today: string, easy: boolean) {
  const adjusted = safetyFor(profile, today).lowImpact;
  if (easy) return [easyMovement(environment, adjusted)];
  if (adjusted) return (profile?.age ?? 0) >= 60 ? familyWorkouts(true) : [easyMovement(environment, true)];
  const base = profile ? profileWorkouts(profile) : workoutsFor(environment, budget);
  const week = rampWeek(ramp, today);
  if (!week) return base;
  return base.map((workout, index) => ({
    ...workout, rounds: Math.min(workout.rounds, week + 1),
    work: Math.min(workout.work, week === 1 ? 30 : 40), rest: Math.max(workout.rest, 30),
    exercises: index === 0 && !workout.quiet ? workout.exercises.filter(exercise => !/jump/i.test(exercise.name)) : workout.exercises,
    quiet: true, name: index === 0 && !workout.quiet ? 'Low-impact interval foundations' : workout.name,
    description: `Ramp-up week ${week}. Use a comfortable effort and take extra rest if needed.`,
  }));
}

const week = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export function movementSchedule(profile: UserBioProfile, ramp: string | null = null, today = localDate(), season?: WeatherSeason) {
  const [primary, mobility = primary, strength = primary] = movementOptions(profile, profile.environment, profile.budget, ramp, today, false, season);
  const sixDays = profile.age >= 20 && profile.age < 60 && (profile.activity === 'moderate' || profile.activity === 'very') && !primary.id.endsWith('-recovery') && !safetyFor(profile, today).lowImpact;
  const prefersStrength = profile.goal === 'gain' || profile.goal === 'recomp';
  const senior = profile.age >= 60;
  const main = prefersStrength ? strength : primary;
  const rest = { title: 'Rest day', detail: 'Take a break or move gently as you feel able.', target: undefined, duration: undefined };
  const active = (workout: Workout, focus: string) => ({ title: workout.name, detail: season === 'pollution' || season === 'summer' ? `${focus} · Indoors if needed` : focus, target: workout.id, duration: workoutMinutes(workout) });
  const days = [
    active(main, 'Full-body movement'),
    active(senior ? primary : mobility, 'Shoulder and hip mobility'),
    active(senior ? mobility : prefersStrength ? primary : strength, senior && mobility.id === 'family-supported' ? 'Supported strength and balance' : 'Strength and control'),
    sixDays ? active(mobility, 'Active recovery') : rest,
    active(main, 'Repeat at a comfortable pace'),
    active(senior ? primary : mobility, 'Light movement and stretching'),
    rest,
  ];
  return days.map((day, index) => ({ day: week[index], ...day }));
}
