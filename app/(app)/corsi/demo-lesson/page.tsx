"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";

type C = { id: string; body: string; createdAt: string };

export default function DemoLessonPage() {
  const { user, idToken } = useAuth();
  const [comments, setComments] = useState<C[]>([]);
  const [body, setBody] = useState("");

  async function load() {
    const r = await fetch(`/api/comments?lessonId=demo-lesson`, { headers: idToken ? { Authorization: `Bearer ${idToken}` } : {} });
    const j = await r.json();
    setComments(j.comments ?? []);
  }

  useEffect(() => { load(); }, [idToken]);

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h1 style={{ marginTop: 0 }}>Lezione Demo</h1>
        <a className="btn" href="/corsi">Indietro</a>
      </div>
      <p className="muted">Commenti consentiti solo a chi ha subscription attiva (enforced via API).</p>

      <div className="card" style={{ marginBottom: 12 }}>
        <h3 style={{ marginTop: 0 }}>Video</h3>
        <p className="muted">In REAL: /api/video-url genera Signed URL da Storage.</p>
        <button className="btn" onClick={async () => {
          const r = await fetch("/api/video-url?path=videos/demo.mp4", { headers: idToken ? { Authorization: `Bearer ${idToken}` } : {} });
          const j = await r.json();
          alert(JSON.stringify(j));
        }}>Richiedi video-url</button>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Commenti</h3>
        <div className="row" style={{ marginBottom: 8 }}>
          <input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Scrivi un commento…" />
          <button className="btn primary" disabled={!user} onClick={async () => {
            const r = await fetch("/api/comments", {
              method: "POST",
              headers: { "content-type": "application/json", ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}) },
              body: JSON.stringify({ lessonId: "demo-lesson", body }),
            });
            const j = await r.json();
            if (!r.ok) return alert(JSON.stringify(j));
            setBody("");
            await load();
          }}>Invia</button>
        </div>

        <div className="muted" style={{ marginBottom: 8 }}>Totale: {comments.length}</div>
        <div className="grid">
          {comments.map(c => (
            <div className="card" key={c.id}>
              <div className="muted">{new Date(c.createdAt).toLocaleString()}</div>
              <div style={{ marginTop: 6 }}>{c.body}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
