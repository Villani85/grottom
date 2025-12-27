"use client";

import { useAuth } from "@/components/auth/AuthProvider";

export default function ChatMediaExample() {
  const { idToken } = useAuth();
  return (
    <div className="card">
      <h1 style={{ marginTop: 0 }}>Chat Media URL</h1>
      <p className="muted">In REAL: verifica participants e genera Signed URL.</p>
      <button className="btn primary" onClick={async () => {
        const r = await fetch("/api/chat-media-url?path=chat/demo.png", { headers: idToken ? { Authorization: `Bearer ${idToken}` } : {} });
        const j = await r.json();
        alert(JSON.stringify(j));
      }}>Richiedi URL</button>
    </div>
  );
}
