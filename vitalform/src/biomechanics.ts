import { frameAt, motionSequences, type MotionFrame, type Point, type RigPose, type MotionSequence } from './exerciseMotion';
import { type ExerciseMotion } from './fitness';

export type ViewAngle = 'side' | 'front';

type JointAngle = 'knee' | 'elbow' | 'hip' | 'trunk';
export interface FormMistakeSpec {
  title: string;
  faultCue: string;
  fixCue: string;
  affectedJoints: string[];
  sidePose?: RigPose;
  frontPose?: RigPose;
}

export interface BiomechanicalSpec {
  frontSequence?: MotionSequence;
  angle?: JointAngle;
  mistake: FormMistakeSpec;
}

// Front View Base Poses
const frontStand: RigPose = {
  head: [180, 42],
  arms: [
    [[162, 66], [152, 92], [144, 118]], // Right (Near)
    [[198, 66], [208, 92], [216, 118]], // Left (Far)
  ],
  legs: [
    [[171, 112], [168, 144], [165, 176]], // Right
    [[189, 112], [192, 144], [195, 176]], // Left
  ],
  toes: [[158, 181], [202, 181]],
};

const frontSquatSetup: RigPose = {
  ...frontStand,
  legs: [[[171, 112], [165, 143], [158, 176]], [[189, 112], [195, 143], [202, 176]]],
  toes: [[152, 181], [208, 181]],
};

const frontSquatDepth: RigPose = {
  head: [180, 78],
  arms: [
    [[160, 94], [150, 96], [140, 98]],
    [[200, 94], [210, 96], [220, 98]],
  ],
  legs: [
    [[168, 126], [155, 143], [158, 176]],
    [[192, 126], [205, 143], [202, 176]],
  ],
  toes: [[152, 181], [208, 181]],
};

const frontSquatMistakeValgus: RigPose = {
  head: [180, 82],
  arms: [
    [[160, 98], [152, 108], [145, 118]],
    [[200, 98], [208, 108], [215, 118]],
  ],
  legs: [
    [[168, 128], [178, 144], [158, 176]], // Knees collapse inwards touching
    [[192, 128], [182, 144], [202, 176]],
  ],
  toes: [[152, 174], [208, 174]], // Heels lifting
};

const sideSquatMistakeRoundSpine: RigPose = {
  head: [215, 84], // Head drops, excessive flexion
  arms: [
    [[190, 104], [205, 122], [215, 140]],
    [[200, 100], [215, 118], [225, 136]],
  ],
  legs: [
    [[154, 124], [198, 146], [178, 172]], // Heels off floor!
    [[162, 118], [204, 142], [194, 171]],
  ],
  toes: [[188, 174], [204, 173]],
};

// Push-up front poses
const frontPushHigh: RigPose = {
  head: [180, 70],
  arms: [
    [[164, 88], [154, 118], [146, 148]],
    [[196, 88], [206, 118], [214, 148]],
  ],
  legs: [
    [[174, 120], [172, 150], [170, 176]],
    [[186, 120], [188, 150], [190, 176]],
  ],
  toes: [[168, 180], [192, 180]],
};

const frontPushLow45: RigPose = {
  head: [180, 105],
  arms: [
    [[164, 118], [144, 128], [146, 148]], // 45 degree tuck
    [[196, 118], [216, 128], [214, 148]],
  ],
  legs: frontPushHigh.legs,
  toes: frontPushHigh.toes,
};

const frontPushMistakeFlared90: RigPose = {
  head: [180, 110],
  arms: [
    [[164, 120], [128, 120], [130, 148]], // Flared out 90 deg impingement
    [[196, 120], [232, 120], [230, 148]],
  ],
  legs: frontPushHigh.legs,
  toes: frontPushHigh.toes,
};

const sidePushMistakeSag: RigPose = {
  head: [228, 88],
  arms: [
    [[212, 105], [210, 132], [246, 124]],
    [[220, 102], [222, 128], [252, 123]],
  ],
  legs: [
    [[168, 144], [142, 158], [114, 175]], // Sagging belly/lumbar
    [[174, 140], [148, 154], [121, 173]],
  ],
  toes: [[124, 181], [132, 180]],
};

// Lunge Front Poses
const frontLungeStand: RigPose = { ...frontStand };
const frontLungeDepth: RigPose = {
  head: [180, 68],
  arms: [
    [[162, 88], [152, 112], [144, 134]],
    [[198, 88], [208, 112], [216, 134]],
  ],
  legs: [
    [[170, 122], [168, 152], [166, 176]], // Front knee stable over ankle
    [[190, 122], [192, 151], [194, 164]],
  ],
  toes: [[160, 181], [200, 169]],
};

