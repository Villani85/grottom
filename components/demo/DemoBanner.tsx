import { isDemoMode } from "@/lib/env";

export function DemoBanner() {
  if (!isDemoMode()) return null;

  return (
    <div style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(124,92,255,0.18)", borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
      <div className="container" style={{ paddingTop: 10, paddingBottom: 10 }}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <span className="badge">DEMO MODE — i dati possono non essere salvati</span>
          <a className="btn" href="/admin/settings">Apri Settings</a>
        </div>
      </div>
    </div>
  );
}
