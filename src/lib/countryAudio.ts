/**
 * Audio Immersion pour l'Atlas Géographique :
 * 1. Prononciation Native (Web Speech API avec accent local du pays)
 * 2. Hymnes Nationaux & Fanfares procédurales (Web Audio API offline-first)
 */

// Mapping des codes ISO3 vers les codes de langue BCP-47 pour la synthèse vocale
const ISO3_TO_LANG_CODE: Record<string, string> = {
  CHE: "fr-CH", // Suisse
  FRA: "fr-FR", // France
  BEL: "fr-BE", // Belgique
  CAN: "fr-CA", // Canada
  DEU: "de-DE", // Allemagne
  AUT: "de-AT", // Autriche
  ITA: "it-IT", // Italie
  ESP: "es-ES", // Espagne
  PRT: "pt-PT", // Portugal
  BRA: "pt-BR", // Brésil
  GBR: "en-GB", // Royaume-Uni
  USA: "en-US", // États-Unis
  AUS: "en-AU", // Australie
  NZL: "en-NZ", // Nouvelle-Zélande
  IRL: "en-IE", // Irlande
  JPN: "ja-JP", // Japon
  CHN: "zh-CN", // Chine
  KOR: "ko-KR", // Corée du Sud
  RUS: "ru-RU", // Russie
  MAR: "ar-MA", // Maroc
  DZA: "ar-DZ", // Algérie
  TUN: "ar-TN", // Tunisie
  EGY: "ar-EG", // Égypte
  SAU: "ar-SA", // Arabie Saoudite
  SEN: "fr-SN", // Sénégal
  CIV: "fr-CI", // Côte d'Ivoire
  CMR: "fr-CM", // Cameroun
  MEX: "es-MX", // Mexique
  ARG: "es-AR", // Argentine
  COL: "es-CO", // Colombie
  CHL: "es-CL", // Chili
  IND: "hi-IN", // Inde
  NLD: "nl-NL", // Pays-Bas
  SWE: "sv-SE", // Suède
  NOR: "nb-NO", // Norvège
  DNK: "da-DK", // Danemark
  FIN: "fi-FI", // Finlande
  POL: "pl-PL", // Pologne
  GRC: "el-GR", // Grèce
  TUR: "tr-TR", // Turquie
  ZAF: "en-ZA", // Afrique du Sud
};

/**
 * Prononce le nom du pays et de sa capitale avec l'accent local natif
 */
export function speakCountryAndCapital(
  countryName: string,
  capitalName: string,
  iso3: string
): { success: boolean; stop: () => void } {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return { success: false, stop: () => {} };
  }

  try {
    window.speechSynthesis.cancel();

    const targetLang = ISO3_TO_LANG_CODE[iso3.toUpperCase()] || "fr-FR";
    const textToSpeak = `${countryName}. Capitale : ${capitalName}.`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);

    utterance.lang = targetLang;
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    // Trouver une voix adaptée si disponible
    const voices = window.speechSynthesis.getVoices();
    const matchedVoice =
      voices.find((v) => v.lang === targetLang) ||
      voices.find((v) => v.lang.startsWith(targetLang.slice(0, 2))) ||
      voices.find((v) => v.lang.startsWith("fr"));

    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    window.speechSynthesis.speak(utterance);

    return {
      success: true,
      stop: () => window.speechSynthesis.cancel(),
    };
  } catch {
    return { success: false, stop: () => {} };
  }
}

/**
 * Moteur de synthèse procédurale Web Audio pour les Hymnes & Fanfares Nationales
 * 100% autonome, zéro dépendance réseau, zéro erreur 404
 */
let activeAudioContext: AudioContext | null = null;
let activeGainNode: GainNode | null = null;

