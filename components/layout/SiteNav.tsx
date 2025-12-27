export function SiteNav() {
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div className="nav">
          <a className="btn" href="/">Home</a>
          <a className="btn" href="/pricing">Pricing</a>
          <a className="btn" href="/gamification">Gamification</a>
          <a className="btn" href="/dashboard">Dashboard</a>
          <a className="btn" href="/community">Community</a>
        </div>
        <div className="nav">
          <a className="btn" href="/login">Login</a>
          <a className="btn" href="/register">Register</a>
          <a className="btn" href="/admin/newsletter">Admin</a>
        </div>
      </div>
    </div>
  );
}
