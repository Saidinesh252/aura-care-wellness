import { type ExerciseMotion } from './fitness';

export type Point = readonly [number, number];
type Limb = readonly [Point, Point, Point];
export interface RigPose {
  head: Point;
  arms: readonly [Limb, Limb];
  legs: readonly [Limb, Limb];
  toes: readonly [Point, Point];
}

type Equipment = 'chair' | 'wall' | 'counter' | 'mat' | 'rail' | 'band' | 'bench' | 'chest-machine' | 'leg-machine' | 'kettlebell';
type Guide = 'shoulder-arcs' | 'knee-line' | 'ankle-arcs' | 'footsteps' | 'spine-line';
export interface MotionFrame { pose: RigPose; cue: string; breath: string }
export interface MotionSequence {
  frames: MotionFrame[];
  seconds: number;
  equipment?: Equipment;
  guide?: Guide;
}

const stand: RigPose = {
  head: [180, 43],
  arms: [[[164, 66], [154, 91], [146, 116]], [[196, 66], [206, 91], [214, 116]]],
  legs: [[[172, 112], [166, 143], [163, 176]], [[188, 112], [194, 143], [197, 176]]],
  toes: [[152, 181], [208, 181]],
};

const side: RigPose = {
  head: [184, 43],
  arms: [[[174, 66], [170, 93], [167, 118]], [[184, 65], [184, 92], [187, 118]]],
  legs: [[[173, 112], [170, 144], [170, 176]], [[181, 111], [185, 143], [187, 175]]],
  toes: [[184, 181], [201, 180]],
};

const seated: RigPose = {
  head: [163, 51],
  arms: [[[153, 74], [151, 102], [174, 118]], [[169, 73], [173, 100], [195, 114]]],
  legs: [[[151, 121], [187, 128], [184, 176]], [[164, 119], [198, 125], [198, 175]]],
  toes: [[198, 181], [211, 180]],
};

const grounded: RigPose = {
  head: [215, 115],
  arms: [[[196, 134], [198, 158], [198, 179]], [[205, 130], [210, 154], [212, 177]]],
  legs: [[[147, 134], [145, 171], [124, 176]], [[152, 129], [156, 168], [135, 174]]],
  toes: [[115, 180], [126, 178]],
};

function offset(pose: RigPose, x: number, y: number): RigPose {
  const point = ([a, b]: Point): Point => [a + x, b + y];
  const limb = ([a, b, c]: Limb): Limb => [point(a), point(b), point(c)];
  return { head: point(pose.head), arms: [limb(pose.arms[0]), limb(pose.arms[1])], legs: [limb(pose.legs[0]), limb(pose.legs[1])], toes: [point(pose.toes[0]), point(pose.toes[1])] };
}

function mixPose(a: RigPose, b: RigPose, amount: number): RigPose {
  const point = (p: Point, q: Point): Point => [p[0] + (q[0] - p[0]) * amount, p[1] + (q[1] - p[1]) * amount];
  const limb = (p: Limb, q: Limb): Limb => [point(p[0], q[0]), point(p[1], q[1]), point(p[2], q[2])];
  return { head: point(a.head, b.head), arms: [limb(a.arms[0], b.arms[0]), limb(a.arms[1], b.arms[1])], legs: [limb(a.legs[0], b.legs[0]), limb(a.legs[1], b.legs[1])], toes: [point(a.toes[0], b.toes[0]), point(a.toes[1], b.toes[1])] };
}

export function frameAt(sequence: MotionSequence, progress: number) {
  const frameCount = sequence.frames.length - 1;
  const position = Math.max(0, Math.min(1, progress)) * frameCount;
  const index = Math.min(frameCount - 1, Math.floor(position));
  const phase = position - index;
  const eased = phase * phase * (3 - 2 * phase);
  const first = sequence.frames[index];
  return { index: Math.round(position) % frameCount, pose: mixPose(first.pose, sequence.frames[index + 1].pose, eased) };
}

const frame = (pose: RigPose, cue: string, breath: string): MotionFrame => ({ pose, cue, breath });
function loop(seconds: number, frames: MotionFrame[], equipment?: Equipment, guide?: Guide): MotionSequence {
  return { seconds, frames: [...frames, { ...frames[0] }], equipment, guide };
}

function pair(seconds: number, before: MotionFrame, after: MotionFrame, equipment?: Equipment, guide?: Guide) {
  return loop(seconds, [before, after], equipment, guide);
}

