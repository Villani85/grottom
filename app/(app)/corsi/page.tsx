export default function CoursesPage() {
  return (
    <div className="card">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h1 style={{ marginTop: 0 }}>Corsi</h1>
        <a className="btn" href="/dashboard">Dashboard</a>
      </div>
      <p className="muted">MVP catalogo.</p>
      <div className="grid">
        <a className="card" href="/corsi/demo-lesson"><h3 style={{ marginTop: 0 }}>Lezione demo</h3><div className="muted">Commenti + video-url</div></a>
      </div>
    </div>
  );
}
