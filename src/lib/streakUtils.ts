/**
 * Utilitaires pour le calcul, l'affichage et la rétention de la série de jours consécutifs (Daily Streaks 🔥).
 */

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
}

export const STREAK_MILESTONES: StreakMilestone[] = [
  { days: 3, label: "Étincelle", badgeEmoji: "✨" },
  { days: 7, label: "Semaine de Feu", badgeEmoji: "🔥" },
  { days: 14, label: "Flamme Ardente", badgeEmoji: "⚡" },
  { days: 30, label: "Maître du Feu", badgeEmoji: "🌋" },
  { days: 60, label: "Flamme Éternelle", badgeEmoji: "🌟" },
  { days: 100, label: "Légende Incandescente", badgeEmoji: "👑" },
  { days: 365, label: "Phénix Immortel", badgeEmoji: "🦅" },
];

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