const crouch: RigPose = {
  head: [190, 76],
  arms: [[[175, 98], [195, 114], [218, 106]], [[185, 91], [206, 106], [226, 99]]],
  legs: [[[159, 129], [190, 143], [171, 176]], [[166, 123], [199, 138], [188, 175]]],
  toes: side.toes,
};
const hinge: RigPose = {
  head: [211, 80],
  arms: [[[187, 93], [189, 118], [189, 144]], [[198, 90], [200, 115], [199, 140]]],
  legs: [[[149, 117], [170, 146], [170, 176]], [[156, 111], [182, 141], [187, 175]]],
  toes: side.toes,
};
const armsUp: RigPose = {
  ...stand,
  arms: [[[164, 66], [150, 45], [151, 20]], [[196, 66], [210, 45], [209, 20]]],
};
const openChest: RigPose = {
  ...seated,
  head: [163, 48],
  arms: [[[152, 70], [132, 84], [109, 86]], [[170, 69], [192, 81], [214, 77]]],
};
const reachSeat: RigPose = {
  ...seated,
  arms: [[[152, 72], [134, 54], [125, 34]], [[170, 71], [189, 53], [198, 32]]],
};
function offsetArms(pose: RigPose, offsets: readonly [Point, Point, Point]) {
  const shift = ([point, delta]: [Point, Point], mirror: number): Point => [point[0] + mirror * delta[0], point[1] + delta[1]];
  const shiftLimb = ([shoulder, elbow, wrist]: Limb, mirror: number): Limb => [
    shift([shoulder, offsets[0]], mirror), shift([elbow, offsets[1]], mirror), shift([wrist, offsets[2]], mirror),
  ];
  return { ...pose, arms: [shiftLimb(pose.arms[0], -1), shiftLimb(pose.arms[1], 1)] as const };
}
const shoulderRoll = (pose: RigPose, equipment?: Equipment) => loop(4, [
  frame(pose, 'Let the arms hang softly', 'Breathe in'),
  frame(offsetArms(pose, [[2, -8], [4, -7], [4, -5]]), 'Float both shoulders up', 'Inhale up'),
  frame(offsetArms(pose, [[5, -2], [6, 1], [8, 1]]), 'Circle back and lower slowly', 'Exhale back and down'),
  frame(offsetArms(pose, [[0, 2], [0, 2], [0, 1]]), 'Relax at the bottom', 'Let your breath settle'),
], equipment, 'shoulder-arcs');

const lungeStand: RigPose = {
  ...side, head: [184, 43],
  legs: [[[173, 110], [161, 142], [146, 174]], [[180, 110], [197, 140], [206, 176]]],
  toes: [[155, 181], [220, 181]],
};
const lungeDepth: RigPose = {
  ...lungeStand, head: [188, 64], arms: offset(side, 4, 21).arms,
  legs: [[[174, 129], [167, 162], [146, 175]], [[182, 129], [206, 144], [206, 176]]],
};
const lungeFarStep: RigPose = {
  ...lungeStand, legs: [[[173, 110], [193, 142], [206, 176]], [[180, 110], [164, 143], [146, 174]]],
  toes: [[220, 181], [155, 181]],
};
const lungeFarDepth: RigPose = {
  ...lungeFarStep, head: lungeDepth.head, arms: lungeDepth.arms,
  legs: [[[174, 129], [205, 144], [206, 176]], [[182, 129], [170, 161], [146, 175]]],
};
const nearMarch: RigPose = {
  ...stand,
  arms: [[[164, 66], [151, 94], [156, 116]], [[196, 66], [210, 89], [226, 89]]],
  legs: [[[172, 112], [149, 136], [155, 160]], stand.legs[1]], toes: [[145, 164], stand.toes[1]],
};
const farMarch: RigPose = {
  ...stand,
  arms: [[[164, 66], [150, 89], [134, 89]], [[196, 66], [209, 94], [204, 116]]],
  legs: [stand.legs[0], [[188, 112], [211, 136], [205, 160]]], toes: [stand.toes[0], [215, 164]],
};

