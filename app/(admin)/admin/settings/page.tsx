"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";

export default function AdminSettingsPage() {
  const { user, idToken } = useAuth();
  const [settings, setSettings] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const r = await fetch("/api/admin/settings", { headers: idToken ? { Authorization: `Bearer ${idToken}` } : {} });
    const j = await r.json();
    setSettings(j.settings);
  }

  useEffect(() => { load(); }, [idToken]);

  const can = user?.isAdmin;

  return (
    <div className="card">
      <h1 style={{ marginTop: 0 }}>Admin Settings</h1>
      <p className="muted">Solo admin. In DEMO usa l'utente demo_admin.</p>

      {!can ? (
        <div className="card" style={{ borderColor: "rgba(255,77,109,0.5)" }}>
          <h3 style={{ marginTop: 0 }}>Accesso negato</h3>
          <p className="muted">Devi essere admin.</p>
          <a className="btn" href="/login">Vai al login</a>
        </div>
      ) : (
        <>
          <div className="grid">
            <div className="card">
              <div className="muted">communityVisibility</div>
              <select value={settings?.communityVisibility ?? "subscribers_only"} onChange={(e) => setSettings((s:any) => ({ ...s, communityVisibility: e.target.value }))}>
                <option value="subscribers_only">subscribers_only</option>
                <option value="authenticated">authenticated</option>
              </select>
            </div>
            <div className="card">
              <div className="muted">billingPlansEnabled</div>
              <select value={settings?.billingPlansEnabled ?? "monthly_and_yearly"} onChange={(e) => setSettings((s:any) => ({ ...s, billingPlansEnabled: e.target.value }))}>
                <option value="monthly_and_yearly">monthly_and_yearly</option>
                <option value="yearly_only">yearly_only</option>
              </select>
            </div>
          </div>

          <div className="row" style={{ marginTop: 12 }}>
            <button className="btn primary" disabled={saving} onClick={async () => {
              setSaving(true);
              const r = await fetch("/api/admin/settings", {
                method: "PUT",
                headers: { "content-type": "application/json", ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}) },
                body: JSON.stringify({ settings }),
              });
              const j = await r.json();
              setSaving(false);
              alert(JSON.stringify(j));
              await load();
            }}>Salva</button>
            <a className="btn" href="/community">Vai alla Community</a>
          </div>
        </>
      )}
    </div>
  );
}
