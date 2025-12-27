export default function PricingPage() {
  return (
    <div className="card">
      <h1 style={{ marginTop: 0 }}>Pricing</h1>
      <p className="muted">In DEMO i pulsanti non creano un checkout reale. In REAL usa Stripe.</p>
      <div className="grid" style={{ marginTop: 12 }}>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Mensile</h3>
          <p className="muted">Accesso completo + community + commenti + leaderboard</p>
          <button className="btn primary" onClick={async () => {
            const r = await fetch("/api/stripe/create-checkout", { method: "POST" });
            const j = await r.json();
            alert(j.url ? `Redirect: ${j.url}` : JSON.stringify(j));
          }}>Abbonati</button>
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Annuale</h3>
          <p className="muted">Sconto annuale + badge “Founder”</p>
          <button className="btn primary" onClick={async () => {
            const r = await fetch("/api/stripe/create-checkout", { method: "POST", headers: { "x-plan": "yearly" } });
            const j = await r.json();
            alert(j.url ? `Redirect: ${j.url}` : JSON.stringify(j));
          }}>Abbonati</button>
        </div>
      </div>
    </div>
  );
}
