import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { languageNames, Language } from "../../i18n/translations";
import { Avatar } from "../common/Avatar";
import { equipShopItem, getPlayerGamificationState } from "../../lib/gamificationManager";
import {
  Settings,
  Mail,
  Lock,
  User,
  Trash2,
  ArrowLeft,
  Globe,
  LogOut,
  Save,
  Shield,
} from "lucide-react";

export interface SettingsPageProps {
  onNavigate?: (view: string) => void;
}

export function SettingsPage({ onNavigate: _onNavigate }: SettingsPageProps = {}) {
  const navigate = useNavigate();
  const { profile, user, refreshProfile } = useAuth();
  const { language, setLanguage, showAllLanguages, setShowAllLanguages, t } =
    useLanguage();
  const [pseudo, setPseudo] = useState(profile?.pseudo || "");
  const [email, setEmail] = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaQrCode, setMfaQrCode] = useState<string | null>(null);
  const [mfaSecret, setMfaSecret] = useState<string | null>(null);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaChallengeId, setMfaChallengeId] = useState<string | null>(null);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaDisablePassword, setMfaDisablePassword] = useState("");
  const [emailPendingTarget, setEmailPendingTarget] = useState<string | null>(
    null
  );
  const [emailCooldownUntil, setEmailCooldownUntil] = useState(0);
  const EMAIL_UPDATE_COOLDOWN_MS = 60_000;
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [frameSaving, setFrameSaving] = useState(false);
  const [gamification, setGamification] = useState(() =>
    getPlayerGamificationState(profile?.id)
  );

  useEffect(() => {
    const handleGamification = () => {
      setGamification(getPlayerGamificationState(profile?.id));
    };
    window.addEventListener("terracost_gamification_updated", handleGamification);
    return () => window.removeEventListener("terracost_gamification_updated", handleGamification);
  }, [profile?.id]);

  const activeFrame =
    gamification.activeAvatarFrame && gamification.activeAvatarFrame !== "none"
      ? gamification.activeAvatarFrame
      : profile?.frame_style && profile.frame_style !== "none"
      ? profile.frame_style
      : "none";

  const ensureValidAuthSession = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const currentSession = sessionData?.session;

    if (!currentSession) {
      throw new Error(t("settings.sessionInvalid"));
    }

    const expiresSoon =
      !!currentSession.expires_at &&
      currentSession.expires_at * 1000 < Date.now() + 60_000;

    if (expiresSoon) {
      const { data: refreshed, error: refreshError } =
        await supabase.auth.refreshSession();
      if (refreshError || !refreshed?.session) {
        throw new Error(t("settings.sessionExpired"));
      }
    }
  };

  const ensureAalForSensitiveUpdate = async () => {
    const { data: aalData, error: aalError } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    if (aalError) {
      throw new Error("Impossible de vérifier le niveau de sécurité MFA.");
    }

    const needsStepUp =
      aalData?.nextLevel === "aal2" && aalData?.currentLevel !== "aal2";

    if (!needsStepUp) return;

    const { data: factorsData, error: factorsError } =
      await supabase.auth.mfa.listFactors();
    if (factorsError) {
      throw new Error("Impossible de charger les facteurs MFA.");
    }

    const activeTotpFactor = (factorsData?.totp || []).find(
      (factor: any) => factor.status === "verified"
    );
    if (!activeTotpFactor?.id) {
      throw new Error("Aucun facteur MFA vérifié trouvé.");
    }

    const code = window.prompt(t("settings.twoFactorCodeLabel"));
    if (!code || code.trim().length < 6) {
      throw new Error(t("settings.twoFactorCodeRequired"));
    }

    const { data: challengeData, error: challengeError } =
      await supabase.auth.mfa.challenge({
        factorId: activeTotpFactor.id,
      });
    if (challengeError || !challengeData?.id) {
      throw new Error(t("settings.twoFactorChallengeError"));
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId: activeTotpFactor.id,
      challengeId: challengeData.id,
      code: code.trim(),
    });
    if (verifyError) {
      throw new Error(t("settings.twoFactorInvalidCode"));
    }
  };

  useEffect(() => {
    loadMfaStatus();
  }, [user?.id]);

  useEffect(() => {
    setEmail(user?.email || "");
  }, [user?.email]);

  useEffect(() => {
    if (!user?.id) return;
    const storageKey = `pending-email-change:${user.id}`;
    const storedPending = localStorage.getItem(storageKey);
    if (storedPending) {
      // Si l'email de session a finalement changé, la confirmation est terminée.
      if (storedPending === user.email) {
        localStorage.removeItem(storageKey);
        setEmailPendingTarget(null);
      } else {
        setEmailPendingTarget(storedPending);
      }
    } else {
      setEmailPendingTarget(null);
    }
  }, [user?.id, user?.email]);

  const loadMfaStatus = async () => {
    try {
      const { data, error: listError } = await supabase.auth.mfa.listFactors();
      if (listError) return;
      const activeTotp = (data?.totp || []).find(
        (factor: any) => factor.status === "verified"
      );
      setMfaEnabled(!!activeTotp);
      if (activeTotp?.id) {
        setMfaFactorId(activeTotp.id);
      }
    } catch {
      // no-op: status remains unchanged
    }
  };

  const startMfaEnrollment = async () => {
    setMfaLoading(true);
    setError("");
    setMessage("");

    try {
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "TerraCoast",
      });

      if (enrollError || !data) {
        setError(t("settings.twoFactorStartError"));
        return;
      }

      setMfaFactorId((data as any).id || null);
      setMfaQrCode((data as any).totp?.qr_code || null);
      setMfaSecret((data as any).totp?.secret || null);
      setMfaChallengeId(null);
      setMfaCode("");
      setMessage(t("settings.twoFactorScanInstructions"));
    } finally {
      setMfaLoading(false);
    }
  };

  const verifyMfaEnrollment = async () => {
    if (!mfaFactorId || !mfaCode.trim()) {
      setError(t("settings.twoFactorCodeRequired"));
      return;
    }

    setMfaLoading(true);
    setError("");
    setMessage("");

    try {
      let challengeId = mfaChallengeId;
      if (!challengeId) {
        const { data: challengeData, error: challengeError } =
          await supabase.auth.mfa.challenge({ factorId: mfaFactorId });

        if (challengeError || !challengeData?.id) {
          setError(t("settings.twoFactorChallengeError"));
          return;
        }
        challengeId = challengeData.id;
        setMfaChallengeId(challengeId);
      }

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId,
        code: mfaCode.trim(),
      });

      if (verifyError) {
        setError(t("settings.twoFactorInvalidCode"));
        return;
      }

      setMfaEnabled(true);
      setMfaQrCode(null);
      setMfaSecret(null);
      setMfaCode("");
      setMfaChallengeId(null);
      setMessage(t("settings.twoFactorEnabledSuccess"));
      await loadMfaStatus();
    } finally {
      setMfaLoading(false);
    }
  };

  const disableMfa = async () => {
    if (!mfaFactorId) {
      await loadMfaStatus();
    }

    if (!mfaFactorId) {
      setError(t("settings.twoFactorNoActiveFactor"));
      return;
    }

    if (!mfaDisablePassword.trim()) {
      setError(t("settings.currentPasswordRequired"));
      return;
    }

    const confirmDisable = window.confirm(
      t("settings.twoFactorDisableConfirm")
    );
    if (!confirmDisable) return;

    setMfaLoading(true);
    setError("");
    setMessage("");

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user?.email || "",
        password: mfaDisablePassword,
      });

      if (authError) {
        setError(t("settings.currentPasswordIncorrect"));
        return;
      }

      const { error: unenrollError } = await supabase.auth.mfa.unenroll({
        factorId: mfaFactorId,
      });

      if (unenrollError) {
        setError(t("settings.twoFactorDisableError"));
        return;
      }

      setMfaEnabled(false);
      setMfaFactorId(null);
      setMfaQrCode(null);
      setMfaSecret(null);
      setMfaCode("");
      setMfaChallengeId(null);
      setMfaDisablePassword("");
      setMessage(t("settings.twoFactorDisabledSuccess"));
    } finally {
      setMfaLoading(false);
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!profile?.id) return;
    setAvatarUploading(true);
    setError("");
    setMessage("");
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const path = `${profile.id}/avatar-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = data.publicUrl;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq("id", profile.id);
      if (updateError) throw updateError;

      await refreshProfile();
      setMessage(t("settings.profilePhotoUpdated"));
    } catch (e: any) {
      console.error("Avatar upload failed:", e);
      setError(t("settings.profilePhotoError"));
    } finally {
      setAvatarUploading(false);
    }
  };

  const saveFrameStyle = async (style: string) => {
    if (!profile?.id) return;
    setFrameSaving(true);
    setError("");
    setMessage("");
    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ frame_style: style, updated_at: new Date().toISOString() })
        .eq("id", profile.id);
      if (updateError) throw updateError;
      equipShopItem(profile.id, "frame", style === "none" ? null : style);
      await refreshProfile();
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("terracoast:profile_updated", { detail: { userId: profile.id } })
        );
      }
      setMessage(t("settings.visualEffectsUpdated"));
    } catch (e) {
      console.error("Frame save failed:", e);
      setError(t("settings.visualEffectsError"));
    } finally {
      setFrameSaving(false);
    }
  };

  const updatePseudo = async () => {
    if (!pseudo.trim() || !profile?.id) {
      setError(t("settings.pseudoRequired"));
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ pseudo: pseudo.trim() })
      .eq("id", profile.id);

    if (updateError) {
      setError(t("settings.pseudoUpdateError"));
    } else {
      setMessage(t("settings.pseudoUpdateSuccess"));
      await refreshProfile();
    }

    setLoading(false);
  };

  const updateEmail = async () => {
    if (!email.trim()) {
      setError(t("settings.allFieldsRequired"));
      return;
    }
    if (email.trim() === (user?.email || "")) {
      setError(t("settings.emailUpdateError"));
      return;
    }
    if (Date.now() < emailCooldownUntil) {
      const secondsLeft = Math.ceil((emailCooldownUntil - Date.now()) / 1000);
      setError(
        `Trop de tentatives. Merci d'attendre ${secondsLeft}s avant de réessayer.`
      );
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      await ensureValidAuthSession();
      await ensureAalForSensitiveUpdate();
    } catch (sessionError: any) {
      setError(sessionError.message || "Session invalide, reconnecte-toi.");
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      email: email.trim(),
    });

    if (updateError) {
      if (
        updateError.status === 429 ||
        updateError.message?.toLowerCase().includes("rate") ||
        updateError.message?.toLowerCase().includes("too many requests")
      ) {
        setEmailCooldownUntil(Date.now() + EMAIL_UPDATE_COOLDOWN_MS);
        setError(
          "Trop de tentatives de changement d'email. Réessaie dans 1 minute."
        );
      } else if (
        updateError.message?.toLowerCase().includes("unauthorized") ||
        updateError.status === 401
      ) {
        setError("Session invalide ou expirée. Merci de te reconnecter.");
      } else {
        setError(t("settings.emailUpdateError"));
      }
    } else {
      setMessage(t("settings.emailConfirmationSent"));
      setCurrentPassword("");
      const pending = email.trim();
      setEmailPendingTarget(pending);
      if (user?.id) {
        localStorage.setItem(`pending-email-change:${user.id}`, pending);
      }
      // Évite les clics répétés qui déclenchent un 429.
      setEmailCooldownUntil(Date.now() + EMAIL_UPDATE_COOLDOWN_MS);
    }

    setLoading(false);
  };

  const updatePassword = async () => {
    if (
      !newPassword.trim() ||
      !confirmPassword.trim()
    ) {
      setError(t("settings.allFieldsRequired"));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t("settings.passwordsMismatch"));
      return;
    }

    if (newPassword.length < 6) {
      setError(t("settings.passwordTooShort"));
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      await ensureValidAuthSession();
      await ensureAalForSensitiveUpdate();
    } catch (sessionError: any) {
      setError(sessionError.message || "Session invalide, reconnecte-toi.");
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      if (
        updateError.message?.toLowerCase().includes("unauthorized") ||
        updateError.status === 401
      ) {
        setError("Session invalide ou expirée. Merci de te reconnecter.");
      } else {
        setError(t("settings.passwordUpdateError"));
      }
    } else {
      setMessage(t("settings.passwordUpdateSuccess"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }

    setLoading(false);
  };

  // ✅ FONCTION DE DÉCONNEXION
  const handleLogout = async () => {
    const confirmLogout = window.confirm(
      t("settings.logoutConfirmation") ||
        "Êtes-vous sûr de vouloir vous déconnecter ?"
    );

    if (!confirmLogout) return;

    setLoading(true);
    const { error } = await supabase.auth.signOut();

    if (error) {
      setError(t("settings.logoutError"));
      setLoading(false);
    }
    // L'utilisateur sera automatiquement redirigé vers la page de connexion
  };

  const deleteAccount = async () => {
    const confirmation = prompt(t("settings.deleteConfirmation"));

    if (confirmation !== t("settings.deleteKeyword")) {
      return;
    }

    setLoading(true);
    setError("");

    const { error } = await supabase.rpc("delete_user_account", {
      user_id: profile?.id,
    });

    if (error) {
      setError(t("settings.deleteAccountError"));
      setLoading(false);
    } else {
      await supabase.auth.signOut();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-slate-200">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/profile")}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-black border-2 border-slate-200 border-b-4 active:translate-y-0.5 shadow-2xs transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-600" />
              <span>{t("settings.backToProfile") || "Retour au profil"}</span>
            </button>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Settings className="w-7 h-7 text-emerald-600" />
              <span>{t("settings.accountSettings") || "Paramètres"}</span>
            </h1>
          </div>

          <button
            onClick={handleLogout}
            disabled={loading}
            className="btn-duo btn-duo-white self-start sm:self-auto px-4 py-2.5 text-rose-600 hover:text-rose-700 text-xs font-black border-rose-200 flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>{t("settings.logout") || "Déconnexion"}</span>
          </button>
        </div>

        {/* Messages de succès/erreur */}
        {message && (
          <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 text-emerald-900 font-bold text-sm shadow-2xs flex items-center gap-2 animate-fade-in">
            <span>✅</span>
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 text-rose-900 font-bold text-sm shadow-2xs flex items-center gap-2 animate-fade-in">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Grille Responsive pour Cartes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CARTE PHOTO DE PROFIL */}
          <div className="card-duo p-5 sm:p-6 bg-white shadow-sm">
            <div className="flex items-center mb-4">
              <div className="p-2.5 bg-amber-100 rounded-2xl text-amber-700 mr-3">
                <User className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-black text-slate-900">
                {t("settings.profilePhoto")}
              </h2>
            </div>

            <div className="flex items-center gap-4">
              <Avatar
                url={profile?.avatar_url}
                pseudo={profile?.pseudo}
                frameStyle={profile?.frame_style}
                size="lg"
              />
              <div className="flex-1">
                <p className="text-xs text-slate-500 font-medium mb-3">
                  {t("settings.profilePhotoHint")}
                </p>
                <label className="btn-duo btn-duo-green px-4 py-2 text-xs font-black inline-flex items-center justify-center cursor-pointer">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    disabled={avatarUploading}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadAvatar(f);
                      e.currentTarget.value = "";
                    }}
                  />
                  {avatarUploading ? t("common.loading") : t("profile.changeAvatar")}
                </label>
              </div>
            </div>
          </div>

          {/* CARTE EFFETS VISUELS */}
          <div className="card-duo p-5 sm:p-6 bg-white shadow-sm">
            <div className="flex items-center mb-4">
              <div className="p-2.5 bg-purple-100 rounded-2xl text-purple-700 mr-3">
                <Shield className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-black text-slate-900">
                {t("settings.visualEffects")}
              </h2>
            </div>

            <div className="flex items-center gap-4">
              <Avatar
                url={profile?.avatar_url}
                pseudo={profile?.pseudo}
                frameStyle={activeFrame}
                size="lg"
              />
              <div className="flex-1">
                <p className="text-xs text-slate-500 font-medium mb-2">
                  {t("settings.visualEffectsHint")}
                </p>
                <label className="block text-xs font-black text-slate-700 mb-1.5 uppercase tracking-wider">
                  {t("profile.frame")}
                </label>
                <select
                  className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 border-b-4 focus:border-purple-500 focus:bg-white rounded-2xl outline-none font-bold text-slate-800 text-sm transition-all cursor-pointer"
                  value={activeFrame}
                  disabled={frameSaving}
                  onChange={(e) => saveFrameStyle(e.target.value)}
                >
                  <option value="none">{t("profile.frameNone")}</option>
                  <option value="frame_flame">🔥 Flamme Incandescente (Boutique)</option>
                  <option value="frame_compass">🧭 Rose des Vents (Boutique)</option>
                  <option value="frame_crown">👑 Couronne d'Explorateur (Boutique)</option>
                  <option value="emerald">{t("profile.frameEmerald")}</option>
                  <option value="gold">{t("profile.frameGold")}</option>
                  <option value="rainbow">{t("profile.frameRainbow")}</option>
                  <option value="ice">{t("profile.frameIce")}</option>
                  <option value="shadow">{t("profile.frameShadow")}</option>
                </select>
              </div>
            </div>
          </div>

          {/* CARTE LANGUE */}
          <div className="card-duo p-5 sm:p-6 bg-white shadow-sm">
            <div className="flex items-center mb-4">
              <div className="p-2.5 bg-emerald-100 rounded-2xl text-emerald-700 mr-3">
                <Globe className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-black text-slate-900">
                {t("settings.languagePreferences")}
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5 uppercase tracking-wider">
                  {t("settings.interfaceLanguage")}
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Language)}
                  className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 border-b-4 focus:border-emerald-500 focus:bg-white rounded-2xl outline-none font-bold text-slate-800 text-sm transition-all cursor-pointer"
                >
                  {Object.entries(languageNames).map(([code, name]) => (
                    <option key={code} value={code}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-start p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <input
                  type="checkbox"
                  id="showAllLanguages"
                  checked={showAllLanguages}
                  onChange={(e) => setShowAllLanguages(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                />
                <label
                  htmlFor="showAllLanguages"
                  className="ml-3 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  {t("settings.showAllLanguagesDescription")}
                </label>
              </div>
            </div>
          </div>

          {/* CARTE NOM D'UTILISATEUR */}
          <div className="card-duo p-5 sm:p-6 bg-white shadow-sm">
            <div className="flex items-center mb-4">
              <div className="p-2.5 bg-blue-100 rounded-2xl text-blue-700 mr-3">
                <User className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-black text-slate-900">
                {t("settings.username")}
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5 uppercase tracking-wider">
                  {t("settings.newUsername")}
                </label>
                <input
                  type="text"
                  value={pseudo}
                  onChange={(e) => setPseudo(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 border-b-4 focus:border-blue-500 focus:bg-white rounded-2xl outline-none font-bold text-slate-800 text-sm transition-all focus:ring-4 focus:ring-blue-100"
                  placeholder={t("settings.yourUsername")}
                />
              </div>

              <button
                onClick={updatePseudo}
                disabled={
                  loading || !pseudo.trim() || pseudo === profile?.pseudo
                }
                className="btn-duo btn-duo-blue w-full py-2.5 text-xs sm:text-sm font-black flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{t("settings.updateUsername")}</span>
              </button>
            </div>
          </div>

          {/* CARTE EMAIL */}
          <div className="card-duo p-5 sm:p-6 bg-white shadow-sm">
            <div className="flex items-center mb-4">
              <div className="p-2.5 bg-emerald-100 rounded-2xl text-emerald-700 mr-3">
                <Mail className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-black text-slate-900">
                {t("settings.emailAddress")}
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5 uppercase tracking-wider">
                  {t("settings.newEmail")}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 border-b-4 focus:border-emerald-500 focus:bg-white rounded-2xl outline-none font-bold text-slate-800 text-sm transition-all focus:ring-4 focus:ring-emerald-100"
                  placeholder={t("settings.newEmailPlaceholder")}
                />
                <p className="text-xs text-slate-500 font-semibold mt-1.5">
                  Email actuel : {user?.email || "-"}
                </p>
                {emailPendingTarget && (
                  <p className="text-xs text-amber-700 font-bold mt-1">
                    Changement en attente de confirmation : {emailPendingTarget}
                  </p>
                )}
              </div>

              <button
                onClick={updateEmail}
                disabled={
                  loading ||
                  !email.trim() ||
                  email.trim() === (user?.email || "") ||
                  Date.now() < emailCooldownUntil
                }
                className="btn-duo btn-duo-green w-full py-2.5 text-xs sm:text-sm font-black flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{t("settings.updateEmail")}</span>
              </button>
            </div>
          </div>

          {/* CARTE MOT DE PASSE */}
          <div className="card-duo p-5 sm:p-6 bg-white shadow-sm">
            <div className="flex items-center mb-4">
              <div className="p-2.5 bg-amber-100 rounded-2xl text-amber-700 mr-3">
                <Lock className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-black text-slate-900">
                {t("settings.password")}
              </h2>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1 uppercase tracking-wider">
                  {t("settings.currentPassword")}
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border-2 border-slate-200 border-b-4 focus:border-amber-500 focus:bg-white rounded-2xl outline-none font-bold text-slate-800 text-sm transition-all"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1 uppercase tracking-wider">
                  {t("settings.newPassword")}
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border-2 border-slate-200 border-b-4 focus:border-amber-500 focus:bg-white rounded-2xl outline-none font-bold text-slate-800 text-sm transition-all"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1 uppercase tracking-wider">
                  {t("settings.confirmNewPassword")}
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border-2 border-slate-200 border-b-4 focus:border-amber-500 focus:bg-white rounded-2xl outline-none font-bold text-slate-800 text-sm transition-all"
                  placeholder="••••••••"
                />
              </div>

              <button
                onClick={updatePassword}
                disabled={
                  loading ||
                  !newPassword.trim() ||
                  !confirmPassword.trim()
                }
                className="btn-duo btn-duo-amber w-full py-2.5 text-xs sm:text-sm font-black flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Shield className="w-4 h-4" />
                <span>{t("settings.updatePassword")}</span>
              </button>
            </div>
          </div>

          {/* CARTE DOUBLE AUTHENTIFICATION */}
          <div className="card-duo p-5 sm:p-6 bg-white shadow-sm lg:col-span-2">
            <div className="flex items-center mb-4">
              <div className="p-2.5 bg-indigo-100 rounded-2xl text-indigo-700 mr-3">
                <Shield className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-black text-slate-900">
                {t("settings.twoFactorTitle")}
              </h2>
            </div>

            <div className="space-y-4">
              <p className="text-xs sm:text-sm font-semibold text-slate-600">
                {t("settings.twoFactorStatus")}:{" "}
                <span
                  className={`font-black ${
                    mfaEnabled ? "text-emerald-600" : "text-slate-700"
                  }`}
                >
                  {mfaEnabled
                    ? t("settings.twoFactorEnabled")
                    : t("settings.twoFactorDisabled")}
                </span>
              </p>

              {!mfaEnabled && !mfaQrCode && (
                <button
                  onClick={startMfaEnrollment}
                  disabled={mfaLoading}
                  className="btn-duo btn-duo-purple px-6 py-2.5 text-xs sm:text-sm font-black disabled:opacity-50"
                >
                  {t("settings.twoFactorStart")}
                </button>
              )}

              {!mfaEnabled && mfaQrCode && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-600 font-medium">
                    {t("settings.twoFactorScanInstructions")}
                  </p>
                  <div className="bg-white border-2 border-slate-200 rounded-2xl p-3 inline-block shadow-xs">
                    <img
                      src={mfaQrCode}
                      alt="QR code 2FA"
                      className="w-44 h-44 rounded-xl"
                    />
                  </div>
                  {mfaSecret && (
                    <p className="text-xs text-slate-500 font-mono break-all">
                      {t("settings.twoFactorBackupKey")}: {mfaSecret}
                    </p>
                  )}
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1 uppercase tracking-wider">
                      {t("settings.twoFactorCodeLabel")}
                    </label>
                    <input
                      type="text"
                      value={mfaCode}
                      onChange={(e) =>
                        setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      className="w-full max-w-xs px-4 py-2.5 bg-slate-50 border-2 border-slate-200 border-b-4 focus:border-indigo-500 focus:bg-white rounded-2xl outline-none font-mono font-black text-slate-900 tracking-widest text-base"
                      placeholder="000000"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={verifyMfaEnrollment}
                      disabled={mfaLoading || mfaCode.length !== 6}
                      className="btn-duo btn-duo-green px-5 py-2 text-xs font-black disabled:opacity-50"
                    >
                      {t("settings.twoFactorConfirmActivation")}
                    </button>
                    <button
                      onClick={() => {
                        setMfaQrCode(null);
                        setMfaSecret(null);
                        setMfaCode("");
                        setMfaChallengeId(null);
                      }}
                      disabled={mfaLoading}
                      className="btn-duo btn-duo-white px-4 py-2 text-xs font-black"
                    >
                      {t("common.cancel")}
                    </button>
                  </div>
                </div>
              )}

              {mfaEnabled && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1 uppercase tracking-wider">
                      {t("settings.twoFactorDisablePassword")}
                    </label>
                    <input
                      type="password"
                      value={mfaDisablePassword}
                      onChange={(e) => setMfaDisablePassword(e.target.value)}
                      className="w-full max-w-xs px-4 py-2.5 bg-slate-50 border-2 border-slate-200 border-b-4 focus:border-rose-500 focus:bg-white rounded-2xl outline-none font-bold text-slate-800 text-sm"
                      placeholder="••••••••"
                    />
                  </div>
                  <button
                    onClick={disableMfa}
                    disabled={mfaLoading || !mfaDisablePassword.trim()}
                    className="btn-duo btn-duo-white text-rose-600 border-rose-300 px-5 py-2.5 text-xs font-black disabled:opacity-50"
                  >
                    {t("settings.twoFactorDisableButton")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ZONE DE DANGER */}
        <div className="card-duo p-5 sm:p-6 bg-gradient-to-r from-rose-50/80 via-red-50/70 to-rose-50/80 border-2 border-rose-200 border-b-4 border-rose-300">
          <div className="flex items-center mb-3">
            <div className="p-2.5 bg-rose-100 rounded-2xl text-rose-700 mr-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black text-rose-950">
              {t("settings.dangerZone")}
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 font-semibold mb-4 leading-relaxed">
            {t("settings.deleteWarning")}
          </p>

          <button
            onClick={deleteAccount}
            disabled={loading}
            className="btn-duo btn-duo-white text-rose-700 border-rose-300 hover:bg-rose-50 px-5 py-2.5 text-xs font-black inline-flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>{t("settings.deleteAccount")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