const inclineHigh: RigPose = {
  head: [225, 76],
  arms: [[[208, 93], [225, 110], [246, 124]], [[216, 91], [234, 109], [252, 123]]],
  legs: [[[166, 127], [140, 151], [114, 175]], [[171, 124], [146, 148], [121, 173]]],
  toes: [[124, 181], [132, 180]],
};
const inclineLow: RigPose = {
  ...inclineHigh,
  head: [241, 107],
  arms: [[[217, 117], [204, 138], [246, 124]], [[226, 114], [217, 134], [252, 123]]],
  legs: [[[168, 146], [143, 159], [114, 175]], [[173, 142], [148, 155], [121, 173]]],
};
const wallHigh: RigPose = {
  head: [176, 44],
  arms: [[[165, 68], [195, 71], [224, 71]], [[174, 66], [202, 68], [229, 68]]],
  legs: [[[153, 114], [145, 146], [136, 176]], [[160, 113], [153, 144], [144, 175]]],
  toes: [[150, 181], [158, 180]],
};
const wallLow: RigPose = {
  ...wallHigh, head: [208, 48],
  arms: [[[192, 70], [181, 96], [224, 71]], [[201, 68], [193, 91], [229, 68]]],
  legs: [[[166, 114], [151, 146], [136, 176]], [[173, 113], [158, 144], [144, 175]]],
};
const plank: RigPose = {
  head: [242, 127],
  arms: [[[226, 145], [225, 174], [247, 177]], [[233, 143], [232, 170], [254, 175]]],
  legs: [[[174, 149], [141, 159], [109, 174]], [[177, 145], [146, 157], [114, 171]]],
  toes: [[118, 182], [123, 180]],
};
const floorBridge: RigPose = {
  head: [116, 165],
  arms: [[[134, 170], [160, 177], [184, 178]], [[135, 166], [161, 171], [184, 174]]],
  legs: [[[184, 166], [215, 137], [228, 176]], [[187, 162], [220, 133], [234, 174]]],
  toes: [[243, 181], [249, 179]],
};
const liftBridge: RigPose = {
  ...floorBridge, legs: [[[181, 142], [215, 137], [228, 176]], [[184, 137], [220, 133], [234, 174]]],
};

const chairNearMarch: RigPose = {
  ...seated,
  legs: [[[151, 120], [187, 106], [193, 144]], seated.legs[1]],
  toes: [[207, 150], seated.toes[1]],
};
const chairFarMarch: RigPose = {
  ...seated,
  legs: [seated.legs[0], [[164, 119], [198, 102], [206, 140]]],
  toes: [seated.toes[0], [220, 146]],
};
const ankleLevel: RigPose = {
  ...seated, legs: [[[151, 121], [187, 128], [219, 155]], seated.legs[1]], toes: [[233, 157], seated.toes[1]],
};
const ankleFlex: RigPose = { ...ankleLevel, toes: [[226, 143], seated.toes[1]] };
const anklePoint: RigPose = { ...ankleLevel, toes: [[234, 165], seated.toes[1]] };

const chairLean: RigPose = {
  ...seated, head: [193, 81],
  arms: [[[169, 100], [180, 121], [203, 126]], [[181, 96], [192, 115], [213, 120]]],
  legs: [[[151, 125], [184, 138], [184, 176]], [[164, 122], [197, 133], [198, 175]]],
};
const chairStanding: RigPose = {
  ...offset(side, 15, 0), legs: [[[178, 112], [180, 145], [184, 176]], [[190, 111], [196, 143], [198, 175]]], toes: seated.toes,
};
const supportStand: RigPose = {
  ...side, head: [179, 43], arms: [[[171, 68], [195, 82], [222, 100]], [[182, 66], [204, 81], [227, 98]]],
};
const supportRaised: RigPose = {
  ...offset(supportStand, 2, -8),
  arms: [[[173, 60], [198, 77], [222, 100]], [[184, 58], [207, 75], [227, 98]]],
  toes: supportStand.toes,
};
const stepLeft: RigPose = {
  ...supportStand, head: [173, 44],
  arms: [[[164, 70], [193, 84], [222, 100]], [[176, 67], [203, 81], [227, 98]]],
  legs: [[[170, 113], [159, 145], [145, 175]], [[178, 112], [186, 140], [189, 160]]],
  toes: [[160, 181], [202, 165]],
};
const stepRight: RigPose = {
  ...supportStand, head: [187, 44],
  arms: [[[176, 70], [200, 85], [222, 100]], [[187, 67], [210, 81], [227, 98]]],
  legs: [[[178, 113], [175, 143], [160, 164]], [[187, 112], [200, 145], [218, 175]]],
  toes: [[173, 168], [233, 181]],
};

const birdNear: RigPose = {
  ...grounded,
  arms: [[[196, 134], [223, 131], [248, 128]], grounded.arms[1]],
  legs: [grounded.legs[0], [[152, 129], [120, 129], [87, 130]]],
  toes: [grounded.toes[0], [77, 136]],
};
const birdFar: RigPose = {
  ...grounded,
  arms: [grounded.arms[0], [[205, 130], [232, 128], [256, 125]]],
  legs: [[[147, 134], [115, 134], [82, 135]], grounded.legs[1]],
  toes: [[73, 140], grounded.toes[1]],
};

