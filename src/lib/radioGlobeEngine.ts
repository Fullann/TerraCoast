// Moteur Audio Hybride : Flux Radio Live & Synthétiseur Procédural Web Audio API
// 100% natif, zéro dépendance externe, résilient aux coupures réseau

import {
  SoundscapeId,
  type RadioStation,
  CURATED_RADIO_STATIONS,
} from "./radioGlobeData";

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

// Générateur de bruit rose/blanc en mémoire pour le Web Audio
function createNoiseBuffer(ctx: AudioContext, seconds: number = 3): AudioBuffer {
  const bufferSize = ctx.sampleRate * seconds;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    // Algorithme de filtre de Paul Kellet pour bruit rose doux
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
    b6 = white * 0.115926;
  }
  return buffer;
}

interface ActiveSoundscapeInstance {
  stop: () => void;
  setVolume: (v: number) => void;
}

/**
 * Synthétiseurs procéduraux purs pour chaque ambiance
 */
function startProceduralSoundscape(
  ctx: AudioContext,
  id: SoundscapeId,
  masterVolumeNode: GainNode
): ActiveSoundscapeInstance {
  const soundscapeGain = ctx.createGain();
  soundscapeGain.gain.setValueAtTime(0.001, ctx.currentTime);
  soundscapeGain.gain.exponentialRampToValueAtTime(1.0, ctx.currentTime + 1.2);
  soundscapeGain.connect(masterVolumeNode);

  const noiseBuffer = createNoiseBuffer(ctx, 4);
  const cleanupTasks: Array<() => void> = [];

  if (id === "rainforest" || id === "monsoon") {
    // Pluie équatoriale : bruit rose filtré passe-bande + gouttes occasionnelles
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = id === "monsoon" ? "lowpass" : "bandpass";
    filter.frequency.value = id === "monsoon" ? 850 : 1200;
    filter.Q.value = 1.0;

    noiseSource.connect(filter);
    filter.connect(soundscapeGain);
    noiseSource.start();

    // Timer de gouttes d'eau
    const dropInterval = setInterval(() => {
      if (ctx.state !== "running") return;
      try {
        const osc = ctx.createOscillator();
        const dropGain = ctx.createGain();
        const freq = 1400 + Math.random() * 800;
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.6, ctx.currentTime + 0.08);

        dropGain.gain.setValueAtTime(0.04, ctx.currentTime);
        dropGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.09);

        osc.connect(dropGain);
        dropGain.connect(soundscapeGain);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } catch {
        // AudioContext clean exit
      }
    }, id === "monsoon" ? 180 : 380);

    cleanupTasks.push(() => {
      clearInterval(dropInterval);
      try {
        noiseSource.stop();
        noiseSource.disconnect();
      } catch {}
    });
  } else if (id === "alpine") {
    // Vent doux des sommets + cloches d'alpage occasionnelles
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 350;

    noiseSource.connect(filter);
    filter.connect(soundscapeGain);
    noiseSource.start();

    // Tintement de cloches en bronze d'alpage (partiels métalliques)
    const bellInterval = setInterval(() => {
      if (ctx.state !== "running") return;
      try {
        const fundamental = 392 + Math.random() * 80; // Sol4
        const partials = [1, 2.76, 5.4];
        partials.forEach((mult, idx) => {
          const osc = ctx.createOscillator();
          const pGain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(fundamental * mult, ctx.currentTime);

          const vol = 0.04 / (idx + 1);
          pGain.gain.setValueAtTime(vol, ctx.currentTime);
          pGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.8);

          osc.connect(pGain);
          pGain.connect(soundscapeGain);
          osc.start();
          osc.stop(ctx.currentTime + 1.9);
        });
      } catch {}
    }, 2800);

    cleanupTasks.push(() => {
      clearInterval(bellInterval);
      try {
        noiseSource.stop();
        noiseSource.disconnect();
      } catch {}
    });
  } else if (id === "ocean") {
    // Vagues de ressac : houle périodique filtrée de 7 secondes
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 450;

    const swellGain = ctx.createGain();
    swellGain.gain.setValueAtTime(0.05, ctx.currentTime);

    noiseSource.connect(filter);
    filter.connect(swellGain);
    swellGain.connect(soundscapeGain);
    noiseSource.start();

    // Modulation cyclique du ressac
    let phase = 0;
    const waveInterval = setInterval(() => {
      if (ctx.state !== "running") return;
      try {
        phase += 0.15;
        const swell = (Math.sin(phase) + 1) / 2; // entre 0 et 1
        const targetVol = 0.03 + swell * 0.18;
        const targetFreq = 250 + swell * 400;
        swellGain.gain.linearRampToValueAtTime(targetVol, ctx.currentTime + 0.15);
        filter.frequency.linearRampToValueAtTime(targetFreq, ctx.currentTime + 0.15);
      } catch {}
    }, 150);

    cleanupTasks.push(() => {
      clearInterval(waveInterval);
      try {
        noiseSource.stop();
        noiseSource.disconnect();
      } catch {}
    });
  } else if (id === "zen") {
    // Carillons de bambou pentatoniques (E4, G4, A4, B4, D5, E5)
    const notes = [329.63, 392.0, 440.0, 493.88, 587.33, 659.25];
    const chimeInterval = setInterval(() => {
      if (ctx.state !== "running") return;
      try {
        const note = notes[Math.floor(Math.random() * notes.length)];
        const osc = ctx.createOscillator();
        const chimeGain = ctx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(note, ctx.currentTime);

        chimeGain.gain.setValueAtTime(0.05, ctx.currentTime);
        chimeGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.2);

        osc.connect(chimeGain);
        chimeGain.connect(soundscapeGain);
        osc.start();
        osc.stop(ctx.currentTime + 2.3);
      } catch {}
    }, 1400);

    cleanupTasks.push(() => {
      clearInterval(chimeInterval);
    });
  } else {
    // desert / cafe / savanna : rumeur et souffle chaleureux
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = id === "desert" ? 280 : 450;
    filter.Q.value = 0.8;

    noiseSource.connect(filter);
    filter.connect(soundscapeGain);
    noiseSource.start();

    cleanupTasks.push(() => {
      try {
        noiseSource.stop();
        noiseSource.disconnect();
      } catch {}
    });
  }

  return {
    stop: () => {
      try {
        soundscapeGain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.8);
        setTimeout(() => {
          cleanupTasks.forEach((t) => t());
          soundscapeGain.disconnect();
        }, 900);
      } catch {
        cleanupTasks.forEach((t) => t());
      }
    },
    setVolume: (v: number) => {
      try {
        soundscapeGain.gain.setValueAtTime(Math.max(0.0001, v), ctx.currentTime);
      } catch {}
    },
  };
}

