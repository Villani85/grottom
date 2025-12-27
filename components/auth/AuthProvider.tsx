"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { isDemoMode } from "@/lib/env";
import { getFirebaseAuth } from "@/lib/firebase-client";
import type { AppUser } from "@/types";

type AuthState = {
  loading: boolean;
  user: AppUser | null;
  idToken: string | null;
  setDemoUid?: (uid: "demo_admin" | "demo_member" | "demo_free") => void;
};

const Ctx = createContext<AuthState>({ loading: true, user: null, idToken: null });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AppUser | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [demoUid, setDemoUid] = useState<"demo_admin" | "demo_member" | "demo_free">("demo_member");

  useEffect(() => {
    let unsub: (() => void) | undefined;

    async function boot() {
      if (isDemoMode()) {
        setLoading(true);
        const res = await fetch("/api/me", { headers: { "x-demo-uid": demoUid } });
        const data = await res.json();
        setUser(data.user ?? null);
        setIdToken(null);
        setLoading(false);
        return;
      }

      const auth = getFirebaseAuth();
      if (!auth) {
        setLoading(false);
        setUser(null);
        setIdToken(null);
        return;
      }

      const mod = await import("firebase/auth");
      unsub = mod.onAuthStateChanged(auth, async (fbUser) => {
        if (!fbUser) {
          setUser(null);
          setIdToken(null);
          setLoading(false);
          return;
        }
        const token = await fbUser.getIdToken();
        setIdToken(token);

        const me = await fetch("/api/me", { headers: { Authorization: `Bearer ${token}` } });
        const json = await me.json();
        setUser(json.user ?? null);
        setLoading(false);
      });
    }

    boot();
    return () => { if (unsub) unsub(); };
  }, [demoUid]);

  const value = useMemo<AuthState>(() => ({
    loading,
    user,
    idToken,
    setDemoUid: isDemoMode() ? setDemoUid : undefined,
  }), [loading, user, idToken]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  return useContext(Ctx);
}
