import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
  useCallback,
  useMemo,
} from "react";
import { supabase } from "../lib/supabase";
import type { Database } from "../lib/database.types";
import { useAuth } from "./AuthContext";

interface DuelNotification {
  type: "invitation" | "accepted" | "completed" | "found";
  from: string;
  quizTitle: string;
  result?: "won" | "lost" | "draw";
  onNavigate?: () => void;
}

interface MessageNotification {
  from: string;
  message: string;
}

interface FriendRequestNotification {
  from: string;
}

interface AppNotification {
  type: "success" | "error" | "info";
  message: string;
}

interface NotificationContextType {
  unreadMessages: number;
  pendingDuels: number;
  pendingDuelsToPlay: number;
  newDuelResults: number;
  pendingFriendRequests: number;
  duelNotification: DuelNotification | null;
  messageNotification: MessageNotification | null;
  friendRequestNotification: FriendRequestNotification | null;
  appNotification: AppNotification | null;
  clearDuelNotification: () => void;
  showDuelNotification: (notification: DuelNotification) => void;
  clearMessageNotification: () => void;
  clearFriendRequestNotification: () => void;
  showAppNotification: (notification: AppNotification) => void;
  clearAppNotification: () => void;
  refreshNotifications: () => Promise<void>;
  setNavigationCallback: (
    callback: (view: string, params?: Record<string, unknown>) => void
  ) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [pendingDuels, setPendingDuels] = useState(0);
  const [pendingFriendRequests, setPendingFriendRequests] = useState(0);
  const [duelNotification, setDuelNotification] =
    useState<DuelNotification | null>(null);
  const [messageNotification, setMessageNotification] =
    useState<MessageNotification | null>(null);
  const [friendRequestNotification, setFriendRequestNotification] =
    useState<FriendRequestNotification | null>(null);
  const [appNotification, setAppNotification] =
    useState<AppNotification | null>(null);
  const [pendingDuelsToPlay, setPendingDuelsToPlay] = useState(0);
  const [newDuelResults, setNewDuelResults] = useState(0);
  const navigationCallbackRef = useRef<
    ((view: string, params?: Record<string, unknown>) => void) | null
  >(null);

  const setNavigationCallback = useCallback(
    (callback: (view: string, params?: Record<string, unknown>) => void) => {
      navigationCallbackRef.current = callback;
    },
    []
  );

  const userId = profile?.id;

  const refreshNotifications = useCallback(async () => {
    if (!userId) return;

    const [
      { count: messagesCount },
      { count: duelsCount },
      { count: friendRequestsCount },
      { data: activeDuels },
      { data: completedDuels },
    ] = await Promise.all([
      supabase
        .from("chat_messages")
        .select("*", { count: "exact", head: true })
        .eq("to_user_id", userId)
        .eq("is_read", false),
      supabase
        .from("duel_invitations")
        .select("*", { count: "exact", head: true })
        .eq("to_user_id", userId)
        .eq("status", "pending"),
      supabase
        .from("friendships")
        .select("*", { count: "exact", head: true })
        .eq("friend_id", userId)
        .eq("status", "pending"),
      supabase
        .from("duels")
        .select("id, player1_session_id, player2_session_id, player1_id, player2_id")
        .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
        .in("status", ["pending", "in_progress"]),
      supabase
        .from("duels")
        .select("id, completed_at")
        .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(10),
    ]);

    setUnreadMessages(messagesCount || 0);
    setPendingDuels(duelsCount || 0);
    setPendingFriendRequests(friendRequestsCount || 0);

    if (activeDuels) {
      const toPlay = activeDuels.filter((duel) => {
        const isPlayer1 = duel.player1_id === userId;
        const hasPlayed = isPlayer1
          ? !!duel.player1_session_id
          : !!duel.player2_session_id;
        return !hasPlayed;
      }).length;
      setPendingDuelsToPlay(toPlay);
    }

    if (completedDuels) {
      const stored = localStorage.getItem("viewedDuels");
      const viewedDuels = stored ? new Set(JSON.parse(stored)) : new Set();

      const newResults = completedDuels.filter((duel) => {
        const completedAt = duel.completed_at
          ? new Date(duel.completed_at)
          : null;
        const isRecent =
          completedAt &&
          Date.now() - completedAt.getTime() < 24 * 60 * 60 * 1000;
        return isRecent && !viewedDuels.has(duel.id);
      }).length;

      setNewDuelResults(newResults);
    }
  }, [userId]);

  const clearDuelNotification = useCallback(() => setDuelNotification(null), []);
  const showDuelNotification = useCallback(
    (notification: DuelNotification) => setDuelNotification(notification),
    []
  );
  const clearMessageNotification = useCallback(
    () => setMessageNotification(null),
    []
  );
  const clearFriendRequestNotification = useCallback(
    () => setFriendRequestNotification(null),
    []
  );
  const showAppNotification = useCallback((notification: AppNotification) => {
    setTimeout(() => {
      setAppNotification(notification);
    }, 0);
  }, []);
  const clearAppNotification = useCallback(() => setAppNotification(null), []);

