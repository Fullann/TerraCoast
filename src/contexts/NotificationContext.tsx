import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
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
  const [navigationCallback, setNavigationCallback] = useState<
    ((view: string, params?: Record<string, unknown>) => void) | null
  >(null);

  const refreshNotifications = async () => {
    if (!profile) return;

    const { count: messagesCount } = await supabase
      .from("chat_messages")
      .select("*", { count: "exact", head: true })
      .eq("to_user_id", profile.id)
      .eq("is_read", false);

    setUnreadMessages(messagesCount || 0);

    const { count: duelsCount } = await supabase
      .from("duel_invitations")
      .select("*", { count: "exact", head: true })
      .eq("to_user_id", profile.id)
      .eq("status", "pending");

    setPendingDuels(duelsCount || 0);

    const { count: friendRequestsCount } = await supabase
      .from("friendships")
      .select("*", { count: "exact", head: true })
      .eq("friend_id", profile.id)
      .eq("status", "pending");

    setPendingFriendRequests(friendRequestsCount || 0);
    const { data: activeDuels } = await supabase
      .from("duels")
      .select(
        "*, player1_session_id, player2_session_id, player1_id, player2_id"
      )
      .or(`player1_id.eq.${profile.id},player2_id.eq.${profile.id}`)
      .in("status", ["pending", "in_progress"]);

    if (activeDuels) {
      const typedActiveDuels =
        activeDuels as Database["public"]["Tables"]["duels"]["Row"][];
      const toPlay = typedActiveDuels.filter((duel) => {
        const isPlayer1 = duel.player1_id === profile.id;
        const hasPlayed = isPlayer1
          ? !!duel.player1_session_id
          : !!duel.player2_session_id;
        return !hasPlayed;
      }).length;
      setPendingDuelsToPlay(toPlay);
    }

    const { data: completedDuels } = await supabase
      .from("duels")
      .select("*")
      .or(`player1_id.eq.${profile.id},player2_id.eq.${profile.id}`)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(10);

    if (completedDuels) {
      const stored = localStorage.getItem("viewedDuels");
      const viewedDuels = stored ? new Set(JSON.parse(stored)) : new Set();
      const typedCompletedDuels =
        completedDuels as Database["public"]["Tables"]["duels"]["Row"][];

      const newResults = typedCompletedDuels.filter((duel) => {
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
  };

  const clearDuelNotification = () => setDuelNotification(null);
  const showDuelNotification = (notification: DuelNotification) =>
    setDuelNotification(notification);
  const clearMessageNotification = () => setMessageNotification(null);
  const clearFriendRequestNotification = () =>
    setFriendRequestNotification(null);
  const showAppNotification = (notification: AppNotification) =>
    setAppNotification(notification);
  const clearAppNotification = () => setAppNotification(null);

  useEffect(() => {
    if (!profile) return;
    refreshNotifications();
    const interval = setInterval(() => {
      refreshNotifications();
    }, 30000);

    const messagesSubscription = supabase
      .channel("notifications_messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `to_user_id=eq.${profile.id}`,
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
      .subscribe();

    const friendRequestsSubscription = supabase
      .channel("notifications_friend_requests")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "friendships",
          filter: `friend_id=eq.${profile.id}`,
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
      .subscribe();

    const duelInvitationsSubscription = supabase
      .channel("notifications_duel_invitations")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "duel_invitations",
          filter: `to_user_id=eq.${profile.id}`,
        },
        async (payload) => {
          const newInvitation =
            payload.new as Database["public"]["Tables"]["duel_invitations"]["Row"];

          const { data: fromUserRaw } = await supabase
            .from("profiles")
            .select("pseudo")
            .eq("id", newInvitation.from_user_id)
            .single();
          const fromUser = fromUserRaw as { pseudo: string } | null;

          const { data: quizRaw } = await supabase
            .from("quizzes")
            .select("title")
            .eq("id", newInvitation.quiz_id)
            .single();
          const quiz = quizRaw as { title: string } | null;

          if (fromUser && quiz) {
            setDuelNotification({
              type: "invitation",
              from: fromUser.pseudo,
              quizTitle: quiz.title,
               onNavigate: () => navigationCallback?.("duels", { tab: "invitations" }),
            });

            setPendingDuels((prev) => prev + 1);
          }
        }
      )
      .subscribe();

    const duelAcceptedSubscription = supabase
      .channel("notifications_duel_accepted")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "duel_invitations",
          filter: `from_user_id=eq.${profile.id}`,
        },
        async (payload) => {
          const updatedInvitation =
            payload.new as Database["public"]["Tables"]["duel_invitations"]["Row"];

          if (updatedInvitation.status === "accepted") {
            const { data: toUserRaw } = await supabase
              .from("profiles")
              .select("pseudo")
              .eq("id", updatedInvitation.to_user_id)
              .single();
            const toUser = toUserRaw as { pseudo: string } | null;

            const { data: quizRaw } = await supabase
              .from("quizzes")
              .select("title")
              .eq("id", updatedInvitation.quiz_id)
              .single();
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
      .subscribe();

    const duelsCompletedSubscription = supabase
      .channel("notifications_duels_completed")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "duels",
          filter: `status=eq.completed`,
        },
        async (payload) => {
          const completedDuel =
            payload.new as Database["public"]["Tables"]["duels"]["Row"];

          if (
            completedDuel.player1_id !== profile.id &&
            completedDuel.player2_id !== profile.id
          ) {
            return;
          }

          const opponentId =
            completedDuel.player1_id === profile.id
              ? completedDuel.player2_id
              : completedDuel.player1_id;

          const { data: opponentRaw } = await supabase
            .from("profiles")
            .select("pseudo")
            .eq("id", opponentId)
            .single();
          const opponent = opponentRaw as { pseudo: string } | null;

          const { data: quizRaw } = await supabase
            .from("quizzes")
            .select("title")
            .eq("id", completedDuel.quiz_id)
            .single();
          const quiz = quizRaw as { title: string } | null;

          if (opponent && quiz) {
            let result: "won" | "lost" | "draw" = "draw";
            if (completedDuel.winner_id === profile.id) {
              result = "won";
            } else if (completedDuel.winner_id === opponentId) {
              result = "lost";
            }

            setDuelNotification({
              type: "completed",
              from: opponent.pseudo,
              quizTitle: quiz.title,
              result,
               onNavigate: () => navigationCallback?.("duels", { tab: "history" }),
            });
          }
        }
      )
      .subscribe();

    return () => {
      messagesSubscription.unsubscribe();
      friendRequestsSubscription.unsubscribe();
      duelInvitationsSubscription.unsubscribe();
      duelAcceptedSubscription.unsubscribe();
      duelsCompletedSubscription.unsubscribe();
      clearInterval(interval);
    };
  }, [profile]);

  return (
    <NotificationContext.Provider
      value={{
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
        setNavigationCallback: (callback) => setNavigationCallback(() => callback),
      }}
    >
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
