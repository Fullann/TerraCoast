import { useEffect, useState } from "react";
import { Shield, ToggleLeft, ToggleRight } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import type { Database } from "../../lib/database.types";

type DuelFeatureFlag =
  Database["public"]["Tables"]["duel_feature_flags"]["Row"];

const FEATURE_KEYS = [
  "anti_repeat",
  "progressive_expand",
  "show_opponent_mmr",
] as const;

export function DuelFeaturesPage() {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [flags, setFlags] = useState<DuelFeatureFlag[]>([]);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    loadFlags();
    logAdminEvent("open_duel_features_page", null, null, {});
  }, []);

  const logAdminEvent = async (
    action: string,
    entityType: string | null,
    entityId: string | null,
    details: Record<string, unknown>
  ) => {
    await supabase.rpc("log_admin_event", {
      p_action: action,
      p_entity_type: entityType,
      p_entity_id: entityId,
      p_details: details,
    });
  };

  const loadFlags = async () => {
    const { data } = await supabase
      .from("duel_feature_flags")
      .select("*")
      .in("feature_key", [...FEATURE_KEYS])
      .order("feature_key", { ascending: true });

    if (data) setFlags(data);
  };

  const toggleFlag = async (featureKey: string, enabled: boolean) => {
    setSavingKey(featureKey);
    const { error } = await supabase
      .from("duel_feature_flags")
      .update({
        enabled: !enabled,
        updated_at: new Date().toISOString(),
      })
      .eq("feature_key", featureKey);

    if (!error) {
      setFlags((prev) =>
        prev.map((f) =>
          f.feature_key === featureKey ? { ...f, enabled: !enabled } : f
        )
      );
      await logAdminEvent("toggle_duel_feature", "duel_feature_flags", featureKey, {
        enabled_before: enabled,
        enabled_after: !enabled,
      });
    }
    setSavingKey(null);
  };

  if (profile?.role !== "admin") {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8 text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {t("admin.duelFeatures.accessDenied")}
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
          <Shield className="w-8 h-8 text-purple-600" />
          {t("admin.duelFeatures.title")}
        </h1>
        <p className="text-gray-600 mt-2">{t("admin.duelFeatures.subtitle")}</p>
      </div>

      <div className="bg-white rounded-xl shadow-md divide-y">
        {flags.map((flag) => (
          <div
            key={flag.feature_key}
            className="p-5 flex items-center justify-between gap-4"
          >
            <div>
              <h3 className="font-semibold text-gray-800">
                {t(`admin.duelFeatures.${flag.feature_key}.label`)}
              </h3>
              <p className="text-sm text-gray-600">
                {t(`admin.duelFeatures.${flag.feature_key}.description`)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => toggleFlag(flag.feature_key, flag.enabled)}
              disabled={savingKey === flag.feature_key}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors ${
                flag.enabled
                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              } ${savingKey === flag.feature_key ? "opacity-60" : ""}`}
            >
              {flag.enabled ? (
                <ToggleRight className="w-5 h-5" />
              ) : (
                <ToggleLeft className="w-5 h-5" />
              )}
              {flag.enabled
                ? t("admin.duelFeatures.enabled")
                : t("admin.duelFeatures.disabled")}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