  useEffect(() => {
    if (!userId) return;
    refreshNotifications();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        refreshNotifications();
      }
    }, 60000);

    const handleDuelCompletedRealtime = async (payload: { new: unknown }) => {
      const completedDuel =
        payload.new as Database["public"]["Tables"]["duels"]["Row"];
      if (completedDuel.status !== "completed") return;

      const opponentId =
        completedDuel.player1_id === userId
          ? completedDuel.player2_id
          : completedDuel.player1_id;

      const [{ data: opponentRaw }, { data: quizRaw }] = await Promise.all([
        supabase
          .from("profiles")
          .select("pseudo")
          .eq("id", opponentId)
          .single(),
        supabase
          .from("quizzes")
          .select("title")
          .eq("id", completedDuel.quiz_id)
          .single(),
      ]);

      const opponent = opponentRaw as { pseudo: string } | null;
      const quiz = quizRaw as { title: string } | null;

      if (opponent && quiz) {
        let result: "won" | "lost" | "draw" = "draw";
        if (completedDuel.winner_id === userId) {
          result = "won";
        } else if (completedDuel.winner_id === opponentId) {
          result = "lost";
        }

        setDuelNotification({
          type: "completed",
          from: opponent.pseudo,
          quizTitle: quiz.title,
          result,
          onNavigate: () =>
            navigationCallbackRef.current?.("duels", { tab: "history" }),
        });
      }
    };

    const notificationChannel = supabase
      .channel(`user_notifications_${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `to_user_id=eq.${userId}`,
        },
        async (payload) => {
          const newMessage =
            payload.new as Database["public"]["Tables"]["chat_messages"]["Row"];

          const { data: fromUserRaw } = await supabase
            .from("profiles")
            .select("pseudo")
            .eq("id", newMessage.from_user_id)
            .single();
          const fromUser = fromUserRaw as { pseudo: string } | null;

          if (fromUser) {
            setMessageNotification({
              from: fromUser.pseudo,
              message: newMessage.message,
            });

            setUnreadMessages((prev) => prev + 1);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "friendships",
          filter: `friend_id=eq.${userId}`,
        },
        async (payload) => {
          const newRequest =
            payload.new as Database["public"]["Tables"]["friendships"]["Row"];

          const { data: fromUserRaw } = await supabase
            .from("profiles")
            .select("pseudo")
            .eq("id", newRequest.user_id)
            .single();
          const fromUser = fromUserRaw as { pseudo: string } | null;

          if (fromUser) {
            setFriendRequestNotification({
              from: fromUser.pseudo,
            });

            setPendingFriendRequests((prev) => prev + 1);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "duel_invitations",
          filter: `to_user_id=eq.${userId}`,
        },
        async (payload) => {
          const newInvitation =
            payload.new as Database["public"]["Tables"]["duel_invitations"]["Row"];

          const [{ data: fromUserRaw }, { data: quizRaw }] = await Promise.all([
            supabase
              .from("profiles")
              .select("pseudo")
              .eq("id", newInvitation.from_user_id)
              .single(),
            supabase
              .from("quizzes")
              .select("title")
              .eq("id", newInvitation.quiz_id)
              .single(),
          ]);
          const fromUser = fromUserRaw as { pseudo: string } | null;
          const quiz = quizRaw as { title: string } | null;

          if (fromUser && quiz) {
            setDuelNotification({
              type: "invitation",
              from: fromUser.pseudo,
              quizTitle: quiz.title,
              onNavigate: () =>
                navigationCallbackRef.current?.("duels", { tab: "invitations" }),
            });

            setPendingDuels((prev) => prev + 1);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "duel_invitations",
          filter: `from_user_id=eq.${userId}`,
        },
        async (payload) => {
          const updatedInvitation =
            payload.new as Database["public"]["Tables"]["duel_invitations"]["Row"];

          if (updatedInvitation.status === "accepted") {
            const [{ data: toUserRaw }, { data: quizRaw }] = await Promise.all([
              supabase
                .from("profiles")
                .select("pseudo")
                .eq("id", updatedInvitation.to_user_id)
                .single(),
              supabase
                .from("quizzes")
                .select("title")
                .eq("id", updatedInvitation.quiz_id)
                .single(),
            ]);
            const toUser = toUserRaw as { pseudo: string } | null;
            const quiz = quizRaw as { title: string } | null;

            if (toUser && quiz) {
              setDuelNotification({
                type: "accepted",
                from: toUser.pseudo,
                quizTitle: quiz.title,
              });
            }
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "duels",
          filter: `player1_id=eq.${userId}`,
        },
        handleDuelCompletedRealtime
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "duels",
          filter: `player2_id=eq.${userId}`,
        },
        handleDuelCompletedRealtime
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notificationChannel);
      clearInterval(interval);
    };
  }, [userId, refreshNotifications]);

  const value = useMemo(
    () => ({
      unreadMessages,
      pendingDuels,
      pendingFriendRequests,
      pendingDuelsToPlay,
      newDuelResults,
      duelNotification,
      messageNotification,
      friendRequestNotification,
      appNotification,
      clearDuelNotification,
      showDuelNotification,
      clearMessageNotification,
      clearFriendRequestNotification,
      showAppNotification,
      clearAppNotification,
      refreshNotifications,
      setNavigationCallback,
    }),
    [
      unreadMessages,
      pendingDuels,
      pendingFriendRequests,
      pendingDuelsToPlay,
      newDuelResults,
      duelNotification,
      messageNotification,
      friendRequestNotification,
      appNotification,
      clearDuelNotification,
      showDuelNotification,
      clearMessageNotification,
      clearFriendRequestNotification,
      showAppNotification,
      clearAppNotification,
      refreshNotifications,
      setNavigationCallback,
    ]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within NotificationProvider"
    );
  }
  return context;
}