const frontLungeMistakeWobble: RigPose = {
  head: [174, 70],
  arms: frontLungeDepth.arms,
  legs: [
    [[168, 122], [182, 150], [166, 176]], // Knee wobbling inwards
    [[192, 122], [206, 151], [194, 164]],
  ],
  toes: frontLungeDepth.toes,
};

const sideLungeMistakeForwardShift: RigPose = {
  head: [210, 70], // Torso tipped forward
  arms: [
    [[190, 92], [184, 118], [178, 142]],
    [[200, 90], [196, 116], [192, 140]],
  ],
  legs: [
    [[182, 126], [214, 152], [172, 175]], // Front knee shooting 4 inches past toes, heel up!
    [[174, 126], [152, 158], [136, 175]],
  ],
  toes: [[180, 174], [144, 181]],
};

// Shoulder Rolls Front
const frontRollDown: RigPose = { ...frontStand };
const frontRollUp: RigPose = {
  ...frontStand,
  head: [180, 42],
  arms: [
    [[162, 58], [150, 85], [142, 112]],
    [[198, 58], [210, 85], [218, 112]],
  ],
};
const frontRollBack: RigPose = {
  ...frontStand,
  head: [180, 42],
  arms: [
    [[160, 68], [146, 94], [140, 118]],
    [[200, 68], [214, 94], [220, 118]],
  ],
};

const frontRollMistake: RigPose = {
  ...frontRollUp,
  head: [180, 48],
  arms: [[[167, 54], [156, 82], [148, 110]], [[193, 54], [204, 82], [212, 110]]],
};

const sideRollMistakeTurtleNeck: RigPose = {
  head: [208, 48], // Craned forward neck
  arms: [
    [[182, 58], [178, 86], [174, 114]], // Shrugged up towards ears
    [[192, 56], [190, 84], [190, 112]],
  ],
  legs: [[[175, 112], [175, 143], [174, 176]], [[183, 111], [185, 142], [185, 175]]],
  toes: [[191, 181], [202, 180]],
};

// Plank Mistake
const sidePlankMistakeSag: RigPose = {
  head: [244, 118],
  arms: [
    [[226, 138], [225, 174], [247, 177]],
    [[233, 136], [232, 170], [254, 175]],
  ],
  legs: [
    [[172, 162], [140, 168], [109, 174]], // Hips sagging heavily
    [[176, 158], [145, 164], [114, 171]],
  ],
  toes: [[118, 182], [123, 180]],
};

// Hip Hinge Mistake
const sideHingeMistakeCatBack: RigPose = {
  head: [222, 98], // Dropped head
  arms: [
    [[182, 102], [182, 130], [180, 158]], // Dangling arms
    [[192, 99], [192, 127], [190, 154]],
  ],
  legs: [
    [[154, 112], [172, 146], [170, 176]], // Straight legs, zero hip hinge
    [[162, 108], [182, 142], [187, 175]],
  ],
  toes: [[184, 181], [201, 180]],
};

const frontPlank: RigPose = {
  head: [180, 112],
  arms: [[[154, 131], [149, 167], [151, 180]], [[206, 131], [211, 167], [209, 180]]],
  legs: [[[167, 142], [165, 147], [162, 153]], [[193, 142], [195, 147], [198, 153]]],
  toes: [[162, 158], [198, 158]],
};

const frontPlankMistake: RigPose = {
  ...frontPlank,
  legs: [[[167, 163], [165, 157], [162, 153]], [[193, 163], [195, 157], [198, 153]]],
};

const frontWallStart: RigPose = {
  ...frontStand,
  arms: [[[163, 68], [156, 70], [148, 71]], [[197, 68], [204, 70], [212, 71]]],
};

const frontWallBent: RigPose = {
  ...frontWallStart,
  head: [180, 46],
  arms: [[[163, 71], [142, 92], [148, 71]], [[197, 71], [218, 92], [212, 71]]],
};

const frontWallMistake: RigPose = {
  ...frontWallBent,
  arms: [[[163, 71], [117, 74], [148, 71]], [[197, 71], [243, 74], [212, 71]]],
};

const rollSideBase: RigPose = {
  head: [185, 42],
  arms: [[[177, 68], [176, 93], [177, 118]], [[187, 67], [188, 93], [189, 116]]],
  legs: [[[175, 112], [175, 143], [174, 176]], [[183, 111], [185, 142], [185, 175]]],
  toes: [[191, 181], [202, 180]],
};

