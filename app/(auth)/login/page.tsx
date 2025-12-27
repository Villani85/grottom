"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { isDemoMode } from "@/lib/env";

export default function LoginPage() {
  const { user, loading, setDemoUid } = useAuth();

  return (
    <div className="card">
      <h1 style={{ marginTop: 0 }}>Login</h1>
      <p className="muted">In DEMO puoi cambiare identità senza Firebase. In REAL va configurato Firebase Auth.</p>

      {loading ? <div className="muted">Caricamento…</div> : null}

      {user ? (
        <div>
          <div className="badge">Sei loggato come: {user.nickname} ({user.email})</div>
          <div className="row" style={{ marginTop: 12 }}>
            <a className="btn primary" href="/dashboard">Vai alla Dashboard</a>
            <a className="btn" href="/profile">Profilo</a>
          </div>
        </div>
      ) : (
        <div className="muted">Nessun utente loggato.</div>
      )}

      {isDemoMode() ? (
        <div style={{ marginTop: 16 }}>
          <hr />
          <h3 style={{ marginTop: 0 }}>Switch DEMO user</h3>
          <div className="row">
            <button className="btn" onClick={() => setDemoUid?.("demo_admin")}>Demo Admin</button>
            <button className="btn" onClick={() => setDemoUid?.("demo_member")}>Demo Member</button>
            <button className="btn" onClick={() => setDemoUid?.("demo_free")}>Demo Free</button>
          </div>
        </div>
      ) : (
        <div style={{ marginTop: 16 }} className="muted">TODO: implementare form login Firebase (email/password).</div>
      )}
    </div>
  );
}
