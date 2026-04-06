export interface QuizTopRow {
  id: string;
  title: string;
  total_plays: number | null;
  average_score: number | null;
}

export function toPercent(value: number): string {
  return `${Math.round(value)}%`;
}

export function toOneDecimal(value: number): string {
  return value.toFixed(1);
}

export function scoreHealthTone(value: number): "good" | "warn" | "bad" {
  if (value >= 70) return "good";
  if (value >= 45) return "warn";
  return "bad";
}

export function normalizeTopQuizzes(rows: QuizTopRow[]): QuizTopRow[] {
  return rows
    .map((row) => ({
      ...row,
      total_plays: row.total_plays || 0,
      average_score: row.average_score || 0,
    }))
    .sort((a, b) => (b.total_plays || 0) - (a.total_plays || 0));
}
