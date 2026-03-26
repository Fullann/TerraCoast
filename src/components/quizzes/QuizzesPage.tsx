import { useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useNotifications } from "../../contexts/NotificationContext";
import {
  BookOpen,
  Search,
  Play,
  Dumbbell,
  Filter,
  Plus,
  Share2,
  PenIcon as Edit,
  Trash2,
  Globe,
} from "lucide-react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from "react-simple-maps";
import worldMapData from "world-atlas/countries-110m.json";
import { ShareQuizModal } from "./ShareQuizModal";
import type { Database } from "../../lib/database.types";
import { getCountriesByIso3 } from "../../lib/countryGameData";
import { ConfirmModal } from "../common/ConfirmModal";

type Quiz = Database["public"]["Tables"]["quizzes"]["Row"];
type QuizType = Database["public"]["Tables"]["quiz_types"]["Row"];
type Category = { id: string; name: string; label: string };
type Difficulty = { id: string; name: string; label: string; color: string };

interface QuizWithType extends Quiz {
  quiz_types?: QuizType | null;
}
interface MapQuizPoint {
  quiz: QuizWithType;
  lat: number;
  lng: number;
  isApprox: boolean;
}
interface HiddenMapQuizInfo {
  id: string;
  title: string;
}

const TAG_BASED_REGION_CENTERS: Array<{
  keys: string[];
  lat: number;
  lng: number;
}> = [
  { keys: ["europe", "europa"], lat: 54, lng: 15 },
  { keys: ["afrique", "africa"], lat: 5, lng: 20 },
  { keys: ["asie", "asia"], lat: 30, lng: 95 },
  {
    keys: [
      "ameriques",
      "amériques",
      "americas",
      "north america",
      "south america",
      "amerique",
      "amérique",
      "america",
    ],
    lat: 12,
    lng: -75,
  },
  { keys: ["oceanie", "océanie", "oceania"], lat: -22, lng: 140 },
  { keys: ["suisse", "switzerland", "schweiz", "svizzera"], lat: 46.8, lng: 8.2 },
  { keys: ["valais", "wallis"], lat: 46.2, lng: 7.5 },
  { keys: ["france"], lat: 46.6, lng: 2.3 },
  { keys: ["belgique", "belgium"], lat: 50.8, lng: 4.5 },
  { keys: ["canada"], lat: 56, lng: -106 },
  { keys: ["usa", "etats-unis", "états-unis", "united states"], lat: 39.8, lng: -98.5 },
];

interface QuizzesPageProps {
  onNavigate: (view: string, data?: any) => void;
}