function rollSideOffset(x: number, y: number): RigPose {
  const move = ([px, py]: Point): Point => [px + x, py + y];
  const moveArm = ([shoulder, elbow, wrist]: RigPose['arms'][number]): RigPose['arms'][number] => [move(shoulder), move(elbow), move(wrist)];
  return { ...rollSideBase, arms: [moveArm(rollSideBase.arms[0]), moveArm(rollSideBase.arms[1])] };
}

export const biomechanicalSpecs: Record<ExerciseMotion, BiomechanicalSpec> = {
  squat: {
    angle: 'knee',
    mistake: {
      title: 'Knees turning inward or heels lifting',
      faultCue: 'The knees drift toward each other and the heels lose contact as the squat deepens.',
      fixCue: 'Keep your whole foot planted, guide each knee along its toes, and stop at a comfortable depth.',
      affectedJoints: ['knee', 'spine', 'hip'],
      frontPose: frontSquatMistakeValgus,
      sidePose: sideSquatMistakeRoundSpine,
    },
    frontSequence: {
      seconds: 4.4,
      frames: [
        { pose: frontSquatSetup, cue: 'Start with both feet grounded', breath: 'Inhale to prepare' },
        { pose: frontSquatDepth, cue: 'Guide knees along your toes and keep your feet planted', breath: 'Keep breathing as you pause' },
        { pose: frontSquatSetup, cue: 'Stand tall and reset', breath: 'Reset breath' },
      ],
    },
  },

  'incline-push': {
    angle: 'elbow',
    mistake: {
      title: 'Elbows flaring or hips dropping',
      faultCue: 'The elbows flare to the sides and the hips drop relative to the shoulders.',
      fixCue: 'Use a stable counter, guide elbows diagonally back and move your chest and hips together.',
      affectedJoints: ['shoulder', 'elbow', 'spine'],
      frontPose: frontPushMistakeFlared90,
      sidePose: sidePushMistakeSag,
    },
    frontSequence: {
      seconds: 4.4, equipment: 'counter',
      frames: [
        { pose: frontPushHigh, cue: 'Hands slightly wider than shoulders, core braced', breath: 'Inhale lowering chest' },
        { pose: frontPushLow45, cue: 'Let your elbows point diagonally back', breath: 'Exhale pressing back' },
        { pose: frontPushHigh, cue: 'Return smoothly with relaxed shoulders', breath: 'Full breath reset' },
      ],
    },
  },

  plank: {
    angle: 'trunk',
    frontSequence: {
      seconds: 4, equipment: 'mat',
      frames: [
        { pose: frontPlank, cue: 'Keep both shoulders at the same height', breath: 'Breathe in gently' },
        { pose: frontPlank, cue: 'Support yourself evenly on both forearms', breath: 'Exhale without holding your breath' },
        { pose: frontPlank, cue: 'Keep both shoulders at the same height', breath: 'Breathe in gently' },
      ],
    },
    mistake: {
      title: 'Hips dropping or rising too high',
      faultCue: 'The hips drift below or above the line from shoulders to feet.',
      fixCue: 'Keep elbows below shoulders, keep hips in line and breathe. Use a shorter hold if you need less load.',
      affectedJoints: ['spine', 'hip', 'shoulder'],
      sidePose: sidePlankMistakeSag,
      frontPose: frontPlankMistake,
    },
  },

  lunge: {
    angle: 'knee',
    mistake: {
      title: 'Front knee collapsing inward',
      faultCue: 'The front knee turns inward and the torso tips forward as you lower.',
      fixCue: 'Keep a steady stance, lower within a comfortable range and guide the front knee in the direction the foot points.',
      affectedJoints: ['knee', 'hip', 'spine'],
      frontPose: frontLungeMistakeWobble,
      sidePose: sideLungeMistakeForwardShift,
    },
    frontSequence: {
      seconds: 9.3,
      frames: [
        { pose: frontLungeStand, cue: 'Stand tall with feet hip-width apart', breath: 'Inhale deep' },
        { pose: frontLungeDepth, cue: 'Step back and guide the front knee along the foot', breath: 'Exhale driving through heel' },
        { pose: frontLungeStand, cue: 'Return to center tall posture', breath: 'Calm breath' },
      ],
    },
  },

  'shoulder-roll': {
    mistake: {
      title: 'Craning the neck and rushing the roll',
      faultCue: 'The chin pokes forward as the shoulders hitch up.',
      fixCue: 'Keep your gaze level and make a small, slow circle up, back and down.',
      affectedJoints: ['shoulder', 'spine'],
      frontPose: frontRollMistake,
      sidePose: sideRollMistakeTurtleNeck,
    },
    frontSequence: {
      seconds: 4.4,
      frames: [
        { pose: frontRollDown, cue: 'Relax arms by sides, chin tucked level', breath: 'Inhale softly' },
        { pose: frontRollUp, cue: 'Float shoulders upward toward ears', breath: 'Inhale deeply' },
        { pose: frontRollBack, cue: 'Roll gently back, then down', breath: 'Exhale down and reset' },
      ],
    },
  },

  hinge: {
    angle: 'hip',
    mistake: {
      title: 'Rounding your back during the hinge',
      faultCue: 'The shoulders drop while the hips barely move back.',
      fixCue: 'Soften your knees, move your hips back and stop where you can keep a comfortable neutral spine.',
      affectedJoints: ['spine', 'hip'],
      sidePose: sideHingeMistakeCatBack,
    },
  },

  bridge: {
    angle: 'hip',
    mistake: {
      title: 'Arching from the lower back',
      faultCue: 'The lower back arches as the hips lift.',
      fixCue: 'Lift gently at the hips and stop before your ribs flare or your back arches.',
      affectedJoints: ['spine', 'hip'],
    },
  },

  jump: {
    angle: 'knee',
    mistake: {
      title: 'Landing with straight knees',
      faultCue: 'The knees stay straight as the feet land.',
      fixCue: 'Land softly with hips and knees bending together, or use a bodyweight squat for a lower-impact option.',
      affectedJoints: ['knee', 'ankle', 'spine'],
    },
  },

  'seated-roll': {
    mistake: {
      title: 'Slouching during the roll',
      faultCue: 'The head and chest drift forward as the shoulders lift.',
      fixCue: 'Sit upright with both feet supported and make small circles.',
      affectedJoints: ['shoulder', 'spine'],
    },
  },

  'split-squat': {
    angle: 'knee',
    mistake: {
      title: 'Setting the feet on one narrow line',
      faultCue: 'Placing the feet directly in line makes it harder to balance.',
      fixCue: 'Keep some width between your feet, hold a fixed support and use a comfortable range.',
      affectedJoints: ['knee', 'ankle', 'hip'],
    },
  },

  'band-row': {
    angle: 'elbow',
    mistake: {
      title: 'Shrugging or pulling toward the chin',
      faultCue: 'The shoulders rise and hands pull upward instead of back.',
      fixCue: 'Use an intact band and fixed anchor. Pull your elbows back beside your ribs.',
      affectedJoints: ['shoulder', 'elbow'],
    },
  },

  'dumbbell-row': {
    mistake: {
      title: 'Twisting or jerking the weight',
      faultCue: 'The torso rotates to yank the weight up.',
      fixCue: 'Brace the free hand on a stable bench and use a load you can lower smoothly.',
      affectedJoints: ['spine', 'shoulder'],
    },
  },

  'chest-press': {
    mistake: {
      title: 'Snapping elbows straight',
      faultCue: 'The elbows snap straight and shoulders lift away from the support.',
      fixCue: 'Set the handles near chest height and press through a controlled range.',
      affectedJoints: ['elbow', 'shoulder'],
    },
  },

  'leg-press': {
    mistake: {
      title: 'Lifting the pelvis off the pad',
      faultCue: 'The pelvis curls away from the pad at the bottom of the press.',
      fixCue: 'Use a smaller range and keep your hips supported throughout.',
      affectedJoints: ['knee', 'spine', 'hip'],
    },
  },

  'goblet-squat': {
    mistake: {
      title: 'Letting the weight drift forward',
      faultCue: 'Holding the weight far from your torso makes it harder to stay balanced.',
      fixCue: 'Hold a manageable weight close to your chest and keep your feet planted.',
      affectedJoints: ['spine', 'knee', 'shoulder'],
    },
  },

  'bird-dog': {
    mistake: {
      title: 'Turning the pelvis during the reach',
      faultCue: 'The extended leg rises higher than you can control and the hip turns outward.',
      fixCue: 'Reach in opposite directions only as far as you can keep both hips level.',
      affectedJoints: ['spine', 'hip'],
    },
  },

  'wall-push': {
    angle: 'elbow',
    frontSequence: {
      seconds: 4.4, equipment: 'wall',
      frames: [
        { pose: frontWallStart, cue: 'Set palms against the wall at chest height', breath: 'Inhale as you bend' },
        { pose: frontWallBent, cue: 'Guide both elbows diagonally down and back', breath: 'Exhale as you press away' },
        { pose: frontWallStart, cue: 'Set palms against the wall at chest height', breath: 'Inhale as you bend' },
      ],
    },
    mistake: {
      title: 'Elbows flaring or hips lagging behind',
      faultCue: 'The elbows move wide and the chest and hips move separately.',
      fixCue: 'Place your hands on a firm wall near chest height and move your chest and hips together.',
      affectedJoints: ['shoulder', 'spine'],
      frontPose: frontWallMistake,
    },
  },

  'calf-raise': {
    mistake: {
      title: 'Rolling onto the edges of your feet',
      faultCue: 'The ankles roll outward as the heels rise.',
      fixCue: 'Hold a fixed support and rise evenly onto the balls of your feet.',
      affectedJoints: ['ankle'],
    },
  },

  'chair-march': {
    mistake: {
      title: 'Leaning back to lift the knee',
      faultCue: 'The torso leans back to raise the knee higher.',
      fixCue: 'Use a stable chair and lift your foot only as far as you can stay upright.',
      affectedJoints: ['hip', 'spine'],
    },
  },

  'chair-stand': {
    mistake: {
      title: 'Dropping into the chair',
      faultCue: 'The hips drop abruptly onto the seat.',
      fixCue: 'Place both feet firmly, use arm support if needed and lower slowly onto a stable chair.',
      affectedJoints: ['knee', 'spine', 'hip'],
    },
  },

  'chair-yoga': {
    mistake: {
      title: 'Pushing into a painful stretch',
      faultCue: 'The reach goes past a comfortable range.',
      fixCue: 'Use a smaller motion and settle your breath at each position.',
      affectedJoints: ['shoulder', 'spine'],
    },
  },

  'tandem-walk': {
    mistake: {
      title: 'Rushing heel-to-toe steps',
      faultCue: 'The next foot moves before balance has settled.',
      fixCue: 'Keep a hand on fixed support and take one small step at a time. Sit down if you feel unsteady.',
      affectedJoints: ['spine', 'ankle'],
    },
  },

  'morning-stretch': {
    mistake: {
      title: 'Holding your breath as you reach',
      faultCue: 'The shoulders rise and the jaw tightens during the reach.',
      fixCue: 'Keep breathing and reach diagonally at a comfortable height.',
      affectedJoints: ['shoulder', 'spine'],
    },
  },

  'sun-salutation': {
    mistake: {
      title: 'Forcing straight legs or dropping the hips',
      faultCue: 'The back rounds in the fold or the hips sag in the plank transition.',
      fixCue: 'Bend the knees where helpful and shorten or skip positions you cannot control.',
      affectedJoints: ['spine', 'shoulder', 'hamstring'],
    },
  },

  reach: {
    mistake: {
      title: 'Arching your back to reach higher',
      faultCue: 'The ribs lift and the lower back arches as the arms reach up.',
      fixCue: 'Use a lower reach and keep your ribs comfortably above your hips.',
      affectedJoints: ['shoulder', 'spine'],
    },
  },

  march: {
    mistake: {
      title: 'Stamping your feet or swaying',
      faultCue: 'The torso sways as each foot lands heavily.',
      fixCue: 'Lift one knee at a time, stay tall and place each foot gently.',
      affectedJoints: ['hip', 'knee', 'ankle'],
    },
  },

  'ankle-pump': {
    mistake: {
      title: 'Moving the whole leg',
      faultCue: 'The knee follows the foot instead of staying still.',
      fixCue: 'Support the working leg and point then flex the foot slowly within a comfortable range.',
      affectedJoints: ['ankle'],
    },
  },

  'seated-reach': {
    mistake: {
      title: 'Shrugging as the arms lift',
      faultCue: 'The shoulders crowd the neck as the hands reach up.',
      fixCue: 'Keep feet supported and reach only as high as feels comfortable.',
      affectedJoints: ['shoulder', 'spine'],
    },
  },

  'neck-glide': {
    mistake: {
      title: 'Tilting the head instead of gliding',
      faultCue: 'The chin tips upward as the head moves back.',
      fixCue: 'Keep your eyes level and glide your chin gently back, then release.',
      affectedJoints: ['spine'],
    },
  },
};

