export default function CommunityPage() {
  return (
    <div className="card">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h1 style={{ marginTop: 0 }}>Community</h1>
        <a className="btn" href="/dashboard">Dashboard</a>
      </div>
      <p className="muted">La visibilità dipende da admin_settings/global.communityVisibility.</p>
      <div className="grid">
        <a className="card" href="/community/feed"><h3 style={{ marginTop: 0 }}>Apri Feed</h3><div className="muted">MVP feed</div></a>
        <a className="card" href="/admin/settings"><h3 style={{ marginTop: 0 }}>Admin Settings</h3><div className="muted">Cambia visibilità</div></a>
      </div>
    </div>
  );
}
