export default function MessagesPage() {
  return (
    <div className="card">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h1 style={{ marginTop: 0 }}>Messages</h1>
        <a className="btn" href="/dashboard">Dashboard</a>
      </div>
      <p className="muted">Chat privata (placeholder). Media protetti via /api/chat-media-url.</p>
      <div className="grid">
        <a className="card" href="/messages/media"><h3 style={{ marginTop: 0 }}>Chat Media URL</h3><div className="muted">Esempio signed URL</div></a>
      </div>
    </div>
  );
}
