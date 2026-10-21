import { addGems, getPlayerGamificationState, savePlayerGamificationState } from "./gamificationManager";

export interface WeekDayStatus {
  dayLabel: string; // "Lun", "Mar", etc.
  dayNumber: number; // 1 to 31
  dateString: string; // YYYY-MM-DD
  isToday: boolean;
  isPast: boolean;
  isCompleted: boolean;
}

export interface StreakMilestone {
  days: number;
  label: string;
  badgeEmoji: string;
  rewardGems: number;
  rewardDescription: string;
  streakFreeze?: number;
  freeBoosterPack?: string;
  exclusiveTitle?: string;
}

export const STREAK_MILESTONES: StreakMilestone[] = [
  { days: 3, label: "Étincelle", badgeEmoji: "✨", rewardGems: 20, rewardDescription: "+20 💎" },
  { days: 7, label: "Semaine de Feu", badgeEmoji: "🔥", rewardGems: 60, rewardDescription: "+60 💎 & 1 Gel de Flamme", streakFreeze: 1 },
  { days: 14, label: "Flamme Ardente", badgeEmoji: "⚡", rewardGems: 120, rewardDescription: "+120 💎" },
  { days: 30, label: "Maître du Feu", badgeEmoji: "🌋", rewardGems: 300, rewardDescription: "+300 💎 & Pack Légendes", freeBoosterPack: "pack_mythic" },
  { days: 60, label: "Flamme Éternelle", badgeEmoji: "🌟", rewardGems: 500, rewardDescription: "+500 💎" },
  { days: 100, label: "Légende Incandescente", badgeEmoji: "👑", rewardGems: 1000, rewardDescription: "+1 000 💎 & Titre Phénix", exclusiveTitle: "Phénix Incandescent" },
  { days: 365, label: "Phénix Immortel", badgeEmoji: "🦅", rewardGems: 2500, rewardDescription: "+2 500 💎 & Titre Phénix Immortel", exclusiveTitle: "Phénix Immortel" },
];

