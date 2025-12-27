"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";

export default function CommunityFeedPage() {
  const { user, idToken } = useAuth();
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/admin/settings");
      const j = await r.json();
      setSettings(j.settings);
    })();
  }, []);

  const visibility = settings?.communityVisibility ?? "subscribers_only";
  const requiresSub = visibility === "subscribers_only";
  const isSub = user?.subscriptionStatus === "active";

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h1 style={{ marginTop: 0 }}>Community Feed</h1>
        <a className="btn" href="/community">Indietro</a>
      </div>
      <div className="badge">visibility: {visibility}</div>

      {requiresSub && !isSub ? (
        <div className="card" style={{ borderColor: "rgba(255,77,109,0.5)" }}>
          <h3 style={{ marginTop: 0 }}>Accesso bloccato</h3>
          <p className="muted">Solo abbonati attivi possono usare la community.</p>
          <a className="btn primary" href="/pricing">Vai al Pricing</a>
        </div>
      ) : (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Post (placeholder)</h3>
          <p className="muted">TODO: implementare posts collection.</p>
          <button className="btn" onClick={async () => {
            const r = await fetch("/api/points", {
              method: "POST",
              headers: { "content-type": "application/json", ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}) },
              body: JSON.stringify({ txId: `feed_open_${Date.now()}`, delta: 2, reason: "Opened community feed" }),
            });
            alert(await r.text());
          }}>+2 XP</button>
        </div>
      )}
    </div>
  );
}
