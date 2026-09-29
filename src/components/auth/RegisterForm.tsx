import { useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { detectUserLanguage } from '../../i18n/translations';
import { supabase } from '../../lib/supabase';
import {
  UserPlus,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
  onShowTerms?: () => void;
  onShowPrivacy?: () => void;
}

export function RegisterForm({ onSwitchToLogin, onShowTerms, onShowPrivacy }: RegisterFormProps) {
  const { signUp } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [pseudo, setPseudo] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Calcul dynamique de la force du mot de passe
  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: '', color: 'bg-slate-200' };
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return { score: 1, label: t('auth.strengthTooShort') || 'Trop court', color: 'bg-[#ff4b4b]' };
    if (score === 2) return { score: 2, label: t('auth.strengthMedium') || 'Moyen', color: 'bg-[#ffc800]' };
    if (score === 3) return { score: 3, label: t('auth.strengthGood') || 'Bon', color: 'bg-[#1cb0f6]' };
    return { score: 4, label: t('auth.strengthStrong') || 'Robuste !', color: 'bg-[#58cc02]' };
  }, [password, t]);

  const passwordsMatch = useMemo(() => {
    if (!confirmPassword) return null;
    return password === confirmPassword;
  }, [password, confirmPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError(t('auth.passwordTooShort'));
      return;
    }

    if (pseudo.length < 3) {
      setError(t('auth.pseudoTooShort'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }

    if (!acceptTerms || !acceptPrivacy) {
      setError(t('auth.mustAcceptTerms'));
      return;
    }

    setLoading(true);

    try {
      const detectedLang = detectUserLanguage();
      await signUp(email, password, pseudo, { acceptTerms: true, acceptPrivacy: true });

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ language: detectedLang })
          .eq('id', user.id);
      }
    } catch (err: any) {
      if (err.message?.includes('already registered')) {
        setError(t('auth.emailAlreadyUsed'));
      } else if (err.message?.includes('duplicate key')) {
        setError(t('auth.pseudoAlreadyTaken'));
      } else {
        setError(err.message || t('auth.registrationError'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* En-tête amical */}
      <div className="flex items-center justify-center gap-2 mb-5">
        <span className="text-3xl">🚀</span>
        <div>
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-2 leading-tight">
            {t('auth.joinTerraCoast') || "Rejoignez TerraCoast"}
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-black border border-amber-300">
              +500 XP
            </span>
          </h3>
          <p className="text-xs text-slate-500 font-semibold">
            {t('auth.passportToConquer') || "Votre passeport pour conquérir le monde en apprenant"}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-2xl bg-red-50 border-2 border-red-200 text-red-700 text-xs font-bold flex items-start gap-2 animate-shake">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
          <span className="leading-snug">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Pseudo Input */}
        <div>
          <label htmlFor="pseudo" className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
            {t('auth.pseudo')}
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="pseudo"
              type="text"
              value={pseudo}
              onChange={(e) => setPseudo(e.target.value)}
              required
              minLength={3}
              maxLength={20}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 text-sm font-semibold focus:outline-none focus:bg-white focus:border-[#58cc02] transition-colors"
              placeholder={t('auth.pseudoPlaceholder')}
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-1 pl-1 font-semibold">
            {t('auth.pseudoHelpText') || "Visible dans les ligues et lors de vos duels mondiaux."}
          </p>
        </div>

        {/* Email Input */}
        <div>
          <label htmlFor="email" className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
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
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 text-sm font-semibold focus:outline-none focus:bg-white focus:border-[#58cc02] transition-colors"
              placeholder={t('auth.emailPlaceholder')}
            />
          </div>
        </div>

        {/* Password Input */}
        <div>
          <label htmlFor="password" className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
            {t('auth.password')}
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 text-sm font-semibold focus:outline-none focus:bg-white focus:border-[#58cc02] transition-colors"
              placeholder={t('auth.passwordPlaceholder')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              aria-label={showPassword ? (t('auth.hidePassword') || "Masquer le mot de passe") : (t('auth.showPassword') || "Afficher le mot de passe")}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Password Strength Indicator */}
          {password && (
            <div className="mt-1.5 flex items-center gap-1.5 pl-1">
              <div className="flex-1 flex gap-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`flex-1 transition-all duration-300 ${
                      step <= passwordStrength.score ? passwordStrength.color : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>
              <span className="text-[11px] font-black text-slate-600">
                {passwordStrength.label}
              </span>
            </div>
          )}
        </div>

        {/* Confirm Password Input */}
        <div>
          <label htmlFor="confirmPassword" className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
            {t('auth.confirmPassword')}
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              className={`w-full pl-10 pr-11 py-2.5 bg-slate-50 border-2 rounded-2xl text-slate-900 placeholder-slate-400 text-sm font-semibold focus:outline-none transition-colors ${
                passwordsMatch === false
                  ? 'border-red-400 focus:bg-white focus:border-red-500'
                  : passwordsMatch === true
                  ? 'border-[#58cc02] focus:bg-white'
                  : 'border-slate-200 focus:bg-white focus:border-[#58cc02]'
              }`}
              placeholder={t('auth.confirmPasswordPlaceholder') || "Confirmez votre mot de passe"}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              aria-label={showConfirmPassword ? (t('auth.hidePassword') || "Masquer le mot de passe") : (t('auth.showPassword') || "Afficher le mot de passe")}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {passwordsMatch === false && (
            <p className="text-[11px] text-red-600 font-bold mt-1 pl-1">
              {t('auth.passwordMismatch')}
            </p>
          )}
        </div>

        {/* Terms & Privacy Checkboxes */}
        <div className="space-y-2 pt-1 text-xs text-slate-600 font-medium">
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-2 border-slate-300 text-[#58cc02] focus:ring-[#58cc02]"
            />
            <span className="leading-snug">
              {t('auth.acceptTermsPrefix') || "J'accepte les"}{' '}
              <button
                type="button"
                onClick={onShowTerms}
                className="text-[#1cb0f6] hover:underline font-bold"
              >
                {t('auth.termsOfService') || "Conditions Générales d'Utilisation"}
              </button>
            </span>
          </label>

          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={acceptPrivacy}
              onChange={(e) => setAcceptPrivacy(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-2 border-slate-300 text-[#58cc02] focus:ring-[#58cc02]"
            />
            <span className="leading-snug">
              {t('auth.acceptPrivacyPrefix') || "J'accepte la"}{' '}
              <button
                type="button"
                onClick={onShowPrivacy}
                className="text-[#1cb0f6] hover:underline font-bold"
              >
                {t('auth.privacyPolicy') || "Politique de Confidentialité"}
              </button>
            </span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !acceptTerms || !acceptPrivacy}
          className="btn-duo btn-duo-green w-full py-3.5 text-sm uppercase tracking-wider mt-3 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              <span>{t('auth.creatingProfile') || "Création du profil..."}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              <span>{t('auth.signUpAndGetXp') || `${t('auth.signUp')} & Obtenir 500 XP`}</span>
            </>
          )}
        </button>
      </form>

      {/* Switch to Login */}
      <div className="mt-5 pt-4 border-t-2 border-slate-100 text-center">
        <p className="text-xs text-slate-500 font-bold">
          {t('auth.alreadyAccount')}{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-[#1cb0f6] hover:underline font-black cursor-pointer ml-1"
          >
            {t('auth.signIn')}
          </button>
        </p>
      </div>
    </div>
  );
}
