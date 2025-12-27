export default function LeaderboardPage() {
  return (
    <div className="card">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h1 style={{ marginTop: 0 }}>Leaderboard</h1>
        <a className="btn" href="/dashboard">Dashboard</a>
      </div>
      <p className="muted">MVP: in produzione query users orderBy pointsTotal.</p>
      <div className="grid">
        <a className="card" href="/admin/users"><h3 style={{ marginTop: 0 }}>Admin Users</h3><div className="muted">Gestione utenti</div></a>
      </div>
    </div>
  );
}
