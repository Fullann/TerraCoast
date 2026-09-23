// Moteur de Narration Vocale & Audio Ducking pour les anecdotes de 10 secondes
// Utilise l'API Web Speech Synthesis native avec sélection de voix naturelle

import { radioGlobeEngine } from "./radioGlobeEngine";
import type { AudioAnecdote } from "./audioAnecdotesData";

class AudioAnecdoteSpeaker {
  private isSpeaking: boolean = false;
  private onStateChangeListeners: Array<(isSpeaking: boolean, anecdote: AudioAnecdote | null) => void> = [];
  private currentAnecdote: AudioAnecdote | null = null;
  private safetyTimeout: any = null;

  public subscribe(
    cb: (isSpeaking: boolean, anecdote: AudioAnecdote | null) => void
  ): () => void {
    this.onStateChangeListeners.push(cb);
    cb(this.isSpeaking, this.currentAnecdote);
    return () => {
      this.onStateChangeListeners = this.onStateChangeListeners.filter((l) => l !== cb);
    };
  }

  private notify(isSpeaking: boolean, anecdote: AudioAnecdote | null) {
    this.isSpeaking = isSpeaking;
    this.currentAnecdote = anecdote;
    this.onStateChangeListeners.forEach((l) => l(isSpeaking, anecdote));
  }

  /**
   * Lance la lecture de la capsule sonore de 10s avec audio ducking automatique
   */
  public speak(anecdote: AudioAnecdote, lang: string = "fr-FR") {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      // Navigateur sans synthèse vocale : simuler 8s d'affichage visuel
      this.notify(true, anecdote);
      setTimeout(() => this.notify(false, null), 8000);
      return;
    }

    // Arrêter toute récitation en cours
    this.stop();

    // 1. Déclencher le ducking audio (-75% de volume sur la musique/ambiance)
    radioGlobeEngine.setDucking(true);
    this.notify(true, anecdote);

    const utterance = new SpeechSynthesisUtterance(anecdote.text);

    // Définir la langue et choisir la voix la plus naturelle
    utterance.lang = lang.startsWith("fr") ? "fr-FR" : "en-US";
    utterance.rate = 1.05; // Rythme dynamique pour tenir en ~9-10s
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) =>
        v.lang.startsWith(utterance.lang.slice(0, 2)) &&
        (v.name.includes("Natural") ||
          v.name.includes("Google") ||
          v.name.includes("Amélie") ||
          v.name.includes("Thomas") ||
          v.name.includes("Siri"))
    ) || voices.find((v) => v.lang.startsWith(utterance.lang.slice(0, 2)));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    const finish = () => {
      if (this.safetyTimeout) {
        clearTimeout(this.safetyTimeout);
        this.safetyTimeout = null;
      }
      // 2. Restaurer le volume d'origine
      radioGlobeEngine.setDucking(false);
      this.notify(false, null);
    };

    utterance.onend = finish;
    utterance.onerror = finish;

    // Sécurité au cas où onend ne fire pas (problème connu sur certains Chrome/Safari)
    this.safetyTimeout = setTimeout(() => {
      finish();
    }, 13000);

    try {
      window.speechSynthesis.speak(utterance);
    } catch {
      finish();
    }
  }

  /**
   * Interrompt immédiatement l'anecdote et restaure le volume
   */
  public stop() {
    if (this.safetyTimeout) {
      clearTimeout(this.safetyTimeout);
      this.safetyTimeout = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    radioGlobeEngine.setDucking(false);
    this.notify(false, null);
  }

  public getStatus() {
    return {
      isSpeaking: this.isSpeaking,
      currentAnecdote: this.currentAnecdote,
    };
  }
}

export const audioAnecdoteSpeaker = new AudioAnecdoteSpeaker();
