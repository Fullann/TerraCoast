import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./supabase";

export interface DatabaseHealthResult {
  isHealthy: boolean;
  error?: string;
  status?: number;
}

export const DATABASE_STATUS_EVENT = "terracoast:database_status";

export interface DatabaseStatusEventDetail {
  isDown: boolean;
  reason?: string;
}

/**
 * Notifie l'ensemble de l'application que la base de données est inaccessible.
 */
export function notifyDatabaseDown(reason?: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent<DatabaseStatusEventDetail>(DATABASE_STATUS_EVENT, {
        detail: { isDown: true, reason },
      })
    );
  }
}

/**
 * Notifie l'ensemble de l'application que la base de données a été rétablie.
 */
export function notifyDatabaseRecovered() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent<DatabaseStatusEventDetail>(DATABASE_STATUS_EVENT, {
        detail: { isDown: false },
      })
    );
  }
}

/**
 * Teste la connectivité et la disponibilité de la base de données Supabase.
 * Utilise un AbortController avec timeout pour éviter tout blocage indéfini.
 */
export async function checkDatabaseHealth(timeoutMs: number = 3000): Promise<DatabaseHealthResult> {
  // Si le navigateur est formellement hors ligne dans un contexte client Web
  if (typeof window !== "undefined" && typeof navigator !== "undefined" && navigator.onLine === false) {
    return { isHealthy: true };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // Requête légère HEAD sur la table des quiz (présente dans toutes les versions)
    const response = await supabase
      .from("quizzes")
      .select("id", { count: "exact", head: true })
      .abortSignal(controller.signal);

    clearTimeout(timer);

    const status = response.status;
    const error = response.error;

    // Erreurs HTTP 5xx ou 0 = Service Down ou coupure réseau Supabase
    if (status === 0 || (status >= 500 && status < 600)) {
      const errMessage = error?.message || `Service de données indisponible (HTTP ${status})`;
      return {
        isHealthy: false,
        status,
        error: errMessage,
      };
    }

    if (error) {
      const msg = (error.message || "").toLowerCase();
      const code = error.code || "";

      // Détection des pannes PostgREST, projets Supabase mis en pause ou indisponibilité DB
      const isCriticalDbError =
        msg.includes("fetch failed") ||
        msg.includes("failed to fetch") ||
        msg.includes("network") ||
        msg.includes("connection refused") ||
        msg.includes("cannot connect") ||
        msg.includes("abort") ||
        msg.includes("timeout") ||
        msg.includes("paused") ||
        msg.includes("maintenance") ||
        msg.includes("unavailable") ||
        code === "PGRST000" ||
        code === "57P01" || // admin_shutdown
        code === "57P02" || // crash_shutdown
        code === "57P03";   // cannot_connect_now

      if (isCriticalDbError) {
        return {
          isHealthy: false,
          status,
          error: error.message,
        };
      }
    }

    return { isHealthy: true, status };
  } catch (err: any) {
    clearTimeout(timer);
    const isAbort = err?.name === "AbortError";
    const msg = isAbort
      ? "Délai de connexion à la base de données dépassé"
      : err?.message || "Impossible de joindre la base de données";

    return {
      isHealthy: false,
      error: msg,
    };
  }
}

/**
 * Hook React pour surveiller l'état de la base de données et s'auto-rétablir.
 */
export function useDatabaseStatus() {
  const [isDatabaseDown, setIsDatabaseDown] = useState(false);
  const [isInitialChecking, setIsInitialChecking] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const isCheckingRef = useRef(false);

  const checkNow = useCallback(async (): Promise<boolean> => {
    if (isCheckingRef.current) return false;
    isCheckingRef.current = true;
    setIsChecking(true);

    try {
      const result = await checkDatabaseHealth(3000);
      setLastChecked(new Date());

      if (!result.isHealthy) {
        setIsDatabaseDown(true);
        setErrorMessage(result.error || "Base de données inaccessible");
        return false;
      } else {
        setIsDatabaseDown((prev) => {
          if (prev) notifyDatabaseRecovered();
          return false;
        });
        setErrorMessage(null);
        return true;
      }
    } finally {
      setIsChecking(false);
      setIsInitialChecking(false);
      isCheckingRef.current = false;
    }
  }, []);

  // Écoute des événements système globaux
  useEffect(() => {
    const handleStatusEvent = (e: Event) => {
      const ce = e as CustomEvent<DatabaseStatusEventDetail>;
      if (ce.detail?.isDown) {
        setIsDatabaseDown(true);
        setIsInitialChecking(false);
        if (ce.detail.reason) {
          setErrorMessage(ce.detail.reason);
        }
      } else {
        setIsDatabaseDown(false);
        setErrorMessage(null);
      }
    };

    window.addEventListener(DATABASE_STATUS_EVENT, handleStatusEvent);
    return () => {
      window.removeEventListener(DATABASE_STATUS_EVENT, handleStatusEvent);
    };
  }, []);

  // Vérification initiale légère au montage
  useEffect(() => {
    void checkNow();
  }, [checkNow]);

  // Si la base est détectée comme étant tombée, relancer un check automatique périodique (toutes les 15 secondes)
  useEffect(() => {
    if (!isDatabaseDown) return;

    const interval = setInterval(() => {
      void checkNow();
    }, 15000);

    return () => clearInterval(interval);
  }, [isDatabaseDown, checkNow]);

  return {
    isDatabaseDown,
    isInitialChecking,
    isChecking,
    errorMessage,
    lastChecked,
    checkNow,
  };
}
