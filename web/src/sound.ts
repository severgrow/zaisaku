let audio: AudioContext | null = null;
let lastCue = 0;

export const tick = (enabled: boolean): void => {
  if (!enabled) return;
  tone(392, 0.03, 0.04);
};

/** Quiet navigation cues. Mute wins. Not played for an ordinary entity tap. */
export const cue = (enabled: boolean, kind: 'go' | 'arrive' | 'open' | 'enter' | 'blocked'): void => {
  if (!enabled) return;
  const now = performance.now();
  if (now - lastCue < 120) return;
  lastCue = now;
  const frequency = kind === 'go' ? 466 : kind === 'arrive' ? 392 : kind === 'open' ? 523 : kind === 'enter' ? 349 : 196;
  tone(frequency, 0.018, kind === 'blocked' ? 0.07 : 0.045);
};

const tone = (frequency: number, volume: number, seconds: number): void => {
  const Ctx = window.AudioContext;
  if (!Ctx) return;
  audio ??= new Ctx();
  if (audio.state === 'suspended') void audio.resume();
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.frequency.value = frequency;
  gain.gain.value = volume;
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start();
  osc.stop(audio.currentTime + seconds);
};
