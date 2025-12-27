export default function GamificationPage() {
  return (
    <div className="card">
      <h1 style={{ marginTop: 0 }}>Gamification</h1>
      <p className="muted">XP, streak, leaderboard e mini-giochi. Ogni azione passa da /api/points con idempotenza.</p>
      <div className="grid" style={{ marginTop: 12 }}>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Azioni che danno XP</h3>
          <ul className="muted">
            <li>Completare una lezione</li>
            <li>Commentare un video</li>
            <li>Giocare un micro-quiz</li>
          </ul>
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Anti-cheat</h3>
          <p className="muted">Ogni transazione ha txId univoco. Se arriva due volte, la seconda è ignorata.</p>
        </div>
      </div>
    </div>
  );
}