function mirroredPose(pose: RigPose): RigPose {
  const mirror = ([x, y]: Point): Point => [360 - x, y];
  const limb = ([first, hinge, end]: RigPose['arms'][number]): RigPose['arms'][number] => [mirror(first), mirror(hinge), mirror(end)];
  return { head: mirror(pose.head), arms: [limb(pose.arms[1]), limb(pose.arms[0])], legs: [limb(pose.legs[1]), limb(pose.legs[0])], toes: [mirror(pose.toes[1]), mirror(pose.toes[0])] };
}

function prepareLunge(sequence: MotionSequence, view: ViewAngle): MotionSequence {
  const [stand, step, depth, , farStep, farDepth] = sequence.frames;
  const stance: MotionFrame = view === 'front' ? { ...step, pose: { ...stand.pose, legs: [stand.pose.legs[0], [[189, 112], [192, 144], [194, 164]]], toes: [stand.pose.toes[0], [200, 169]] }, cue: 'Step back with one foot' } : step;
  const bottom = view === 'front' ? step : depth;
  const otherStance = view === 'front' ? { ...stance, pose: mirroredPose(stance.pose) } : farStep;
  const otherBottom = view === 'front' ? { ...bottom, pose: mirroredPose(bottom.pose) } : farDepth;
  return { ...sequence, frames: [stand, stance, bottom, stance, stand, otherStance, otherBottom, otherStance, stand] };
}

