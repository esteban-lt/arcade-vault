"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  readStoredSessionUser,
  storeSessionUser,
  type SessionUser,
} from "@/lib/session";

type AuthContextValue = {
  user: SessionUser | null;
  signIn: (user: SessionUser) => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Starts as a guest so the server and first client render match; the stored session loads after mount.
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is only readable after hydration
    setUser(readStoredSessionUser());
  }, []);

  const signIn = useCallback((nextUser: SessionUser) => {
    setUser(nextUser);
    storeSessionUser(nextUser);
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    storeSessionUser(null);
  }, []);

  const value = useMemo(() => ({ user, signIn, signOut }), [user, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }
  return context;
}
