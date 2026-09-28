import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { supabase } from '../../lib/supabase';
import {
  LogIn,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
} from 'lucide-react';

export function LoginForm({
  onSwitchToRegister,
  forceMfa = false,
}: {
  onSwitchToRegister?: () => void;
  forceMfa?: boolean;
}) {
  const { signIn, verifyMfa } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [requiresMfa, setRequiresMfa] = useState(forceMfa);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const result = await signIn(email, password);
      setRequiresMfa(result.requiresMfa);
    } catch (err: any) {
      setError(err.message || t('auth.connectionError'));
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verifyMfa(mfaCode);
    } catch (err: any) {
      setError(err.message || t('auth.connectionError'));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email || !email.includes('@')) {
      setError("Veuillez saisir votre adresse email pour réinitialiser votre mot de passe.");
      return;
    }
    setError('');
    setResettingPassword(true);
    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/settings`,
      });
      if (resetErr) throw resetErr;
      setSuccessMsg("Un email de réinitialisation vous a été envoyé !");
    } catch (err: any) {
      setError(err.message || "Erreur lors de la réinitialisation.");
    } finally {
      setResettingPassword(false);
    }
  };

  return (
    <div className="w-full">
      {/* En-tête amical */}
      <div className="flex items-center justify-center gap-2 mb-5">
        <span className="text-3xl">👋</span>
        <div>
          <h3 className="text-xl font-black text-slate-900 leading-tight">
            {requiresMfa ? "Validation Double Facteur" : "Bon retour parmi nous !"}
          </h3>
          <p className="text-xs text-slate-500 font-semibold">
            {requiresMfa
              ? "Saisissez votre code à 6 chiffres"
              : "Prêt à continuer votre conquête du monde ?"}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-2xl bg-red-50 border-2 border-red-200 text-red-700 text-xs font-bold flex items-start gap-2 animate-shake">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
          <span className="leading-snug">{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border-2 border-emerald-200 text-emerald-800 text-xs font-bold flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-[#58cc02] mt-0.5" />
          <span className="leading-snug">{successMsg}</span>
        </div>
      )}

      <form onSubmit={requiresMfa ? handleMfaSubmit : handleSubmit} className="space-y-4">
        {!requiresMfa ? (
          <>
            <div>
              <label htmlFor="email" className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">
                {t('auth.email')}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 text-sm font-semibold focus:outline-none focus:bg-white focus:border-[#58cc02] transition-colors"
                  placeholder={t('auth.emailPlaceholder')}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-xs font-black uppercase tracking-wider text-slate-600">
                  {t('auth.password')}
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={resettingPassword}
                  className="text-xs text-[#1cb0f6] hover:underline font-black cursor-pointer"
                >
                  {resettingPassword ? "Envoi..." : "Oublié ?"}
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full pl-10 pr-11 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 text-sm font-semibold focus:outline-none focus:bg-white focus:border-[#58cc02] transition-colors"
                  placeholder={t('auth.passwordPlaceholder')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  aria-label={showPassword ? "Masquer mot de passe" : "Afficher mot de passe"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-200 space-y-3">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-800">
              <KeyRound className="w-4 h-4 text-[#58cc02]" />
              <span>{t('settings.twoFactorCodeLabel')}</span>
            </div>
            <input
              id="mfaCode"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              required
              autoFocus
              className="w-full text-center tracking-[0.4em] font-mono text-2xl py-3 bg-white border-2 border-emerald-300 rounded-xl text-slate-900 font-black focus:outline-none focus:border-[#58cc02]"
              placeholder="000000"
            />
            <p className="text-xs text-slate-600 leading-snug font-medium">
              {t('settings.twoFactorScanInstructions')}
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-duo btn-duo-green w-full py-3.5 text-sm uppercase tracking-wider mt-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              <span>Connexion en cours...</span>
            </>
          ) : requiresMfa ? (
            <>
              <ShieldCheck className="w-4 h-4 mr-2" />
              <span>{t('settings.twoFactorConfirmActivation')}</span>
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4 mr-2" />
              <span>{t('auth.signIn')}</span>
            </>
          )}
        </button>
      </form>

      {!requiresMfa && onSwitchToRegister && (
        <div className="mt-6 pt-5 border-t-2 border-slate-100 text-center">
          <p className="text-xs text-slate-500 font-bold">
            {t('auth.noAccount')}{' '}
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="text-[#1cb0f6] hover:underline font-black cursor-pointer ml-1"
            >
              {t('auth.signUp')}
            </button>
          </p>
        </div>
      )}
    </div>
  );
}
