import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { getMe } from "./api";
import type { AuthResponse } from "./api";
import {
  clearStoredSession,
  readStoredSession,
  type SessionSnapshot,
  type SessionUser,
  writeStoredSession,
} from "./session";

interface AuthContextValue {
  ready: boolean;
  isAuthenticated: boolean;
  token: string | null;
  user: SessionUser | null;
  setSessionFromAuth: (auth: AuthResponse) => void;
  refreshMe: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<SessionSnapshot | null>(null);

  useEffect(() => {
    const stored = readStoredSession();
    if (!stored) {
      setReady(true);
      return;
    }

    setSession(stored);
    getMe()
      .then((user) => {
        const nextSession: SessionSnapshot = {
          token: stored.token,
          expiresAt: stored.expiresAt,
          user,
        };
        writeStoredSession(nextSession);
        setSession(nextSession);
      })
      .catch(() => {
        clearStoredSession();
        setSession(null);
      })
      .finally(() => setReady(true));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      isAuthenticated: !!session?.token,
      token: session?.token ?? null,
      user: session?.user ?? null,
      setSessionFromAuth(auth) {
        const nextSession: SessionSnapshot = {
          token: auth.token,
          expiresAt: auth.expiresAt,
          user: auth.user,
        };
        writeStoredSession(nextSession);
        setSession(nextSession);
      },
      async refreshMe() {
        const stored = readStoredSession();
        if (!stored) {
          clearStoredSession();
          setSession(null);
          return;
        }

        const user = await getMe();
        const nextSession: SessionSnapshot = {
          token: stored.token,
          expiresAt: stored.expiresAt,
          user,
        };
        writeStoredSession(nextSession);
        setSession(nextSession);
      },
      logout() {
        clearStoredSession();
        setSession(null);
      },
    }),
    [ready, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth precisa ser usado dentro de AuthProvider.");
  }

  return context;
}