function frontFromProfile(pose: RigPose, motion: ExerciseMotion, frame: number): RigPose {
  const chair = ['ankle-pump', 'neck-glide', 'seated-reach', 'seated-roll', 'chair-march', 'chair-stand', 'chair-yoga', 'morning-stretch'].includes(motion);
  const phase = frame % 4;
  const armShape = (side: 0 | 1): [number, number, number] => {
    if (motion === 'seated-reach') return [18, 25, 24];
    if (motion === 'chair-yoga' && frame === 1) return [18, 36, 54];
    if (motion === 'morning-stretch' && phase === (side === 0 ? 1 : 3)) return [18, 32, 45];
    if (motion === 'goblet-squat') return [18, 16, 4];
    if (motion === 'bird-dog') return [17, 18, 19];
    if (motion === 'band-row' || motion === 'chest-press') return [18, frame === 1 ? 31 : 22, 17];
    if (motion === 'dumbbell-row') return [17, side === 0 && frame === 1 ? 29 : 20, 20];
    if (motion === 'seated-roll') return [18, 23, 21];
    if (motion === 'sun-salutation' && [1, 9].includes(frame)) return [18, 26, 25];
    return chair ? [18, 24, 15] : [18, 25, 25];
  };
  const legShape = (side: 0 | 1): [number, number, number, number] => {
    if (motion === 'tandem-walk') return [10, 9, phase === (side === 0 ? 1 : 3) ? 2 : 9, 5];
    if (motion === 'goblet-squat' || motion === 'jump') return [12, frame === 1 ? 24 : 18, 21, 27];
    if (motion === 'split-squat') return [11, 15, 15, 19];
    return [11, 17, 18, 22];
  };
  const project = (side: 0 | 1, spacing: number, point: Point): Point => [180 + (side === 0 ? -spacing : spacing), point[1]];
  function limbs(side: 0 | 1) {
    const [shoulder, elbow, wrist] = pose.arms[side];
    const [hip, knee, ankle] = pose.legs[side];
    const [s, e, w] = armShape(side);
    const [h, k, a, t] = legShape(side);
    return {
      arm: [project(side, s, shoulder), project(side, e, elbow), project(side, w, wrist)] as const,
      leg: [project(side, h, hip), project(side, k, knee), project(side, a, ankle)] as const,
      toe: project(side, t, pose.toes[side]),
    };
  }
  const right = limbs(0);
  const left = limbs(1);
  return { head: [180, pose.head[1]], arms: [right.arm, left.arm], legs: [right.leg, left.leg], toes: [right.toe, left.toe] };
}