const dumbbellLow: RigPose = {
  ...hinge, head: [216, 91],
  arms: [[[187, 113], [181, 142], [173, 167]], [[202, 112], [219, 138], [233, 149]]],
};
const dumbbellHigh: RigPose = {
  ...dumbbellLow,
  arms: [[[187, 113], [157, 108], [166, 134]], dumbbellLow.arms[1]],
};
const bandForward: RigPose = {
  ...side,
  arms: [[[174, 67], [197, 79], [230, 81]], [[184, 65], [211, 76], [238, 77]]],
};
const bandPulled: RigPose = {
  ...side,
  arms: [[[174, 67], [144, 81], [172, 91]], [[184, 65], [157, 80], [183, 86]]],
};
const machineReady: RigPose = {
  ...seated,
  arms: [[[153, 75], [139, 93], [163, 88]], [[169, 73], [158, 89], [180, 85]]],
};
const machinePressed: RigPose = {
  ...seated,
  arms: [[[153, 75], [179, 84], [203, 87]], [[169, 73], [194, 80], [218, 83]]],
};
const legReady: RigPose = {
  head: [123, 90],
  arms: [[[135, 112], [132, 137], [158, 146]], [[145, 109], [142, 133], [170, 140]]],
  legs: [[[165, 151], [192, 123], [218, 137]], [[174, 146], [201, 119], [226, 133]]],
  toes: [[224, 129], [232, 125]],
};
const legPressed: RigPose = {
  ...legReady,
  legs: [[[165, 151], [201, 130], [237, 111]], [[174, 146], [211, 125], [245, 105]]],
  toes: [[246, 109], [254, 103]],
};
const gobletStand: RigPose = {
  ...side,
  arms: [[[174, 66], [185, 89], [201, 70]], [[184, 65], [195, 87], [209, 70]]],
};
const gobletDepth: RigPose = {
  ...crouch,
  arms: [[[175, 98], [186, 121], [205, 101]], [[185, 91], [196, 115], [213, 99]]],
};
const stretchLeft: RigPose = {
  ...seated, head: [154, 52],
  arms: [[[145, 74], [132, 55], [120, 37]], seated.arms[1]],
};
const stretchRight: RigPose = {
  ...seated, head: [170, 50],
  arms: [seated.arms[0], [[171, 71], [194, 57], [206, 39]]],
};

const yogaFold: RigPose = {
  ...side, head: [218, 145],
  arms: [[[198, 132], [206, 158], [219, 177]], [[203, 128], [215, 153], [229, 176]]],
  legs: [[[173, 112], [181, 146], [170, 176]], [[181, 111], [190, 143], [187, 175]]],
};
const yogaHalf: RigPose = {
  ...yogaFold, head: [222, 91],
  arms: [[[202, 102], [198, 126], [181, 145]], [[208, 100], [208, 124], [190, 142]]],
};
const yogaStep: RigPose = {
  ...grounded, head: [231, 104],
  arms: [[[210, 122], [218, 150], [224, 177]], [[218, 119], [227, 147], [234, 175]]],
  legs: [[[169, 132], [132, 153], [97, 174]], [[177, 127], [205, 134], [204, 173]]],
  toes: [[109, 181], [218, 179]],
};
const yogaPlank: RigPose = {
  ...yogaStep, head: [245, 120],
  arms: [[[225, 136], [225, 156], [224, 177]], [[233, 134], [234, 153], [234, 175]]],
  legs: [[[169, 147], [131, 157], [97, 174]], [[178, 144], [141, 155], [106, 172]]],
  toes: [[109, 181], [118, 179]],
};
const yogaDog: RigPose = {
  ...yogaPlank, head: [196, 146],
  arms: [[[181, 126], [201, 150], [224, 177]], [[189, 123], [210, 148], [234, 175]]],
  legs: [[[145, 90], [124, 130], [97, 174]], [[153, 88], [132, 127], [106, 172]]],
};

