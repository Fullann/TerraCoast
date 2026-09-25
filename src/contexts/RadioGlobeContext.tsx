import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  type RadioStation,
  type SoundscapeDefinition,
  type SoundscapeId,
  SOUNDSCAPES,
  getRecommendedAudioForCountry,
} from "../lib/radioGlobeData";
import { radioGlobeEngine } from "../lib/radioGlobeEngine";
import {
  audioAnecdoteSpeaker,
} from "../lib/audioAnecdoteSpeaker";
import {
  getAudioAnecdoteForCountry,
  type AudioAnecdote,
} from "../lib/audioAnecdotesData";

const ANECDOTES_STORAGE_KEY = "terracoast_radio_anecdotes_enabled";
const VOLUME_STORAGE_KEY = "terracoast_radio_volume";

interface CurrentCountryInfo {
  iso3: string;
  name: string;
  flag: string;
}

interface RadioGlobeContextType {
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  mode: "radio" | "soundscape";
  currentStation: RadioStation;
  currentSoundscape: SoundscapeDefinition;
  currentCountry: CurrentCountryInfo | null;
  anecdotesEnabled: boolean;
  isSpeakingAnecdote: boolean;
  currentAnecdote: AudioAnecdote | null;

  // Actions
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  setMode: (mode: "radio" | "soundscape") => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  tuneToCountry: (iso3: string, name?: string, flag?: string) => void;
  setStation: (station: RadioStation) => void;
  setSoundscape: (id: SoundscapeId) => void;
  triggerCountryAnecdote: (iso3: string, name?: string, flag?: string) => void;
  skipAnecdote: () => void;
  toggleAnecdotesEnabled: () => void;
}

const RadioGlobeContext = createContext<RadioGlobeContextType | null>(null);

export function RadioGlobeProvider({ children }: { children: React.ReactNode }) {
  // Initialiser sur Brésil par défaut
  const initialAudio = getRecommendedAudioForCountry("BRA");

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolumeState] = useState<number>(() => {
    if (typeof localStorage !== "undefined") {
      const saved = localStorage.getItem(VOLUME_STORAGE_KEY);
      return saved ? parseFloat(saved) || 0.65 : 0.65;
    }
    return 0.65;
  });
  const [mode, setModeState] = useState<"radio" | "soundscape">("radio");
  const [currentStation, setCurrentStation] = useState<RadioStation>(initialAudio.station);
  const [currentSoundscape, setCurrentSoundscape] = useState<SoundscapeDefinition>(
    initialAudio.soundscape
  );
  const [currentCountry, setCurrentCountry] = useState<CurrentCountryInfo | null>({
    iso3: "BRA",
    name: "Brésil",
    flag: "🇧🇷",
  });

  const [anecdotesEnabled, setAnecdotesEnabled] = useState<boolean>(() => {
    if (typeof localStorage !== "undefined") {
      const saved = localStorage.getItem(ANECDOTES_STORAGE_KEY);
      return saved === null ? true : saved === "true";
    }
    return true;
  });

  const [isSpeakingAnecdote, setIsSpeakingAnecdote] = useState<boolean>(false);
  const [currentAnecdote, setCurrentAnecdote] = useState<AudioAnecdote | null>(null);

  // Synchroniser avec l'engine et écouter ses changements d'état
  useEffect(() => {
    radioGlobeEngine.setVolume(volume);
    radioGlobeEngine.setStation(currentStation);

    const unsubEngine = radioGlobeEngine.subscribe((engineState) => {
      setIsPlaying(engineState.isPlaying);
      setIsMuted(engineState.isMuted);
      setModeState(engineState.mode);
    });
    return unsubEngine;
  }, []);

  // Écouter les changements d'état du narrateur vocal
  useEffect(() => {
    const unsub = audioAnecdoteSpeaker.subscribe((speaking, anecdote) => {
      setIsSpeakingAnecdote(speaking);
      setCurrentAnecdote(anecdote);
    });
    return unsub;
  }, []);

  const play = useCallback(() => {
    radioGlobeEngine.play();
    setIsPlaying(true);
  }, []);

  const pause = useCallback(() => {
    radioGlobeEngine.pause();
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const setMode = useCallback(
    (newMode: "radio" | "soundscape") => {
      setModeState(newMode);
      radioGlobeEngine.setMode(newMode);
    },
    []
  );

  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    setVolumeState(clamped);
    radioGlobeEngine.setVolume(clamped);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(VOLUME_STORAGE_KEY, String(clamped));
    }
  }, []);

  const toggleMute = useCallback(() => {
    const muted = radioGlobeEngine.toggleMute();
    setIsMuted(muted);
  }, []);

  const setStation = useCallback(
    (station: RadioStation) => {
      setCurrentStation(station);
      setCurrentSoundscape(SOUNDSCAPES[station.fallbackSoundscape] || SOUNDSCAPES.rainforest);
      setCurrentCountry({
        iso3: station.iso3,
        name: station.countryName,
        flag: station.flag,
      });
      radioGlobeEngine.setStation(station);
    },
    []
  );

  const setSoundscape = useCallback((id: SoundscapeId) => {
    const def = SOUNDSCAPES[id];
    if (def) {
      setCurrentSoundscape(def);
      radioGlobeEngine.setSoundscape(id);
    }
  }, []);

  // Synchroniser sur un pays (appelé depuis l'Atlas ou les Quiz)
  const tuneToCountry = useCallback(
    (iso3: string, name?: string, flag?: string) => {
      const { station, soundscape } = getRecommendedAudioForCountry(iso3);
      setCurrentStation(station);
      setCurrentSoundscape(soundscape);
      setCurrentCountry({
        iso3: iso3.toUpperCase(),
        name: name || station.countryName,
        flag: flag || station.flag,
      });
      radioGlobeEngine.setStation(station);
      radioGlobeEngine.setSoundscape(soundscape.id);
    },
    []
  );

  // Déclencher une capsule vocale de 10s (appelé lors d'une bonne réponse en quiz)
  const triggerCountryAnecdote = useCallback(
    (iso3: string, name?: string, flag?: string) => {
      if (!anecdotesEnabled) return;
      const anecdote = getAudioAnecdoteForCountry(iso3, name, flag);
      audioAnecdoteSpeaker.speak(anecdote);
    },
    [anecdotesEnabled]
  );

  const skipAnecdote = useCallback(() => {
    audioAnecdoteSpeaker.stop();
  }, []);

  const toggleAnecdotesEnabled = useCallback(() => {
    setAnecdotesEnabled((prev) => {
      const next = !prev;
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(ANECDOTES_STORAGE_KEY, String(next));
      }
      if (!next) {
        audioAnecdoteSpeaker.stop();
      }
      return next;
    });
  }, []);

  return (
    <RadioGlobeContext.Provider
      value={{
        isPlaying,
        isMuted,
        volume,
        mode,
        currentStation,
        currentSoundscape,
        currentCountry,
        anecdotesEnabled,
        isSpeakingAnecdote,
        currentAnecdote,
        play,
        pause,
        togglePlay,
        setMode,
        setVolume,
        toggleMute,
        tuneToCountry,
        setStation,
        setSoundscape,
        triggerCountryAnecdote,
        skipAnecdote,
        toggleAnecdotesEnabled,
      }}
    >
      {children}
    </RadioGlobeContext.Provider>
  );
}

export function useRadioGlobe() {
  const ctx = useContext(RadioGlobeContext);
  if (!ctx) {
    throw new Error("useRadioGlobe must be used within a RadioGlobeProvider");
  }
  return ctx;
}
