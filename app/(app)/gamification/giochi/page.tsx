export default function GamesPage() {
  return (
    <div className="card">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h1 style={{ marginTop: 0 }}>Giochi</h1>
        <a className="btn" href="/dashboard">Dashboard</a>
      </div>
      <p className="muted">Mini-giochi React.</p>
      <div className="grid">
        <a className="card" href="/gamification/giochi/micro-quiz"><h3 style={{ marginTop: 0 }}>Micro-quiz</h3><div className="muted">12 domande rapide (demo)</div></a>
      </div>
    </div>
  );
}
