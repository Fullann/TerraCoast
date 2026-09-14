import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
  ReactNode,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { Database } from "../lib/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  mfaRequired: boolean;
  signUp: (
    email: string,
    password: string,
    pseudo: string,
    options?: { acceptTerms?: boolean; acceptPrivacy?: boolean }
  ) => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ requiresMfa: boolean }>;
  verifyMfa: (code: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaChallengeId, setMfaChallengeId] = useState<string | null>(null);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      return null;
    }

    return data;
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
    }
  }, [user, fetchProfile]);

  const refreshMfaStatus = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (error) return;
      setMfaRequired(
        data?.nextLevel === "aal2" && data?.currentLevel !== "aal2"
      );
    } catch {
      // no-op
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      (async () => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const profileData = await fetchProfile(session.user.id);

          setProfile(profileData);
        }

        await refreshMfaStatus();
        setLoading(false);
      })();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const profileData = await fetchProfile(session.user.id);

          setProfile(profileData);
        } else {
          setProfile(null);
          setMfaRequired(false);
          setMfaFactorId(null);
          setMfaChallengeId(null);
        }
        await refreshMfaStatus();
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      pseudo: string,
      options?: { acceptTerms?: boolean; acceptPrivacy?: boolean }
    ) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      if (!data.user) throw new Error("No user returned");

      const now = new Date().toISOString();
      const profileInsert: ProfileInsert = {
        id: data.user.id,
        pseudo,
        email_newsletter: false,
        terms_accepted_at: options?.acceptTerms ? now : null,
        privacy_accepted_at: options?.acceptPrivacy ? now : null,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase insert inference can fail with custom Database types
      const { error: profileError } = await supabase.from("profiles").insert(profileInsert as any);

      if (profileError) throw profileError;

      // Recharger le profil immédiatement pour éviter la race avec onAuthStateChange
      // (le callback peut s'exécuter avant l'insert et laisser profile à null)
      const profileData = await fetchProfile(data.user.id);
      if (profileData) setProfile(profileData);
    },
    [fetchProfile]
  );

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    const requiresMfa =
      aalData?.nextLevel === "aal2" && aalData?.currentLevel !== "aal2";

    if (!requiresMfa) {
      setMfaRequired(false);
      setMfaFactorId(null);
      setMfaChallengeId(null);
      return { requiresMfa: false };
    }

    const { data: factorsData, error: factorsError } =
      await supabase.auth.mfa.listFactors();
    if (factorsError) throw factorsError;

    const activeTotpFactor = (factorsData?.totp || []).find(
      (factor: any) => factor.status === "verified"
    );
    if (!activeTotpFactor?.id) {
      throw new Error("Aucun facteur MFA vérifié trouvé.");
    }

    const { data: challengeData, error: challengeError } =
      await supabase.auth.mfa.challenge({
        factorId: activeTotpFactor.id,
      });
    if (challengeError || !challengeData?.id) {
      throw challengeError || new Error("Impossible de créer le challenge MFA.");
    }

    setMfaRequired(true);
    setMfaFactorId(activeTotpFactor.id);
    setMfaChallengeId(challengeData.id);
    return { requiresMfa: true };
  }, []);

  const verifyMfa = useCallback(
    async (code: string) => {
      let factorId = mfaFactorId;
      let challengeId = mfaChallengeId;

      // Robustesse: si l'utilisateur arrive sur l'étape MFA sans être passé
      // par signIn (ex. session restaurée après refresh), on reconstruit le challenge.
      if (!factorId) {
        const { data: factorsData, error: factorsError } =
          await supabase.auth.mfa.listFactors();
        if (factorsError) throw factorsError;
        const activeTotpFactor = (factorsData?.totp || []).find(
          (factor: any) => factor.status === "verified"
        );
        if (!activeTotpFactor?.id) {
          throw new Error("Aucun facteur MFA vérifié trouvé.");
        }
        factorId = activeTotpFactor.id;
        setMfaFactorId(factorId);
      }

      if (!challengeId) {
        const { data: challengeData, error: challengeError } =
          await supabase.auth.mfa.challenge({ factorId });
        if (challengeError || !challengeData?.id) {
          throw challengeError || new Error("Impossible de créer le challenge MFA.");
        }
        challengeId = challengeData.id;
        setMfaChallengeId(challengeId);
      }

      const { error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code: code.trim(),
      });
      if (error) throw error;

      setMfaRequired(false);
      setMfaFactorId(null);
      setMfaChallengeId(null);
    },
    [mfaFactorId, mfaChallengeId]
  );

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  const value = useMemo(
    () => ({
      user,
      profile,
      session,
      loading,
      mfaRequired,
      signUp,
      signIn,
      verifyMfa,
      signOut,
      refreshProfile,
    }),
    [
      user,
      profile,
      session,
      loading,
      mfaRequired,
      signUp,
      signIn,
      verifyMfa,
      signOut,
      refreshProfile,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