/**
 * Contrôleur Global Radio Globe
 */
class RadioGlobeEngine {
  private audioElement: HTMLAudioElement | null = null;
  private masterGainNode: GainNode | null = null;
  private activeSoundscape: ActiveSoundscapeInstance | null = null;

  private currentMode: "radio" | "soundscape" = "radio";
  private isPlaying: boolean = false;
  private isMuted: boolean = false;
  private baseVolume: number = 0.65;
  private duckFactor: number = 1.0; // 0.25 en cas de ducking vocal
  private currentStation: RadioStation = CURATED_RADIO_STATIONS[0];
  private currentSoundscapeId: SoundscapeId = "rainforest";
  private listeners: Array<(state: ReturnType<RadioGlobeEngine["getState"]>) => void> = [];

  constructor() {
    if (typeof window !== "undefined") {
      this.audioElement = new Audio();
      // NOTE: DO NOT set crossOrigin = "anonymous" for standard audio streams,
      // as shoutcast/icecast servers often do not send CORS headers, causing the browser to block playback.
      this.audioElement.preload = "none";

      this.audioElement.addEventListener("error", (e) => {
        console.warn("[RadioGlobeEngine] Audio error event caught:", e);
      });

      this.audioElement.addEventListener("ended", () => {
        if (this.isPlaying && this.currentMode === "radio") {
          // Reconnexion automatique au flux en direct
          this.play();
        }
      });
    }
  }

  public subscribe(cb: (state: ReturnType<RadioGlobeEngine["getState"]>) => void): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notifyState() {
    const state = this.getState();
    this.listeners.forEach((l) => {
      try {
        l(state);
      } catch {}
    });
  }

  private initAudioNodes() {
    const ctx = getAudioContext();
    if (ctx && !this.masterGainNode) {
      this.masterGainNode = ctx.createGain();
      this.masterGainNode.gain.setValueAtTime(this.computeEffectiveVolume(), ctx.currentTime);
      this.masterGainNode.connect(ctx.destination);
    }
  }

  private computeEffectiveVolume(): number {
    if (this.isMuted) return 0;
    return this.baseVolume * this.duckFactor;
  }

