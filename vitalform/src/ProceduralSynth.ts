// Procedural Web Audio API Ambient Synth — Zero external audio files (.mp3 / .wav)
// Synthesizes warm ambient sci-fi pad chords with detuned oscillators, ADSR envelopes,
// AnalyserNode real-time frequency data, and velocity-modulated low-pass filter sweeps.

export type ChordMood = 'space' | 'synthwave' | 'zen';

export const moodConfigs: Record<ChordMood, {
  name: string;
  tag: string;
  chords: number[][];
  oscTypes: [OscillatorType, OscillatorType];
  baseCutoff: number;
  filterQ: number;
  stepTime: number;
  detuneCents: number;
}> = {
  space: {
    name: 'Deep Space Pad',
    tag: 'Space',
    chords: [
      [45, 52, 57, 60, 64], // Am9
      [41, 48, 53, 57, 60], // Fmaj7
      [48, 55, 60, 64, 67], // Cmaj9
      [43, 50, 55, 59, 62], // G6
    ],
    oscTypes: ['sine', 'triangle'],
    baseCutoff: 680,
    filterQ: 0.85,
    stepTime: 5.6,
    detuneCents: 8,
  },
  synthwave: {
    name: '80s Synthwave',
    tag: '80s',
    chords: [
      [50, 57, 62, 65, 69], // Dm9
      [46, 53, 58, 62, 65], // Bbmaj7
      [41, 48, 53, 57, 60], // Fmaj7
      [48, 55, 60, 64, 67], // Cadd9
    ],
    oscTypes: ['sawtooth', 'triangle'],
    baseCutoff: 880,
    filterQ: 1.35,
    stepTime: 4.4,
    detuneCents: 12,
  },
  zen: {
    name: 'Zen Focus',
    tag: 'Zen',
    chords: [
      [50, 57, 61, 64, 69], // Dmaj9
      [47, 54, 59, 62, 66], // Bm7
      [43, 50, 55, 59, 64], // Gmaj7
      [45, 52, 57, 61, 64], // A6/9
    ],
    oscTypes: ['sine', 'sine'],
    baseCutoff: 540,
    filterQ: 0.65,
    stepTime: 6.8,
    detuneCents: 5,
  },
};

const frequency = (note: number) => 440 * 2 ** ((note - 69) / 12);

interface Synth {
  context: AudioContext;
  level: GainNode;
  filter: BiquadFilterNode;
  analyser: AnalyserNode;
  clock: number;
  chord: number;
  tick?: number;
}

let synth: Synth | undefined;
let activeMood: ChordMood = 'space';
let requested = false;
let frequencyBuffer: Uint8Array | null = null;

function createSynth(): Synth {
  const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const context = new AudioContextClass();
  const filter = context.createBiquadFilter();
  const level = context.createGain();
  const limiter = context.createDynamicsCompressor();
  const analyser = context.createAnalyser();

  // 64 fftSize gives 32 real-time frequency bins
  analyser.fftSize = 64;
  analyser.smoothingTimeConstant = 0.82;

  const cfg = moodConfigs[activeMood];
  filter.type = 'lowpass';
  filter.frequency.value = cfg.baseCutoff;
  filter.Q.value = cfg.filterQ;

  level.gain.value = 0.0001;

  limiter.threshold.value = -12;
  limiter.knee.value = 8;
  limiter.ratio.value = 6;
  limiter.attack.value = 0.003;
  limiter.release.value = 0.25;

  // Signal chain: Oscillators -> Envelopes -> Filter -> Level -> Limiter -> Analyser -> Speakers
  filter.connect(level).connect(limiter).connect(analyser).connect(context.destination);

  frequencyBuffer = new Uint8Array(analyser.frequencyBinCount);

  return { context, level, filter, analyser, clock: context.currentTime, chord: 0 };
}