export function QuizzesPage({ onNavigate }: QuizzesPageProps) {
  const { profile } = useAuth();
  const { language, showAllLanguages, t } = useLanguage();
  const { showAppNotification } = useNotifications();
  const [quizzes, setQuizzes] = useState<QuizWithType[]>([]);
  const [myQuizzes, setMyQuizzes] = useState<QuizWithType[]>([]);
  const [sharedQuizzes, setSharedQuizzes] = useState<QuizWithType[]>([]);
  const [quizTypes, setQuizTypes] = useState<QuizType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [difficulties, setDifficulties] = useState<Difficulty[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<"public" | "my" | "shared">(
    "public"
  );
  const [shareQuiz, setShareQuiz] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [mapTooltip, setMapTooltip] = useState<{
    quiz: QuizWithType;
    isApprox: boolean;
    x: number;
    y: number;
  } | null>(null);
  const [derivedMapCoords, setDerivedMapCoords] = useState<
    Record<string, { lat: number; lng: number }>
  >({});
  const [hiddenMapQuizzes, setHiddenMapQuizzes] = useState<HiddenMapQuizInfo[]>([]);
  const [showHiddenMapQuizzes, setShowHiddenMapQuizzes] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    message: string;
    onConfirm: null | (() => void | Promise<void>);
  }>({ open: false, message: "", onConfirm: null });
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [selectedContinent, setSelectedContinent] = useState<
    "all" | "europe" | "africa" | "asia" | "americas" | "oceania"
  >("all");
  const [expandedGroupKey, setExpandedGroupKey] = useState<string | null>(null);

  const continentView: Record<
    "all" | "europe" | "africa" | "asia" | "americas" | "oceania",
    { center: [number, number]; zoom: number; label: string }
  > = {
    all: { center: [0, 20], zoom: 1, label: t("quizzes.map.continent.all") },
    europe: { center: [15, 54], zoom: 2.9, label: t("quizzes.map.continent.europe") },
    africa: { center: [20, 5], zoom: 2.5, label: t("quizzes.map.continent.africa") },
    asia: { center: [95, 30], zoom: 2.2, label: t("quizzes.map.continent.asia") },
    americas: {
      center: [-75, 15],
      zoom: 2.0,
      label: t("quizzes.map.continent.americas"),
    },
    oceania: { center: [140, -22], zoom: 2.8, label: t("quizzes.map.continent.oceania") },
  };

  const getGamesText = (count: number) => {
    // Règle demandée: 0 ou 1 => "partie", sinon "parties"
    return count <= 1 ? t("quizzes.game") : t("quizzes.games");
  };

  const openConfirmModal = (
    message: string,
    onConfirm: () => void | Promise<void>
  ) => {
    setConfirmModal({ open: true, message, onConfirm });
  };

  const resolveApproxCoordsFromTags = (quiz: QuizWithType) => {
    const tags = Array.isArray(quiz.tags) ? quiz.tags : [];
    if (tags.length === 0) return null;
    const normalized = tags.map((tag) =>
      String(tag || "")
        .trim()
        .toLowerCase()
    );
    for (const region of TAG_BASED_REGION_CENTERS) {
      if (region.keys.some((k) => normalized.includes(k))) {
        return { lat: region.lat, lng: region.lng };
      }
    }
    return null;
  };

  useEffect(() => {
    loadQuizzes();
    loadQuizTypes();
    loadCategories();
    loadDifficulties();
  }, [
    profile,
    categoryFilter,
    difficultyFilter,
    typeFilter,
    language,
    showAllLanguages,
  ]);
  useEffect(() => {
    if (!profile) return;

    // Abonnement aux mises à jour des quiz (total_plays, average_score)
    const quizzesSubscription = supabase
      .channel("quizzes_updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "quizzes",
        },
        (payload) => {
          const updatedQuiz = payload.new as Quiz;

          // Mettre à jour dans la liste des quiz publics
          setQuizzes((prev) =>
            prev.map((q) =>
              q.id === updatedQuiz.id
                ? {
                    ...q,
                    total_plays: updatedQuiz.total_plays,
                    average_score: updatedQuiz.average_score,
                  }
                : q
            )
          );

          // Mettre à jour dans la liste de mes quiz
          setMyQuizzes((prev) =>
            prev.map((q) =>
              q.id === updatedQuiz.id
                ? {
                    ...q,
                    total_plays: updatedQuiz.total_plays,
                    average_score: updatedQuiz.average_score,
                  }
                : q
            )
          );

          // Mettre à jour dans la liste des quiz partagés
          setSharedQuizzes((prev) =>
            prev.map((q) =>
              q.id === updatedQuiz.id
                ? {
                    ...q,
                    total_plays: updatedQuiz.total_plays,
                    average_score: updatedQuiz.average_score,
                  }
                : q
            )
          );
        }
      )
      .subscribe();

    return () => {
      quizzesSubscription.unsubscribe();
    };
  }, [profile]);
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadQuizzes();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [
    profile,
    categoryFilter,
    difficultyFilter,
    typeFilter,
    language,
    showAllLanguages,
  ]);
  const loadQuizTypes = async () => {
    const { data } = await supabase
      .from("quiz_types")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (data) setQuizTypes(data);
  };

  const loadCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("label");

    if (data) setCategories(data);
  };

  const loadDifficulties = async () => {
    const { data } = await supabase
      .from("difficulties")
      .select("*")
      .order("multiplier");

    if (data) setDifficulties(data);
  };

  const requestPublish = async (quizId: string, quizTitle: string) => {
    openConfirmModal(
      t("quizzes.confirmPublishRequest").replace("{title}", quizTitle),
      async () => {
        await performPublishRequest(quizId);
      }
    );
  };

  const performPublishRequest = async (quizId: string) => {
    const { error } = await (supabase as any)
      .from("quizzes")
      .update({ pending_validation: true, validation_status: "pending" })
      .eq("id", quizId);

    if (error) {
      showAppNotification({ type: "error", message: t("quizzes.publishRequestError") });
      return;
    }

    showAppNotification({ type: "success", message: t("quizzes.publishRequestSuccess") });
    loadQuizzes();
  };

  const publishQuizDirectly = async (quizId: string) => {
    const { error } = await (supabase as any)
      .from("quizzes")
      .update({
        is_public: true,
        is_global: true,
        published_at: new Date().toISOString(),
      })
      .eq("id", quizId);

    if (error) {
      showAppNotification({ type: "error", message: t("quizzes.publishError") });
      return;
    }

    showAppNotification({ type: "success", message: t("quizzes.publishSuccess") });
    loadQuizzes();
  };

  const removeSharedQuiz = async (quizId: string) => {
    openConfirmModal(t("quizzes.confirmRemoveShared"), async () => {
      await performRemoveSharedQuiz(quizId);
    });
  };

  const performRemoveSharedQuiz = async (quizId: string) => {
    if (!profile?.id) return;
    const { error } = await supabase
      .from("quiz_shares")
      .delete()
      .eq("quiz_id", quizId)
      .eq("shared_with_user_id", profile.id);

    if (error) {
      console.error("Error removing shared quiz:", error);
      showAppNotification({ type: "error", message: t("quizzes.removeError") });
      return;
    }

    setSharedQuizzes(sharedQuizzes.filter((q) => q.id !== quizId));

    showAppNotification({
      type: "success",
      message: t("quizzes.removeSuccess"),
    });
  };
  const deleteQuiz = async (quizId: string, quizTitle: string) => {
    openConfirmModal(
      t("quizzes.confirmDelete").replace("{title}", quizTitle),
      async () => {
        await performDeleteQuiz(quizId);
      }
    );
  };

  const performDeleteQuiz = async (quizId: string) => {
    // Supprimer d'abord les questions associées
    const { error: questionsError } = await supabase
      .from("questions")
      .delete()
      .eq("quiz_id", quizId);

    if (questionsError) {
      console.error("Error deleting questions:", questionsError);
      showAppNotification({ type: "error", message: t("quizzes.deleteQuestionsError") });
      return;
    }

    // Supprimer les partages associés
    await supabase.from("quiz_shares").delete().eq("quiz_id", quizId);

    // Supprimer le quiz
    const { error: quizError } = await supabase
      .from("quizzes")
      .delete()
      .eq("id", quizId);

    if (quizError) {
      console.error("Error deleting quiz:", quizError);
      showAppNotification({ type: "error", message: t("quizzes.deleteError") });
      return;
    }

    // Mettre à jour la liste locale
    setMyQuizzes(myQuizzes.filter((q) => q.id !== quizId));

    showAppNotification({ type: "success", message: t("quizzes.deleteSuccess") });
  };

  const loadQuizzes = async () => {
    if (!profile) return;

    let query = supabase
      .from("quizzes")
      .select("*, quiz_types(*)")
      .or("is_public.eq.true,is_global.eq.true")
      .order("total_plays", { ascending: false });

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      query = query.or(
        `title.ilike.%${searchLower}%,description.ilike.%${searchLower}%,tags.cs.{"${searchLower}"}`
      );
    }
    if (categoryFilter !== "all") {
      query = query.eq("category", categoryFilter);
    }

    if (difficultyFilter !== "all") {
      query = query.eq("difficulty", difficultyFilter);
    }

    if (typeFilter !== "all") {
      query = query.eq("quiz_type_id", typeFilter);
    }

    if (!showAllLanguages) {
      query = query.eq("language", language);
    }

    const { data } = await query;
    if (data) setQuizzes(data as QuizWithType[]);

    const { data: myData } = await supabase
      .from("quizzes")
      .select("*, quiz_types(*)")
      .eq("creator_id", profile.id)
      .order("created_at", { ascending: false });

    if (myData) setMyQuizzes(myData as QuizWithType[]);

    const { data: sharedData } = await supabase
      .from("quiz_shares")
      .select("quiz:quizzes(*)")
      .eq("shared_with_user_id", profile.id);

    if (sharedData) {
      const sharedQuizzesList = sharedData
        .map((share: any) => share.quiz)
        .filter((quiz: Quiz | null) => quiz !== null) as Quiz[];
      setSharedQuizzes(sharedQuizzesList);
    }
  };

  const filteredQuizzes = (
    activeTab === "public"
      ? quizzes
      : activeTab === "my"
      ? myQuizzes
      : sharedQuizzes
  ).filter(
    (quiz) =>
      quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quiz.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (quiz.tags &&
        quiz.tags.some((tag) => tag.includes(searchTerm.toLowerCase())))
  );
  const isSearching = searchTerm.trim().length > 0;

  useEffect(() => {
    let cancelled = false;
    const computeFallbackCoords = async () => {
      if (activeTab !== "public") return;
      const missingCoords = filteredQuizzes.filter(
        (quiz) =>
          !(
            typeof quiz.location_lat === "number" &&
            typeof quiz.location_lng === "number" &&
            quiz.location_lat >= -90 &&
            quiz.location_lat <= 90 &&
            quiz.location_lng >= -180 &&
            quiz.location_lng <= 180
          )
      );
      if (missingCoords.length === 0) {
        if (!cancelled) {
          setDerivedMapCoords({});
          setHiddenMapQuizzes([]);
        }
        return;
      }

      const quizIds = missingCoords.map((q) => q.id);
      const { data: quizQuestions } = await supabase
        .from("questions")
        .select("quiz_id, map_data")
        .in("quiz_id", quizIds)
        .in("question_type", ["puzzle_map", "map_click", "country_multi"]);

      const nextCoords: Record<string, { lat: number; lng: number }> = {};
      const nextHidden: HiddenMapQuizInfo[] = [];
      missingCoords.forEach((quiz) => {
        const relatedQuestions = (quizQuestions || []).filter(
          (q: any) => q.quiz_id === quiz.id
        );
        const selectedIso3s = relatedQuestions.flatMap((q: any) => {
          const mapData = q.map_data as { selectedCountries?: string[] } | null;
          return Array.isArray(mapData?.selectedCountries) ? mapData.selectedCountries : [];
        });
        const uniqueIso3s = [...new Set(selectedIso3s)].slice(0, 6);
        const countries = getCountriesByIso3(uniqueIso3s);
        if (countries.length > 0) {
          const avgLat = countries.reduce((sum, c) => sum + c.lat, 0) / countries.length;
          const avgLng = countries.reduce((sum, c) => sum + c.lng, 0) / countries.length;
          nextCoords[quiz.id] = { lat: avgLat, lng: avgLng };
          return;
        }
        const tagCoords = resolveApproxCoordsFromTags(quiz);
        if (tagCoords) {
          nextCoords[quiz.id] = tagCoords;
          return;
        }
        nextHidden.push({ id: quiz.id, title: quiz.title });
      });

      if (!cancelled) {
        setDerivedMapCoords(nextCoords);
        setHiddenMapQuizzes(nextHidden);
      }
    };

    computeFallbackCoords();
    return () => {
      cancelled = true;
    };
  }, [activeTab, filteredQuizzes]);

  const getContinentFromCoordinates = (
    lat: number,
    lng: number
  ): "europe" | "africa" | "asia" | "americas" | "oceania" => {
    if (lat < -10 && lng > 110) return "oceania";
    if (lng >= -170 && lng <= -30) return "americas";
    if (lat >= 35 && lng >= -25 && lng <= 60) return "europe";
    if (lat >= -35 && lat <= 35 && lng >= -20 && lng <= 55) return "africa";
    if (lng >= 55 && lng <= 180) return "asia";
    return "europe";
  };

  const mapQuizzes: MapQuizPoint[] = filteredQuizzes
    .map((quiz) => {
      if (
        typeof quiz.location_lat === "number" &&
        typeof quiz.location_lng === "number" &&
        quiz.location_lat >= -90 &&
        quiz.location_lat <= 90 &&
        quiz.location_lng >= -180 &&
        quiz.location_lng <= 180
      ) {
        return {
          quiz,
          lat: Number(quiz.location_lat),
          lng: Number(quiz.location_lng),
          isApprox: false,
        } satisfies MapQuizPoint;
      }
      const derived = derivedMapCoords[quiz.id];
      if (!derived) return null;
      return {
        quiz,
        lat: derived.lat,
        lng: derived.lng,
        isApprox: true,
      } satisfies MapQuizPoint;
    })
    .filter((item): item is MapQuizPoint => Boolean(item));

  const visibleMapQuizzes =
    selectedContinent === "all"
      ? mapQuizzes
      : mapQuizzes.filter(
          (point) =>
            getContinentFromCoordinates(
              Number(point.lat),
              Number(point.lng)
            ) === selectedContinent
        );
  const groupedMapQuizzes = (() => {
    const proximityLat = 1.2;
    const proximityLng = 1.4;
    const clusters: Array<{
      key: string;
      lat: number;
      lng: number;
      quizzes: MapQuizPoint[];
    }> = [];

    visibleMapQuizzes.forEach((point) => {
      const lat = Number(point.lat);
      const lng = Number(point.lng);
      let targetCluster: (typeof clusters)[number] | null = null;

      for (const cluster of clusters) {
        if (
          Math.abs(cluster.lat - lat) <= proximityLat &&
          Math.abs(cluster.lng - lng) <= proximityLng
        ) {
          targetCluster = cluster;
          break;
        }
      }

      if (!targetCluster) {
        clusters.push({
          key: `cluster-${clusters.length}-${point.quiz.id}`,
          lat,
          lng,
          quizzes: [point],
        });
        return;
      }

      targetCluster.quizzes.push(point);
      const count = targetCluster.quizzes.length;
      targetCluster.lat = (targetCluster.lat * (count - 1) + lat) / count;
      targetCluster.lng = (targetCluster.lng * (count - 1) + lng) / count;
    });

    return clusters;
  })();
  const mapZoomFactor = continentView[selectedContinent].zoom;
  const markerRadius = mapZoomFactor >= 2.5 ? 3 : mapZoomFactor >= 2 ? 3.2 : 3.6;
  const markerPulseRadius = markerRadius + 3.2;

  const getCategoryLabel = (categoryName: string) => {
    const category = categories.find((c) => c.name === categoryName);
    return category ? category.label : categoryName;
  };

  const getDifficultyLabel = (difficultyName: string) => {
    const difficulty = difficulties.find((d) => d.name === difficultyName);
    return difficulty ? difficulty.label : difficultyName;
  };

  const getDifficultyColor = (difficultyName: string) => {
    const difficulty = difficulties.find((d) => d.name === difficultyName);
    if (!difficulty) return "bg-gray-100 text-gray-700";

    return `bg-${difficulty.color}-100 text-${difficulty.color}-700`;
  };

  const getMapPointColor = (difficultyName: string) => {
    if (difficultyName === "easy") return "#22C55E";
    if (difficultyName === "medium") return "#F59E0B";
    return "#EF4444";
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          {t("quizzes.title")}
        </h1>
        <p className="text-gray-600">{t("quizzes.subtitle")}</p>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        {/* Recherche + Bouton filtres */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={t("quizzes.searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Bouton pour afficher/masquer les filtres */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center ${
              showFilters
                ? "bg-emerald-100 text-emerald-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>

        {/* Filtres (cachables) */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 animate-slide-down">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none appearance-none bg-white cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 0.5rem center",
                backgroundSize: "1.5em 1.5em",
              }}
            >
              <option value="all">{t("quizzes.allCategories")}</option>
              {categories.map((category) => (
                <option key={category.name} value={category.name}>
                  {category.label}
                </option>
              ))}
            </select>

            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="px-4 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none appearance-none bg-white cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 0.5rem center",
                backgroundSize: "1.5em 1.5em",
              }}
            >
              <option value="all">{t("quizzes.allDifficulties")}</option>
              {difficulties.map((difficulty) => (
                <option key={difficulty.name} value={difficulty.name}>
                  {difficulty.label}
                </option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none appearance-none bg-white cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 0.5rem center",
                backgroundSize: "1.5em 1.5em",
              }}
            >
              <option value="all">{t("quizzes.allTypes")}</option>
              {quizTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Onglets */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => setActiveTab("public")}
            className={`flex flex-col items-center justify-center px-4 py-3 rounded-xl font-medium transition-all ${
              activeTab === "public"
                ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <BookOpen className="w-5 h-5 mb-1" />
            <span className="text-xs">{t("quiz.publicQuizzes")}</span>
          </button>

          <button
            onClick={() => setActiveTab("my")}
            className={`flex flex-col items-center justify-center px-4 py-3 rounded-xl font-medium transition-all ${
              activeTab === "my"
                ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <Edit className="w-5 h-5 mb-1" />
            <span className="text-xs">{t("quiz.myQuizzes")}</span>
          </button>

          <button
            onClick={() => setActiveTab("shared")}
            className={`flex flex-col items-center justify-center px-4 py-3 rounded-xl font-medium transition-all relative ${
              activeTab === "shared"
                ? "bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <Share2 className="w-5 h-5 mb-1" />
            <span className="text-xs">{t("quiz.sharedQuizzes")}</span>
            {sharedQuizzes.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {sharedQuizzes.length}
              </span>
            )}
          </button>

          <button
            onClick={() => onNavigate("create-quiz")}
            className="flex flex-col items-center justify-center px-4 py-3 rounded-xl font-medium bg-gradient-to-br from-teal-500 to-cyan-500 text-white hover:from-teal-600 hover:to-cyan-600 transition-all shadow-md"
          >
            <Plus className="w-5 h-5 mb-1" />
            <span className="text-xs">{t("quiz.create")}</span>
          </button>
        </div>
      </div>

      {activeTab === "public" && !isSearching && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {t("quizzes.map.title")}
              </h2>
              <p className="text-sm text-gray-600">
                {t("quizzes.map.subtitle")}
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedContinent("all");
                setExpandedGroupKey(null);
              }}
              className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700"
            >
              {t("quizzes.map.resetView")}
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {(Object.keys(continentView) as Array<keyof typeof continentView>).map(
              (continentKey) => (
                <button
                  key={continentKey}
                  onClick={() => {
                    setSelectedContinent(continentKey);
                    setExpandedGroupKey(null);
                  }}
                  className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                    selectedContinent === continentKey
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {continentView[continentKey].label}
                </button>
              )
            )}
          </div>

          <div
            ref={mapContainerRef}
            className="relative w-full h-[420px] rounded-xl overflow-hidden border border-gray-200 bg-sky-50"
          >
            <ComposableMap
              projection="geoEqualEarth"
              width={980}
              height={420}
              style={{ width: "100%", height: "100%" }}
            >
              <ZoomableGroup
                center={continentView[selectedContinent].center}
                zoom={continentView[selectedContinent].zoom}
                minZoom={1}
                maxZoom={4}
              >
                <Geographies geography={worldMapData as any}>
                  {({ geographies }: { geographies: any[] }) =>
                    geographies.map((geo: any) => (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill="#E5E7EB"
                        stroke="#9CA3AF"
                        strokeWidth={0.35}
                      />
                    ))
                  }
                </Geographies>

                {groupedMapQuizzes.map((group) => (
                  <Marker
                    key={`quiz-marker-group-${group.key}`}
                    coordinates={[group.lng, group.lat]}
                  >
                    {group.quizzes.length > 1 && (
                      <g
                        onClick={() =>
                          setExpandedGroupKey((prev) =>
                            prev === group.key ? null : group.key
                          )
                        }
                        style={{ cursor: "pointer" }}
                      >
                        <circle r={markerPulseRadius + 1.2} fill="#111827" opacity={0.16} />
                        <circle r={markerRadius + 1.6} fill="#111827" stroke="#ffffff" strokeWidth={1.2} />
                        <text
                          x={0}
                          y={2}
                          textAnchor="middle"
                          style={{ fill: "#ffffff", fontSize: "9px", fontWeight: 700 }}
                        >
                          {group.quizzes.length}
                        </text>
                      </g>
                    )}

                    {(group.quizzes.length === 1 || expandedGroupKey === group.key) &&
                      group.quizzes.map((point, index) => {
                      const quiz = point.quiz;
                      const stackSize = group.quizzes.length;
                      const angle = index * 0.9;
                      const ring = Math.floor(index / 8);
                      const pixelRadius = stackSize <= 1 ? 0 : 16 + ring * 12;
                      const dx = stackSize <= 1 ? 0 : Math.cos(angle) * pixelRadius;
                      const dy = stackSize <= 1 ? 0 : Math.sin(angle) * pixelRadius;
                      return (
                        <g
                          key={`quiz-point-${quiz.id}-${index}`}
                          transform={`translate(${dx}, ${dy})`}
                          onClick={() => onNavigate("play-quiz", { quizId: quiz.id })}
                          onMouseEnter={(e: any) => {
                            const rect = mapContainerRef.current?.getBoundingClientRect();
                            if (!rect) return;
                            setMapTooltip({
                              quiz,
                              isApprox: point.isApprox,
                              x: e.clientX - rect.left,
                              y: e.clientY - rect.top,
                            });
                          }}
                          onMouseMove={(e: any) => {
                            const rect = mapContainerRef.current?.getBoundingClientRect();
                            if (!rect) return;
                            setMapTooltip((prev) =>
                              prev && prev.quiz.id === quiz.id
                                ? {
                                    ...prev,
                                    x: e.clientX - rect.left,
                                    y: e.clientY - rect.top,
                                  }
                                : prev
                            );
                          }}
                          onMouseLeave={() => setMapTooltip(null)}
                          style={{ cursor: "pointer" }}
                        >
                          {stackSize > 1 && (
                            <line x1={-dx} y1={-dy} x2={0} y2={0} stroke="#6B7280" strokeWidth={0.5} />
                          )}
                          <circle
                            r={markerPulseRadius}
                            fill={getMapPointColor(quiz.difficulty)}
                            opacity={0.25}
                            className="quiz-map-marker-pulse"
                            style={{ animationDelay: `${(index % 8) * 0.1}s` }}
                          />
                          <circle
                            r={markerRadius}
                            fill={getMapPointColor(quiz.difficulty)}
                            stroke={point.isApprox ? "#1F2937" : "#ffffff"}
                            strokeWidth={1.2}
                            strokeDasharray={point.isApprox ? "2 1" : undefined}
                          />
                        </g>
                      );
                    })}
                  </Marker>
                ))}
              </ZoomableGroup>
            </ComposableMap>
            {mapTooltip && (
              <div
                className="absolute z-20 pointer-events-none px-3 py-2 rounded-lg shadow-lg border bg-white/95 text-xs"
                style={{
                  left: Math.min(mapTooltip.x + 14, 760),
                  top: Math.max(mapTooltip.y - 12, 8),
                }}
              >
                <p className="font-semibold text-gray-900">{mapTooltip.quiz.title}</p>
                {mapTooltip.isApprox && (
                  <p className="text-amber-700 font-medium">{t("quizzes.map.approxPosition")}</p>
                )}
                <p className="text-gray-700">
                  Difficulté: {getDifficultyLabel(mapTooltip.quiz.difficulty)}
                </p>
                <p className="text-gray-700">
                  Parties: {mapTooltip.quiz.total_plays}{" "}
                  {getGamesText(mapTooltip.quiz.total_plays)}
                </p>
              </div>
            )}
          </div>

          <p className="mt-3 text-xs text-gray-500">
            {visibleMapQuizzes.length} quiz avec coordonnées visibles sur la carte.
          </p>
          {activeTab === "public" && hiddenMapQuizzes.length > 0 && (
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setShowHiddenMapQuizzes((prev) => !prev)}
                className="text-xs text-amber-700 hover:text-amber-800 underline underline-offset-2"
              >
                {t("quizzes.map.hiddenCount")
                  .replace("{count}", String(hiddenMapQuizzes.length))}
              </button>
              {showHiddenMapQuizzes && (
                <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-3 max-h-36 overflow-auto">
                  <ul className="text-xs text-amber-900 space-y-1">
                    {hiddenMapQuizzes.map((quiz) => (
                      <li key={`hidden-map-quiz-${quiz.id}`}>• {quiz.title}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Style pour l'animation */}
      <style>{`
  .animate-slide-down {
    animation: slideDown 0.3s ease-out;
  }
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  .quiz-map-marker-pulse {
    animation: mapMarkerPulse 1.8s ease-out infinite;
  }
  @keyframes mapMarkerPulse {
    0% {
      transform: scale(0.8);
      opacity: 0.35;
    }
    70% {
      transform: scale(1.7);
      opacity: 0;
    }
    100% {
      transform: scale(1.7);
      opacity: 0;
    }
  }
`}</style>

      {filteredQuizzes.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            {t("quizzes.noQuizFound")}
          </h3>
          <p className="text-gray-500">
            {activeTab === "my"
              ? t("quizzes.noQuizCreated")
              : activeTab === "shared"
              ? t("quizzes.noQuizShared")
              : t("quizzes.tryDifferentFilters")}
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4 p-4 rounded-xl border border-purple-200 bg-purple-50">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-purple-900">
                  {t("quizzes.trainingBannerTitle")}
                </p>
                <p className="text-sm text-purple-700">
                  {t("quizzes.trainingBannerDesc")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate("training-mode")}
                className="px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                {t("home.trainingMode")}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuizzes.map((quiz) => (
            <div
              key={quiz.id}
              onClick={() => onNavigate("play-quiz", { quizId: quiz.id })}
              className="bg-white cursor-pointer rounded-xl shadow-md hover:shadow-xl transition-shadow overflow-hidden flex flex-col h-full"
            >
              {quiz.cover_image_url ? (
                <img
                  src={quiz.cover_image_url}
                  alt={quiz.title}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                  <BookOpen className="w-20 h-20 text-white opacity-50" />
                </div>
              )}
              <div className="p-6 flex flex-col h-full">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-bold text-gray-800 flex-1">
                    {quiz.title}
                  </h3>
                  {quiz.is_global && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      {t("quizzes.global")}
                    </span>
                  )}
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {quiz.description || ""}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                    {getCategoryLabel(quiz.category)}
                  </span>
                  <span
                    className={`text-xs px-3 py-1 rounded-full ${getDifficultyColor(
                      quiz.difficulty
                    )}`}
                  >
                    {getDifficultyLabel(quiz.difficulty)}
                  </span>
                  {quiz.quiz_types && (
                    <span
                      className="text-xs px-3 py-1 rounded-full font-medium"
                      style={{
                        backgroundColor: `${quiz.quiz_types.color}20`,
                        color: quiz.quiz_types.color,
                      }}
                    >
                      {quiz.quiz_types.name}
                    </span>
                  )}
                </div>

                <div className="mt-auto space-y-3">
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>
                      {quiz.total_plays} {getGamesText(quiz.total_plays)}
                    </span>
                    {quiz.average_score > 0 && (
                      <span>
                        {t("quizzes.average")}: {Math.round(quiz.average_score)}
                      </span>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate("play-quiz", { quizId: quiz.id });
                      }}
                      className="flex-1 bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 transition-colors font-medium flex items-center justify-center"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      {t("quiz.play")}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate("play-training", { quizId: quiz.id, questionCount: 10 });
                      }}
                      className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors font-medium flex items-center justify-center"
                      title={t("quizzes.trainNow")}
                    >
                      <Dumbbell className="w-4 h-4" />
                    </button>

                    {activeTab === "my" && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigate("edit-quiz", { quizId: quiz.id });
                          }}
                          className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                          title={t("quiz.edit")}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {!quiz.is_public && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShareQuiz({ id: quiz.id, title: quiz.title });
                              }}
                              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                              title={t("quizzes.shareWithFriends")}
                            >
                              <Share2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                profile?.role === "admin"
                                  ? publishQuizDirectly(quiz.id)
                                  : requestPublish(quiz.id, quiz.title);
                              }}
                              className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                              title={
                                profile?.role === "admin"
                                  ? t("quizzes.publishDirectly")
                                  : t("quizzes.requestPublish")
                              }
                            >
                              <Globe className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteQuiz(quiz.id, quiz.title);
                              }}
                              className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                              title={t("quizzes.deleteQuiz")}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </>
                    )}
                    {activeTab === "shared" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSharedQuiz(quiz.id);
                        }}
                        className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        title={t("quizzes.removeFromList")}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          </div>
        </>
      )}

      {shareQuiz && (
        <ShareQuizModal
          quizId={shareQuiz.id}
          quizTitle={shareQuiz.title}
          onClose={() => setShareQuiz(null)}
        />
      )}
      <ConfirmModal
        open={confirmModal.open}
        message={confirmModal.message}
        cancelLabel={t("common.cancel")}
        confirmLabel={t("common.confirm")}
        onCancel={() => setConfirmModal({ open: false, message: "", onConfirm: null })}
        onConfirm={async () => {
          const fn = confirmModal.onConfirm;
          setConfirmModal({ open: false, message: "", onConfirm: null });
          if (fn) await fn();
        }}
      />
    </div>
  );
}
