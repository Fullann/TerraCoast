import { useState, useEffect, useRef } from "react";

export interface NetworkStatus {
  isOnline: boolean;
  wasOffline: boolean;
}

/**
 * Hook detecting online / offline network connectivity status.
 * Flags `wasOffline` briefly upon reconnection so that a reassurance banner/toast can appear.
 */
export function useNetworkStatus(reconnectToastDurationMs = 4000): NetworkStatus {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== "undefined" ? navigator.onLine : true;
  });
  const [wasOffline, setWasOffline] = useState<boolean>(false);
  const previouslyOfflineRef = useRef<boolean>(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (previouslyOfflineRef.current) {
        setWasOffline(true);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          setWasOffline(false);
          previouslyOfflineRef.current = false;
        }, reconnectToastDurationMs);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      previouslyOfflineRef.current = true;
      setWasOffline(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [reconnectToastDurationMs]);

  return { isOnline, wasOffline };
}
