"use client";

import { useAuth } from "@/components/auth/AuthProvider";

export default function ProfilePage() {
  const { user, loading } = useAuth();

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h1 style={{ marginTop: 0 }}>Profilo</h1>
        <a className="btn" href="/dashboard">Dashboard</a>
      </div>
      {loading ? <div className="muted">Caricamento…</div> : null}
      {user ? (
        <div className="grid">
          <div className="card"><div className="muted">UID</div><div>{user.uid}</div></div>
          <div className="card"><div className="muted">Email</div><div>{user.email}</div></div>
          <div className="card"><div className="muted">Nickname</div><div>{user.nickname}</div></div>
          <div className="card"><div className="muted">Punti</div><div>{user.pointsTotal}</div></div>
          <div className="card"><div className="muted">Subscription</div><div>{user.subscriptionStatus}</div></div>
          <div className="card"><div className="muted">Admin</div><div>{user.isAdmin ? "Yes" : "No"}</div></div>
        </div>
      ) : (
        <div className="muted">Non sei loggato. Vai su /login.</div>
      )}
    </div>
  );
}
