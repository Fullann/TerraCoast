export const normalizeAnswer = (answer: string): string => {
  return answer
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

export const levenshteinDistance = (a: string, b: string): number => {
  const aa = a || "";
  const bb = b || "";
  const dp: number[][] = Array.from({ length: aa.length + 1 }, () =>
    Array(bb.length + 1).fill(0)
  );
  for (let i = 0; i <= aa.length; i += 1) dp[i][0] = i;
  for (let j = 0; j <= bb.length; j += 1) dp[0][j] = j;
  for (let i = 1; i <= aa.length; i += 1) {
    for (let j = 1; j <= bb.length; j += 1) {
      const cost = aa[i - 1] === bb[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[aa.length][bb.length];
};

export const matchesWithTolerance = (
  userInput: string,
  expected: string,
  mode: "strict" | "lenient"
): boolean => {
  const ua = normalizeAnswer(userInput);
  const ea = normalizeAnswer(expected);
  if (!ua || !ea) return false;
  if (ua === ea) return true;
  if (mode === "strict") return false;
  return levenshteinDistance(ua, ea) <= 1;
};

export const calculatePoints = (
  timeTaken: number,
  basePoints: number,
  timeLimit: number = 30
): number => {
  const speedBonus = Math.max(0, 1 - timeTaken / timeLimit) * 0.5;
  return Math.round(basePoints * (1 + speedBonus));
};

export const arraysEqual = (a: string[], b: string[]): boolean =>
  a.length === b.length && a.every((value, index) => value === b[index]);
