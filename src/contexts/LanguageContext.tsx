import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import { Language, translate, detectUserLanguage, loadLanguage } from '../i18n/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  showAllLanguages: boolean;
  setShowAllLanguages: (show: boolean) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = typeof localStorage !== 'undefined' ? (localStorage.getItem('terracost_lang') as Language) : null;
    return saved || 'fr';
  });
  const [showAllLanguages, setShowAllLanguagesState] = useState(false);
  const [loadedVersion, setLoadedVersion] = useState(0);

  useEffect(() => {
    const saved = typeof localStorage !== 'undefined' ? (localStorage.getItem('terracost_lang') as Language) : null;
    const lang = profile ? ((profile.language as Language) || saved || 'fr') : (saved || detectUserLanguage());
    setLanguageState(lang);
    document.documentElement.lang = lang;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('terracost_lang', lang);
    }
    if (profile) {
      setShowAllLanguagesState(profile.show_all_languages || false);
    }
    loadLanguage(lang).then(() => {
      setLoadedVersion((v) => v + 1);
    });
  }, [profile]);

  const setLanguage = useCallback(async (lang: Language) => {
    setLanguageState(lang);
    document.documentElement.lang = lang;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('terracost_lang', lang);
    }
    await loadLanguage(lang);
    setLoadedVersion((v) => v + 1);
    if (profile) {
      await supabase
        .from('profiles')
        .update({ language: lang })
        .eq('id', profile.id);
    }
  }, [profile]);

  const setShowAllLanguages = useCallback(async (show: boolean) => {
    setShowAllLanguagesState(show);
    if (profile) {
      await supabase
        .from('profiles')
        .update({ show_all_languages: show })
        .eq('id', profile.id);
    }
  }, [profile]);

  const t = useCallback((key: string) => translate(key, language), [language, loadedVersion]);

  const value = useMemo(
    () => ({ language, setLanguage, t, showAllLanguages, setShowAllLanguages }),
    [language, setLanguage, t, showAllLanguages, setShowAllLanguages, loadedVersion]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