// Thèmes mélodiques des hymnes célèbres (fréquences en Hz + durées en secondes)
const ANTHEM_MOTIFS: Record<string, Array<[number, number]>> = {
  // Cantique Suisse (Doux et solennel)
  CHE: [
    [261.63, 0.6], // Do
    [329.63, 0.4], // Mi
    [392.0, 0.6],  // Sol
    [523.25, 0.8], // Do aigu
    [493.88, 0.4], // Si
    [440.0, 0.4],  // La
    [392.0, 0.8],  // Sol
  ],
  // La Marseillaise (France - énergique et martial)
  FRA: [
    [293.66, 0.3], // Ré
    [293.66, 0.3], // Ré
    [293.66, 0.3], // Ré
    [392.0, 0.7],  // Sol
    [392.0, 0.4],  // Sol
    [440.0, 0.4],  // La
    [440.0, 0.4],  // La
    [587.33, 0.9], // Ré aigu
    [493.88, 0.4], // Si
    [392.0, 0.6],  // Sol
  ],
  // God Save the King (Royaume-Uni)
  GBR: [
    [261.63, 0.5], // Do
    [261.63, 0.5], // Do
    [293.66, 0.5], // Ré
    [246.94, 0.7], // Si grave
    [261.63, 0.5], // Do
    [293.66, 0.5], // Ré
    [329.63, 0.9], // Mi
  ],
  // Star-Spangled Banner (États-Unis)
  USA: [
    [392.0, 0.3],  // Sol
    [329.63, 0.3], // Mi
    [261.63, 0.5], // Do
    [329.63, 0.3], // Mi
    [392.0, 0.5],  // Sol
    [523.25, 0.8], // Do aigu
  ],
  // Kimigayo (Japon - Pentatonique traditionnel)
  JPN: [
    [293.66, 0.8], // Ré
    [261.63, 0.8], // Do
    [293.66, 0.8], // Ré
    [329.63, 0.8], // Mi
    [392.0, 0.8],  // Sol
    [329.63, 0.8], // Mi
    [293.66, 1.2], // Ré
  ],
  // Deutschlandlied / Ode à la Joie (Allemagne / Europe)
  DEU: [
    [329.63, 0.5], // Mi
    [329.63, 0.5], // Mi
    [349.23, 0.5], // Fa
    [392.0, 0.5],  // Sol
    [392.0, 0.5],  // Sol
    [349.23, 0.5], // Fa
    [329.63, 0.5], // Mi
    [293.66, 0.5], // Ré
  ],
  // Hino Nacional Brasileiro (Brésil - Brillant et cuivré)
  BRA: [
    [392.0, 0.3],  // Sol
    [440.0, 0.3],  // La
    [493.88, 0.3], // Si
    [523.25, 0.6], // Do
    [587.33, 0.3], // Ré
    [659.25, 0.8], // Mi
  ],
};

/**
 * Génère une fanfare majestueuse pour n'importe quel pays basé sur son ISO3
 */
function getProceduralFanfare(iso3: string): Array<[number, number]> {
  let hash = 0;
  for (let i = 0; i < iso3.length; i++) {
    hash = (hash << 5) - hash + iso3.charCodeAt(i);
  }
  const rootFreq = 220 + (Math.abs(hash) % 110); // 220Hz à 330Hz

  return [
    [rootFreq, 0.4],
    [rootFreq * 1.25, 0.3],
    [rootFreq * 1.5, 0.4],
    [rootFreq * 2.0, 0.7],
    [rootFreq * 1.75, 0.3],
    [rootFreq * 2.0, 1.0],
  ];
}

/**
 * Joue l'extrait d'hymne national ou fanfare du pays
 */
export function playNationalAnthem(iso3: string, onEnded?: () => void): () => void {
  stopNationalAnthem();

  if (typeof window === "undefined") return () => {};

  try {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return () => {};

    const ctx = new AudioContextClass();
    activeAudioContext = ctx;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.25, ctx.currentTime);
    masterGain.connect(ctx.destination);
    activeGainNode = masterGain;

    const notes = ANTHEM_MOTIFS[iso3.toUpperCase()] || getProceduralFanfare(iso3);
    let currentStartTime = ctx.currentTime + 0.05;

    notes.forEach(([freq, duration]) => {
      // Oscillateur Principal (Cuivres chaleureux)
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, currentStartTime);

      // Enveloppe d'attaque et relâchement (ADSR)
      noteGain.gain.setValueAtTime(0.001, currentStartTime);
      noteGain.gain.exponentialRampToValueAtTime(0.3, currentStartTime + 0.04);
      noteGain.gain.exponentialRampToValueAtTime(0.001, currentStartTime + duration - 0.02);

      // Filtre passe-bas pour adoucir le timbre
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(freq * 3.5, currentStartTime);

      osc.connect(filter);
      filter.connect(noteGain);
      noteGain.connect(masterGain);

      osc.start(currentStartTime);
      osc.stop(currentStartTime + duration);

      currentStartTime += duration;
    });

    const totalDuration = currentStartTime - ctx.currentTime;
    const timeout = setTimeout(() => {
      stopNationalAnthem();
      if (onEnded) onEnded();
    }, totalDuration * 1000);

    return () => {
      clearTimeout(timeout);
      stopNationalAnthem();
    };
  } catch {
    return () => {};
  }
}

/**
 * Arrête la lecture audio de l'hymne en cours
 */
export function stopNationalAnthem(): void {
  try {
    if (activeGainNode && activeAudioContext) {
      activeGainNode.gain.setValueAtTime(activeGainNode.gain.value, activeAudioContext.currentTime);
      activeGainNode.gain.exponentialRampToValueAtTime(0.0001, activeAudioContext.currentTime + 0.05);
    }
    if (activeAudioContext && activeAudioContext.state !== "closed") {
      setTimeout(() => {
        try {
          activeAudioContext?.close();
        } catch {
          // Ignorer
        }
        activeAudioContext = null;
        activeGainNode = null;
      }, 60);
    }
  } catch {
    activeAudioContext = null;
    activeGainNode = null;
  }
}
