import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useNotifications } from "../../contexts/NotificationContext";
import {
  Send,
  ArrowLeft,
  MessageCircle,
} from "lucide-react";
import type { Database } from "../../lib/database.types";
import { Avatar } from "../common/Avatar";
import { fetchUserFriends } from "../../lib/queries/friendQueries";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type ChatMessage = Database["public"]["Tables"]["chat_messages"]["Row"];

interface MessageWithUser extends ChatMessage {
  from_profile: Profile | null;
}

export interface ChatPageProps {
  friendId?: string;
  onNavigate?: (view: string) => void;
}

export function ChatPage({ friendId: propFriendId }: ChatPageProps = {}) {
  const navigate = useNavigate();
  const params = useParams<{ friendId?: string }>();
  const friendId = propFriendId || params.friendId;
  const { profile } = useAuth();
  const { t } = useLanguage();
  const { refreshNotifications } = useNotifications();
  const [friends, setFriends] = useState<Profile[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<Profile | null>(null);
  const selectedFriendRef = useRef<Profile | null>(null);
  const [messages, setMessages] = useState<MessageWithUser[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    selectedFriendRef.current = selectedFriend;
  }, [selectedFriend]);

  useEffect(() => {
    loadFriends();

    if (!profile) return;

    const allMessagesSubscription = supabase
      .channel(`all_messages_notifications_${profile.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `to_user_id=eq.${profile.id}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          if (selectedFriendRef.current?.id !== newMsg.from_user_id) {
            setUnreadCounts((prev) => ({
              ...prev,
              [newMsg.from_user_id]: (prev[newMsg.from_user_id] || 0) + 1,
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(allMessagesSubscription);
    };
  }, [profile?.id]);

  useEffect(() => {
    if (friendId) {
      const friend = friends.find((f) => f.id === friendId);
      if (friend) setSelectedFriend(friend);
    }
  }, [friendId, friends]);

  useEffect(() => {
    if (selectedFriend && profile) {
      loadMessages();
      markMessagesAsRead();

      const subscription = supabase
        .channel(`chat_${profile.id}_${selectedFriend.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "chat_messages",
          },
          (payload) => {
            const newMsg = payload.new as ChatMessage;
            if (
              (newMsg.from_user_id === selectedFriend.id &&
                newMsg.to_user_id === profile.id) ||
              (newMsg.from_user_id === profile.id &&
                newMsg.to_user_id === selectedFriend.id)
            ) {
              setMessages((prev) => {
                if (prev.some((m) => m.id === newMsg.id)) return prev;
                return [
                  ...prev,
                  {
                    ...newMsg,
                    from_profile:
                      newMsg.from_user_id === profile.id
                        ? profile
                        : selectedFriend,
                  },
                ];
              });
              if (newMsg.from_user_id === selectedFriend.id) {
                markMessagesAsRead();
              }
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [selectedFriend?.id, profile?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadFriends = async () => {
    if (!profile) return;

    const allFriends = await fetchUserFriends(profile.id);
    setFriends(allFriends);

    const { data: unreadData } = await supabase
      .from("chat_messages")
      .select("from_user_id")
      .eq("to_user_id", profile.id)
      .eq("is_read", false);

    const counts: Record<string, number> = {};
    (unreadData || []).forEach((msg) => {
      counts[msg.from_user_id] = (counts[msg.from_user_id] || 0) + 1;
    });
    setUnreadCounts(counts);
  };

  const loadMessages = async () => {
    if (!profile || !selectedFriend) return;

    const { data } = await supabase
      .from("chat_messages")
      .select("*, from_profile:profiles!chat_messages_from_user_id_fkey(*)")
      .or(
        `and(from_user_id.eq.${profile.id},to_user_id.eq.${selectedFriend.id}),and(from_user_id.eq.${selectedFriend.id},to_user_id.eq.${profile.id})`
      )
      .order("created_at", { ascending: true });

    if (data) {
      setMessages(data as MessageWithUser[]);
    }
  };

  const markMessagesAsRead = async () => {
    if (!profile || !selectedFriend) return;

    await supabase
      .from("chat_messages")
      .update({ is_read: true })
      .eq("to_user_id", profile.id)
      .eq("from_user_id", selectedFriend.id)
      .eq("is_read", false);

    setUnreadCounts((prev) => ({ ...prev, [selectedFriend.id]: 0 }));
    refreshNotifications();
  };

  const sendMessage = async () => {
    if (!profile || !selectedFriend || !newMessage.trim()) return;

    setLoading(true);

    try {
      await supabase.from("chat_messages").insert({
        from_user_id: profile.id,
        to_user_id: selectedFriend.id,
        message: newMessage.trim(),
      });

      setNewMessage("");
      loadMessages();
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
      {/* Top Navigation */}
      <div className="mb-5 flex items-center justify-between">
        <button
          onClick={() => navigate("/friends")}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-black border-2 border-slate-200 border-b-4 active:translate-y-0.5 shadow-2xs transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-600" />
          <span>{t("chat.backToFriends") || "Retour aux amis"}</span>
        </button>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-black uppercase tracking-wider font-mono">
          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
          <span>Messagerie Instantanée</span>
        </div>
      </div>

      <div
        className="bg-white rounded-3xl border-2 border-slate-200 border-b-4 shadow-sm overflow-hidden"
        style={{ height: "72vh" }}
      >
        <div className="flex h-full flex-col sm:flex-row">
          {/* Liste des amis à gauche */}
          <div className="w-full sm:w-80 border-b sm:border-b-0 sm:border-r-2 border-slate-200 overflow-y-auto bg-slate-50/50">
            <div className="p-4 border-b-2 border-slate-200 bg-white sticky top-0 z-10 flex items-center justify-between">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-emerald-600" />
                <span>{t("chat.messages") || "Conversations"}</span>
              </h2>
              <span className="text-xs font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                {friends.length}
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {friends.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-3xl mb-2">💬</div>
                  <p className="text-slate-500 font-bold text-xs">{t("chat.noFriends") || "Aucun ami pour le moment."}</p>
                  <button
                    onClick={() => navigate("/friends")}
                    className="mt-3 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs transition"
                  >
                    Ajouter des amis
                  </button>
                </div>
              ) : (
                friends.map((friend) => (
                  <button
                    key={friend.id}
                    onClick={() => {
                      setSelectedFriend(friend);
                      navigate(`/chat/${friend.id}`, { replace: true });
                    }}
                    className={`w-full p-3.5 text-left transition-all relative flex items-center gap-3 ${
                      selectedFriend?.id === friend.id
                        ? "bg-emerald-50/80 border-l-4 border-emerald-600 text-emerald-950"
                        : "hover:bg-slate-100/70 text-slate-800"
                    }`}
                  >
                    <div className="relative shrink-0">
                      <Avatar
                        url={(friend as any).avatar_url}
                        pseudo={friend.pseudo}
                        frameStyle={(friend as any).frame_style}
                        size="md"
                      />
                      {unreadCounts[friend.id] > 0 && (
                        <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-black animate-pulse shadow-xs">
                          {unreadCounts[friend.id]}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-black text-sm text-slate-900 truncate">
                          {friend.pseudo || t("chat.user")}
                        </p>
                      </div>
                      <p className="text-xs text-slate-500 font-bold">
                        {t("profile.level")} {friend.level || 1}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Panneau de discussion à droite */}
          <div className="flex-1 flex flex-col bg-slate-50/40">
            {selectedFriend ? (
              <>
                <div className="p-3.5 sm:p-4 border-b-2 border-slate-200 bg-white flex items-center justify-between gap-3 shadow-2xs">
                  <div
                    className="flex items-center gap-3 cursor-pointer group"
                    onClick={() => navigate(`/profile/${selectedFriend.id}`)}
                  >
                    <Avatar
                      url={(selectedFriend as any).avatar_url}
                      pseudo={selectedFriend.pseudo}
                      frameStyle={(selectedFriend as any).frame_style}
                      size="sm"
                    />
                    <div>
                      <h3 className="font-black text-sm text-slate-900 group-hover:text-emerald-600 transition-colors">
                        {selectedFriend.pseudo || t("chat.user")}
                      </h3>
                      <p className="text-[11px] text-slate-500 font-semibold">
                        {t("profile.level")} {selectedFriend.level || 1} • Cliquez pour voir le profil
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/profile/${selectedFriend.id}`)}
                    className="text-xs font-black px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                  >
                    Profil
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-slate-50/50">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <span className="text-4xl mb-2">👋</span>
                      <p className="text-slate-700 font-black text-sm">{t("chat.noMessages") || "Aucun message pour le moment."}</p>
                      <p className="text-slate-400 text-xs font-medium mt-1">Dites bonjour à votre ami pour démarrer la discussion !</p>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isOwnMessage = message.from_user_id === profile?.id;
                      const senderName =
                        message.from_profile?.pseudo || t("chat.deletedUser");

                      return (
                        <div
                          key={message.id}
                          className={`flex ${
                            isOwnMessage ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl shadow-2xs ${
                              isOwnMessage
                                ? "bg-emerald-600 text-white rounded-tr-xs border-b-2 border-emerald-700 font-medium"
                                : "bg-white border-2 border-slate-200 text-slate-800 rounded-tl-xs font-medium"
                            }`}
                          >
                            {!isOwnMessage && (
                              <p className="text-[11px] font-black mb-0.5 text-emerald-700">
                                {senderName}
                              </p>
                            )}
                            <p className="break-words text-sm leading-relaxed">{message.message}</p>
                            <p
                              className={`text-[10px] mt-1 text-right font-bold ${
                                isOwnMessage
                                  ? "text-emerald-100"
                                  : "text-slate-400"
                              }`}
                            >
                              {new Date(message.created_at).toLocaleTimeString(
                                undefined,
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-3 sm:p-4 border-t-2 border-slate-200 bg-white">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      sendMessage();
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={t("chat.typeMessage") || "Écrivez votre message..."}
                      className="flex-1 px-4 py-2.5 bg-slate-50 border-2 border-slate-200 border-b-4 focus:border-emerald-500 focus:bg-white rounded-2xl outline-none font-bold text-slate-800 text-sm transition-all focus:ring-4 focus:ring-emerald-100"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || loading}
                      className="btn-duo btn-duo-green px-5 py-2.5 text-sm font-black flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                    >
                      <Send className="w-4 h-4" />
                      <span className="hidden sm:inline">Envoyer</span>
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-8 text-center bg-slate-50/50">
                <div className="max-w-sm">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 border-2 border-emerald-200 border-b-4 flex items-center justify-center text-2xl mx-auto mb-3 shadow-xs">
                    💬
                  </div>
                  <h3 className="font-black text-slate-900 text-base mb-1">Vos messages privés</h3>
                  <p className="text-slate-500 text-xs font-semibold leading-relaxed">
                    {t("chat.selectFriend") || "Sélectionnez un ami dans la liste à gauche pour démarrer ou poursuivre votre conversation."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
