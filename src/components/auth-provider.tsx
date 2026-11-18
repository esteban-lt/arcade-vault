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
import type { SessionUser } from "@/lib/profile";
import { createClient } from "@/lib/supabase/client";

type AuthContextValue = {
  user: SessionUser | null;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [supabase] = useState(createClient);
  // Starts as a guest so the server and first client render match; the session loads after mount.
  const [authenticatedUserId, setAuthenticatedUserId] = useState<string | null>(null);
  const [loadedUser, setLoadedUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    let isActive = true;

    // getUser validates the session against the Auth server, unlike the locally stored one.
    supabase.auth.getUser().then(({ data }) => {
      if (isActive) setAuthenticatedUserId(data.user?.id ?? null);
    });

    // Only the user id is read here: Supabase calls inside this callback can deadlock.
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthenticatedUserId(session?.user.id ?? null);
    });

    return () => {
      isActive = false;
      subscription.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!authenticatedUserId) return;

    let isActive = true;

    supabase
      .from("profiles")
      .select("username")
      .eq("id", authenticatedUserId)
      .maybeSingle()
      .then(({ data }) => {
        if (!isActive) return;
        setLoadedUser(
          data ? { id: authenticatedUserId, name: data.username.toUpperCase() } : null,
        );
      });

    return () => {
      isActive = false;
    };
  }, [supabase, authenticatedUserId]);

  // Derived, so signing out clears the user immediately without a setState in an effect.
  const user = loadedUser?.id === authenticatedUserId ? loadedUser : null;

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, [supabase]);

  const value = useMemo(() => ({ user, signOut }), [user, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }
  return context;
}