export function getClaimedStreakMilestones(userId?: string | null): number[] {
  if (typeof window === "undefined" || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(`terracoast_claimed_streaks_${userId || "guest"}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isStreakMilestoneClaimed(userId: string | null | undefined, days: number): boolean {
  return getClaimedStreakMilestones(userId).includes(days);
}

export function claimStreakMilestone(
  userId: string | null | undefined,
  days: number,
  currentStreak: number
): { success: boolean; milestone?: StreakMilestone; message?: string } {
  const m = STREAK_MILESTONES.find((item) => item.days === days);
  if (!m) return { success: false, message: "Jalon introuvable." };
  if (currentStreak < days) return { success: false, message: `Il vous faut ${days} jours de flamme.` };
  if (isStreakMilestoneClaimed(userId, days)) return { success: false, message: "Jalon déjà réclamé !" };

  const claimed = getClaimedStreakMilestones(userId);
  claimed.push(days);
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.setItem(`terracoast_claimed_streaks_${userId || "guest"}`, JSON.stringify(claimed));
    } catch {}
  }

  addGems(userId || undefined, m.rewardGems);

  const gamification = getPlayerGamificationState(userId || undefined);
  if (m.streakFreeze) {
    gamification.streakFreezes = (gamification.streakFreezes || 0) + m.streakFreeze;
  }
  if (m.exclusiveTitle && !gamification.inventory.titles.includes(m.exclusiveTitle)) {
    gamification.inventory.titles.push(m.exclusiveTitle);
    if (!gamification.activeTitle) {
      gamification.activeTitle = m.exclusiveTitle;
    }
  }
  savePlayerGamificationState(userId || undefined, gamification);

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("terracoast:profile_updated", {
        detail: { userId, gemsAdded: m.rewardGems },
      })
    );
  }

  return { success: true, milestone: m, message: `Palier ${days} jours réclamé avec succès !` };
}

/**
 * Formate une date en chaîne locale YYYY-MM-DD
 */
export function formatDateToIsoDay(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Vérifie si l'utilisateur a déjà complété une partie aujourd'hui
 */
export function isStreakPlayedToday(lastActivityDate?: string | null): boolean {
  if (!lastActivityDate) return false;
  return lastActivityDate === formatDateToIsoDay(new Date());
}

/**
 * Vérifie si la série est active mais en péril (l'utilisateur doit jouer aujourd'hui avant minuit)
 */
export function isStreakAtRisk(
  lastActivityDate?: string | null,
  currentStreak?: number | null
): boolean {
  const streak = currentStreak || 0;
  if (streak <= 0) return false;
  if (isStreakPlayedToday(lastActivityDate)) return false;

  // Si dernière activité = hier
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return lastActivityDate === formatDateToIsoDay(yesterday);
}

/**
 * Vérifie si la série a manqué un jour et consomme un Gel de Flamme pour la sauver
 */
export function checkAndApplyStreakFreeze(
  userId: string | undefined,
  lastActivityDate?: string | null,
  currentStreak?: number | null,
  consumeFreezeFn?: (userId?: string) => boolean
): { saved: boolean; message?: string } {
  const streak = currentStreak || 0;
  if (streak <= 0 || !lastActivityDate) return { saved: false };
  if (isStreakPlayedToday(lastActivityDate) || isStreakAtRisk(lastActivityDate, currentStreak)) {
    return { saved: false };
  }

  // Si l'utilisateur a manqué hier ou plus
  if (consumeFreezeFn && consumeFreezeFn(userId)) {
    return {
      saved: true,
      message: `🧊 Votre Gel de Flamme a été utilisé pour protéger votre série de ${streak} jours !`,
    };
  }

  return { saved: false };
}

/**
 * Prochain palier de série et pourcentage d'accomplissement
 */
export function getNextStreakMilestone(currentStreak: number = 0) {
  const streak = Math.max(0, currentStreak);
  const next = STREAK_MILESTONES.find((m) => m.days > streak) || {
    days: streak + 10,
    label: "Super Nova",
    badgeEmoji: "🏆",
  };

  const prevMilestoneDays =
    STREAK_MILESTONES.slice()
      .reverse()
      .find((m) => m.days <= streak)?.days || 0;

  const totalRange = next.days - prevMilestoneDays;
  const currentProgress = streak - prevMilestoneDays;
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round((currentProgress / totalRange) * 100))
  );

  return {
    nextDays: next.days,
    label: next.label,
    badgeEmoji: next.badgeEmoji,
    remainingDays: Math.max(0, next.days - streak),
    progressPercent,
  };
}

/**
 * Récupère les 7 jours de la semaine courante (Lundi -> Dimanche) avec l'état de complétion
 */
export function getWeekStreakStatus(
  lastActivityDate?: string | null,
  currentStreak: number = 0
): WeekDayStatus[] {
  const now = new Date();
  const todayIso = formatDateToIsoDay(now);

  // Jour de la semaine (0 = Dimanche, 1 = Lundi, ... 6 = Samedi)
  const currentDayOfWeek = now.getDay();
  // Calcul du décalage pour pointer sur le Lundi (1 -> 0, 0 -> 6)
  const diffToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;

  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);

  const dayLabels = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const playedToday = isStreakPlayedToday(lastActivityDate);

  // Ensemble des dates ISO couvertes par la série actuelle
  const activeDatesSet = new Set<string>();
  if (currentStreak > 0 && (playedToday || isStreakAtRisk(lastActivityDate, currentStreak))) {
    const baseDate = new Date();
    if (!playedToday) {
      // Dernière date validée était hier
      baseDate.setDate(baseDate.getDate() - 1);
    }
    for (let i = 0; i < currentStreak; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() - i);
      activeDatesSet.add(formatDateToIsoDay(d));
    }
  }

  const week: WeekDayStatus[] = [];

  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(monday);
    dayDate.setDate(monday.getDate() + i);
    const dateIso = formatDateToIsoDay(dayDate);
    const isToday = dateIso === todayIso;
    const isPast = dateIso < todayIso;

    let isCompleted = false;
    if (isToday) {
      isCompleted = playedToday;
    } else if (isPast) {
      isCompleted = activeDatesSet.has(dateIso);
    }

    week.push({
      dayLabel: dayLabels[i],
      dayNumber: dayDate.getDate(),
      dateString: dateIso,
      isToday,
      isPast,
      isCompleted,
    });
  }

  return week;
}
