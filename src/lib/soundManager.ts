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

// Déverrouillage automatique au premier tap / interaction (indispensable sous Safari iOS)
if (typeof window !== "undefined") {
  const unlockAudio = () => {
    try {
      const ctx = getAudioContext();
      if (ctx && ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }
    } catch {}
    window.removeEventListener("pointerdown", unlockAudio);
    window.removeEventListener("touchstart", unlockAudio);
    window.removeEventListener("keydown", unlockAudio);
  };
  window.addEventListener("pointerdown", unlockAudio, { passive: true });
  window.addEventListener("touchstart", unlockAudio, { passive: true });
  window.addEventListener("keydown", unlockAudio, { passive: true });
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
 * Son de clic ou sélection d'option (Effet Bubble Pop ludique type Duolingo)
 */
export function playClickSound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  triggerHaptic("light");

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  // Balayage fréquentiel pop immédiat (bubble pop)
  osc.frequency.setValueAtTime(440, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(920, ctx.currentTime + 0.04);

  gain.gain.setValueAtTime(0.001, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.09, ctx.currentTime + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.055);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.06);
}

/**
 * Son de déchirure tactile d'un booster de cartes (effet foil / papier métallisé)
 */
export function playBoosterTearSound(intensity: number = 0.5) {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  triggerHaptic("light");

  try {
    const bufferSize = Math.floor(ctx.sampleRate * 0.08);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.7));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1400 + intensity * 1200, ctx.currentTime);
    filter.Q.setValueAtTime(2.5, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.18 * Math.min(1, intensity + 0.3), ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.078);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(ctx.currentTime);
    noise.stop(ctx.currentTime + 0.08);
  } catch {}
}

/**
 * Son d'ouverture triomphale quand le booster est complètement déchiré
 */
export function playRipCompleteSound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  triggerHaptic("success");

  try {
    // 1. Whoosh d'ouverture
    const whooshOsc = ctx.createOscillator();
    const whooshGain = ctx.createGain();
    whooshOsc.type = "sine";
    whooshOsc.frequency.setValueAtTime(220, ctx.currentTime);
    whooshOsc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);

    whooshGain.gain.setValueAtTime(0.001, ctx.currentTime);
    whooshGain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.03);
    whooshGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);

    whooshOsc.connect(whooshGain);
    whooshGain.connect(ctx.destination);
    whooshOsc.start(ctx.currentTime);
    whooshOsc.stop(ctx.currentTime + 0.23);

    // 2. Chime étincelant immédiat
    const chimes = [783.99, 1046.5, 1318.5, 1567.98];
    chimes.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(f, ctx.currentTime + 0.08 + i * 0.04);
      g.gain.setValueAtTime(0.001, ctx.currentTime + 0.08 + i * 0.04);
      g.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.08 + i * 0.04 + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08 + i * 0.04 + 0.3);

      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(ctx.currentTime + 0.08 + i * 0.04);
      osc.stop(ctx.currentTime + 0.08 + i * 0.04 + 0.32);
    });
  } catch {}
}

/**
 * Son de flip / retournement de carte TCG
 */
export function playCardFlipSound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  triggerHaptic("light");

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(600, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.08);

  gain.gain.setValueAtTime(0.001, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.085);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.09);
}

/**
 * Fanfare spectaculaire pour le tirage de cartes rares (Rare, Épique, Légendaire, Mythique ou Shiny)
 */
