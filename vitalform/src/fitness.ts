import { tiers, type Budget, type DiscoveryItem, type Environment, type Goal } from './context';

export type Muscle = 'Shoulders' | 'Chest' | 'Back' | 'Core' | 'Glutes' | 'Legs';
export type ExerciseMotion =
  | 'squat' | 'jump' | 'incline-push' | 'plank' | 'hinge' | 'bridge' | 'lunge' | 'reach' | 'march'
  | 'shoulder-roll' | 'seated-roll' | 'split-squat' | 'band-row' | 'dumbbell-row' | 'chest-press' | 'leg-press' | 'goblet-squat'
  | 'ankle-pump' | 'seated-reach' | 'neck-glide' | 'wall-push' | 'bird-dog' | 'calf-raise' | 'chair-march'
  | 'chair-stand' | 'chair-yoga' | 'tandem-walk' | 'morning-stretch' | 'sun-salutation';
export interface Exercise {
  name: string; cue: string; muscles: Muscle[]; motion: ExerciseMotion; reps: number;
}
export interface Workout {
  id: string; name: string; description: string; gear: string; cost: number; quiet: boolean;
  rounds: number; work: number; rest: number; exercises: Exercise[]; tags: Goal[];
}
const squat: Exercise = { name: 'Bodyweight squat', cue: 'Sit back and down with heels planted. Let your knees follow your toes.', muscles: ['Glutes', 'Legs'], motion: 'squat', reps: 10 };
const jump: Exercise = { name: 'Squat jump', cue: 'Use a small jump and land softly with bent knees. Replace with bodyweight squats for lower impact.', muscles: ['Glutes', 'Legs'], motion: 'jump', reps: 8 };
const push: Exercise = { name: 'Incline push-up', cue: 'Use a stable counter. Keep your ribs and hips in line as you bend your elbows.', muscles: ['Chest', 'Shoulders', 'Core'], motion: 'incline-push', reps: 10 };
const plank: Exercise = { name: 'Forearm plank', cue: 'Place elbows below shoulders. Brace gently and keep breathing.', muscles: ['Core', 'Shoulders'], motion: 'plank', reps: 0 };
const hinge: Exercise = { name: 'Standing hip hinge', cue: 'Soften your knees. Push your hips back with a long, neutral spine.', muscles: ['Back', 'Glutes', 'Legs'], motion: 'hinge', reps: 12 };
const bridge: Exercise = { name: 'Glute bridge', cue: 'Press through your heels and lift at the hips. Stop before your low back arches.', muscles: ['Core', 'Glutes'], motion: 'bridge', reps: 12 };
const lunge: Exercise = { name: 'Reverse lunge', cue: 'Step one foot back. Drop straight down within your comfortable range, then alternate.', muscles: ['Glutes', 'Legs'], motion: 'lunge', reps: 10 };
const reach: Exercise = { name: 'Standing overhead reach', cue: 'Reach only as high as is comfortable. Let your shoulders relax and keep your ribs down.', muscles: ['Shoulders', 'Back'], motion: 'reach', reps: 10 };
const march: Exercise = { name: 'Controlled march', cue: 'Lift one knee at a time. Stay tall and place each foot gently on the floor.', muscles: ['Core', 'Legs'], motion: 'march', reps: 16 };
const roll: Exercise = { name: 'Shoulder rolls', cue: 'Lift, roll back and lower your shoulders slowly. Keep your jaw relaxed.', muscles: ['Shoulders', 'Back'], motion: 'shoulder-roll', reps: 10 };
const split: Exercise = { name: 'Supported split squat', cue: 'Lightly hold a fixed support. Lower and rise without shifting your front foot.', muscles: ['Glutes', 'Legs'], motion: 'split-squat', reps: 10 };
const band: Exercise = { name: 'Resistance-band row', cue: 'Use an undamaged band and secure anchor. Pull your elbows back without shrugging.', muscles: ['Back', 'Shoulders'], motion: 'band-row', reps: 12 };
const row: Exercise = { name: 'Dumbbell row', cue: 'Brace against a stable bench. Pull the dumbbell toward your hip, then lower slowly.', muscles: ['Back', 'Shoulders'], motion: 'dumbbell-row', reps: 12 };
const press: Exercise = { name: 'Machine chest press', cue: 'Set the handles near mid-chest. Press smoothly without locking your elbows.', muscles: ['Chest', 'Shoulders'], motion: 'chest-press', reps: 10 };
const legPress: Exercise = { name: 'Machine leg press', cue: 'Keep feet flat and hips against the pad. Move in a comfortable range without locking your knees.', muscles: ['Glutes', 'Legs'], motion: 'leg-press', reps: 10 };
const goblet: Exercise = { name: 'Goblet squat', cue: 'Hold a light weight near your chest. Keep your heels grounded throughout each rep.', muscles: ['Core', 'Glutes', 'Legs'], motion: 'goblet-squat', reps: 10 };
const ankle: Exercise = { name: 'Seated ankle pumps', cue: 'Sit in a stable chair. Slowly point and flex one foot within a comfortable range.', muscles: ['Legs'], motion: 'ankle-pump', reps: 8 };
const seatedRoll: Exercise = { ...roll, motion: 'seated-roll', name: 'Seated shoulder rolls', cue: 'Sit tall with both feet supported. Keep your jaw relaxed and make small circles.' };
const seatedReach: Exercise = { ...reach, motion: 'seated-reach', name: 'Comfortable seated reach', cue: 'Keep your feet supported. Raise your arms only as far as comfortable and lower slowly.' };
const neck: Exercise = { name: 'Seated neck glides', cue: 'Look level, then gently draw your chin straight back. Release without tipping your head.', muscles: ['Shoulders'], motion: 'neck-glide', reps: 5 };
const wall: Exercise = { name: 'Wall push-ups', cue: 'Place your palms on a solid wall at chest height. Bend your elbows slowly and keep your body long.', muscles: ['Chest', 'Shoulders', 'Core'], motion: 'wall-push', reps: 6 };
const birdDog: Exercise = { name: 'Bird-dog', cue: 'Start with hands under shoulders and knees under hips. Extend opposite limbs only as far as you can keep hips level.', muscles: ['Back', 'Core', 'Glutes'], motion: 'bird-dog', reps: 6 };
const calf: Exercise = { name: 'Supported calf raises', cue: 'Hold a fixed support. Rise onto the balls of both feet slowly, then lower with control.', muscles: ['Legs'], motion: 'calf-raise', reps: 6 };
const chairMarch: Exercise = { name: 'Chair marches', cue: 'Sit tall on a stable chair. Raise one bent knee gently, lower it, then switch sides.', muscles: ['Core', 'Legs'], motion: 'chair-march', reps: 6 };
const chairStand: Exercise = { name: 'Chair sit-to-stand', cue: 'Use a stable chair against a wall and plant both feet. Use arm support if needed. Lower with control.', muscles: ['Glutes', 'Legs'], motion: 'chair-stand', reps: 5 };
const chairYoga: Exercise = { name: 'Seated chair yoga', cue: 'Sit tall, open your arms gently, then return your hands to your lap. Keep the stretch pain-free.', muscles: ['Shoulders', 'Chest', 'Back'], motion: 'chair-yoga', reps: 5 };
const tandem: Exercise = { name: 'Supported tandem balance walk', cue: 'Keep a hand on a fixed rail or counter. If steady, take small heel-to-toe steps. Skip the walk if you feel unsteady.', muscles: ['Core', 'Legs'], motion: 'tandem-walk', reps: 6 };
const stretch: Exercise = { name: 'Gentle morning stretch', cue: 'Sit comfortably with feet supported. Reach one arm diagonally upward, keeping your shoulders relaxed, then alternate.', muscles: ['Shoulders', 'Back'], motion: 'morning-stretch', reps: 6 };
const salute: Exercise = { name: 'Sun Salutation', cue: 'Follow the modified step-back flow slowly. Use a mat, bend your knees where useful and skip any position that causes discomfort.', muscles: ['Chest', 'Shoulders', 'Back', 'Core', 'Legs'], motion: 'sun-salutation', reps: 0 };

