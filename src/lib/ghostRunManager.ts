/**
 * Gestionnaire des Défis Asynchrones entre Amis (« Ghost Runs » 👻)
 * Permet d'enregistrer une performance sur un quiz, de générer un lien partageable
 * (WhatsApp / Discord / SMS), et de permettre à un ami d'affronter le fantôme
 * du joueur à son propre rythme.
 */

export interface GhostRunChallenge {
  id: string;
  quizId: string;
  quizTitle: string;
  quizCategory?: string;
  challengerId?: string;
  challengerPseudo: string;
  challengerAvatar?: string;
  challengerScore: number;
  challengerAccuracy: number;
  challengerTimeSeconds: number;
  challengerFederation?: string;
  createdAt: string;
}

export interface GhostRunResult {
  id: string;
  challengeId: string;
  quizId: string;
  quizTitle: string;
  challengerPseudo: string;
  challengerScore: number;
  opponentPseudo: string;
  opponentScore: number;
  opponentAccuracy: number;
  opponentWon: boolean;
  scoreDifference: number;
  completedAt: string;
}

const STORAGE_SENT_GHOSTS_KEY = "terracoast_ghost_runs_sent_v1";
const STORAGE_COMPLETED_GHOSTS_KEY = "terracoast_ghost_runs_completed_v1";

let inMemorySentGhosts: GhostRunChallenge[] = [];
let inMemoryCompletedGhosts: GhostRunResult[] = [];

/**
 * Encode en base64 UTF-8 sécurisé pour les URL
 */
function utf8ToBase64(str: string): string {
  try {
    return btoa(
      encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
        String.fromCharCode(parseInt(p1, 16))
      )
    );
  } catch {
    return btoa(str);
  }
}

/**
 * Décode le base64 UTF-8 sécurisé
 */
function base64ToUtf8(str: string): string {
  try {
    return decodeURIComponent(
      Array.prototype.map
        .call(atob(str), (c: string) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
  } catch {
    return atob(str);
  }
}

/**
 * Encode un GhostRun en chaîne URL compacte
 */
export function encodeGhostRunChallenge(challenge: GhostRunChallenge): string {
  const json = JSON.stringify(challenge);
  return encodeURIComponent(utf8ToBase64(json));
}

/**
 * Décode un GhostRun depuis une chaîne URL ou un query param
 */
export function decodeGhostRunChallenge(encodedString: string): GhostRunChallenge | null {
  try {
    const raw = decodeURIComponent(encodedString);
    const json = base64ToUtf8(raw);
    const parsed = JSON.parse(json) as GhostRunChallenge;
    if (parsed && parsed.quizId && typeof parsed.challengerScore === "number") {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Génère le lien URL complet de défi Ghost Run
 */
export function getGhostRunUrl(challenge: GhostRunChallenge): string {
  const encoded = encodeGhostRunChallenge(challenge);
  const origin =
    typeof window !== "undefined" && window.location.origin
      ? window.location.origin
      : "https://terracoast.app";
  return `${origin}/quizzes/play/${challenge.quizId}?ghost=${encoded}`;
}

/**
 * Génère les textes et liens de partage WhatsApp / Discord / Réseaux
 */
export function generateGhostRunShare(challenge: GhostRunChallenge): {
  message: string;
  url: string;
  whatsappUrl: string;
  telegramUrl: string;
  twitterUrl: string;
} {
  const url = getGhostRunUrl(challenge);
  const message = `⚔️ DÉFI GHOST RUN TERRACOAST ! 👻\nJ'ai fait ${challenge.challengerScore} pts (${challenge.challengerAccuracy}%) sur le quiz "${challenge.quizTitle}". Sauras-tu battre mon fantôme ? 🌍\nRelève le défi à ton rythme ici :\n${url}`;

  return {
    message,
    url,
    whatsappUrl: `https://wa.me/?text=${encodeURIComponent(message)}`,
    telegramUrl: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(
      `⚔️ Défi Ghost Run sur ${challenge.quizTitle} ! Bats mon score de ${challenge.challengerScore} pts ! 👻`
    )}`,
    twitterUrl: `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      `⚔️ Sauras-tu battre mon fantôme sur "${challenge.quizTitle}" (${challenge.challengerScore} pts) sur @TerraCoastApp ? 👻 ${url}`
    )}`,
  };
}

/**
 * Enregistre un Ghost Run créé par l'utilisateur
 */
export function saveSentGhostRun(challenge: GhostRunChallenge): void {
  try {
    const existing = getSentGhostRuns();
    const updated = [challenge, ...existing.filter((g) => g.id !== challenge.id)].slice(0, 50);
    inMemorySentGhosts = updated;
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_SENT_GHOSTS_KEY, JSON.stringify(updated));
    }
  } catch {
    // Ignorer
  }
}

/**
 * Récupère l'historique des Ghost Runs envoyés
 */
export function getSentGhostRuns(): GhostRunChallenge[] {
  if (inMemorySentGhosts.length > 0) return inMemorySentGhosts;
  try {
    if (typeof localStorage !== "undefined") {
      const stored = localStorage.getItem(STORAGE_SENT_GHOSTS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as GhostRunChallenge[];
        inMemorySentGhosts = parsed;
        return parsed;
      }
    }
  } catch {
    // Ignorer
  }
  return inMemorySentGhosts;
}

/**
 * Enregistre le dénouement d'un duel Ghost Run
 */
export function recordCompletedGhostRun(result: GhostRunResult): void {
  try {
    const existing = getCompletedGhostRuns();
    const updated = [result, ...existing.filter((g) => g.id !== result.id)].slice(0, 50);
    inMemoryCompletedGhosts = updated;
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_COMPLETED_GHOSTS_KEY, JSON.stringify(updated));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("terracoast_ghost_completed", { detail: result }));
      }
    }
  } catch {
    // Ignorer
  }
}

/**
 * Récupère l'historique des Ghost Runs complétés
 */
export function getCompletedGhostRuns(): GhostRunResult[] {
  if (inMemoryCompletedGhosts.length > 0) return inMemoryCompletedGhosts;
  try {
    if (typeof localStorage !== "undefined") {
      const stored = localStorage.getItem(STORAGE_COMPLETED_GHOSTS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as GhostRunResult[];
        inMemoryCompletedGhosts = parsed;
        return parsed;
      }
    }
  } catch {
    // Ignorer
  }
  return inMemoryCompletedGhosts;
}
