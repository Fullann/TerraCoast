import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, Wifi, X } from "lucide-react";
import { useNetworkStatus } from "../../hooks/useNetworkStatus";
import { useLanguage } from "../../contexts/LanguageContext";

export const OfflineIndicator: React.FC = () => {
  const { isOnline, wasOffline } = useNetworkStatus();
  const { t } = useLanguage();
  const [isDismissed, setIsDismissed] = useState(false);

  // Reset dismissal when network drops again
  useEffect(() => {
    if (!isOnline) {
      setIsDismissed(false);
    }
  }, [isOnline]);

  const showOffline = !isOnline && !isDismissed;
  const showReconnected = isOnline && wasOffline;

  return (
    <AnimatePresence>
      {showOffline && (
        <motion.div
          key="offline-banner"
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ duration: 0.3 }}
          role="alert"
          aria-live="assertive"
          className="fixed top-3 inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-[10000] max-w-lg shadow-2xl rounded-2xl bg-gradient-to-r from-red-900/90 via-amber-900/90 to-red-950/90 backdrop-blur-md border border-red-500/40 text-white p-3.5 flex items-start gap-3"
        >
          <div className="p-2 rounded-xl bg-red-500/20 text-red-300 shrink-0 mt-0.5">
            <WifiOff className="w-5 h-5 animate-pulse" aria-hidden="true" />
          </div>

          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-ping shrink-0" aria-hidden="true" />
              <h4 className="text-sm font-bold text-red-100 tracking-wide">
                {t("offline.title")}
              </h4>
            </div>
            <p className="text-xs text-red-200/90 mt-1 leading-relaxed">
              {t("offline.banner")}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            aria-label={t("common.close")}
            title={t("common.close")}
            className="p-1 rounded-lg text-red-300 hover:text-white hover:bg-red-500/20 transition-colors shrink-0"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </motion.div>
      )}

      {showReconnected && (
        <motion.div
          key="reconnected-banner"
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ duration: 0.3 }}
          role="status"
          aria-live="polite"
          className="fixed top-3 inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-[10000] max-w-md shadow-2xl rounded-2xl bg-gradient-to-r from-emerald-900/90 via-teal-900/90 to-emerald-950/90 backdrop-blur-md border border-emerald-500/40 text-white p-3.5 flex items-center gap-3"
        >
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 shrink-0">
            <Wifi className="w-5 h-5" aria-hidden="true" />
          </div>
          <p className="text-sm font-semibold text-emerald-100 flex-1">
            {t("offline.reconnected")}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