  private applyVolumeUpdate() {
    const eff = this.computeEffectiveVolume();
    if (this.audioElement) {
      this.audioElement.volume = Math.max(0, Math.min(1, eff));
    }
    const ctx = getAudioContext();
    if (ctx && this.masterGainNode) {
      try {
        this.masterGainNode.gain.linearRampToValueAtTime(eff, ctx.currentTime + 0.15);
      } catch {
        this.masterGainNode.gain.value = eff;
      }
    }
  }

  public play() {
    this.isPlaying = true;
    this.initAudioNodes();

    if (this.currentMode === "radio") {
      // Arrêter l'ambiance synthétisée si elle jouait
      if (this.activeSoundscape) {
        this.activeSoundscape.stop();
        this.activeSoundscape = null;
      }

      const station = this.currentStation || CURATED_RADIO_STATIONS[0];
      this.currentStation = station;

      if (this.audioElement) {
        if (this.audioElement.src !== station.streamUrl) {
          this.audioElement.src = station.streamUrl;
          this.audioElement.load();
        }
        this.audioElement.volume = this.computeEffectiveVolume();
        const playPromise = this.audioElement.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn("[RadioGlobeEngine] play() rejected for station", station.name, err);
            // Si la station spécifique échoue, basculer sur un flux de secours ultra-robuste
            if (station.streamUrl !== "https://icecast.radiofrance.fr/fipworld-midfi.mp3" && this.audioElement) {
              console.log("[RadioGlobeEngine] Retrying with backup world stream...");
              this.audioElement.src = "https://icecast.radiofrance.fr/fipworld-midfi.mp3";
              this.audioElement.load();
              this.audioElement.play().catch((e) => console.warn("[RadioGlobeEngine] Backup stream play failed:", e));
            }
          });
        }
      }
    } else {
      if (this.audioElement) {
        this.audioElement.pause();
      }
      this.startSoundscape();
    }
    this.notifyState();
  }

  public pause() {
    this.isPlaying = false;
    if (this.audioElement) {
      this.audioElement.pause();
    }
    if (this.activeSoundscape) {
      this.activeSoundscape.stop();
      this.activeSoundscape = null;
    }
    this.notifyState();
  }

  private startSoundscape() {
    const ctx = getAudioContext();
    if (!ctx || !this.masterGainNode) return;
    if (this.activeSoundscape) {
      this.activeSoundscape.stop();
      this.activeSoundscape = null;
    }
    this.activeSoundscape = startProceduralSoundscape(
      ctx,
      this.currentSoundscapeId,
      this.masterGainNode
    );
  }

  public setMode(mode: "radio" | "soundscape") {
    const wasPlaying = this.isPlaying;
    if (wasPlaying) {
      this.pause();
    }
    this.currentMode = mode;
    if (wasPlaying) {
      this.play();
    } else {
      this.notifyState();
    }
  }

  public setStation(station: RadioStation) {
    this.currentStation = station;
    this.currentSoundscapeId = station.fallbackSoundscape;
    if (this.isPlaying) {
      if (this.currentMode === "radio") {
        if (this.audioElement) {
          this.audioElement.src = station.streamUrl;
          this.audioElement.load();
          const playPromise = this.audioElement.play();
          if (playPromise !== undefined) {
            playPromise.catch((err) => {
              console.warn("[RadioGlobeEngine] Station switch play failed:", err);
            });
          }
        }
      } else {
        this.startSoundscape();
      }
    }
    this.notifyState();
  }

  public setSoundscape(id: SoundscapeId) {
    this.currentSoundscapeId = id;
    if (this.isPlaying && this.currentMode === "soundscape") {
      this.startSoundscape();
    }
    this.notifyState();
  }

  public setVolume(vol: number) {
    this.baseVolume = Math.max(0, Math.min(1, vol));
    this.applyVolumeUpdate();
    this.notifyState();
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    this.applyVolumeUpdate();
    this.notifyState();
    return this.isMuted;
  }

  /**
   * Ducking pro : atténue la musique/ambiance à 25% pendant les capsules vocales
   */
  public setDucking(enabled: boolean) {
    this.duckFactor = enabled ? 0.25 : 1.0;
    this.applyVolumeUpdate();
  }

  public getState() {
    return {
      isPlaying: this.isPlaying,
      isMuted: this.isMuted,
      volume: this.baseVolume,
      mode: this.currentMode,
      station: this.currentStation,
      soundscapeId: this.currentSoundscapeId,
    };
  }
}

export const radioGlobeEngine = new RadioGlobeEngine();
