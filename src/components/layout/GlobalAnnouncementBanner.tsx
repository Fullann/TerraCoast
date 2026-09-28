import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ArrowRight, Sparkles, AlertCircle, Info, CheckCircle, Flame } from 'lucide-react';
import {
  getSiteConfig,
  isAnnouncementDismissed,
  dismissAnnouncement,
  type SiteConfig,
  type AnnouncementVariant,
} from '../../lib/siteConfigManager';

export function GlobalAnnouncementBanner() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<SiteConfig>(() => getSiteConfig());
  const [dismissed, setDismissed] = useState<boolean>(() =>
    isAnnouncementDismissed(getSiteConfig().announcement.id)
  );

  useEffect(() => {
    const handleConfigChange = (e: Event) => {
      const customEvent = e as CustomEvent<SiteConfig>;
      const newConfig = customEvent.detail || getSiteConfig();
      setConfig(newConfig);
      setDismissed(isAnnouncementDismissed(newConfig.announcement.id));
    };

    const handleDismissed = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail === config.announcement.id) {
        setDismissed(true);
      }
    };

    window.addEventListener('terracost_site_config_updated', handleConfigChange);
    window.addEventListener('terracost_announcement_dismissed', handleDismissed);
    return () => {
      window.removeEventListener('terracost_site_config_updated', handleConfigChange);
      window.removeEventListener('terracost_announcement_dismissed', handleDismissed);
    };
  }, [config.announcement.id]);

  const announcement = config.announcement;

  if (!announcement.enabled || dismissed || !announcement.message.trim()) {
    return null;
  }

  const handleDismiss = () => {
    dismissAnnouncement(announcement.id);
    setDismissed(true);
  };

  const handleAction = () => {
    if (announcement.actionUrl) {
      if (announcement.actionUrl.startsWith('http')) {
        window.open(announcement.actionUrl, '_blank');
      } else {
        navigate(announcement.actionUrl);
      }
    }
  };

  // Color schemes for each variant
  const variantStyles: Record<
    AnnouncementVariant,
    { bg: string; badge: string; icon: React.ReactNode; text: string }
  > = {
    celebration: {
      bg: 'bg-gradient-to-r from-violet-600 via-fuchsia-600 to-amber-500 text-white',
      badge: 'bg-white/20 text-white border border-white/30 backdrop-blur-sm',
      icon: <Sparkles className="w-4 h-4 text-amber-300 shrink-0 animate-pulse" />,
      text: 'text-white',
    },
    success: {
      bg: 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white',
      badge: 'bg-white/20 text-white border border-white/30 backdrop-blur-sm',
      icon: <CheckCircle className="w-4 h-4 text-emerald-200 shrink-0" />,
      text: 'text-white',
    },
    info: {
      bg: 'bg-gradient-to-r from-sky-600 to-indigo-700 text-white',
      badge: 'bg-white/20 text-white border border-white/30 backdrop-blur-sm',
      icon: <Info className="w-4 h-4 text-sky-200 shrink-0" />,
      text: 'text-white',
    },
    warning: {
      bg: 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-900',
      badge: 'bg-slate-900/15 text-slate-950 border border-slate-900/20 font-black',
      icon: <Flame className="w-4 h-4 text-orange-950 shrink-0" />,
      text: 'text-slate-950 font-semibold',
    },
    alert: {
      bg: 'bg-gradient-to-r from-rose-600 to-red-700 text-white',
      badge: 'bg-white/20 text-white border border-white/30',
      icon: <AlertCircle className="w-4 h-4 text-rose-200 shrink-0" />,
      text: 'text-white',
    },
  };

  const style = variantStyles[announcement.variant] || variantStyles.info;

  return (
    <div
      role="banner"
      className={`relative z-40 w-full px-4 py-2.5 transition-all shadow-sm ${style.bg}`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {style.icon}
          {announcement.badgeText && (
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-black tracking-wide uppercase shrink-0 ${style.badge}`}
            >
              {announcement.badgeText}
            </span>
          )}
          <p className={`truncate sm:whitespace-normal font-medium ${style.text}`}>
            {announcement.message}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {announcement.actionText && announcement.actionUrl && (
            <button
              onClick={handleAction}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold bg-white text-slate-900 hover:bg-slate-100 transition-all shadow-sm active:scale-95"
            >
              <span>{announcement.actionText}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {announcement.dismissible && (
            <button
              onClick={handleDismiss}
              aria-label="Fermer l'annonce"
              className="p-1 rounded-lg hover:bg-black/10 active:scale-95 transition-colors opacity-80 hover:opacity-100"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
