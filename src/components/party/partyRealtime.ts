import { supabase } from "../../lib/supabase";
import type {
  PartyPlayer,
  PartyRealtimeEvent,
  PartyRoom,
} from "./types";

const GUEST_ID_KEY = "terracoast_party_guest_id";
const GUEST_PSEUDO_KEY = "terracoast_party_pseudo";
const GUEST_AVATAR_KEY = "terracoast_party_avatar";

export function getOrCreateGuestId(): string {
  let id = localStorage.getItem(GUEST_ID_KEY);
  if (!id) {
    id = "guest_" + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    localStorage.setItem(GUEST_ID_KEY, id);
  }
  return id;
}

export function getStoredGuestPseudo(): string {
  return localStorage.getItem(GUEST_PSEUDO_KEY) || "";
}

export function saveGuestPseudo(pseudo: string) {
  localStorage.setItem(GUEST_PSEUDO_KEY, pseudo);
}

export function getStoredGuestAvatar(): string {
  return localStorage.getItem(GUEST_AVATAR_KEY) || "🌍";
}

export function saveGuestAvatar(avatar: string) {
  localStorage.setItem(GUEST_AVATAR_KEY, avatar);
}

/**
 * Génère un code PIN convivial du style TERRA-24 (ou TERRA-XX)
 */
export function generatePartyPin(): string {
  const num = Math.floor(10 + Math.random() * 90); // 10..99
  return `TERRA-${num}`;
}

/**
 * Normalise un code saisi par l'utilisateur (ex: "terra24", "24", "TERRA-24")
 */
export function normalizePartyPin(input: string): string {
  const clean = input.trim().toUpperCase().replace(/\s+/g, "");
  if (!clean) return "";
  if (clean.startsWith("TERRA-")) return clean;
  if (clean.startsWith("TERRA")) {
    return `TERRA-${clean.slice(5)}`;
  }
  if (/^\d{2,4}$/.test(clean)) {
    return `TERRA-${clean}`;
  }
  return clean;
}

/**
 * Calcul du score style Kahoot avec bonus de vitesse et série (streak)
 * Max 1000 pts de base + jusqu'à 200 pts de bonus streak
 */
export function calculatePartyScore(
  isCorrect: boolean,
  timeMs: number,
  timeLimitSeconds: number,
  currentStreak: number
): { points: number; newStreak: number } {
  if (!isCorrect) {
    return { points: 0, newStreak: 0 };
  }

  const limitMs = Math.max(timeLimitSeconds * 1000, 5000);
  const clampedTimeMs = Math.min(Math.max(timeMs, 200), limitMs);

  // Formule de vitesse : de 500 à 1000 points selon rapidité
  const speedRatio = 1 - clampedTimeMs / limitMs;
  const basePoints = Math.round(500 + 500 * speedRatio);

  // Bonus streak
  const newStreak = currentStreak + 1;
  let streakBonus = 0;
  if (newStreak >= 4) streakBonus = 200;
  else if (newStreak === 3) streakBonus = 150;
  else if (newStreak === 2) streakBonus = 100;
  else if (newStreak === 1) streakBonus = 50;

  return {
    points: basePoints + streakBonus,
    newStreak,
  };
}

/**
 * Gestion du canal Supabase Realtime avec Broadcast + Presence
 */
export class PartyRealtimeService {
  private channel: ReturnType<typeof supabase.channel> | null = null;
  private roomCode: string;

  constructor(roomCode: string) {
    this.roomCode = normalizePartyPin(roomCode);
  }

  public subscribe({
    currentPlayer,
    onEvent,
    onPresenceSync,
  }: {
    currentPlayer: PartyPlayer;
    onEvent: (event: PartyRealtimeEvent) => void;
    onPresenceSync: (players: PartyPlayer[]) => void;
  }) {
    if (this.channel) {
      supabase.removeChannel(this.channel);
    }

    const channelName = `terra_party_${this.roomCode}`;
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: true },
        presence: { key: currentPlayer.guestId },
      },
    });

    // 1. Écoute Presence (qui est dans le salon en direct)
    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const playersList: PartyPlayer[] = [];
        const seenGuestIds = new Set<string>();

        Object.values(state).forEach((presences) => {
          (presences as any[]).forEach((p) => {
            if (p?.guestId && !seenGuestIds.has(p.guestId)) {
              seenGuestIds.add(p.guestId);
              playersList.push({
                id: p.id || p.guestId,
                guestId: p.guestId,
                userId: p.userId || null,
                pseudo: p.pseudo || "Joueur",
                avatarUrl: p.avatarUrl || "🌍",
                score: p.score ?? 0,
                streak: p.streak ?? 0,
                isHost: !!p.isHost,
                isConnected: true,
                rank: p.rank,
              });
            }
          });
        });

        onPresenceSync(playersList);
      })
      .on("presence", { event: "join" }, ({ newPresences }) => {
        console.log("Party player joined:", newPresences);
      })
      .on("presence", { event: "leave" }, ({ leftPresences }) => {
        console.log("Party player left:", leftPresences);
      });

    // 2. Écoute Broadcast (événements rapides en direct)
    channel.on("broadcast", { event: "party_event" }, ({ payload }) => {
      if (payload) {
        onEvent(payload as PartyRealtimeEvent);
      }
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          guestId: currentPlayer.guestId,
          userId: currentPlayer.userId,
          pseudo: currentPlayer.pseudo,
          avatarUrl: currentPlayer.avatarUrl,
          score: currentPlayer.score,
          streak: currentPlayer.streak,
          isHost: currentPlayer.isHost,
        });
      }
    });

    this.channel = channel;
    return channel;
  }

  public async updatePresence(player: Partial<PartyPlayer>) {
    if (!this.channel) return;
    try {
      await this.channel.track({
        guestId: player.guestId,
        userId: player.userId,
        pseudo: player.pseudo,
        avatarUrl: player.avatarUrl,
        score: player.score,
        streak: player.streak,
        isHost: player.isHost,
        rank: player.rank,
      });
    } catch (err) {
      console.warn("Failed to update presence:", err);
    }
  }

  public async sendEvent(event: PartyRealtimeEvent) {
    if (!this.channel) return;
    await this.channel.send({
      type: "broadcast",
      event: "party_event",
      payload: event,
    });
  }

  public disconnect() {
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }
}

/**
 * Tentative de synchronisation en base Supabase (si les tables existent),
 * avec repli silencieux et transparent en cas de table non encore migrée.
 */
export async function tryPersistPartyRoom(room: PartyRoom) {
  try {
    const { error } = await supabase.from("party_rooms").upsert(
      {
        code: room.code,
        host_id: room.hostId || null,
        host_pseudo: room.hostPseudo,
        quiz_id: room.quizId,
        status: room.status,
        current_question_index: room.currentQuestionIndex,
        time_limit_seconds: room.timeLimitSeconds,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "code" }
    );
    if (error) {
      console.debug("Note: party_rooms table not yet created on remote, continuing via Realtime channels.");
    }
  } catch {
    // Ignorer si la table n'existe pas encore côté distant
  }
}
