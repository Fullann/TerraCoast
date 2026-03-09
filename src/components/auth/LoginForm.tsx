import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { LogIn } from 'lucide-react';

export function LoginForm({
  onSwitchToRegister,
  forceMfa = false,
}: {
  onSwitchToRegister: () => void;
  forceMfa?: boolean;
}) {
  const { signIn, verifyMfa } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [requiresMfa, setRequiresMfa] = useState(forceMfa);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
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

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-xl shadow-lg p-8">
      <div className="flex items-center justify-center mb-6">
        <LogIn className="w-8 h-8 text-emerald-600 mr-2" />
        <h2 className="text-2xl font-bold text-gray-800">{t('auth.login')}</h2>
      </div>

      <form onSubmit={requiresMfa ? handleMfaSubmit : handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {!requiresMfa ? (
          <>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                {t('auth.email')}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                placeholder={t('auth.emailPlaceholder')}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                {t('auth.password')}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                placeholder={t('auth.passwordPlaceholder')}
              />
            </div>
          </>
        ) : (
          <div>
            <label htmlFor="mfaCode" className="block text-sm font-medium text-gray-700 mb-1">
              {t('settings.twoFactorCodeLabel')}
            </label>
            <input
              id="mfaCode"
              type="text"
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              placeholder={t('settings.twoFactorCodePlaceholder')}
            />
            <p className="text-xs text-gray-500 mt-1">{t('settings.twoFactorScanInstructions')}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loading ? t('common.loading') : (requiresMfa ? t('settings.twoFactorConfirmActivation') : t('auth.signIn'))}
        </button>
      </form>

      {!requiresMfa && (
        <div className="mt-6 text-center">
          <button
            onClick={onSwitchToRegister}
            className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
          >
            {t('auth.noAccount')} {t('auth.signUp')}
          </button>
        </div>
      )}
    </div>
  );
}
