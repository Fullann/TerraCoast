import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { Target, X } from "lucide-react";
import type { Database } from "../../lib/database.types";
import { Avatar } from "../common/Avatar";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface ChallengeFriendModalProps {
  quizId: string;
  quizTitle: string;
  targetScore: number; // 0-100
  onClose: () => void;
}

export function ChallengeFriendModal({
  quizId,
  quizTitle,
  targetScore,
  onClose,
}: ChallengeFriendModalProps) {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [friends, setFriends] = useState<Profile[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const selectedSet = useMemo(() => new Set(selectedFriends), [selectedFriends]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadFriends();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const subtitle = useMemo(() => {
    const clamped = Math.max(0, Math.min(100, Math.round(targetScore)));
    return t("challenge.subtitle")
      .replace("{title}", quizTitle)
      .replace("{score}", String(clamped));
  }, [quizTitle, t, targetScore]);

  const loadFriends = async () => {
    if (!profile) return;

    const { data: friendshipsAsSender } = await supabase
      .from("friendships")
      .select("friend_profile:profiles!friendships_friend_id_fkey(*)")
      .eq("user_id", profile.id)
      .eq("status", "accepted")
      .eq("friend_profile.is_banned", false);

    const { data: friendshipsAsReceiver } = await supabase
      .from("friendships")
      .select("user_profile:profiles!friendships_user_id_fkey(*)")
      .eq("friend_id", profile.id)
      .eq("status", "accepted")
      .eq("user_profile.is_banned", false);

    const allFriends: Profile[] = [
      ...(friendshipsAsSender
        ?.map((f: any) => f.friend_profile)
        .filter(Boolean) || []),
      ...(friendshipsAsReceiver
        ?.map((f: any) => f.user_profile)
        .filter(Boolean) || []),
    ];

    const uniqueFriends = Array.from(
      new Map(allFriends.map((friend) => [friend.id, friend])).values()
    ).sort((a, b) => a.pseudo.localeCompare(b.pseudo));

    setFriends(uniqueFriends);
  };

  const toggleFriend = (friendId: string) => {
    if (selectedSet.has(friendId)) {
      setSelectedFriends((prev) => prev.filter((id) => id !== friendId));
    } else {
      setSelectedFriends((prev) => [...prev, friendId]);
    }
  };

  const sendChallenge = async () => {
    if (!profile || selectedFriends.length === 0) return;

    setLoading(true);
    setErrorMessage("");

    try {
      const rows = selectedFriends.map((friendId) => ({
        from_user_id: profile.id,
        to_user_id: friendId,
        quiz_id: quizId,
        target_score: Math.max(0, Math.min(100, Math.round(targetScore))),
        status: "pending",
      }));

      const { error } = await supabase.from("quiz_score_challenges").insert(rows);
      if (error) {
        setErrorMessage(t("challenge.error"));
        return;
      }

      setSuccess(true);
      setTimeout(() => onClose(), 1400);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <Target className="w-6 h-6 mr-2 text-emerald-600" />
            {t("challenge.title")}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              {t("challenge.success")}
            </h3>
            <p className="text-gray-600">{t("challenge.successMessage")}</p>
          </div>
        ) : (
          <>
            <p className="text-gray-600 mb-4">{subtitle}</p>

            {friends.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">{t("friends.noFriends")}</p>
              </div>
            ) : (
              <>
                {errorMessage && (
                  <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {errorMessage}
                  </div>
                )}
                <div className="max-h-64 overflow-y-auto mb-6 space-y-2">
                  {friends.map((friend) => (
                    <button
                      key={friend.id}
                      onClick={() => toggleFriend(friend.id)}
                      className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                        selectedSet.has(friend.id)
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-gray-200 hover:border-emerald-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar
                            url={friend.avatar_url}
                            pseudo={friend.pseudo}
                            frameStyle={friend.frame_style}
                            size="sm"
                          />
                          <div>
                            <p className="font-semibold text-gray-800">
                              {friend.pseudo}
                            </p>
                            <p className="text-sm text-gray-600">
                              {t("profile.level")} {friend.level}
                            </p>
                          </div>
                        </div>
                        {selectedSet.has(friend.id) && (
                          <div className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm">✓</span>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    {t("common.cancel")}
                  </button>
                  <button
                    onClick={sendChallenge}
                    disabled={selectedFriends.length === 0 || loading}
                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading
                      ? t("common.loading")
                      : `${t("challenge.send")} (${selectedFriends.length})`}
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

