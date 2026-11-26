let audio: AudioContext | null = null;

export const tick = (enabled: boolean): void => {
  if (!enabled) return;
  const Ctx = window.AudioContext;
  if (!Ctx) return;
  audio ??= new Ctx();
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.frequency.value = 392;
  gain.gain.value = 0.03;
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start();
  osc.stop(audio.currentTime + 0.04);
};
