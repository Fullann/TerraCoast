import type { Database } from "../../../lib/database.types";
import type { Language } from "../../../i18n/translations";
import type { SubdivisionScope } from "../../../lib/subdivisionGameData";

export type QuestionType =
  | "mcq"
  | "single_answer"
  | "map_click"
  | "text_free"
  | "true_false"
  | "puzzle_map"
  | "top10_order"
  | "country_multi";

export type QuizCategory =
  | "flags"
  | "capitals"
  | "maps"
  | "borders"
  | "regions"
  | "mixed"
  | string;

export type Difficulty = "easy" | "medium" | "hard";

export type QuizType = Database["public"]["Tables"]["quiz_types"]["Row"];

export interface QuestionMapData {
  mode?: "puzzle_map" | "top10_order" | "map_click" | "country_multi";
  continent?: string;
  metric?: "population" | "area_km2";
  selectedCountries?: string[];
  requiredFields?: ("name" | "capital" | "map_click")[];
  countryMultiPrompt?: string;
  nameTolerance?: "strict" | "lenient";
  capitalTolerance?: "strict" | "lenient";
  showTargetList?: boolean;
  mapLevel?: "countries" | "subdivisions" | "custom_geojson";
  subdivisionScope?: SubdivisionScope;
  customGeojsonMapId?: string;
  customGeojsonPublicUrl?: string;
  customGeojsonIdProperty?: string;
  initialView?: {
    centerLat?: number;
    centerLng?: number;
    zoom?: number;
  };
}

export interface QuestionItem {
  id?: string;
  quiz_id?: string;
  question_text: string;
  question_type: QuestionType;
  correct_answer: string;
  correct_answers?: string[] | null;
  options: string[] | null;
  map_data?: QuestionMapData | null;
  image_url?: string | null;
  option_images?: Record<string, string> | null;
  points: number;
  order_index: number;
  complement_if_wrong?: string | null;
  created_at?: string;
  isNew?: boolean;
}

export interface QuizFormData {
  title: string;
  description: string;
  category: QuizCategory;
  difficulty: Difficulty;
  quizLanguage: Language;
  selectedQuizType: string;
  timeLimitSeconds: number;
  randomizeQuestions: boolean;
  randomizeAnswers: boolean;
  isPublic: boolean;
  isGlobal?: boolean;
  coverImageUrl: string;
  locationLat: string;
  locationLng: string;
  tags: string[];
}

export const MAP_VIEW_PRESETS: Record<
  string,
  { centerLat: number; centerLng: number; zoom: number }
> = {
  world: { centerLat: 20, centerLng: 0, zoom: 1 },
  europe: { centerLat: 54, centerLng: 15, zoom: 2.8 },
  africa: { centerLat: 5, centerLng: 20, zoom: 2.4 },
  asia: { centerLat: 30, centerLng: 95, zoom: 2.3 },
  americas: { centerLat: 10, centerLng: -75, zoom: 2.1 },
  oceania: { centerLat: -22, centerLng: 140, zoom: 2.7 },
  switzerland: { centerLat: 46.8, centerLng: 8.2, zoom: 5.2 },
  france: { centerLat: 46.6, centerLng: 2.3, zoom: 4.6 },
  usa: { centerLat: 39.8, centerLng: -98.5, zoom: 2.7 },
};

export const createDefaultQuestion = (orderIndex: number = 0): QuestionItem => ({
  question_text: "",
  question_type: "mcq",
  correct_answer: "",
  correct_answers: [],
  options: ["", "", "", ""],
  map_data: null,
  image_url: "",
  option_images: {},
  points: 100,
  order_index: orderIndex,
  complement_if_wrong: "",
});
