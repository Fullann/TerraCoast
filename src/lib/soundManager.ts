// Sound Design (Web Audio API) & Haptics pour TerraCoast
// 100% natif, zéro fichier externe, fonctionne offline et instantanément.

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

const SOUND_STORAGE_KEY = "terracoast_sound_enabled";

export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const stored = localStorage.getItem(SOUND_STORAGE_KEY);
  return stored === null ? true : stored === "true";
}

export function setSoundEnabled(enabled: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SOUND_STORAGE_KEY, String(enabled));
}

export function toggleSound(): boolean {
  const current = isSoundEnabled();
  setSoundEnabled(!current);
  return !current;
}

/**
 * Vibration Haptique pour smartphone
 */
export function triggerHaptic(type: "light" | "medium" | "success" | "error" = "light") {
  if (typeof window === "undefined" || !("vibrate" in navigator)) return;
  try {
    switch (type) {
      case "light":
        navigator.vibrate(15);
        break;
      case "medium":
        navigator.vibrate(35);
        break;
      case "success":
        navigator.vibrate([20, 40, 30]);
        break;
      case "error":
        navigator.vibrate([60, 40, 80]);
        break;
    }
  } catch {
    // Ignorer si vibration non autorisée
  }
}

/**
 * Joue un carillon satisfaisant sur bonne réponse (Do - Mi - Sol)
 */
export function playCorrectSound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  triggerHaptic("success");

  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

    gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.08);
    gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + idx * 0.08 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.08 + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime + idx * 0.08);
    osc.stop(ctx.currentTime + idx * 0.08 + 0.36);
  });
}

/**
 * Joue un buzzer discret sur mauvaise réponse
 */
export function playIncorrectSound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  triggerHaptic("error");

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "triangle";
  osc.frequency.setValueAtTime(220, ctx.currentTime); // A3
  osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.25);

  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.29);
}

/**
 * Joue un bip de compte à rebours sous tension (< 5 secondes)
 */
export function playTickSound(isUrgent = false) {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(isUrgent ? 880 : 587, ctx.currentTime);

  gain.gain.setValueAtTime(0.08, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.07);
}

/**
 * Fanfare de victoire joyeuse (fin de quiz ou victoire en duel)
 */
export function playVictoryFanfare() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  triggerHaptic("success");

  // Accord majestueux et mélodie triomphale
  const chords = [
    { time: 0.0, freqs: [523.25, 659.25, 783.99] }, // C
    { time: 0.15, freqs: [523.25, 659.25, 783.99] },
    { time: 0.3, freqs: [523.25, 659.25, 783.99] },
    { time: 0.5, freqs: [698.46, 880.0, 1046.5] }, // F
    { time: 0.75, freqs: [783.99, 987.77, 1174.66] }, // G
    { time: 1.05, freqs: [1046.5, 1318.51, 1567.98] }, // High C
  ];

  chords.forEach((c) => {
    c.freqs.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + c.time);

      gain.gain.setValueAtTime(0.001, ctx.currentTime + c.time);
      gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + c.time + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + c.time + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + c.time);
      osc.stop(ctx.currentTime + c.time + 0.46);
    });
  });
}

/**
 * Son de clic ou sélection d'option
 */
export function playClickSound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  triggerHaptic("light");

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(700, ctx.currentTime);

  gain.gain.setValueAtTime(0.04, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.045);
}
