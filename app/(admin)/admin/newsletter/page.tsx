"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";

type Campaign = any;

export default function NewsletterStudioPage() {
  const { user, idToken } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selected, setSelected] = useState<Campaign | null>(null);

  async function load() {
    const r = await fetch("/api/newsletter/campaigns", { headers: idToken ? { Authorization: `Bearer ${idToken}` } : {} });
    const j = await r.json();
    setCampaigns(j.campaigns ?? []);
    if (!selected && j.campaigns?.length) setSelected(j.campaigns[0]);
  }

  useEffect(() => { load(); }, [idToken]);

  const can = user?.isAdmin;

  return (
    <div className="card">
      <h1 style={{ marginTop: 0 }}>Newsletter Studio</h1>
      <p className="muted">Editor HTML + scheduling + dispatch via cron endpoint.</p>

      {!can ? (
        <div className="card" style={{ borderColor: "rgba(255,77,109,0.5)" }}>
          <h3 style={{ marginTop: 0 }}>Accesso negato</h3>
          <p className="muted">Devi essere admin.</p>
        </div>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: "320px 1fr" }}>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Campagne</h3>
            <button className="btn" onClick={async () => {
              const r = await fetch("/api/newsletter/campaigns", {
                method: "POST",
                headers: { "content-type": "application/json", ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}) },
                body: JSON.stringify({ subject: "Nuova campagna", html: "<h1>Hello</h1><p>Contenuto…</p>" }),
              });
              const j = await r.json();
              alert(JSON.stringify(j));
              await load();
            }}>+ Nuova</button>
            <hr />
            <div style={{ display: "grid", gap: 10 }}>
              {campaigns.map((c) => (
                <button key={c.id} className="btn" onClick={() => setSelected(c)} style={{ justifyContent: "space-between" }}>
                  <span>{c.subject || "(senza subject)"}</span>
                  <span className="badge">{c.status}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            {!selected ? <div className="muted">Seleziona una campagna…</div> : (
              <CampaignEditor campaign={selected} idToken={idToken} onSaved={load} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CampaignEditor({ campaign, idToken, onSaved }: { campaign: any; idToken: string | null; onSaved: () => void }) {
  const [subject, setSubject] = useState(campaign.subject ?? "");
  const [html, setHtml] = useState(campaign.html ?? "");
  const [include, setInclude] = useState<string>(campaign.audience?.include?.[0] ?? "all");
  const [marketing, setMarketing] = useState<boolean>(Boolean(campaign.audience?.marketing));
  const [scheduledAt, setScheduledAt] = useState<string>(campaign.scheduledAt ?? "");

  const locked = campaign.status === "sending" || campaign.status === "sent";

  async function save(status?: string) {
    const r = await fetch("/api/newsletter/campaigns", {
      method: "PUT",
      headers: { "content-type": "application/json", ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}) },
      body: JSON.stringify({
        id: campaign.id,
        subject,
        html,
        status: status ?? campaign.status,
        audience: { include: [include], excludeBanned: true, marketing },
        scheduledAt: scheduledAt || null,
      }),
    });
    const j = await r.json();
    alert(JSON.stringify(j));
    await onSaved();
  }

  return (
    <div>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h3 style={{ marginTop: 0 }}>Editor</h3>
        <span className="badge">{campaign.status}</span>
      </div>

      <div className="grid">
        <div>
          <div className="muted">Subject</div>
          <input value={subject} disabled={locked} onChange={(e) => setSubject(e.target.value)} />
        </div>
        <div>
          <div className="muted">Audience</div>
          <select value={include} disabled={locked} onChange={(e) => setInclude(e.target.value)}>
            <option value="all">all</option>
            <option value="subscribers_active">subscribers_active</option>
            <option value="non_subscribers">non_subscribers</option>
          </select>
        </div>
        <div>
          <div className="muted">Marketing (GDPR opt-in)</div>
          <select value={marketing ? "true" : "false"} disabled={locked} onChange={(e) => setMarketing(e.target.value === "true")}>
            <option value="false">false</option>
            <option value="true">true</option>
          </select>
        </div>
        <div>
          <div className="muted">ScheduledAt (Europe/Rome)</div>
          <input value={scheduledAt} disabled={locked} placeholder="2026-01-01T09:00:00+01:00" onChange={(e) => setScheduledAt(e.target.value)} />
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <div className="muted">HTML</div>
        <textarea value={html} disabled={locked} onChange={(e) => setHtml(e.target.value)} />
      </div>

      <div className="row" style={{ marginTop: 12 }}>
        <button className="btn primary" disabled={locked} onClick={() => save()}>Salva</button>
        <button className="btn" disabled={locked} onClick={() => save("scheduled")}>Schedule</button>
        <button className="btn danger" disabled={locked} onClick={async () => {
          setScheduledAt(new Date().toISOString());
          await save("scheduled");
        }}>Invia subito</button>
      </div>

      <hr />

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Preview</h3>
        <div className="muted">In produzione: preview desktop/mobile più fedele.</div>
        <div className="card" style={{ background: "white", color: "black" }} dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  );
}