function standingProfileFromFront(pose: RigPose): RigPose {
  const put = (limb: RigPose['arms'][number], right: boolean): RigPose['arms'][number] => {
    const [anchor, pivot, end] = limb;
    const x = right ? 173 : 183;
    return [[x, anchor[1]], [x + (anchor[1] - pivot[1] > 10 ? -4 : 4), pivot[1]], [x + (end[1] < 90 ? 8 : 6), end[1]]];
  };
  const legs = ([hip, knee, ankle]: RigPose['legs'][number], right: boolean): RigPose['legs'][number] => {
    const x = right ? 172 : 185;
    return [[x, hip[1]], [x + (knee[1] < 140 ? 20 : 0), knee[1]], [x + (ankle[1] < 170 ? 10 : 0), ankle[1]]];
  };
  return { head: [184, pose.head[1]], arms: [put(pose.arms[0], true), put(pose.arms[1], false)], legs: [legs(pose.legs[0], true), legs(pose.legs[1], false)], toes: [[190 + (pose.toes[0][1] < 175 ? 10 : 0), pose.toes[0][1]], [202 + (pose.toes[1][1] < 175 ? 10 : 0), pose.toes[1][1]]] };
}

export function sequenceForView(motion: ExerciseMotion, view: ViewAngle) {
  const base = motionSequences[motion];
  const naturallyFront = motion === 'reach' || motion === 'march';
  const frontal = biomechanicalSpecs[motion].frontSequence ?? (naturallyFront ? base : {
    ...base, frames: base.frames.map((item, index) => ({ ...item, pose: frontFromProfile(item.pose, motion, index === base.frames.length - 1 ? 0 : index) })),
  });
  const selected = view === 'front' ? frontal : naturallyFront ? {
    ...base, frames: base.frames.map(item => ({ ...item, pose: standingProfileFromFront(item.pose) })),
  } : base;
  if (motion === 'lunge') return prepareLunge(selected, view);
  if (motion !== 'shoulder-roll') return selected;
  const frames = selected.frames.slice(0, 3);
  if (view === 'front') {
    const down = { ...frames[0], cue: 'Relax at the bottom of the circle', breath: 'Keep breathing' };
    return { ...selected, frames: [...frames, down, frames[0]] };
  }
  const poses = [rollSideBase, rollSideOffset(2, -9), rollSideOffset(-6, -4), rollSideOffset(-4, 2), rollSideBase];
  return { ...selected, frames: selected.frames.map((entry, index) => ({ ...entry, pose: poses[index] })) };
}

