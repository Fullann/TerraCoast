import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { Avatar } from "../common/Avatar";
import { useNotifications } from "../../contexts/NotificationContext";
import { ConfirmModal } from "../common/ConfirmModal";
import {
  Users,
  UserPlus,
  UserCheck,
  X,
  MessageCircle,
  UserMinus,
  Sparkles,
} from "lucide-react";
import type { Database } from "../../lib/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Friendship = Database["public"]["Tables"]["friendships"]["Row"];
type QuizScoreChallenge =
  Database["public"]["Tables"]["quiz_score_challenges"]["Row"] & {
    quizzes?: { title: string | null };
    from_profile?: { pseudo: string | null; avatar_url?: string | null; frame_style?: string | null } | null;
  };

interface FriendData extends Friendship {
  friend_profile?: Profile;
  user_profile?: Profile;
}

export interface FriendsPageProps {
  onNavigate?: (view: string, data?: any) => void;
}

export function FriendsPage({ onNavigate: _onNavigate }: FriendsPageProps = {}) {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { t } = useLanguage();
  const { showAppNotification } = useNotifications();
  const [friends, setFriends] = useState<FriendData[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendData[]>([]);
  const [pendingChallenges, setPendingChallenges] = useState<
    QuizScoreChallenge[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [suggestions, setSuggestions] = useState<Profile[]>([]);
  const [existingFriendIds, setExistingFriendIds] = useState<Set<string>>(
    new Set()
  );
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: (() => void) | null;
  }>({ open: false, title: "", message: "", onConfirm: null });

  useEffect(() => {
    loadFriends();
    loadSuggestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  useEffect(() => {
    loadChallenges();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  const loadFriends = async () => {
    if (!profile) return;

    const { data: friendshipsAsSender } = await supabase
      .from("friendships")
      .select("*, friend_profile:profiles!friendships_friend_id_fkey(*)")
      .eq("user_id", profile.id)
      .eq("status", "accepted");

    const { data: friendshipsAsReceiver } = await supabase
      .from("friendships")
      .select("*, user_profile:profiles!friendships_user_id_fkey(*)")
      .eq("friend_id", profile.id)
      .eq("status", "accepted");

    const validFriendsAsSender = (friendshipsAsSender || []).filter(
      (f) => !f.friend_profile?.is_banned
    ) as FriendData[];

    const validFriendsAsReceiver = (friendshipsAsReceiver || []).filter(
      (f) => !f.user_profile?.is_banned
    ) as FriendData[];

    const allFriends = [...validFriendsAsSender, ...validFriendsAsReceiver];

    setFriends(allFriends);

    const { data: pending } = await supabase
      .from("friendships")
      .select("*, user_profile:profiles!friendships_user_id_fkey(*)")
      .eq("friend_id", profile.id)
      .eq("status", "pending");

    const validPending = (pending || []).filter(
      (p) => !p.user_profile?.is_banned
    ) as FriendData[];

    setPendingRequests(validPending);

    const friendIds = new Set<string>();
    allFriends.forEach((f) => {
      if (f.friend_profile) friendIds.add(f.friend_profile.id);
      if (f.user_profile) friendIds.add(f.user_profile.id);
    });
    validPending.forEach((p) => {
      if (p.user_profile) friendIds.add(p.user_profile.id);
    });
    setExistingFriendIds(friendIds);
  };

  const loadSuggestions = async () => {
    if (!profile) return;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .neq("id", profile.id)
      .eq("is_banned", false)
      .limit(50);

    if (data) {
      const shuffled = (data as Profile[]).sort(() => Math.random() - 0.5).slice(0, 4);
      setSuggestions(shuffled);
    }
  };

  const loadChallenges = async () => {
    if (!profile) return;
    const { data, error } = await supabase
      .from("quiz_score_challenges")
      .select(
        "*, quizzes(title), from_profile:profiles!quiz_score_challenges_from_user_id_fkey(pseudo,avatar_url,frame_style)"
      )
      .eq("to_user_id", profile.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) {
      console.error("Failed to load challenges:", error);
      return;
    }
    setPendingChallenges((data as any) || []);
  };

  const acceptChallenge = async (challenge: QuizScoreChallenge) => {
    if (!profile) return;
    await supabase
      .from("quiz_score_challenges")
      .update({ status: "accepted", accepted_at: new Date().toISOString() })
      .eq("id", challenge.id)
      .eq("to_user_id", profile.id);
    await loadChallenges();
    navigate(`/quizzes/play/${challenge.quiz_id}?challengeId=${challenge.id}`);
  };

  const declineChallenge = async (challenge: QuizScoreChallenge) => {
    if (!profile) return;
    await supabase
      .from("quiz_score_challenges")
      .update({ status: "declined" })
      .eq("id", challenge.id)
      .eq("to_user_id", profile.id);
    await loadChallenges();
  };

  const searchUsers = async () => {
    if (!searchTerm.trim() || !profile) return;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .ilike("pseudo", `%${searchTerm}%`)
      .neq("id", profile.id)
      .eq("is_banned", false)
      .limit(10);

    const filtered = (data || []).filter((u) => !existingFriendIds.has(u.id));
    setSearchResults(filtered);
  };

  const sendFriendRequest = async (friendId: string) => {
    if (!profile) return;

    try {
      await supabase.from("friendships").insert({
        user_id: profile.id,
        friend_id: friendId,
        status: "pending",
      });

      showAppNotification({ type: "success", message: t("friends.requestSent") });
      setSearchResults([]);
      setSearchTerm("");
    } catch (error) {
      console.error("Error sending friend request:", error);
    }
  };

  const acceptFriendRequest = async (friendshipId: string) => {
    await supabase
      .from("friendships")
      .update({ status: "accepted", accepted_at: new Date().toISOString() })
      .eq("id", friendshipId);

    loadFriends();
  };

  const rejectFriendRequest = async (friendshipId: string) => {
    await supabase.from("friendships").delete().eq("id", friendshipId);

    loadFriends();
  };

  const removeFriend = async (friendshipId: string, friendName: string) => {
    setConfirmState({
      open: true,
      title: t("common.confirm"),
      message: t("friends.confirmRemove").replace("{name}", friendName),
      onConfirm: async () => {
        await supabase.from("friendships").delete().eq("id", friendshipId);
        setConfirmState({ open: false, title: "", message: "", onConfirm: null });
        loadFriends();
        loadSuggestions();
      },
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
      {confirmState.open && (
        <ConfirmModal
          title={confirmState.title}
          message={confirmState.message}
          confirmText={t("common.confirm")}
          cancelText={t("common.cancel")}
          onConfirm={() => confirmState.onConfirm?.()}
          onCancel={() =>
            setConfirmState({ open: false, title: "", message: "", onConfirm: null })
          }
        />
      )}

      {/* Header Duolingo */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-black uppercase tracking-wider mb-2 font-mono">
          <Users className="w-3.5 h-3.5 text-emerald-600" />
          <span>Communauté & Réseau</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <span>{t("friends.title")}</span>
          <span>👥</span>
        </h1>
        <p className="text-slate-600 text-sm sm:text-base font-medium mt-1">
          {t("friends.subtitle")}
        </p>
      </div>

      {/* Défis en attente */}
      {pendingChallenges.length > 0 && (
        <div className="card-duo p-5 sm:p-6 mb-8 bg-gradient-to-br from-emerald-50/80 to-teal-50/80 border-2 border-emerald-200 border-b-4 border-emerald-400">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-emerald-950 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <span>{t("challenge.title")}</span>
              <span className="text-xs bg-emerald-600 text-white font-black px-2 py-0.5 rounded-full">
                {pendingChallenges.length}
              </span>
            </h2>
          </div>
          <div className="space-y-3">
            {pendingChallenges.map((ch) => (
              <div
                key={ch.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border-2 border-emerald-200 shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    url={ch.from_profile?.avatar_url}
                    pseudo={ch.from_profile?.pseudo || ""}
                    frameStyle={ch.from_profile?.frame_style}
                    size="md"
                  />
                  <div>
                    <p className="font-black text-sm text-slate-900">
                      {ch.from_profile?.pseudo || t("profile.user")}
                    </p>
                    <p className="text-xs text-slate-600 font-semibold">
                      {t("challenge.subtitle")
                        .replace("{title}", ch.quizzes?.title || "")
                        .replace("{score}", String(ch.target_score))}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 justify-end shrink-0">
                  <button
                    onClick={() => declineChallenge(ch)}
                    className="btn-duo btn-duo-white px-3.5 py-2 text-xs font-black text-slate-600"
                  >
                    {t("common.cancel")}
                  </button>
                  <button
                    onClick={() => acceptChallenge(ch)}
                    className="btn-duo btn-duo-green px-4 py-2 text-xs font-black"
                  >
                    {t("common.play")} ⚔️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Demandes d'amis en attente */}
      {pendingRequests.length > 0 && (
        <div className="card-duo p-5 sm:p-6 mb-8 bg-gradient-to-br from-amber-50/80 to-orange-50/80 border-2 border-amber-300 border-b-4 border-amber-400">
          <h2 className="text-lg font-black text-amber-950 mb-4 flex items-center gap-2">
            <span>{t("friends.pendingRequests")}</span>
            <span className="text-xs bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-full">
              {pendingRequests.length}
            </span>
          </h2>
          <div className="space-y-3">
            {pendingRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between bg-white p-3.5 sm:p-4 rounded-2xl border-2 border-amber-200 shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    url={request.user_profile?.avatar_url}
                    pseudo={request.user_profile?.pseudo}
                    frameStyle={request.user_profile?.frame_style}
                    size="md"
                  />
                  <div>
                    <p className="font-black text-sm text-slate-900">
                      {request.user_profile?.pseudo}
                    </p>
                    <p className="text-xs text-slate-500 font-bold">
                      {t("profile.level")} {request.user_profile?.level}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => acceptFriendRequest(request.id)}
                    className="btn-duo btn-duo-green p-2 text-white font-black"
                    title={t("friends.accept")}
                  >
                    <UserCheck className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => rejectFriendRequest(request.id)}
                    className="btn-duo btn-duo-white p-2 text-rose-600 hover:text-rose-700 font-black border-rose-200"
                    title={t("friends.reject")}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Barre de Recherche d'amis Tactile */}
      <div className="card-duo p-5 sm:p-6 mb-8 bg-white shadow-sm">
        <h2 className="text-base sm:text-lg font-black text-slate-900 mb-3 flex items-center gap-2">
          <span>{t("friends.searchTitle")}</span>
          <span>🔍</span>
        </h2>
        <div className="flex gap-2.5">
          <input
            type="text"
            placeholder={t("friends.searchPlaceholder") || "Rechercher par pseudo..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchUsers()}
            className="flex-1 px-4 py-3 bg-slate-50 border-2 border-slate-200 border-b-4 focus:border-emerald-500 focus:bg-white rounded-2xl outline-none font-bold text-slate-800 text-sm transition-all focus:ring-4 focus:ring-emerald-100"
          />
          <button
            onClick={searchUsers}
            className="btn-duo btn-duo-green px-5 sm:px-6 py-3 text-xs sm:text-sm font-black shrink-0"
          >
            {t("common.search")}
          </button>
        </div>

        {searchResults.length > 0 && (
          <div className="mt-4 space-y-2 pt-3 border-t-2 border-slate-100">
            {searchResults.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between p-3 bg-slate-50 border-2 border-slate-200 rounded-2xl hover:border-emerald-300 transition-all"
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    url={u.avatar_url}
                    pseudo={u.pseudo}
                    frameStyle={u.frame_style}
                    size="sm"
                  />
                  <div>
                    <p className="font-black text-sm text-slate-900">{u.pseudo}</p>
                    <p className="text-xs text-slate-500 font-bold">
                      {t("profile.level")} {u.level}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => sendFriendRequest(u.id)}
                  className="btn-duo btn-duo-blue px-3.5 py-1.5 text-xs font-black flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{t("friends.add")}</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mes Amis */}
      <div className="card-duo p-5 sm:p-6 mb-8 bg-white shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <span>{t("friends.myFriendsTitle")}</span>
            <span className="text-xs bg-slate-100 text-slate-700 font-black px-2.5 py-0.5 rounded-full border border-slate-200">
              {friends.length}
            </span>
          </h2>
        </div>

        {friends.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 border-2 border-slate-200 border-b-4 flex items-center justify-center text-3xl mx-auto mb-3 shadow-2xs">
              👥
            </div>
            <p className="text-slate-800 font-black text-base">{t("friends.noFriends") || "Aucun ami ajouté pour l'instant"}</p>
            <p className="text-slate-500 text-xs font-semibold mt-1 max-w-sm mx-auto">
              Recherchez des amis avec la barre ci-dessus ou lancez des duels en ligne pour élargir votre réseau !
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {friends.map((friendship) => {
              const friendProfile =
                friendship.friend_profile || friendship.user_profile;
              if (!friendProfile) return null;

              return (
                <div
                  key={friendship.id}
                  className="flex items-center justify-between p-3.5 bg-slate-50/70 border-2 border-slate-200 border-b-4 hover:border-emerald-300 hover:bg-emerald-50/20 rounded-2xl transition-all shadow-2xs"
                >
                  <div
                    className="flex items-center gap-3 flex-1 cursor-pointer group min-w-0"
                    onClick={() => navigate(`/profile/${friendProfile.id}`)}
                  >
                    <Avatar
                      url={friendProfile.avatar_url}
                      pseudo={friendProfile.pseudo}
                      frameStyle={friendProfile.frame_style}
                      size="md"
                    />
                    <div className="min-w-0">
                      <p className="font-black text-sm text-slate-900 group-hover:text-emerald-600 transition-colors truncate">
                        {friendProfile.pseudo}
                      </p>
                      <p className="text-xs text-slate-500 font-bold">
                        {t("profile.level")} {friendProfile.level} • {friendProfile.experience_points || 0} XP
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => navigate(`/chat/${friendProfile.id}`)}
                      className="btn-duo btn-duo-green p-2 text-white"
                      title={t("friends.sendMessage")}
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        removeFriend(friendship.id, friendProfile.pseudo)
                      }
                      className="btn-duo btn-duo-white p-2 text-slate-400 hover:text-rose-600"
                      title={t("friends.removeFriend")}
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Suggestions d'explorateurs */}
      {suggestions.length > 0 && (
        <div className="card-duo p-5 sm:p-6 bg-gradient-to-r from-sky-50/70 via-indigo-50/60 to-emerald-50/70 border-2 border-sky-200 border-b-4 border-sky-300">
          <h2 className="text-base sm:text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <span>{t("friends.suggestions")}</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {suggestions
              .filter((s) => !existingFriendIds.has(s.id))
              .map((u) => (
                <div
                  key={u.id}
                  className="bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-2xs hover:border-sky-300 hover:shadow-sm transition-all text-center flex flex-col items-center justify-between"
                >
                  <div className="mb-2">
                    <Avatar
                      url={u.avatar_url}
                      pseudo={u.pseudo}
                      frameStyle={u.frame_style}
                      size="lg"
                    />
                  </div>
                  <div className="w-full">
                    <p className="font-black text-sm text-slate-900 truncate">
                      {u.pseudo}
                    </p>
                    <p className="text-[11px] text-slate-500 font-bold mb-3">
                      {t("profile.level")} {u.level}
                    </p>
                    <button
                      onClick={() => {
                        sendFriendRequest(u.id);
                        setSuggestions((prev) =>
                          prev.filter((item) => item.id !== u.id)
                        );
                      }}
                      className="btn-duo btn-duo-blue w-full py-2 text-xs font-black flex items-center justify-center gap-1"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>{t("friends.add")}</span>
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