function schedulePad(engine: Synth, notes: number[], start: number) {
  const { context, filter } = engine;
  const cfg = moodConfigs[activeMood];
  const release = start + cfg.stepTime * 1.35;

  notes.forEach((note, index) => {
    const envelope = context.createGain();
    const at = start + index * 0.06;
    const isRoot = index === 0;

    // ADSR Envelope
    envelope.gain.setValueAtTime(0.0001, at);
    envelope.gain.exponentialRampToValueAtTime(isRoot ? 0.17 : 0.07, at + 1.4);
    envelope.gain.exponentialRampToValueAtTime(isRoot ? 0.11 : 0.045, at + 3.2);
    envelope.gain.setValueAtTime(isRoot ? 0.11 : 0.045, at + (cfg.stepTime - 0.7));
    envelope.gain.exponentialRampToValueAtTime(0.0001, release);
    envelope.connect(filter);

    // Detuned dual oscillators based on current mood configuration
    const [oscA, oscB] = cfg.oscTypes;
    for (const [detune, oscType] of [[-cfg.detuneCents, oscA], [cfg.detuneCents, oscB]] as const) {
      const voice = context.createOscillator();
      voice.type = oscType;
      voice.frequency.value = frequency(note);
      voice.detune.value = detune;
      voice.connect(envelope);
      voice.start(at);
      voice.stop(release + 0.05);
      voice.onended = () => {
        voice.disconnect();
        if (detune > 0) envelope.disconnect();
      };
    }
  });
}

function queueChords(engine: Synth) {
  const { context } = engine;
  if (context.state !== 'running') return;
  const cfg = moodConfigs[activeMood];
  if (engine.clock < context.currentTime) engine.clock = context.currentTime + 0.05;
  while (engine.clock < context.currentTime + 1.2) {
    schedulePad(engine, cfg.chords[engine.chord++ % cfg.chords.length], engine.clock);
    engine.clock += cfg.stepTime;
  }
}

export function setChordMood(mood: ChordMood): void {
  activeMood = mood;
  if (!synth) return;
  const cfg = moodConfigs[mood];
  synth.filter.frequency.setTargetAtTime(cfg.baseCutoff, synth.context.currentTime, 0.3);
  synth.filter.Q.setTargetAtTime(cfg.filterQ, synth.context.currentTime, 0.3);
  synth.clock = synth.context.currentTime + 0.05;
}

export function getChordMood(): ChordMood {
  return activeMood;
}

export function getSynthFrequencyData(): Uint8Array | null {
  if (!synth || !requested || synth.context.state !== 'running') return null;
  if (!frequencyBuffer || frequencyBuffer.length !== synth.analyser.frequencyBinCount) {
    frequencyBuffer = new Uint8Array(synth.analyser.frequencyBinCount);
  }
  synth.analyser.getByteFrequencyData(frequencyBuffer);
  return frequencyBuffer;
}

export async function setSynthEnabled(enabled: boolean): Promise<boolean> {
  requested = enabled;
  if (!enabled) {
    const audio = synth;
    if (audio) {
      window.clearInterval(audio.tick);
      audio.tick = undefined;
      audio.level.gain.cancelScheduledValues(audio.context.currentTime);
      audio.level.gain.setTargetAtTime(0.0001, audio.context.currentTime, 0.08);
      window.setTimeout(() => {
        if (!requested && synth === audio) {
          synth = undefined;
          frequencyBuffer = null;
          void audio.context.close().catch(() => undefined);
        }
      }, 350);
    }
    return false;
  }

  try {
    const audio = synth ?? (synth = createSynth());
    if (audio.context.state === 'suspended') {
      await audio.context.resume();
    }
    if (!requested || synth !== audio) return false;

    audio.level.gain.cancelScheduledValues(audio.context.currentTime);
    audio.level.gain.setTargetAtTime(0.24, audio.context.currentTime, 0.18);
    queueChords(audio);
    if (audio.tick === undefined) {
      audio.tick = window.setInterval(() => queueChords(audio), 500);
    }
    return true;
  } catch {
    requested = false;
    return false;
  }
}

// Retro 8-bit procedural typewriter chirp with subtle pitch jitter
export function playSynthBlip() {
  const audio = synth;
  if (!audio || !requested || audio.context.state !== 'running') return;
  const { context, level } = audio;
  const now = context.currentTime;
  const note = context.createOscillator();
  const envelope = context.createGain();

  note.type = 'triangle';
  const baseFreq = 540 + (Math.random() - 0.5) * 90;
  note.frequency.setValueAtTime(baseFreq, now);
  note.frequency.exponentialRampToValueAtTime(baseFreq * 0.65, now + 0.045);

  envelope.gain.setValueAtTime(0.04, now);
  envelope.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);

  note.connect(envelope).connect(level);
  note.start(now);
  note.stop(now + 0.06);
  note.onended = () => {
    note.disconnect();
    envelope.disconnect();
  };
}
