"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";

type Q = { q: string; a: string; b: string; correct: "a" | "b" };

const QUESTIONS: Q[] = [
  { q: "Choose: 'I went' = ?", a: "Io sono andato", b: "Io vado", correct: "a" },
  { q: "Choose: 'He has' = ?", a: "Lui è", b: "Lui ha", correct: "b" },
  { q: "Choose: 'We were' = ?", a: "Noi eravamo", b: "Noi saremo", correct: "a" },
];

export default function MicroQuiz() {
  const { idToken } = useAuth();
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const q = useMemo(() => QUESTIONS[i], [i]);

  async function answer(which: "a" | "b") {
    const ok = which === q.correct;
    if (ok) setScore(s => s + 1);

    if (i + 1 >= QUESTIONS.length) {
      setDone(true);
      const delta = ok ? 10 : 5;
      await fetch("/api/points", {
        method: "POST",
        headers: { "content-type": "application/json", ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}) },
        body: JSON.stringify({ txId: `microquiz_${Date.now()}`, delta, reason: "Completed micro-quiz" }),
      });
      return;
    }
    setI(i + 1);
  }

  return (
    <div className="card">
      <h1 style={{ marginTop: 0 }}>Micro-Quiz</h1>
      <p className="muted">Obiettivo: velocità. 1 tap per risposta. XP su completion.</p>

      {done ? (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Finito!</h3>
          <div className="badge">Score: {score}/{QUESTIONS.length}</div>
          <div className="row" style={{ marginTop: 12 }}>
            <button className="btn primary" onClick={() => { setI(0); setScore(0); setDone(false); }}>Ricomincia</button>
            <a className="btn" href="/leaderboard">Leaderboard</a>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="badge">Domanda {i + 1}/{QUESTIONS.length}</div>
          <h3>{q.q}</h3>
          <div className="row">
            <button className="btn primary" onClick={() => answer("a")}>{q.a}</button>
            <button className="btn" onClick={() => answer("b")}>{q.b}</button>
          </div>
        </div>
      )}
    </div>
  );
}