export const seatedExercises = [seatedRoll, ankle, seatedReach, chairMarch, neck, chairYoga, stretch];
export const supportedExercises = [wall, chairStand, calf, tandem];
export const exerciseLibrary = [
  roll, neck, wall, squat, birdDog, calf, chairMarch, chairStand, chairYoga, ankle, tandem, stretch, salute,
  jump, push, plank, hinge, bridge, lunge, reach, march, split, band, row, press, legPress, goblet, seatedRoll, seatedReach,
];

export function workoutMinutes(workout: Workout) {
  const intervals = workout.exercises.length * workout.rounds;
  return Math.ceil((intervals * workout.work + (intervals - 1) * workout.rest) / 60);
}

export function easyMovement(environment: Environment, adjusted = false): Workout {
  return {
    id: `${environment}-easy-mobility`, name: adjusted ? 'Gentle seated mobility' : '7-minute mobility reset',
    description: 'A quiet, equipment-free reset. Move slowly and stop if symptoms increase.',
    quiet: true, gear: 'Stable chair', cost: 0, rounds: 2, work: 45, rest: 28,
    exercises: [seatedRoll, ankle, seatedReach], tags: ['Sustained Energy'],
  };
}

export function familyWorkouts(seatedOnly = false): Workout[] {
  const mobility: Workout = {
    id: 'family-mobility', name: 'Seated mobility & chair yoga',
    description: 'Gentle upper- and lower-body movement from a stable chair.',
    quiet: true, gear: 'Stable chair', cost: 0, rounds: 1, work: 50, rest: 15,
    exercises: [seatedRoll, ankle, chairMarch, neck, chairYoga, stretch], tags: ['Sustained Energy'],
  };
  if (seatedOnly) return [mobility];
  return [mobility, {
    id: 'family-supported', name: 'Supported strength & balance',
    description: 'Chair, wall and fixed-rail practice. Choose the seated session if balance is difficult.',
    quiet: true, gear: 'Chair, wall & fixed rail', cost: 0, rounds: 1, work: 45, rest: 20,
    exercises: supportedExercises, tags: ['Sustained Energy'],
  }];
}

