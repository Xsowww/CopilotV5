/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabaseClient } from "../services/supabaseClient";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isSupabaseConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (
    email: string,
    password: string,
    metadata: { full_name?: string }
  ) => Promise<{ error?: string; needsVerification?: boolean }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const supabase = getSupabaseClient();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const readSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!isMounted) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    };

    void readSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!supabase) {
        return { error: "Supabase n'est pas configuré" };
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return { error: error.message };
      }
      return {};
    },
    [supabase]
  );

  const signUp = useCallback(
    async (email: string, password: string, metadata: { full_name?: string }) => {
      if (!supabase) {
        return { error: "Supabase n'est pas configuré" };
      }
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: { data: metadata },
      });
      if (error) {
        return { error: error.message };
      }
      return { needsVerification: !data.session };
    },
    [supabase]
  );

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }, [supabase]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      loading,
      isSupabaseConfigured: Boolean(supabase),
      signIn,
      signUp,
      signOut,
    }),
    [loading, session, signIn, signOut, signUp, supabase, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé au sein d'un AuthProvider");
  }
  return context;
};