type Phase = { label: string; breath?: string; seconds: number; from: number; to: number };

export function motionPhases(sequence: MotionSequence, motion: ExerciseMotion): Phase[] {
  const count = sequence.frames.length - 1;
  if (motion === 'plank') return [{ label: 'Steady hold', seconds: sequence.seconds, from: 0, to: count }];
  if (motion === 'lunge') return [0, 4].flatMap(offset => [
    { label: 'Step back', breath: 'Inhale gently', seconds: 1, from: offset, to: offset + 1 },
    { label: 'Lower', breath: 'Inhale', seconds: 3, from: offset + 1, to: offset + 2 },
    { label: 'Pause', breath: 'Keep breathing', seconds: 1, from: offset + 2, to: offset + 2 },
    { label: 'Rise', breath: 'Exhale', seconds: 2, from: offset + 2, to: offset + 3 },
    { label: 'Return to stand', breath: 'Breathe naturally', seconds: 1, from: offset + 3, to: offset + 4 },
  ]);
  if (['squat', 'goblet-squat', 'split-squat', 'incline-push', 'wall-push', 'hinge'].includes(motion)) return [
    { label: motion === 'hinge' ? 'Hinge back' : 'Lower', breath: 'Inhale', seconds: 3, from: 0, to: 1 },
    { label: 'Pause', breath: 'Keep breathing', seconds: 1, from: 1, to: 1 },
    { label: /push/.test(motion) ? 'Press away' : 'Rise', breath: 'Exhale', seconds: 2, from: 1, to: 2 },
  ];
  if (motion === 'shoulder-roll' || motion === 'seated-roll') return ['Lift', 'Roll back', 'Lower', 'Reset'].map((label, index) => ({
    label, breath: index === 0 ? 'Inhale' : index === 3 ? 'Breathe naturally' : 'Exhale slowly', seconds: 1, from: index, to: index + 1,
  }));
  return sequence.frames.slice(0, -1).map((_, index) => ({ label: `Movement ${index + 1}`, seconds: sequence.seconds / count, from: index, to: index + 1 }));
}

export function demoFrame(sequence: MotionSequence, phases: Phase[], elapsed: number) {
  let remaining = elapsed;
  let index = 0;
  while (index < phases.length - 1 && remaining >= phases[index].seconds) remaining -= phases[index++].seconds;
  const phase = phases[index];
  const position = phase.from + (phase.to - phase.from) * Math.max(0, Math.min(1, remaining / phase.seconds));
  const frameCount = sequence.frames.length - 1;
  const frame = frameAt(sequence, position / frameCount);
  return { ...frame, phase, phaseIndex: index, secondsLeft: Math.max(0, phase.seconds - remaining), cue: sequence.frames[frame.index] };
}