export function workoutsFor(environment: Environment, budget: Budget): Workout[] {
  const tier = tiers.indexOf(budget);
  const short = {
    home: { name: 'Morning Mobility Flow', description: 'Wake up your hips and shoulders with a gentle full-body reset.', exercises: [roll, hinge, reach] },
    pg: { name: 'Quiet Room Mobility', description: 'Unwind in a narrow space with three slow standing movements.', exercises: [roll, reach, split] },
    office: { name: 'Desk Stretch Break', description: 'Reset your posture between meetings or after a long journey.', exercises: [roll, reach, march] },
    gym: { name: 'Studio Warm-Up', description: 'Move your hips, shoulders and core before your first working set.', exercises: [march, hinge, reach] },
  }[environment];
  const primary = {
    home: { name: 'Total Body HIIT Circuit', description: 'A full-body interval circuit with squats, marching and core work.', exercises: [jump, march, push, plank], quiet: false, gear: 'Zero equipment', cost: 0 },
    pg: { name: 'Silent PG Core & Push-up Circuit', description: 'Low-impact holds and upper-body work that fit a shared room.', exercises: [push, plank, squat, bridge], quiet: true, gear: 'Zero equipment', cost: 0 },
    office: { name: 'Standing Travel Circuit', description: 'A no-floor circuit built for a small office or hotel room.', exercises: [march, split, push, hinge], quiet: true, gear: 'Wall or stable counter', cost: 0 },
    gym: tier === 0
      ? { name: 'Bodyweight Studio Circuit', description: 'Full-body training with floor space and a stable wall.', exercises: [squat, push, lunge, plank], quiet: true, gear: 'Zero equipment', cost: 0 }
      : { name: 'Gym Strength Foundations', description: 'Practice controlled compound movements with commercial equipment.', exercises: [legPress, press, row, plank], quiet: true, gear: 'Machines & dumbbell', cost: [0, 650, 2400, 7200][tier] },
  }[environment];
  const equipment = {
    home: ['Zero equipment', 'Resistance band', 'Dumbbells', 'Adjustable weights'],
    pg: ['Zero equipment', 'Resistance band', 'Resistance band', 'Premium resistance band'],
    office: ['Zero equipment', 'Zero equipment', 'Zero equipment', 'Zero equipment'],
    gym: ['Zero equipment', 'Gym access', 'Gym access', 'Studio access'],
  }[environment][tier];
  const resistance = tier === 0 || environment === 'office' ? push : environment === 'pg' || (environment === 'home' && tier === 1) ? band : row;
  const lower = tier >= 2 && (environment === 'home' || environment === 'gym') ? goblet : split;
  const cost = environment === 'office' ? 0 : environment === 'pg' ? [0, 329, 890, 1690][tier] : [0, 690, 3790, 7900][tier];
  return [
    { ...primary, id: `${environment}-signature`, rounds: 3, work: 40, rest: 30, tags: ['Fat Loss', 'Muscle Gain', 'Sustained Energy'] },
    { ...short, id: `${environment}-quick`, rounds: 2, work: 35, rest: 20, cost: 0, gear: 'Zero equipment', quiet: true, tags: ['Sustained Energy'] },
    {
      id: `${environment}-strength-${budget}`, name: environment === 'pg' ? 'Quiet Room Strength Session' : environment === 'office' ? 'Hotel Room Strength Session' : 'Progressive Strength Session',
      description: 'Five rounds of controlled strength work with time to rest between intervals.',
      exercises: [lower, resistance, hinge, environment === 'office' ? push : bridge, lunge, environment === 'office' ? march : plank],
      gear: equipment, cost, quiet: true, rounds: 5, work: 40, rest: 30, tags: ['Muscle Gain'],
    },
  ];
}

export function fitnessDiscovery(environment: Environment, budget: Budget, workouts = workoutsFor(environment, budget)): DiscoveryItem[] {
  return workouts.map(workout => ({
    id: workout.id, target: workout.id, pillar: 'fitness', title: workout.name, description: workout.description,
    amount: workout.cost, minutes: workoutMinutes(workout), tags: workout.tags,
  }));
}
