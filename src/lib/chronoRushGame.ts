import { getAllAtlasCountries, type AtlasCountry } from "./atlasData";
import type { Language } from "../i18n/translations";

export type ChronoRushQuestionType = "capital" | "flag" | "continent" | "border";

export interface ChronoRushOption {
  id: string;
  label: string;
  isCorrect: boolean;
  flagEmoji?: string;
}

export interface ChronoRushQuestion {
  id: string;
  type: ChronoRushQuestionType;
  prompt: string;
  subPrompt?: string;
  flagEmoji?: string;
  options: ChronoRushOption[];
  targetCountry: AtlasCountry;
}

export const CHRONO_RUSH_CONFIG = {
  initialTimeSeconds: 45,
  bonusTimeCorrect: 3,
  penaltyTimeWrong: 5,
  maxTimeSeconds: 90,
  basePoints: 100,
};

const STORAGE_KEY_RECORD = "terracoast_chrono_rush_highscore";

export function getChronoRushHighScore(): number {
  if (typeof window === "undefined") return 0;
  return Number(localStorage.getItem(STORAGE_KEY_RECORD)) || 0;
}

export function saveChronoRushHighScore(score: number): boolean {
  if (typeof window === "undefined") return false;
  const current = getChronoRushHighScore();
  if (score > current) {
    localStorage.setItem(STORAGE_KEY_RECORD, String(score));
    return true;
  }
  return false;
}

export function getComboMultiplier(streak: number): number {
  if (streak >= 10) return 4;
  if (streak >= 5) return 3;
  if (streak >= 3) return 2;
  return 1;
}

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Génère une question rapide et variée
 */
export function generateChronoRushQuestion(
  lang: Language = "fr",
  recentIso3s: string[] = []
): ChronoRushQuestion {
  const allCountries = getAllAtlasCountries(lang).filter(
    (c) => c.population > 200000 && c.capital && c.capital !== "—"
  );

  const available = allCountries.filter((c) => !recentIso3s.includes(c.iso3));
  const pool = available.length > 10 ? available : allCountries;
  const target = pool[Math.floor(Math.random() * pool.length)];

  // Types de questions disponibles
  const types: ChronoRushQuestionType[] = ["capital", "flag", "continent"];
  if (target.borders && target.borders.length > 0) {
    types.push("border");
  }

  const selectedType = types[Math.floor(Math.random() * types.length)];
  const qId = `${target.iso3}_${selectedType}_${Date.now()}`;

  switch (selectedType) {
    case "capital": {
      // 3 autres capitales plausibles du même continent si possible
      const sameContinent = allCountries.filter(
        (c) => c.iso3 !== target.iso3 && c.continent === target.continent
      );
      const distractorsPool = sameContinent.length >= 3 ? sameContinent : allCountries.filter((c) => c.iso3 !== target.iso3);
      const distractors = shuffle(distractorsPool).slice(0, 3);

      const options: ChronoRushOption[] = shuffle([
        { id: target.iso3, label: target.capital, isCorrect: true },
        ...distractors.map((d) => ({
          id: d.iso3,
          label: d.capital,
          isCorrect: false,
        })),
      ]);

      return {
        id: qId,
        type: "capital",
        prompt: `Capitale de ce pays :`,
        subPrompt: `${target.flagEmoji} ${target.name}`,
        flagEmoji: target.flagEmoji,
        options,
        targetCountry: target,
      };
    }

    case "flag": {
      // Trouver le pays correspondant au drapeau
      const distractors = shuffle(
        allCountries.filter((c) => c.iso3 !== target.iso3)
      ).slice(0, 3);

      const options: ChronoRushOption[] = shuffle([
        { id: target.iso3, label: target.name, isCorrect: true, flagEmoji: target.flagEmoji },
        ...distractors.map((d) => ({
          id: d.iso3,
          label: d.name,
          isCorrect: false,
          flagEmoji: d.flagEmoji,
        })),
      ]);

      return {
        id: qId,
        type: "flag",
        prompt: `À quel pays appartient ce drapeau ?`,
        subPrompt: target.flagEmoji,
        flagEmoji: target.flagEmoji,
        options,
        targetCountry: target,
      };
    }

    case "continent": {
      const continents = ["Europe", "Asie", "Afrique", "Amériques", "Océanie"];
      const correctCont = target.continent === "Americas" ? "Amériques" : target.continent === "Asia" ? "Asie" : target.continent === "Africa" ? "Afrique" : target.continent === "Europe" ? "Europe" : target.continent === "Oceania" ? "Océanie" : target.continent;
      
      const otherContinents = continents.filter((c) => c !== correctCont);
      const distractors = shuffle(otherContinents).slice(0, 3);

      const options: ChronoRushOption[] = shuffle([
        { id: "correct", label: correctCont, isCorrect: true },
        ...distractors.map((c, i) => ({
          id: `dist_${i}`,
          label: c,
          isCorrect: false,
        })),
      ]);

      return {
        id: qId,
        type: "continent",
        prompt: `Sur quel continent se trouve ce pays ?`,
        subPrompt: `${target.flagEmoji} ${target.name}`,
        flagEmoji: target.flagEmoji,
        options,
        targetCountry: target,
      };
    }

    case "border": {
      // Trouver le pays voisin
      const neighborIso = target.borders[Math.floor(Math.random() * target.borders.length)];
      const neighborCountry = allCountries.find((c) => c.iso3 === neighborIso);

      if (neighborCountry) {
        const nonNeighbors = shuffle(
          allCountries.filter(
            (c) => c.iso3 !== target.iso3 && !target.borders.includes(c.iso3)
          )
        ).slice(0, 3);

        const options: ChronoRushOption[] = shuffle([
          { id: neighborCountry.iso3, label: `${neighborCountry.flagEmoji} ${neighborCountry.name}`, isCorrect: true },
          ...nonNeighbors.map((n) => ({
            id: n.iso3,
            label: `${n.flagEmoji} ${n.name}`,
            isCorrect: false,
          })),
        ]);

        return {
          id: qId,
          type: "border",
          prompt: `Lequel de ces pays a une frontière avec :`,
          subPrompt: `${target.flagEmoji} ${target.name}`,
          flagEmoji: target.flagEmoji,
          options,
          targetCountry: target,
        };
      }
      // Si voisin non trouvé, repli vers capitale
      return generateChronoRushQuestion(lang, recentIso3s);
    }
  }
}
