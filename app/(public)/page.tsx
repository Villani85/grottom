import { isDemoMode } from "@/lib/env";

export default function HomePage() {
  return (
    <div className="grid">
      <div className="card">
        <h1 style={{ marginTop: 0 }}>Membership Gamificata (V0-Friendly)</h1>
        <p className="muted">UI pronta, build stabile, DEMO mode automatico, API endpoint per cron/webhook.</p>
        <div className="row" style={{ marginTop: 12 }}>
          <a className="btn primary" href="/dashboard">Entra nella Dashboard</a>
          <a className="btn" href="/pricing">Vedi Pricing</a>
        </div>
        <hr />
        <div className="badge">Stato: {isDemoMode() ? "DEMO" : "REAL"}</div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Pagine incluse</h3>
        <ul className="muted">
          <li>Pubblico: Home, Pricing, Gamification</li>
          <li>Auth: Login, Register, Reset Password</li>
          <li>Area Membro: Dashboard, Corsi, Community, Messages, Giochi, Leaderboard, Profile</li>
          <li>Admin: Users, Courses, Newsletter Studio, Settings</li>
        </ul>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>API incluse</h3>
        <ul className="muted">
          <li>/api/health</li>
          <li>/api/me</li>
          <li>/api/points</li>
          <li>/api/comments</li>
          <li>/api/video-url, /api/chat-media-url</li>
          <li>/api/admin/settings, /api/admin/users</li>
          <li>/api/newsletter/campaigns</li>
          <li>/api/cron/newsletter-dispatch, /api/cron/publish-scheduled</li>
          <li>/api/webhooks/stripe</li>
        </ul>
      </div>
    </div>
  );
}
