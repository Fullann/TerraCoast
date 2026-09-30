import { useCallback, useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { supabase } from "../../lib/supabase";
import { Avatar } from "../common/Avatar";
import { ChallengeFriendModal } from "../quizzes/ChallengeFriendModal";
import { StreakModal } from "./modals/StreakModal";
import { DayDetailsModal } from "./modals/DayDetailsModal";
import { WarnModal } from "./modals/WarnModal";
import { WarningHistoryModal } from "./modals/WarningHistoryModal";
import { FederationSelectModal } from "./modals/FederationSelectModal";
import { ProfileScoreChart } from "./ProfileScoreChart";
import { getUserFederation, type Federation } from "../../lib/federations";
import { getConquestStats } from "../../lib/conquestManager";
import { toast } from "../common/ToastContainer";
import { playSound } from "../../lib/soundManager";
import {
  getPlayerGamificationState,
  equipShopItem,
  getActiveTitleDetails,
  getUnlockedShopTitles,
  type PlayerGamificationState,
} from "../../lib/gamificationManager";
import {
  Trophy,
  Award,
  Clock,
  Flame,
  UserPlus,
  UserCheck,
  AlertTriangle,
  History,
  Settings,
  Star,
  User,
  Zap,
  Sparkles,
  ChevronRight,
  Target,
  Swords,
  CheckCircle2,
  ShoppingBag,
} from "lucide-react";
import type { Database } from "../../lib/database.types";

const ALL_FRAMES_CATALOG = [
  {
    id: "none",
    name: "Sans cadre (Défaut)",
    description: "Affichage classique épuré sans contour spécial.",
    isShop: false,
    price: 0,
  },
  {
    id: "frame_flame",
    name: "Flamme Incandescente 🔥",
    description: "Halo incandescent de braises ardentes qui palpite autour de votre photo.",
    isShop: true,
    price: 250,
  },
  {
    id: "frame_compass",
    name: "Rose des Vents 🧭",
    description: "Boussole de marin dorée en rotation continue pour explorateurs chevronnés.",
    isShop: true,
    price: 300,
  },
  {
    id: "frame_crown",
    name: "Couronne d'Explorateur 👑",
    description: "Couronne d'or sertie de gemmes pour régner sur les classements.",
    isShop: true,
    price: 500,
  },
  {
    id: "emerald",
    name: "Émeraude Royale 💎",
    description: "Anneau d'émeraude brillant aux éclats de pierre précieuse.",
    isShop: false,
    price: 0,
  },
  {
    id: "gold",
    name: "Or Solaire 🪙",
    description: "Finition or pur avec reflet doré radieux.",
    isShop: false,
    price: 0,
  },
  {
    id: "rainbow",
    name: "Arc-en-ciel Prismatique 🌈",
    description: "Dégradé pastel multicolore vibrant.",
    isShop: false,
    price: 0,
  },
  {
    id: "ice",
    name: "Glace Polaire 🧊",
    description: "Cristaux givrés bleutés venus des calottes polaires.",
    isShop: false,
    price: 0,
  },
  {
    id: "shadow",
    name: "Ombre Mystique 🌘",
    description: "Contour d'ombre profonde et contrastée.",
    isShop: false,
    price: 0,
  },
];

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type UserBadge = Database["public"]["Tables"]["user_badges"]["Row"] & {
  badges?: Database["public"]["Tables"]["badges"]["Row"];
};
type UserTitle = Database["public"]["Tables"]["user_titles"]["Row"] & {
  titles?: Database["public"]["Tables"]["titles"]["Row"];
};
type GameSession = Database["public"]["Tables"]["game_sessions"]["Row"] & {
  quizzes?: Database["public"]["Tables"]["quizzes"]["Row"];
};

export interface ProfilePageProps {
  userId?: string;
  onNavigate?: (view: string) => void;
}

export function ProfilePage({ userId: propUserId }: ProfilePageProps = {}) {
  const navigate = useNavigate();
  const params = useParams<{ userId?: string }>();
  const userId = propUserId || params.userId;
  const { profile: currentUserProfile } = useAuth();
  const { t } = useLanguage();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [titles, setTitles] = useState<UserTitle[]>([]);
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [currentUserDailyStats, setCurrentUserDailyStats] = useState<
    { date: string; points: number }[]
  >([]);
  const [stats, setStats] = useState({
    totalGames: 0,
    winRate: 0,
    averageScore: 0,
  });
  const [dailyStats, setDailyStats] = useState<
    { date: string; points: number }[]
  >([]);
  const [showWarnModal, setShowWarnModal] = useState(false);
  const [warnReason, setWarnReason] = useState("");
  const [sending, setSending] = useState(false);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [friendshipStatus, setFriendshipStatus] = useState<
    "none" | "pending" | "friends" | "blocked"
  >("none");
  const [showWarningHistory, setShowWarningHistory] = useState(false);
  const [warningHistory, setWarningHistory] = useState<{ id: string; reason: string; status: string; created_at: string }[]>([]);
  const [selectedDataPoint, setSelectedDataPoint] = useState<Record<string, number | string> | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [frameSaving, setFrameSaving] = useState(false);
  const [challengeModalOpen, setChallengeModalOpen] = useState(false);
  const [challengeQuiz, setChallengeQuiz] = useState<{
    quizId: string;
    quizTitle: string;
    targetScore: number;
  } | null>(null);

  const isOwnProfile = !userId || userId === currentUserProfile?.id;
  const targetUserId = userId || currentUserProfile?.id;
  const isAdmin = currentUserProfile?.role === "admin";

  const [showFederationModal, setShowFederationModal] = useState(false);
  const [currentFed, setCurrentFed] = useState<Federation>(() =>
    getUserFederation(targetUserId)
  );

  const [gamification, setGamification] = useState<PlayerGamificationState>(() =>
    getPlayerGamificationState(targetUserId)
  );

  useEffect(() => {
    setCurrentFed(getUserFederation(targetUserId));
    setGamification(getPlayerGamificationState(targetUserId));
  }, [targetUserId]);

  useEffect(() => {
    const handleGamificationUpdated = () => {
      setGamification(getPlayerGamificationState(targetUserId));
    };
    window.addEventListener("terracost_gamification_updated", handleGamificationUpdated);
    window.addEventListener("terracoast:profile_updated", handleGamificationUpdated);
    return () => {
      window.removeEventListener("terracost_gamification_updated", handleGamificationUpdated);
      window.removeEventListener("terracoast:profile_updated", handleGamificationUpdated);
    };
  }, [targetUserId]);

  const getDayText = (count?: number | null) => {
    return (count ?? 0) > 1 ? t("common.days") : t("common.day");
  };

  const getXPForLevel = (level: number) => {
    // Retourne l'XP total nécessaire pour atteindre ce niveau
    return (level - 1) * 100;
  };

  const getLevelProgress = () => {
    if (!profile)
      return { current: 0, needed: 100, percentage: 0, remaining: 100 };

    const currentXP = profile.experience_points;
    const currentLevel = profile.level;

    // XP pour le début du niveau actuel
    const xpForCurrentLevel = getXPForLevel(currentLevel);

    // XP pour atteindre le niveau suivant
    const xpForNextLevel = getXPForLevel(currentLevel + 1);

    // XP dans le niveau actuel
    const xpInCurrentLevel = currentXP - xpForCurrentLevel;

    // XP nécessaire pour compléter le niveau
    const xpNeededForLevel = xpForNextLevel - xpForCurrentLevel; // Toujours 1000

    // Pourcentage de progression
    const percentage = Math.min(
      100,
      (xpInCurrentLevel / xpNeededForLevel) * 100
    );

    return {
      current: xpInCurrentLevel,
      needed: xpNeededForLevel,
      percentage: Math.round(percentage),
      remaining: xpNeededForLevel - xpInCurrentLevel,
    };
  };

  const loadProfileData = useCallback(async () => {
    if (!targetUserId) return;

    const [profileResult, badgesResult, titlesResult, sessionsResult] =
      await Promise.all([
        supabase.from("profiles").select("*").eq("id", targetUserId).single(),
        supabase
          .from("user_badges")
          .select("*, badges(*)")
          .eq("user_id", targetUserId)
          .order("earned_at", { ascending: false }),
        supabase
          .from("user_titles")
          .select("*, titles(*)")
          .eq("user_id", targetUserId)
          .order("earned_at", { ascending: false }),
        supabase
          .from("game_sessions")
          .select("*, quizzes(title)")
          .eq("player_id", targetUserId)
          .eq("completed", true)
          .order("started_at", { ascending: false })
          .limit(5),
      ]);

    if (profileResult.data) setProfile(profileResult.data);
    if (badgesResult.data) setBadges(badgesResult.data);
    if (titlesResult.data) {
      setTitles(
        [...titlesResult.data].sort(
          (a, b) => Number(Boolean(b.is_active)) - Number(Boolean(a.is_active))
        )
      );
    }
    if (sessionsResult.data) setSessions(sessionsResult.data as any);

    await Promise.all([
      loadStats(),
      loadDailyStats(),
      (!isOwnProfile && currentUserProfile) ? loadFriendshipStatus() : Promise.resolve(),
    ]);
  }, [targetUserId, isOwnProfile, currentUserProfile]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  const uploadAvatar = async (file: File) => {
    if (!currentUserProfile || !isOwnProfile) return;
    setAvatarUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const path = `${currentUserProfile.id}/avatar-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = data.publicUrl;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq("id", currentUserProfile.id);

      if (updateError) throw updateError;

      await loadProfileData();
    } catch (e) {
      console.error("Avatar upload failed:", e);
    } finally {
      setAvatarUploading(false);
    }
  };

  const saveFrameStyle = async (style: string) => {
    if (!currentUserProfile || !isOwnProfile) return;
    setFrameSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ frame_style: style, updated_at: new Date().toISOString() })
        .eq("id", currentUserProfile.id);
      if (error) throw error;
      await loadProfileData();
    } catch (e) {
      console.error("Frame save failed:", e);
    } finally {
      setFrameSaving(false);
    }
  };

  useEffect(() => {
    if (!targetUserId) return;

    const channel = supabase
      .channel(`profile-awards-${targetUserId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_badges",
          filter: `user_id=eq.${targetUserId}`,
        },
        loadProfileData
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_titles",
          filter: `user_id=eq.${targetUserId}`,
        },
        loadProfileData
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${targetUserId}`,
        },
        loadProfileData
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_sessions",
          filter: `player_id=eq.${targetUserId}`,
        },
        loadProfileData
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "duels",
          filter: `player1_id=eq.${targetUserId}`,
        },
        loadProfileData
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "duels",
          filter: `player2_id=eq.${targetUserId}`,
        },
        loadProfileData
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [targetUserId, loadProfileData]);

  const loadFriendshipStatus = async () => {
    if (!currentUserProfile || !targetUserId) return;

    const { data } = await supabase
      .from("friendships")
      .select("*")
      .or(
        `and(user_id.eq.${currentUserProfile.id},friend_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},friend_id.eq.${currentUserProfile.id})`
      )
      .single();

    if (data) {
      setFriendshipStatus(data.status as any);
    }
  };

  const loadStats = async () => {
    if (!targetUserId) return;

    const { data } = await supabase
      .from("game_sessions")
      .select("score, completed")
      .eq("player_id", targetUserId)
      .eq("completed", true);

    if (data) {
      const totalGames = data.length;
      const averageScore =
        data.reduce((sum, s) => sum + (s.score || 0), 0) / totalGames || 0;

      setStats({
        totalGames,
        winRate: 0,
        averageScore: Math.round(averageScore),
      });
    }
  };

  const loadDailyStats = async () => {
    if (!targetUserId) return;

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toLocaleDateString();
    });

    const startDate = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000
    ).toISOString();

    const { data } = await supabase
      .from("game_sessions")
      .select("started_at, score")
      .eq("player_id", targetUserId)
      .eq("completed", true)
      .gte("started_at", startDate);

    const dailyData: { [key: string]: number } = {};
    last7Days.forEach((day) => {
      dailyData[day] = 0;
    });

    if (data) {
      data.forEach((session) => {
        const date = new Date(session.started_at).toLocaleDateString();
        if (dailyData.hasOwnProperty(date)) {
          dailyData[date] = (dailyData[date] || 0) + (session.score || 0);
        }
      });
    }

    const formattedData = last7Days.map((date) => ({
      date,
      points: dailyData[date],
    }));

    setDailyStats(formattedData);

    if (!isOwnProfile && currentUserProfile) {
      const { data: myData } = await supabase
        .from("game_sessions")
        .select("started_at, score")
        .eq("player_id", currentUserProfile.id)
        .eq("completed", true)
        .gte("started_at", startDate);

      const myDailyData: { [key: string]: number } = {};
      last7Days.forEach((day) => {
        myDailyData[day] = 0;
      });

      if (myData) {
        myData.forEach((session) => {
          const date = new Date(session.started_at).toLocaleDateString();
          if (myDailyData.hasOwnProperty(date)) {
            myDailyData[date] = (myDailyData[date] || 0) + (session.score || 0);
          }
        });
      }

      const myFormattedData = last7Days.map((date) => ({
        date,
        points: myDailyData[date],
      }));

      setCurrentUserDailyStats(myFormattedData);
    }
  };

  const sendFriendRequest = async () => {
    if (!currentUserProfile || !targetUserId) return;

    const { error } = await supabase.from("friendships").insert({
      user_id: currentUserProfile.id,
      friend_id: targetUserId,
      status: "pending",
    });

    if (!error) {
      setFriendshipStatus("pending");
    }
  };

  const sendWarning = async () => {
    if (!warnReason.trim() || !currentUserProfile?.id || !targetUserId) return;

    setSending(true);
    const { error } = await supabase.from("warnings").insert({
      reported_user_id: targetUserId,
      reporter_user_id: currentUserProfile.id,
      reason: warnReason,
      status: "pending",
    });

    if (!error) {
      setShowWarnModal(false);
      setWarnReason("");
    }
    setSending(false);
  };

  const loadWarningHistory = async () => {
    if (!targetUserId) return;
    const { data } = await supabase
      .from("warnings")
      .select("*")
      .eq("reported_user_id", targetUserId)
      .order("created_at", { ascending: false });

    if (data) setWarningHistory(data);
  };


  const allDaysData = dailyStats.map((stat) => {
    const myStatForDay = currentUserDailyStats.find(
      (s) => s.date === stat.date
    );
    return {
      name: stat.date,
      [isOwnProfile
        ? t("profile.myProgress")
        : profile?.pseudo || t("profile.user")]: stat.points,
      ...(myStatForDay && { [t("profile.myProgress")]: myStatForDay.points }),
    };
  });

  const levelProgress = getLevelProgress();
  const activeTitle = titles.find((title) => title.is_active);

  const activeTitleFromShop = getActiveTitleDetails(targetUserId);
  const displayedTitleName = activeTitleFromShop?.name || activeTitle?.titles?.name;
  const displayedTitleIcon = activeTitleFromShop?.icon || "⭐";

  const currentActiveFrame = (profile?.frame_style && profile.frame_style !== "none")
    ? profile.frame_style
    : (isOwnProfile ? (gamification.activeAvatarFrame || "none") : "none");

  const availableFrames = useMemo(() => {
    const unlockedSet = new Set<string>([
      "none",
      "emerald",
      "gold",
      "rainbow",
      "ice",
      "shadow",
      ...(gamification.inventory?.avatarFrames || []),
    ]);
    if (profile?.frame_style && profile.frame_style !== "none") {
      unlockedSet.add(profile.frame_style);
    }
    return ALL_FRAMES_CATALOG.map((f) => ({
      ...f,
      isUnlocked: unlockedSet.has(f.id),
    }));
  }, [gamification.inventory?.avatarFrames, profile?.frame_style]);

  const unlockedShopTitles = useMemo(() => {
    return getUnlockedShopTitles(targetUserId);
  }, [targetUserId, gamification.inventory?.titles]);

  const totalTitlesCount = titles.length + unlockedShopTitles.length;

  const handleEquipFrame = async (frameId: string) => {
    if (!isOwnProfile || !currentUserProfile) return;
    const targetId = frameId === "none" ? "none" : frameId;
    equipShopItem(currentUserProfile.id, "frame", targetId === "none" ? null : targetId);
    setGamification(getPlayerGamificationState(currentUserProfile.id));
    playSound("click");
    toast.success(targetId === "none" ? "Cadre retiré." : "Cadre équipé avec succès ! ✨");
    await saveFrameStyle(targetId);
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("terracoast:profile_updated", { detail: { userId: currentUserProfile.id } })
      );
    }
  };

  const handleEquipShopTitle = async (titleId: string, titleName: string) => {
    if (!isOwnProfile || !currentUserProfile) return;
    const isCurrentlyActive = gamification.activeTitle === titleId || gamification.activeTitle === titleName;
    const targetId = isCurrentlyActive ? null : titleId;
    equipShopItem(currentUserProfile.id, "title", targetId);
    setGamification(getPlayerGamificationState(currentUserProfile.id));
    
    // Désactiver aussi les titres DB pour qu'il n'y ait qu'un seul titre actif
    if (!isCurrentlyActive) {
      setTitles((prev) => prev.map((t) => ({ ...t, is_active: false })));
      try {
        await supabase
          .from("user_titles")
          .update({ is_active: false })
          .eq("user_id", currentUserProfile.id);
      } catch {
        // no-op
      }
    }

    playSound("click");
    toast.success(isCurrentlyActive ? "Titre retiré." : `${titleName} activé avec succès ! ⭐`);
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("terracoast:profile_updated", { detail: { userId: currentUserProfile.id } })
      );
    }
  };

  const setActiveTitle = async (userTitleId: string) => {
    if (!isOwnProfile || !currentUserProfile) return;

    // Retirer le titre de la boutique s'il y en avait un actif
    equipShopItem(currentUserProfile.id, "title", null);
    setGamification(getPlayerGamificationState(currentUserProfile.id));

    const { error: resetError } = await supabase
      .from("user_titles")
      .update({ is_active: false })
      .eq("user_id", currentUserProfile.id);
    if (resetError) return;

    const { error: activateError } = await supabase
      .from("user_titles")
      .update({ is_active: true })
      .eq("id", userTitleId)
      .eq("user_id", currentUserProfile.id);
    if (activateError) return;

    setTitles((prev) =>
      prev
        .map((title) => ({
          ...title,
          is_active: title.id === userTitleId,
        }))
        .sort(
          (a, b) => Number(Boolean(b.is_active)) - Number(Boolean(a.is_active))
        )
    );

    playSound("click");
    toast.success("Titre activé avec succès ! ⭐");
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("terracoast:profile_updated", { detail: { userId: currentUserProfile.id } })
      );
    }
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {challengeModalOpen && challengeQuiz && (
          <ChallengeFriendModal
            quizId={challengeQuiz.quizId}
            quizTitle={challengeQuiz.quizTitle}
            targetScore={challengeQuiz.targetScore}
            onClose={() => {
              setChallengeModalOpen(false);
              setChallengeQuiz(null);
            }}
          />
        )}

        {/* 🎮 HERO EXPLORER CARD (CARTE D'IDENTITÉ GAMER) */}
        <div className="bg-white rounded-3xl border-2 border-slate-200 border-b-4 border-b-slate-300 shadow-sm p-6 sm:p-8 relative overflow-hidden">
          {/* Bannière Décorative Supérieure */}
          <div className="h-28 -mx-6 -mt-6 sm:-mx-8 sm:-mt-8 mb-6 bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 relative flex items-center justify-between px-6 sm:px-8 overflow-hidden rounded-t-[22px]">
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
            <div className="relative z-10 flex items-center gap-2 text-white/90 text-xs font-black uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Passeport Explorateur TerraCoast</span>
            </div>
            {profile.role === "admin" && (
              <span className="relative z-10 bg-rose-500 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-sm border border-rose-400">
                Staff Administrateur 🛡️
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar 3D avec Badge de Niveau Tactile */}
            <div className="relative -mt-14 sm:-mt-16 group shrink-0">
              <div className="p-1.5 bg-white rounded-3xl shadow-xl border-2 border-slate-200">
                <Avatar
                  url={profile.avatar_url}
                  pseudo={profile.pseudo}
                  frameStyle={currentActiveFrame}
                  size="xl"
                  className="rounded-2xl"
                />
              </div>
              <div
                className="absolute -bottom-2 -right-2 bg-amber-400 border-2 border-amber-200 border-b-4 border-amber-600 text-slate-900 rounded-2xl w-12 h-12 flex flex-col items-center justify-center font-black text-xs shadow-md rotate-[-4deg]"
                title={`Niveau ${profile.level}`}
              >
                <span className="text-[9px] uppercase tracking-tighter text-amber-900 font-extrabold leading-none">
                  Niv.
                </span>
                <span className="text-base font-black leading-tight">
                  {profile.level}
                </span>
              </div>
            </div>

            {/* Infos Joueur & Titres */}
            <div className="flex-1 text-center sm:text-left w-full min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-2 flex-wrap justify-center sm:justify-start">
                    <span>{profile.pseudo}</span>
                  </h1>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                    {displayedTitleName && (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-xl bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-900 text-xs font-black border-2 border-purple-200 border-b-4 border-b-purple-400 shadow-xs animate-fade-in">
                        <span className="text-sm leading-none">{displayedTitleIcon}</span>
                        <span>{displayedTitleName}</span>
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => isOwnProfile && setShowFederationModal(true)}
                      disabled={!isOwnProfile}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-xl text-xs font-black border-2 transition ${
                        isOwnProfile
                          ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300 border-b-4 border-b-emerald-500 active:translate-y-0.5 cursor-pointer shadow-sm"
                          : "bg-slate-100 text-slate-700 border-slate-200 border-b-4 border-b-slate-300"
                      }`}
                      title={isOwnProfile ? "Changer de Fédération / Blason" : undefined}
                    >
                      <span className="text-base leading-none">{currentFed.flagEmoji}</span>
                      <span>{currentFed.name}</span>
                      {isOwnProfile && (
                        <span className="text-[10px] text-emerald-600 ml-1 font-bold">✎</span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Bouton Paramètres pour Desktop */}
                {isOwnProfile && (
                  <button
                    onClick={() => navigate("/settings")}
                    className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-2xl border-2 border-slate-200 border-b-4 border-b-slate-300 active:translate-y-1 transition-all shadow-sm shrink-0"
                  >
                    <Settings className="w-4 h-4 text-slate-500" />
                    <span>{t("profile.settings")}</span>
                  </button>
                )}
              </div>

              {/* 🌟 BARRE DE PROGRESSION DU NIVEAU STYLE DUOLINGO */}
              <div className="mt-4 bg-slate-50 rounded-2xl p-3.5 border-2 border-slate-200 border-b-4 border-b-slate-300">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-1.5 px-1">
                  <span className="flex items-center gap-1.5 font-black text-slate-800">
                    <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                    Progression Niv. {profile.level}
                  </span>
                  <span className="font-extrabold text-emerald-700">
                    {levelProgress.current} / {levelProgress.needed} XP
                  </span>
                </div>
                <div className="h-5 bg-slate-200/80 rounded-full border border-slate-300 p-0.5 overflow-hidden shadow-inner relative">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500 transition-all duration-700 ease-out flex items-center justify-end pr-2 relative shadow-sm"
                    style={{ width: `${Math.max(6, levelProgress.percentage)}%` }}
                  >
                    {levelProgress.percentage >= 15 && (
                      <span className="text-[10px] font-black text-white drop-shadow">
                        {levelProgress.percentage}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center mt-1.5 px-1 text-[11px] text-slate-500">
                  <span>Prochain palier : Niveau {profile.level + 1}</span>
                  <span className="font-bold text-slate-700">
                    Encore {levelProgress.remaining} XP requis
                  </span>
                </div>
              </div>

              {/* 📊 LES 4 BLOCS DE STATS TACTILES 3D */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-5">
                {/* 1. Niveau & XP */}
                <div className="bg-emerald-50/80 border-2 border-emerald-200 border-b-4 border-b-emerald-400 rounded-2xl p-3.5 sm:p-4 text-center hover:scale-[1.02] transition-transform">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center mx-auto mb-1 text-emerald-600">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-emerald-700">
                    {profile.level}
                  </p>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                    {t("profile.level")}
                  </p>
                  <p className="text-[10px] font-semibold text-emerald-600/80 mt-0.5">
                    {profile.experience_points} XP total
                  </p>
                </div>

                {/* 2. Série de Flamme */}
                <div
                  onClick={() => setShowStreakModal(true)}
                  className="bg-amber-50/80 border-2 border-amber-200 border-b-4 border-b-amber-400 rounded-2xl p-3.5 sm:p-4 text-center cursor-pointer hover:scale-[1.02] active:translate-y-0.5 transition-all group"
                  title="Voir le calendrier des flammes"
                >
                  <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center mx-auto mb-1 text-amber-600 group-hover:scale-110 transition-transform">
                    <Flame className="w-4 h-4 fill-amber-500 text-amber-500 animate-pulse" />
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-amber-700">
                    {profile.current_streak || 0}
                  </p>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                    {getDayText(profile.current_streak)}
                  </p>
                  <p className="text-[10px] font-semibold text-amber-600/80 mt-0.5">
                    Record : {profile.longest_streak || 0}j 🔥
                  </p>
                </div>

                {/* 3. Cote de Duel MMR */}
                <div className="bg-purple-50/80 border-2 border-purple-200 border-b-4 border-b-purple-400 rounded-2xl p-3.5 sm:p-4 text-center hover:scale-[1.02] transition-transform">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 border border-purple-300 flex items-center justify-center mx-auto mb-1 text-purple-600">
                    <Swords className="w-4 h-4" />
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-purple-700">
                    {profile.duel_rating ?? 1000}
                  </p>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-purple-800">
                    {t("profile.mmr")}
                  </p>
                  <p className="text-[10px] font-semibold text-purple-600/80 mt-0.5">
                    {profile.duel_ranked_games ?? 0} {t("profile.rankedDuels")}
                  </p>
                </div>

                {/* 4. Parties Jouées & Score */}
                <div className="bg-sky-50/80 border-2 border-sky-200 border-b-4 border-b-sky-400 rounded-2xl p-3.5 sm:p-4 text-center hover:scale-[1.02] transition-transform">
                  <div className="w-8 h-8 rounded-xl bg-sky-100 border border-sky-300 flex items-center justify-center mx-auto mb-1 text-sky-600">
                    <Target className="w-4 h-4" />
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-sky-700">
                    {stats.totalGames}
                  </p>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-sky-800">
                    {t("profile.games")}
                  </p>
                  <p className="text-[10px] font-semibold text-sky-600/80 mt-0.5">
                    Moyenne : {stats.averageScore} pts
                  </p>
                </div>
              </div>

              {/* 🗺️ WIDGET CARTE DE CONQUÊTE & POKÉDEX */}
              {(() => {
                const cStats = getConquestStats(targetUserId);
                return (
                  <div
                    onClick={() => navigate("/conquest")}
                    className="mt-5 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 border-2 border-emerald-500/40 border-b-4 border-b-emerald-600 text-white shadow-md hover:border-emerald-400 hover:shadow-lg transition-all cursor-pointer group active:translate-y-0.5 flex flex-col sm:flex-row items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400/40 border-b-4 border-b-emerald-600 flex items-center justify-center text-2xl shadow-inner shrink-0 group-hover:scale-105 transition-transform">
                        🗺️
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm sm:text-base font-black text-white group-hover:text-emerald-300 transition-colors">
                            Pokédex Géographique & Conquête
                          </h4>
                          <span className="bg-emerald-400 text-slate-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-sm">
                            {cStats.conquestPercentage}% Conquis
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-0.5">
                          {cStats.conqueredCount} / {cStats.totalCountries} pays découverts • {cStats.legendaryCount} cartes légendaires 🌟
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="w-full sm:w-auto shrink-0 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs border-b-4 border-emerald-700 active:translate-y-1 shadow-md transition flex items-center justify-center gap-2"
                    >
                      <span>Explorer ma Carte</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* BOUTONS D'ACTION TACTILES 3D */}
          <div className="flex flex-wrap items-center gap-3 mt-6 pt-5 border-t border-slate-100">
            {isOwnProfile && (
              <>
                <button
                  onClick={() => navigate("/settings")}
                  className="sm:hidden flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-2xl border-2 border-slate-200 border-b-4 border-b-slate-300 active:translate-y-1 transition-all shadow-sm"
                >
                  <Settings className="w-4 h-4" />
                  <span>{t("profile.settings")}</span>
                </button>

                {isAdmin && (
                  <button
                    onClick={() => navigate("/account-details")}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black rounded-2xl border-2 border-indigo-200 border-b-4 border-indigo-400 active:translate-y-1 transition-all shadow-sm text-xs"
                  >
                    <User className="w-4 h-4" />
                    <span>{t("profile.accountDetails")}</span>
                  </button>
                )}
              </>
            )}

            {!isOwnProfile && (
              <>
                {friendshipStatus === "none" && (
                  <button
                    onClick={sendFriendRequest}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-black rounded-2xl border-b-4 border-blue-700 active:translate-y-1 transition-all shadow-sm"
                  >
                    <UserPlus className="w-5 h-5" />
                    <span>{t("profile.addFriend")}</span>
                  </button>
                )}

                {friendshipStatus === "pending" && (
                  <button
                    disabled
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 text-slate-400 font-bold rounded-2xl border-2 border-slate-200 border-b-4 border-b-slate-300 cursor-not-allowed opacity-80"
                  >
                    <Clock className="w-5 h-5" />
                    <span>{t("profile.requestPending")}</span>
                  </button>
                )}

                {friendshipStatus === "friends" && (
                  <div className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3 bg-emerald-100 text-emerald-800 font-black rounded-2xl border-2 border-emerald-300 border-b-4 border-b-emerald-500 shadow-sm">
                    <UserCheck className="w-5 h-5 text-emerald-600" />
                    <span>{t("profile.friends")}</span>
                  </div>
                )}

                {isAdmin && (
                  <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => navigate(`/account-details?userId=${targetUserId}`)}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black rounded-2xl border-2 border-indigo-200 border-b-4 border-indigo-400 active:translate-y-1 transition-all text-xs"
                    >
                      <User className="w-4 h-4" />
                      <span>{t("profile.accountDetails")}</span>
                    </button>

                    <button
                      onClick={() => setShowWarnModal(true)}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-50 hover:bg-orange-100 text-orange-700 font-black rounded-2xl border-2 border-orange-200 border-b-4 border-orange-400 active:translate-y-1 transition-all text-xs"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      <span>{t("profile.warnUser")}</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowWarningHistory(true);
                        loadWarningHistory();
                      }}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-black rounded-2xl border-2 border-purple-200 border-b-4 border-purple-400 active:translate-y-1 transition-all text-xs"
                    >
                      <History className="w-4 h-4" />
                      <span>{t("profile.warningHistory")}</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* 📈 GRAPHIQUE DE PROGRESSION */}
        <ProfileScoreChart
          data={allDaysData}
          isOwnProfile={isOwnProfile}
          userKey={profile?.pseudo || t("profile.user")}
          currentUserKey={t("profile.myProgress")}
          showCompareLine={currentUserDailyStats.length > 0}
          onPointClick={(dataPoint) => setSelectedDataPoint(dataPoint)}
        />

        {/* 🏆 BADGES & TROPHÉES */}
        <div className="bg-white rounded-3xl border-2 border-slate-200 border-b-4 border-b-slate-300 shadow-sm p-6 sm:p-7">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 border-2 border-amber-200 border-b-4 border-b-amber-300 flex items-center justify-center text-amber-600 shadow-sm">
                <Award className="w-5 h-5" />
              </div>
              <span>{t("profile.badges")}</span>
            </h2>
            <span className="text-xs font-black text-amber-800 bg-amber-50 border border-amber-200 px-3.5 py-1 rounded-full shadow-sm">
              {badges.length} débloqué{badges.length > 1 ? "s" : ""}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {badges.map((userBadge) => (
              <div
                key={userBadge.id}
                className="group relative bg-slate-50 hover:bg-amber-50/60 rounded-2xl p-4 border-2 border-slate-200 hover:border-amber-300 border-b-4 border-b-slate-300 hover:border-b-amber-400 transition-all duration-200 hover:scale-[1.03] text-center flex flex-col items-center justify-between shadow-sm cursor-pointer"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 rounded-2xl flex items-center justify-center shadow-md border-2 border-amber-200 border-b-4 border-amber-600 group-hover:rotate-6 transition-transform mb-2">
                  <Award className="w-7 h-7 text-white drop-shadow" />
                </div>
                <h3 className="font-black text-slate-800 text-xs sm:text-sm leading-snug mb-1 line-clamp-2">
                  {userBadge.badges?.name}
                </h3>
                <span className="text-[10px] font-bold text-slate-400">
                  {new Date(userBadge.earned_at).toLocaleDateString()}
                </span>

                {/* Popover Infobulle au Survol */}
                <div className="absolute inset-0 bg-slate-900/95 text-white rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center p-3 text-center pointer-events-none z-10 border-2 border-amber-400">
                  <p className="text-xs font-bold leading-relaxed">
                    {userBadge.badges?.description}
                  </p>
                  <span className="text-[10px] font-semibold text-amber-300 mt-2">
                    Obtenu le {new Date(userBadge.earned_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {badges.length === 0 && (
            <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 border-2 border-amber-200 border-b-4 border-b-amber-300 flex items-center justify-center mx-auto mb-3 text-amber-500 text-3xl">
                🏆
              </div>
              <h4 className="text-sm font-black text-slate-700">Aucun badge débloqué pour le moment</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Complète des quiz, relève des défis quotidiens et gagne des duels pour enrichir ton armoire à trophées !
              </p>
            </div>
          )}
        </div>

        {/* 🎨 SKINS & CADRES D'AVATAR */}
        <div className="bg-white rounded-3xl border-2 border-slate-200 border-b-4 border-b-slate-300 shadow-sm p-6 sm:p-7">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 border-2 border-amber-200 border-b-4 border-b-amber-300 flex items-center justify-center text-amber-600 shadow-sm">
                <span>🎨</span>
              </div>
              <span>Skins & Cadres d'Avatar</span>
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-amber-900 bg-amber-50 border border-amber-200 px-3.5 py-1 rounded-full shadow-sm">
                {availableFrames.filter((f) => f.isUnlocked).length} débloqué(s)
              </span>
              {isOwnProfile && (
                <button
                  type="button"
                  onClick={() => navigate("/shop")}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 text-amber-950 font-black text-xs border-b-2 border-amber-600 active:translate-y-0.5 shadow-xs cursor-pointer"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Boutique</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {availableFrames.map((frame) => {
              const isEquipped = currentActiveFrame === frame.id || (frame.id === "none" && (!currentActiveFrame || currentActiveFrame === "none"));
              return (
                <div
                  key={frame.id}
                  className={`rounded-2xl p-4 border-2 transition-all flex flex-col justify-between ${
                    isEquipped
                      ? "bg-amber-50/70 border-amber-400 border-b-4 border-b-amber-500 shadow-md ring-2 ring-amber-300/40"
                      : frame.isUnlocked
                      ? "bg-slate-50 border-slate-200 border-b-4 border-b-slate-300 hover:border-slate-300"
                      : "bg-slate-50/50 border-slate-200/60 opacity-80"
                  }`}
                >
                  <div>
                    {/* Header: Preview + Status */}
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="p-1 bg-white rounded-2xl shadow-xs border border-slate-100 shrink-0">
                        <Avatar
                          url={profile.avatar_url}
                          pseudo={profile.pseudo}
                          frameStyle={frame.id}
                          size="md"
                        />
                      </div>
                      {isEquipped ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider shadow-xs">
                          <CheckCircle2 className="w-3 h-3" />
                          Équipé
                        </span>
                      ) : frame.isUnlocked ? (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-slate-200 text-slate-700">
                          Débloqué
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-lg bg-amber-100 text-amber-800 border border-amber-200">
                          <span>🔒</span> {frame.price ? `${frame.price} 💎` : "Boutique"}
                        </span>
                      )}
                    </div>

                    <h3 className="font-black text-slate-900 text-sm mb-1">
                      {frame.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mb-3 line-clamp-2">
                      {frame.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 mt-auto">
                    {isOwnProfile && frame.isUnlocked && !isEquipped && (
                      <button
                        type="button"
                        onClick={() => handleEquipFrame(frame.id)}
                        className="w-full py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black border-b-4 border-emerald-800 active:translate-y-0.5 transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Équiper ce skin</span>
                      </button>
                    )}
                    {isOwnProfile && isEquipped && frame.id !== "none" && (
                      <button
                        type="button"
                        onClick={() => handleEquipFrame("none")}
                        className="w-full py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-black border-b-4 border-slate-400 active:translate-y-0.5 transition-all shadow-xs cursor-pointer"
                      >
                        Retirer le cadre
                      </button>
                    )}
                    {isOwnProfile && !frame.isUnlocked && (
                      <button
                        type="button"
                        onClick={() => navigate("/shop")}
                        className="w-full py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 text-xs font-black border-b-4 border-amber-600 active:translate-y-0.5 transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Débloquer ({frame.price || 250} 💎)</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ⭐ TITRES HONORIFIQUES */}
        <div className="bg-white rounded-3xl border-2 border-slate-200 border-b-4 border-b-slate-300 shadow-sm p-6 sm:p-7">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 border-2 border-purple-200 border-b-4 border-b-purple-300 flex items-center justify-center text-purple-600 shadow-sm">
                <Star className="w-5 h-5 fill-purple-400 text-purple-600" />
              </div>
              <span>{t("profile.titles")}</span>
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-purple-800 bg-purple-50 border border-purple-200 px-3.5 py-1 rounded-full shadow-sm">
                {totalTitlesCount} titre{totalTitlesCount > 1 ? "s" : ""}
              </span>
              {isOwnProfile && (
                <button
                  type="button"
                  onClick={() => navigate("/shop")}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 font-black text-xs border border-purple-300 active:translate-y-0.5 shadow-xs cursor-pointer"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-purple-600" />
                  <span>Titres Boutique 💎</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 1. Titres débloqués dans la boutique */}
            {unlockedShopTitles.map((shopTitle) => {
              const isShopActive =
                gamification.activeTitle === shopTitle.id ||
                gamification.activeTitle === shopTitle.name;
              return (
                <div
                  key={shopTitle.id}
                  className={`rounded-2xl p-4 sm:p-5 border-2 transition-all flex flex-col justify-between ${
                    isShopActive
                      ? "bg-purple-50/90 border-purple-400 border-b-4 border-b-purple-600 shadow-md ring-2 ring-purple-300/40"
                      : "bg-slate-50 border-slate-200 border-b-4 border-b-slate-300 hover:border-slate-300"
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h3 className="font-black text-slate-900 text-base flex items-center gap-1.5">
                        <span>{shopTitle.name}</span>
                      </h3>
                      {isShopActive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-purple-600 text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
                          <CheckCircle2 className="w-3 h-3" />
                          {t("profile.active")}
                        </span>
                      ) : (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-purple-100 text-purple-800 border border-purple-200">
                          Boutique 💎
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 font-medium mb-3">
                      {shopTitle.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 mt-2">
                    <span className="text-[10px] font-black text-purple-600 uppercase tracking-wider">
                      Titre Exclusif
                    </span>
                    {isOwnProfile && !isShopActive && (
                      <button
                        type="button"
                        onClick={() => handleEquipShopTitle(shopTitle.id, shopTitle.name)}
                        className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black border-b-4 border-purple-800 active:translate-y-0.5 transition-all shadow-sm cursor-pointer"
                      >
                        {t("profile.activateTitle")}
                      </button>
                    )}
                    {isOwnProfile && isShopActive && (
                      <button
                        type="button"
                        onClick={() => handleEquipShopTitle(shopTitle.id, shopTitle.name)}
                        className="px-2.5 py-1 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold border-b-2 border-slate-300 cursor-pointer"
                      >
                        Retirer
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* 2. Titres de progression (Supabase) */}
            {titles.map((userTitle) => (
              <div
                key={userTitle.id}
                className={`rounded-2xl p-4 sm:p-5 border-2 transition-all flex flex-col justify-between ${
                  userTitle.is_active && !gamification.activeTitle
                    ? "bg-purple-50/80 border-purple-300 border-b-4 border-b-purple-500 shadow-sm"
                    : "bg-slate-50 border-slate-200 border-b-4 border-b-slate-300 hover:border-slate-300"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3 className="font-black text-slate-900 text-base flex items-center gap-1.5">
                      <span>{userTitle.titles?.name}</span>
                    </h3>
                    {userTitle.is_active && !gamification.activeTitle && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-purple-600 text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
                        <CheckCircle2 className="w-3 h-3" />
                        {t("profile.active")}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 font-medium mb-3">
                    {userTitle.titles?.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 mt-2">
                  <span className="text-[10px] font-bold text-slate-400">
                    {new Date(userTitle.earned_at).toLocaleDateString()}
                  </span>
                  {isOwnProfile && (!userTitle.is_active || gamification.activeTitle) && (
                    <button
                      type="button"
                      onClick={() => setActiveTitle(userTitle.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black border-b-4 border-purple-800 active:translate-y-0.5 transition-all shadow-sm cursor-pointer"
                    >
                      {t("profile.activateTitle")}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {totalTitlesCount === 0 && (
            <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50">
              <div className="w-16 h-16 rounded-2xl bg-purple-50 border-2 border-purple-200 border-b-4 border-b-purple-300 flex items-center justify-center mx-auto mb-3 text-purple-400 text-3xl">
                ⭐
              </div>
              <h4 className="text-sm font-black text-slate-700">Aucun titre honorifique pour le moment</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto mb-4">
                Atteins des paliers d'expérience ou obtiens des titres légendaires dans la Boutique TerraCoast !
              </p>
              {isOwnProfile && (
                <button
                  type="button"
                  onClick={() => navigate("/shop")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs border-b-4 border-purple-800 shadow-sm active:translate-y-0.5 cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Explorer les Titres de la Boutique</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* 🎮 DERNIÈRES PARTIES JOUÉES */}
        <div className="bg-white rounded-3xl border-2 border-slate-200 border-b-4 border-b-slate-300 shadow-sm overflow-hidden">
          <div className="p-5 sm:p-6 pb-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 border-2 border-emerald-200 border-b-4 border-b-emerald-300 flex items-center justify-center text-emerald-600 shadow-sm">
                  <History className="w-5 h-5" />
                </div>
                <span>{t("profile.recentGames")}</span>
              </h2>
              <span className="text-xs font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-3.5 py-1 rounded-full shadow-sm">
                {sessions.length} partie{sessions.length > 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {sessions.length === 0 ? (
            <div className="px-5 sm:px-6 pb-6">
              <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 border-2 border-emerald-200 border-b-4 border-b-emerald-300 flex items-center justify-center mx-auto mb-3 text-emerald-500 text-3xl">
                  🎮
                </div>
                <h4 className="text-sm font-black text-slate-700">{t("profile.noGamesYet")}</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Lance une partie pour voir tes statistiques et exploits s'afficher ici !
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {sessions.map((session, idx) => {
                const scoreVal = session.score || 0;
                const accuracyVal = Math.round(session.accuracy_percentage || 0);
                const correctAnswers = (session as any).correct_answers ?? 0;
                const totalQuestions = (session as any).total_questions ?? 0;
                const timeStr = session.time_taken_seconds
                  ? `${Math.floor(session.time_taken_seconds / 60)}:${(session.time_taken_seconds % 60).toString().padStart(2, "0")}`
                  : "N/A";

                const isHighScore = idx === 0 && scoreVal > 0;
                const isDuel = session.mode === "duel";

                return (
                  <div
                    key={session.id}
                    className={`group relative px-5 sm:px-6 py-4 sm:py-5 hover:bg-slate-50/60 transition-all duration-200 ${
                      isHighScore ? "bg-gradient-to-r from-amber-50/40 to-transparent" : ""
                    }`}
                  >
                    {/* Accent Bar gauche */}
                    <div
                      className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${
                        isDuel
                          ? "bg-purple-500"
                          : isHighScore
                          ? "bg-gradient-to-b from-amber-400 to-amber-500"
                          : "bg-emerald-400"
                      }`}
                    />

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Infos de la partie */}
                      <div className="flex-1 min-w-0 ml-2">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          {isHighScore && (
                            <span className="text-xs">🏆</span>
                          )}
                          <h3 className="font-black text-slate-800 text-sm sm:text-base truncate group-hover:text-emerald-600 transition-colors">
                            {session.quizzes?.title || t("profile.unknownQuiz")}
                          </h3>
                          {session.mode && (
                            <span
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                                isDuel
                                  ? "bg-purple-100 text-purple-700 border-purple-200"
                                  : "bg-blue-100 text-blue-700 border-blue-200"
                              }`}
                            >
                              {isDuel ? "⚔️ Duel" : "👤 Solo"}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400">
                          <Clock className="w-3 h-3 text-slate-300" />
                          <span>
                            {new Date(session.started_at).toLocaleDateString(undefined, {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span>
                            {new Date(session.started_at).toLocaleTimeString(undefined, {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Score principal + stats pills sur la droite */}
                      <div className="flex items-center gap-3 sm:gap-4 ml-2 sm:ml-0">
                        {/* Stat pills compactes */}
                        <div className="hidden sm:flex items-center gap-1.5">
                          <div className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 rounded-xl border border-blue-200 text-blue-700">
                            <span className="text-[10px] font-black">{accuracyVal}%</span>
                          </div>
                          <div className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-700">
                            <span className="text-[10px] font-black">{correctAnswers}/{totalQuestions}</span>
                          </div>
                          <div className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-700">
                            <span className="text-[10px] font-black">{timeStr}</span>
                          </div>
                        </div>

                        {/* Score principal */}
                        <div className={`px-4 py-2 rounded-2xl border-2 text-center min-w-[80px] ${
                          isDuel
                            ? "bg-purple-50 border-purple-200 border-b-4 border-b-purple-400"
                            : isHighScore
                            ? "bg-amber-50 border-amber-200 border-b-4 border-b-amber-400"
                            : "bg-slate-50 border-slate-200 border-b-4 border-b-slate-300"
                        }`}>
                          <p className={`text-xl sm:text-2xl font-black font-mono leading-tight ${
                            isDuel
                              ? "text-purple-700"
                              : isHighScore
                              ? "text-amber-700"
                              : "text-slate-800"
                          }`}>
                            {scoreVal}
                          </p>
                          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mt-0.5">
                            {t("profile.score")}
                          </p>
                        </div>

                        {/* Bouton Défier */}
                        {isOwnProfile && session.quiz_id && (
                          <button
                            type="button"
                            onClick={() => {
                              setChallengeQuiz({
                                quizId: session.quiz_id,
                                quizTitle:
                                  session.quizzes?.title || t("profile.unknownQuiz"),
                                targetScore: session.score || 0,
                              });
                              setChallengeModalOpen(true);
                            }}
                            className="px-3 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black border-2 border-emerald-400 border-b-4 border-b-emerald-700 active:translate-y-1 active:border-b-2 transition-all shadow-sm flex items-center gap-1.5 shrink-0"
                          >
                            <Swords className="w-3.5 h-3.5" />
                            <span className="hidden lg:inline">Défier</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Stats Pills mobiles */}
                    <div className="sm:hidden flex items-center gap-2 mt-3 ml-2">
                      <div className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-blue-50 rounded-xl border border-blue-200">
                        <span className="text-[10px] font-black text-blue-700">{accuracyVal}% préc.</span>
                      </div>
                      <div className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-emerald-50 rounded-xl border border-emerald-200">
                        <span className="text-[10px] font-black text-emerald-700">{correctAnswers}/{totalQuestions} Q</span>
                      </div>
                      <div className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-amber-50 rounded-xl border border-amber-200">
                        <span className="text-[10px] font-black text-amber-700">⏱ {timeStr}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* MODALES MODULARISÉES */}
      <StreakModal
        isOpen={showStreakModal}
        onClose={() => setShowStreakModal(false)}
        currentStreak={profile.current_streak || 0}
        longestStreak={profile.longest_streak || 0}
        isOwnProfile={isOwnProfile}
        frameStyle={(profile as any).frame_style}
        avatarUploading={avatarUploading}
        frameSaving={frameSaving}
        onUploadAvatar={uploadAvatar}
        onSaveFrameStyle={saveFrameStyle}
      />

      <DayDetailsModal
        selectedDataPoint={selectedDataPoint}
        onClose={() => setSelectedDataPoint(null)}
        isOwnProfile={isOwnProfile}
        profilePseudo={profile.pseudo}
      />

      <WarnModal
        isOpen={showWarnModal}
        onClose={() => setShowWarnModal(false)}
        warnReason={warnReason}
        onWarnReasonChange={setWarnReason}
        onSendWarning={sendWarning}
        sending={sending}
      />

      <WarningHistoryModal
        isOpen={showWarningHistory}
        onClose={() => setShowWarningHistory(false)}
        warnings={warningHistory}
      />

      <FederationSelectModal
        isOpen={showFederationModal}
        onClose={() => setShowFederationModal(false)}
        currentFederationId={currentFed.id}
        userId={targetUserId}
        onFederationChanged={(fed) => setCurrentFed(fed)}
      />
    </div>
  );
}