export function playRareCardFanfare(
  rarity: "common" | "rare" | "epic" | "legendary" | "mythic",
  isShiny: boolean = false
) {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  if (rarity === "rare" && !isShiny) {
    // 🌟 RARE : Carillon ascendant cristallin
    triggerHaptic("medium");
    const notes = [523.25, 659.25, 783.99, 987.77, 1046.5]; // C5, E5, G5, B5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.06);

      gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.06);
      gain.gain.linearRampToValueAtTime(0.16, ctx.currentTime + idx * 0.06 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.06 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.06);
      osc.stop(ctx.currentTime + idx * 0.06 + 0.36);
    });
    return;
  }

  if (rarity === "epic" && !isShiny) {
    // 🔮 ÉPIQUE : Accords mystiques violets & harpe scintillante
    triggerHaptic("success");
    const chords = [
      { time: 0.0, freqs: [440, 523.25, 659.25], type: "triangle" as OscillatorType }, // Am
      { time: 0.22, freqs: [523.25, 659.25, 783.99], type: "triangle" as OscillatorType }, // C
      { time: 0.45, freqs: [659.25, 880, 1046.5, 1318.5], type: "sine" as OscillatorType }, // High Em/Am
    ];

    chords.forEach((c) => {
      c.freqs.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = c.type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime + c.time);

        gain.gain.setValueAtTime(0.001, ctx.currentTime + c.time);
        gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + c.time + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + c.time + 0.55);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + c.time);
        osc.stop(ctx.currentTime + c.time + 0.56);
      });
    });
    return;
  }

  if (rarity === "legendary") {
    // 👑 LÉGENDAIRE : Impact de basse + Fanfare cuivrée majestueuse
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate([40, 40, 80, 50, 120]);
      } catch {}
    }

    // Impact basse
    const bassOsc = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bassOsc.type = "sine";
    bassOsc.frequency.setValueAtTime(140, ctx.currentTime);
    bassOsc.frequency.exponentialRampToValueAtTime(55, ctx.currentTime + 0.3);
    bassGain.gain.setValueAtTime(0.25, ctx.currentTime);
    bassGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    bassOsc.connect(bassGain);
    bassGain.connect(ctx.destination);
    bassOsc.start(ctx.currentTime);
    bassOsc.stop(ctx.currentTime + 0.36);

    // Accords cuivrés triomphants
    const brassChords = [
      { time: 0.05, freqs: [261.63, 392.0, 523.25] }, // C4
      { time: 0.25, freqs: [293.66, 440.0, 587.33] }, // D4
      { time: 0.45, freqs: [329.63, 493.88, 659.25] }, // E4
      { time: 0.7, freqs: [392.0, 523.25, 659.25, 783.99, 1046.5] }, // Solennel C5
    ];

    brassChords.forEach((c) => {
      c.freqs.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + c.time);

        gain.gain.setValueAtTime(0.001, ctx.currentTime + c.time);
        gain.gain.linearRampToValueAtTime(0.14, ctx.currentTime + c.time + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + c.time + 0.65);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + c.time);
        osc.stop(ctx.currentTime + c.time + 0.66);
      });
    });
    return;
  }

  // 🌈 MYTHIQUE ou SHINY : Explosion cosmique céleste & arpeggio étincelant infini
  if (typeof window !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate([30, 30, 50, 40, 90, 60, 150]);
    } catch {}
  }

  // Cloche cosmique
  const cosmicNotes = [392.0, 523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98, 2093.0];
  cosmicNotes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.05);

    gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.05);
    gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + idx * 0.05 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.05 + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + idx * 0.05);
    osc.stop(ctx.currentTime + idx * 0.05 + 0.62);
  });

  // Accord final royal céleste
  const finalChord = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98];
  finalChord.forEach((freq) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, ctx.currentTime + 0.45);

    gain.gain.setValueAtTime(0.001, ctx.currentTime + 0.45);
    gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.45 + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45 + 0.9);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + 0.45);
    osc.stop(ctx.currentTime + 0.45 + 0.95);
  });
}

/**
 * Joue un son selon un identifiant simple
 */
export function playSound(
  type:
    | "correct"
    | "wrong"
    | "click"
    | "fanfare"
    | "success"
    | "error"
    | "card_flip"
    | "card_rare"
    | "card_epic"
    | "card_legendary"
    | "card_mythic"
    | "booster_tear"
    | "booster_open"
) {
  if (type === "correct" || type === "success") {
    playCorrectSound();
  } else if (type === "wrong" || type === "error") {
    playIncorrectSound();
  } else if (type === "click") {
    playClickSound();
  } else if (type === "fanfare") {
    playVictoryFanfare();
  } else if (type === "card_flip") {
    playCardFlipSound();
  } else if (type === "card_rare") {
    playRareCardFanfare("rare");
  } else if (type === "card_epic") {
    playRareCardFanfare("epic");
  } else if (type === "card_legendary") {
    playRareCardFanfare("legendary");
  } else if (type === "card_mythic") {
    playRareCardFanfare("mythic");
  } else if (type === "booster_tear") {
    playBoosterTearSound(0.7);
  } else if (type === "booster_open") {
    playRipCompleteSound();
  }
}


