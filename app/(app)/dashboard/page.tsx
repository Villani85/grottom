export default function DashboardPage() {
  return (
    <div className="card">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h1 style={{ marginTop: 0 }}>Dashboard</h1>
        <a className="btn" href="/profile">Profilo</a>
      </div>
      <p className="muted">Link rapidi.</p>
      <div className="grid">
        <a className="card" href="/corsi"><h3 style={{ marginTop: 0 }}>Corsi</h3><div className="muted">Catalogo + lezione demo</div></a>
        <a className="card" href="/community"><h3 style={{ marginTop: 0 }}>Community</h3><div className="muted">Visibilità dinamica</div></a>
        <a className="card" href="/messages"><h3 style={{ marginTop: 0 }}>Messages</h3><div className="muted">Chat (placeholder)</div></a>
        <a className="card" href="/gamification/giochi"><h3 style={{ marginTop: 0 }}>Giochi</h3><div className="muted">Micro-quiz</div></a>
        <a className="card" href="/leaderboard"><h3 style={{ marginTop: 0 }}>Leaderboard</h3><div className="muted">Classifica</div></a>
      </div>
    </div>
  );
}