export function motionTrajectories(sequence: MotionSequence) {
  const poses = Array.from({ length: 41 }, (_, index) => frameAt(sequence, index / 40).pose);
  const tracks = [
    ...([0, 1] as const).flatMap(side => ([2, 1, 0] as const).map(joint => poses.map(pose => pose.arms[side][joint]))),
    ...([0, 1] as const).map(side => poses.map(pose => pose.toes[side])),
  ];
  const moves = (points: Point[]) => points.some(point => Math.hypot(point[0] - points[0][0], point[1] - points[0][1]) >= 5);
  const [rightHand, rightElbow, rightShoulder, leftHand, leftElbow, leftShoulder, rightFoot, leftFoot] = tracks;
  return [[rightHand, rightElbow, rightShoulder].find(moves), [leftHand, leftElbow, leftShoulder].find(moves), rightFoot, leftFoot]
    .flatMap((track, index) => track && moves(track) ? [{ side: index % 2 === 0 ? 'right' : 'left', path: track.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ') }] : []);
}

const midpoint = (a: Point, b: Point): Point => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];

export function projectedAngle(pose: RigPose, joint: JointAngle, motion: ExerciseMotion) {
  return jointAngleGuide(pose, joint, motion).degrees;
}

export function jointAngleGuide(pose: RigPose, joint: JointAngle, motion: ExerciseMotion) {
  const leg = motion === 'lunge' && pose.toes[1][0] > pose.toes[0][0] ? pose.legs[1] : pose.legs[0];
  const shoulder = midpoint(pose.arms[0][0], pose.arms[1][0]);
  const hip = midpoint(pose.legs[0][0], pose.legs[1][0]);
  const [first, pivot, second] = joint === 'trunk' ? [shoulder, hip, midpoint(pose.toes[0], pose.toes[1])]
    : joint === 'elbow' ? pose.arms[0] : joint === 'hip' ? [shoulder, leg[0], leg[1]] : leg;
  const ax = first[0] - pivot[0], ay = first[1] - pivot[1];
  const bx = second[0] - pivot[0], by = second[1] - pivot[1];
  const cross = ax * by - ay * bx;
  const degrees = Math.round(Math.atan2(Math.abs(cross), ax * bx + ay * by) * 180 / Math.PI);
  const radius = 13;
  const point = (x: number, y: number) => {
    const length = Math.hypot(x, y) || 1;
    return `${pivot[0] + radius * x / length} ${pivot[1] + radius * y / length}`;
  };
  return { degrees, arc: `M${point(ax, ay)} A${radius} ${radius} 0 0 ${cross < 0 ? 0 : 1} ${point(bx, by)}` };
}

export function getMistakePose(motion: ExerciseMotion, view: ViewAngle, sequence: MotionSequence): RigPose {
  const spec = biomechanicalSpecs[motion].mistake;
  const customPose = view === 'front' ? spec.frontPose : spec.sidePose;
  if (customPose) return customPose;
  const pose = sequence.frames[1].pose;
  if (motion === 'neck-glide') return { ...pose, head: [pose.head[0] + (view === 'side' ? -9 : 0), pose.head[1] - 9] };
  if (motion === 'chair-march' && view === 'side') return {
    ...pose, head: [pose.head[0] - 16, pose.head[1] + 6],
    arms: [pose.arms[0].map(([x, y], index) => [x - (2 - index) * 6, y]) as unknown as RigPose['arms'][0], pose.arms[1]],
  };
  const points = spec.affectedJoints;
  const [right, left] = pose.arms;
  const [rightLeg, leftLeg] = pose.legs;
  const shift = ([x, y]: Point, dx: number, dy: number): Point => [x + dx, y + dy];
  return {
    head: points.includes('spine') ? shift(pose.head, 13, 6) : pose.head,
    arms: [
      [points.includes('shoulder') ? shift(right[0], 6, -6) : right[0], points.includes('elbow') ? shift(right[1], -11, -4) : right[1], right[2]],
      [points.includes('shoulder') ? shift(left[0], 6, -6) : left[0], points.includes('elbow') ? shift(left[1], 11, -4) : left[1], left[2]],
    ],
    legs: [
      [points.includes('hip') ? shift(rightLeg[0], 0, 9) : rightLeg[0], points.includes('knee') ? shift(rightLeg[1], 10, -3) : rightLeg[1], rightLeg[2]],
      [points.includes('hip') ? shift(leftLeg[0], 0, 9) : leftLeg[0], points.includes('knee') ? shift(leftLeg[1], -10, -3) : leftLeg[1], leftLeg[2]],
    ],
    toes: points.includes('ankle') ? [shift(pose.toes[0], -8, 0), shift(pose.toes[1], 8, 0)] : pose.toes,
  };
}