export const motionSequences: Record<ExerciseMotion, MotionSequence> = {
  squat: pair(4.4, frame(side, 'Plant your heels and stand tall', 'Inhale to prepare'), frame(crouch, 'Sit your hips back and track your knees over your toes', 'Exhale as you rise'), undefined, 'knee-line'),
  jump: loop(3.5, [
    frame(side, 'Set your feet and soften your knees', 'Inhale to prepare'),
    frame(crouch, 'Load a shallow squat', 'Breathe in'),
    frame(offset(side, 0, -21), 'Use a small jump', 'Exhale through the rise'),
    frame(crouch, 'Land gently with bent knees', 'Breathe in as you land'),
  ], undefined, 'knee-line'),
  'incline-push': pair(4.4, frame(inclineHigh, 'Brace against the counter with your body long', 'Inhale as your elbows bend'), frame(inclineLow, 'Bring your chest toward the counter', 'Exhale as you press away'), 'counter', 'spine-line'),
  plank: pair(4, frame(plank, 'Align shoulders over elbows', 'Breathe in gently'), frame({ ...plank, head: [242, 126], legs: [[[174, 147], plank.legs[0][1], plank.legs[0][2]], plank.legs[1]] }, 'Keep hips level and glutes lightly engaged', 'Exhale without holding your breath'), 'mat', 'spine-line'),
  hinge: pair(4.3, frame(side, 'Stand tall, then soften both knees', 'Breathe in'), frame(hinge, 'Push your hips back and keep a long spine', 'Exhale as you stand'), undefined, 'spine-line'),
  bridge: pair(4.4, frame(floorBridge, 'Keep feet planted and shoulders relaxed', 'Breathe in'), frame(liftBridge, 'Lift hips without arching your lower back', 'Exhale on the lift'), 'mat'),
  lunge: loop(9.3, [
    frame(side, 'Stand with feet comfortably apart', 'Breathe in'),
    frame(lungeStand, 'Step one foot back', 'Inhale as you step'),
    frame(lungeDepth, 'Bend both knees in a comfortable range', 'Exhale as you rise'),
    frame(side, 'Return to standing', 'Take a calm breath'),
    frame(lungeFarStep, 'Step back with the other foot', 'Inhale as you step'),
    frame(lungeFarDepth, 'Lower under control', 'Exhale as you rise'),
  ], undefined, 'knee-line'),
  reach: pair(4.8, frame(stand, 'Stand tall with shoulders relaxed', 'Inhale to prepare'), frame(armsUp, 'Reach up within a comfortable range', 'Exhale on the reach')),
  march: loop(4.4, [frame(stand, 'Stand tall and steady', 'Breathe naturally'), frame(nearMarch, 'Raise one bent knee gently', 'Exhale as you lift'), frame(stand, 'Set your foot down softly', 'Breathe in'), frame(farMarch, 'Lift the other knee', 'Exhale as you lift')]),
  'shoulder-roll': shoulderRoll(stand),
  'seated-roll': shoulderRoll(seated, 'chair'),
  'split-squat': pair(4.8, frame({ ...lungeStand, arms: supportStand.arms }, 'Stagger your feet and hold the fixed support', 'Inhale to prepare'), frame({ ...lungeDepth, arms: [[[175, 92], [198, 102], [222, 100]], [[184, 88], [208, 101], [227, 98]]] }, 'Lower as far as comfortable without shifting your feet', 'Exhale on the return'), 'rail', 'knee-line'),
  'band-row': pair(4.4, frame(bandForward, 'Set the band on a fixed anchor around chest height', 'Inhale with arms forward'), frame(bandPulled, 'Draw both elbows behind you without shrugging', 'Exhale as you pull'), 'band'),
  'dumbbell-row': pair(4.4, frame(dumbbellLow, 'Brace your other hand on a stable bench', 'Breathe in'), frame(dumbbellHigh, 'Draw the weight toward your hip', 'Exhale as you pull'), 'bench', 'spine-line'),
  'chest-press': pair(4.4, frame(machineReady, 'Sit with handles at chest height', 'Inhale as the handles return'), frame(machinePressed, 'Press forward without locking your elbows', 'Exhale as you press'), 'chest-machine'),
  'leg-press': pair(5.2, frame(legReady, 'Set your heels on the plate and keep hips supported', 'Inhale as your knees bend'), frame(legPressed, 'Press smoothly and keep knees soft', 'Exhale as you press'), 'leg-machine'),
  'goblet-squat': pair(4.4, frame(gobletStand, 'Hold the weight near your chest', 'Inhale to prepare'), frame(gobletDepth, 'Sit between your hips and keep your heels planted', 'Exhale as you stand'), 'kettlebell', 'knee-line'),
  'ankle-pump': loop(5.2, [frame(ankleLevel, 'Sit tall and support the working leg comfortably', 'Breathe naturally'), frame(ankleFlex, 'Draw your toes gently toward you', 'Breathe in'), frame(anklePoint, 'Point the toes only as far as feels comfortable', 'Breathe out')], 'chair', 'ankle-arcs'),
  'seated-reach': pair(4.8, frame(seated, 'Keep both feet supported', 'Breathe in'), frame(reachSeat, 'Reach up gently without arching', 'Breathe out'), 'chair'),
  'neck-glide': pair(4.8, frame(seated, 'Keep your eyes level and shoulders relaxed', 'Breathe in'), frame({ ...seated, head: [156, 52] }, 'Draw your chin gently back without tipping your head', 'Exhale slowly'), 'chair'),
  'wall-push': pair(4.4, frame(wallHigh, 'Plant both palms on the wall at chest height', 'Inhale as your elbows bend'), frame(wallLow, 'Bring your chest toward the wall and keep a long body line', 'Exhale as you press away'), 'wall', 'spine-line'),
  'bird-dog': loop(8, [frame(grounded, 'Set your hands under shoulders and knees under hips', 'Inhale to prepare'), frame(birdNear, 'Reach one arm and the opposite leg, keeping hips level', 'Exhale on the reach'), frame(grounded, 'Return both limbs with control', 'Breathe in'), frame(birdFar, 'Repeat with your other arm and leg', 'Exhale on the reach')], 'mat', 'spine-line'),
  'calf-raise': pair(4.4, frame(supportStand, 'Hold a steady rail and ground both feet', 'Breathe in'), frame(supportRaised, 'Rise slowly onto the balls of both feet', 'Exhale on the rise'), 'rail'),
  'chair-march': loop(5.2, [frame(seated, 'Sit tall with both feet flat', 'Breathe naturally'), frame(chairNearMarch, 'Raise one bent knee a little', 'Exhale as you lift'), frame(seated, 'Lower the foot with control', 'Breathe in'), frame(chairFarMarch, 'Raise the other knee gently', 'Exhale as you lift')], 'chair'),
  'chair-stand': loop(7, [frame(seated, 'Sit near the front of a stable chair', 'Breathe in'), frame(chairLean, 'Lean forward slightly with both heels down', 'Prepare to breathe out'), frame(chairStanding, 'Rise and use hand support if needed', 'Exhale as you stand'), frame(chairLean, 'Reach your hips back and lower with control', 'Inhale as you sit')], 'chair', 'knee-line'),
  'chair-yoga': pair(6, frame(seated, 'Start tall with your hands resting on your lap', 'Breathe in and relax your shoulders'), frame(openChest, 'Open your arms gently without forcing the stretch', 'Breathe out as you return'), 'chair'),
  'tandem-walk': loop(6.4, [frame(supportStand, 'Hold a fixed rail and look ahead', 'Breathe naturally'), frame(stepLeft, 'Take a short step toward heel-to-toe placement', 'Breathe out on the step'), frame(supportStand, 'Regain balance before the next step', 'Take a calm breath'), frame(stepRight, 'Take a short step with the other foot', 'Breathe out on the step')], 'rail', 'footsteps'),
  'morning-stretch': loop(6.4, [frame(seated, 'Sit comfortably with your feet grounded', 'Inhale to prepare'), frame(stretchLeft, 'Reach one arm diagonally up', 'Exhale without straining'), frame(seated, 'Return to center and relax', 'Breathe in'), frame(stretchRight, 'Reach up with the other arm', 'Exhale gently')], 'chair'),
  'sun-salutation': loop(21, [
    frame(side, 'Mountain pose. Stand tall and steady', 'Breathe naturally'),
    frame(armsUp, 'Sweep your arms overhead', 'Inhale as you reach'),
    frame(yogaFold, 'Fold forward, bending your knees as needed', 'Exhale as you fold'),
    frame(yogaHalf, 'Lengthen your spine halfway up', 'Inhale and look down'),
    frame(yogaStep, 'Step one foot back, then the other', 'Exhale as you step'),
    frame(yogaPlank, 'Place hands beneath shoulders', 'Breathe steadily'),
    frame(yogaDog, 'Shift your hips up and back with soft knees', 'Exhale and keep breathing'),
    frame(yogaStep, 'Step forward one foot at a time', 'Breathe naturally'),
    frame(yogaFold, 'Fold with knees relaxed', 'Exhale'),
    frame(armsUp, 'Rise with control and reach upward', 'Inhale on the rise'),
  ], 'mat'),
};
