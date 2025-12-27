"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";

export default function AdminUsersPage() {
  const { user, idToken } = useAuth();
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/admin/users", { headers: idToken ? { Authorization: `Bearer ${idToken}` } : {} });
      const j = await r.json();
      setUsers(j.users ?? []);
    })();
  }, [idToken]);

  if (!user?.isAdmin) {
    return (
      <div className="card">
        <h1 style={{ marginTop: 0 }}>Users</h1>
        <div className="muted">Accesso negato.</div>
      </div>
    );
  }

  return (
    <div className="card">
      <h1 style={{ marginTop: 0 }}>Users</h1>
      <div className="muted">Gestione utenti (MVP).</div>
      <div className="grid" style={{ marginTop: 12 }}>
        {users.map(u => (
          <div key={u.uid} className="card">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <strong>{u.nickname}</strong>
              <span className="badge">{u.isAdmin ? "admin" : "member"}</span>
            </div>
            <div className="muted">{u.email}</div>
            <div className="row" style={{ marginTop: 10 }}>
              <span className="badge">points: {u.pointsTotal}</span>
              <span className="badge">sub: {u.subscriptionStatus}</span>
              <span className="badge">mkt: {u.marketingOptIn ? "yes" : "no"}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
