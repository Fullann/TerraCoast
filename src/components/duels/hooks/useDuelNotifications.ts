import { useCallback } from "react";

interface UseDuelNotificationsParams {
  showDuelNotification: (notification: {
    type: "found";
    from: string;
    quizTitle: string;
  }) => void;
}

export function useDuelNotifications({
  showDuelNotification,
}: UseDuelNotificationsParams) {
  const notifyMatchFound = useCallback(
    (from: string, quizTitle: string) => {
      showDuelNotification({
        type: "found",
        from,
        quizTitle,
      });
    },
    [showDuelNotification]
  );

  return {
    notifyMatchFound,
  };
}
