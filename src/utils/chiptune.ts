// Retro 8-bit Web Audio synthesizer for birthday melody and flower pop effects.

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedAudioCtx) {
    sharedAudioCtx = new AudioCtx();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

export function playSpikeChime(pitchOffset = 0): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const baseNotes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
  const factor = Math.pow(2, pitchOffset / 12);

  baseNotes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq * factor, now + idx * 0.045);

    gain.gain.setValueAtTime(0.001, now + idx * 0.045);
    gain.gain.linearRampToValueAtTime(0.055, now + idx * 0.045 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.045 + 0.14);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + idx * 0.045);
    osc.stop(now + idx * 0.045 + 0.15);
  });
}

export function playConfettiPop(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(240, now);
  osc.frequency.exponentialRampToValueAtTime(880, now + 0.09);

  gain.gain.setValueAtTime(0.09, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.13);
}

interface NoteStep {
  freq: number;
  bassFreq: number;
  beats: number;
}

// Classic Happy Birthday in F major (8-bit arrangement)
const BIRTHDAY_SCORE: NoteStep[] = [
  // "Happy birthday to you"
  { freq: 261.63, bassFreq: 174.61, beats: 0.75 },
  { freq: 261.63, bassFreq: 174.61, beats: 0.25 },
  { freq: 293.66, bassFreq: 174.61, beats: 1 },
  { freq: 261.63, bassFreq: 174.61, beats: 1 },
  { freq: 349.23, bassFreq: 130.81, beats: 1 },
  { freq: 329.63, bassFreq: 130.81, beats: 2 },

  // "Happy birthday to you"
  { freq: 261.63, bassFreq: 130.81, beats: 0.75 },
  { freq: 261.63, bassFreq: 130.81, beats: 0.25 },
  { freq: 293.66, bassFreq: 130.81, beats: 1 },
  { freq: 261.63, bassFreq: 130.81, beats: 1 },
  { freq: 392.0, bassFreq: 174.61, beats: 1 },
  { freq: 349.23, bassFreq: 174.61, beats: 2 },

  // "Happy birthday dear boi"
  { freq: 261.63, bassFreq: 174.61, beats: 0.75 },
  { freq: 261.63, bassFreq: 174.61, beats: 0.25 },
  { freq: 523.25, bassFreq: 174.61, beats: 1 },
  { freq: 440.0, bassFreq: 174.61, beats: 1 },
  { freq: 349.23, bassFreq: 116.54, beats: 1 },
  { freq: 329.63, bassFreq: 116.54, beats: 1 },
  { freq: 293.66, bassFreq: 116.54, beats: 2 },

  // "Happy birthday to you"
  { freq: 466.16, bassFreq: 116.54, beats: 0.75 },
  { freq: 466.16, bassFreq: 116.54, beats: 0.25 },
  { freq: 440.0, bassFreq: 174.61, beats: 1 },
  { freq: 349.23, bassFreq: 130.81, beats: 1 },
  { freq: 392.0, bassFreq: 130.81, beats: 1 },
  { freq: 349.23, bassFreq: 174.61, beats: 2.2 },
];

export function startBirthdayTune(onFinish?: () => void): () => void {
  const ctx = getAudioContext();
  if (!ctx) {
    onFinish?.();
    return () => {};
  }

  let cancelled = false;
  const activeOscillators: OscillatorNode[] = [];
  const beatDuration = 0.34;
  let offset = 0.04;

  const startTime = ctx.currentTime;

  BIRTHDAY_SCORE.forEach((step) => {
    const dur = step.beats * beatDuration;
    const noteStart = startTime + offset;

    // Lead square wave
    const lead = ctx.createOscillator();
    const leadGain = ctx.createGain();
    lead.type = 'square';
    lead.frequency.setValueAtTime(step.freq, noteStart);

    leadGain.gain.setValueAtTime(0.001, noteStart);
    leadGain.gain.linearRampToValueAtTime(0.055, noteStart + 0.015);
    leadGain.gain.setValueAtTime(0.05, noteStart + dur * 0.72);
    leadGain.gain.exponentialRampToValueAtTime(0.001, noteStart + dur * 0.94);

    lead.connect(leadGain);
    leadGain.connect(ctx.destination);
    lead.start(noteStart);
    lead.stop(noteStart + dur * 0.96);
    activeOscillators.push(lead);

    // Warm 8-bit triangle bass
    const bass = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bass.type = 'triangle';
    bass.frequency.setValueAtTime(step.bassFreq, noteStart);

    bassGain.gain.setValueAtTime(0.001, noteStart);
    bassGain.gain.linearRampToValueAtTime(0.075, noteStart + 0.02);
    bassGain.gain.exponentialRampToValueAtTime(0.001, noteStart + dur * 0.9);

    bass.connect(bassGain);
    bassGain.connect(ctx.destination);
    bass.start(noteStart);
    bass.stop(noteStart + dur * 0.94);
    activeOscillators.push(bass);

    offset += dur;
  });

  const timeoutId = window.setTimeout(() => {
    if (!cancelled) {
      onFinish?.();
    }
  }, offset * 1000 + 80);

  return () => {
    cancelled = true;
    window.clearTimeout(timeoutId);
    activeOscillators.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // Ignore already-stopped oscillators
      }
    });
  };
}
