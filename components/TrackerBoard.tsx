"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Application = {
  id: string;
  status: "nuevo" | "revisando" | "postulado" | "descartado";
  match_reason: string | null;
  match_score: number | null;
  cover_letter: string | null;
  cv_tailored_url: string | null;
  ats_report: {
    ats_score_estimado: number;
    keywords_encontradas: string[];
    keywords_faltantes: string[];
    resumen_cambios: string[];
  } | null;
  job_postings: {
    role: string; company: string; apply_url: string; location: string | null;
  };
};

function StarRating({ score }: { score: number | null }) {
  if (score == null) return <span style={{ fontSize: 11, color: "#5a6e67" }}>Sin calcular</span>;
  const full = Math.floor(score);
  const half = score - full >= 0.5;
  const stars = Array.from({ length: 5 }, (_, i) => {
    if (i < full) return "★";
    if (i === full && half) return "⯨";
    return "☆";
  }).join("");
  return (
    <span style={{ fontFamily: "monospace", fontSize: 13, color: "#d8a33d" }}>
      {stars} <span style={{ color: "#8ba396", fontSize: 11 }}>{score.toFixed(1)}/5</span>
    </span>
  );
}

export default function TrackerBoard({
  initialApplications, profile, userEmail,
}: { initialApplications: Application[]; profile: any; userEmail: string }) {
  const [apps, setApps] = useState(initialApplications);
  const [filter, setFilter] = useState<string>("todos");
  const [searching, setSearching] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [openLetterId, setOpenLetterId] = useState<string | null>(null);
  const [openAtsId, setOpenAtsId] = useState<string | null>(null);
  const [openTimelineId, setOpenTimelineId] = useState<string | null>(null);
  const [events, setEvents] = useState<Record<string, any[]>>({});
  const [newEventType, setNewEventType] = useState("seguimiento");
  const [newEventDate, setNewEventDate] = useState(new Date().toISOString().slice(0, 10));
  const [newEventNotes, setNewEventNotes] = useState("");

  async function loadEvents(id: string) {
    const res = await fetch(`/api/applications/${id}/events`);
    const data = await res.json();
    if (data.events) setEvents(prev => ({ ...prev, [id]: data.events }));
  }

  async function toggleTimeline(id: string) {
    if (openTimelineId === id) { setOpenTimelineId(null); return; }
    setOpenTimelineId(id);
    if (!events[id]) await loadEvents(id);
  }

  async function addEvent(id: string) {
    if (!newEventNotes.trim() && newEventType === "nota") return;
    const res = await fetch(`/api/applications/${id}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_type: newEventType, event_date: newEventDate, notes: newEventNotes }),
    });
    if (res.ok) {
      setNewEventNotes("");
      await loadEvents(id);
    }
  }
  const [notice, setNotice] = useState<string | null>(null);
  const router = useRouter();

  async function updateStatus(id: string, status: string) {
    setApps(prev => prev.map(a => a.id === id ? { ...a, status: status as any } : a));
    await fetch(`/api/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  async function handleSearchJobs() {
    setSearching(true);
    setNotice(null);
    const res = await fetch("/api/search-jobs", { method: "POST" });
    const data = await res.json();
    setSearching(false);
    if (!res.ok) { setNotice("Error: " + (data.error || "no se pudo buscar")); return; }
    const sourceInfo = data.bySource ? Object.entries(data.bySource).map(([s, n]) => `${s}: ${n}`).join(", ") : "";
    const visaInfo = data.excludedByVisa ? ` — 🛂 ${data.excludedByVisa} descartadas por visa` : "";
    const relevanceInfo = data.excludedByRelevance ? ` — 🎯 ${data.excludedByRelevance} descartadas por no ser relevantes` : "";
    const errorInfo = data.errors?.length ? ` — ⚠️ ${data.errors.length} errores (revisa la terminal)` : "";
    setNotice(`Se agregaron ${data.inserted} ofertas nuevas. ${sourceInfo}${visaInfo}${relevanceInfo}${errorInfo}`);
    const r2 = await fetch("/api/applications");
    const d2 = await r2.json();
    if (d2.applications) setApps(d2.applications);
  }

  async function handleGenerate(id: string) {
    setGeneratingId(id);
    setNotice(null);
    const res = await fetch(`/api/generate-application/${id}`, { method: "POST" });
    const data = await res.json();
    setGeneratingId(null);
    if (!res.ok) { setNotice("Error: " + (data.error || "no se pudo generar")); return; }
    setApps(prev => prev.map(a => a.id === id
      ? { ...a, cover_letter: data.coverLetter, cv_tailored_url: "listo", ats_report: data.ats_report || null }
      : a));
    setOpenLetterId(id);
  }

  async function handleDownload(id: string) {
    const res = await fetch(`/api/cv-download/${id}`);
    const data = await res.json();
    if (!res.ok) { setNotice("Error: " + (data.error || "sin CV generado aún")); return; }
    window.open(data.url, "_blank");
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta postulación del tracker?")) return;
    setApps(prev => prev.filter(a => a.id !== id));
    await fetch(`/api/applications/${id}`, { method: "DELETE" });
  }

  const filtered = (filter === "todos" ? apps : apps.filter(a => a.status === filter))
    .slice()
    .sort((a, b) => (b.match_score ?? -1) - (a.match_score ?? -1));
  const counts = { nuevo: 0, revisando: 0, postulado: 0, descartado: 0 } as Record<string, number>;
  apps.forEach(a => counts[a.status]++);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 28px 80px" }}>
      <style>{`
        .job-card {
          transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
        }
        .job-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.35);
          border-color: #3a4a43 !important;
        }
      `}</style>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: "monospace", fontSize: 12, color: "#d8a33d", textTransform: "uppercase" }}>
          pipeline / postulaciones
        </div>
        <h1 style={{ fontSize: 22, margin: "4px 0" }}>Hola, {profile?.full_name || userEmail}</h1>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        <button onClick={handleSearchJobs} disabled={searching} style={{
          fontFamily: "monospace", fontSize: 13, padding: "9px 16px", borderRadius: 8,
          background: "#4fb3a9", color: "#08211d", border: "none", cursor: "pointer", fontWeight: 700,
        }}>{searching ? "Buscando…" : "🔍 Buscar ofertas nuevas"}</button>
        {notice && <span style={{ fontSize: 12, color: "#8ba396" }}>{notice}</span>}
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        {["todos", "nuevo", "revisando", "postulado", "descartado"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            fontFamily: "monospace", fontSize: 12, padding: "7px 12px", borderRadius: 20,
            border: "1px solid #2a352f", cursor: "pointer",
            background: filter === f ? "#d8a33d" : "transparent",
            color: filter === f ? "#20180a" : "#8ba396",
            fontWeight: filter === f ? 700 : 400,
          }}>{f} {f !== "todos" ? `(${counts[f] || 0})` : `(${apps.length})`}</button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: 60, color: "#8ba396" }}>
          Aún no hay postulaciones en este filtro. Haz clic en "Buscar ofertas nuevas".
        </div>
      )}

      {filtered.map(app => (
        <div key={app.id} className="job-card" style={{
          background: "#161d19", border: "1px solid #2a352f", borderRadius: 10,
          padding: "18px 20px", marginBottom: 12,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ fontWeight: 700, margin: 0, fontSize: 16 }}>{app.job_postings.role}</p>
              <div style={{ color: "#8ba396", fontSize: 13 }}>{app.job_postings.company}</div>
            </div>
            <StarRating score={app.match_score} />
          </div>
          {app.match_reason && (
            <div style={{ fontSize: 13, margin: "10px 0", paddingLeft: 12, borderLeft: "2px solid #2a352f" }}>
              {app.match_reason}
            </div>
          )}

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
            <button onClick={() => handleGenerate(app.id)} disabled={generatingId === app.id} style={{
              fontFamily: "monospace", fontSize: 11, color: "#d8a33d", background: "none",
              border: "1px dashed #d8a33d", borderRadius: 6, padding: "5px 10px", cursor: "pointer",
            }}>
              {generatingId === app.id ? "Generando con IA…" : "✨ Generar CV + carta"}
            </button>
            {app.cv_tailored_url && (
              <button onClick={() => handleDownload(app.id)} style={{
                fontFamily: "monospace", fontSize: 11, color: "#4fb3a9", background: "none",
                border: "1px dashed #4fb3a9", borderRadius: 6, padding: "5px 10px", cursor: "pointer",
              }}>⬇ Descargar CV en PDF</button>
            )}
            {app.cover_letter && (
              <button onClick={() => setOpenLetterId(openLetterId === app.id ? null : app.id)} style={{
                fontFamily: "monospace", fontSize: 11, color: "#8ba396", background: "none",
                border: "1px solid #2a352f", borderRadius: 6, padding: "5px 10px", cursor: "pointer",
              }}>{openLetterId === app.id ? "Ocultar carta" : "Ver carta"}</button>
            )}
            {app.ats_report && (
              <button onClick={() => setOpenAtsId(openAtsId === app.id ? null : app.id)} style={{
                fontFamily: "monospace", fontSize: 11, color: "#4fb3a9", background: "none",
                border: "1px solid #2a352f", borderRadius: 6, padding: "5px 10px", cursor: "pointer",
              }}>{openAtsId === app.id ? "Ocultar análisis ATS" : `📊 Análisis ATS (${app.ats_report.ats_score_estimado}/100)`}</button>
            )}
            <button onClick={() => handleDelete(app.id)} style={{
              fontFamily: "monospace", fontSize: 11, color: "#c1595a", background: "none",
              border: "1px solid #c1595a", borderRadius: 6, padding: "5px 10px", cursor: "pointer",
            }}>🗑 Eliminar</button>
            <button onClick={() => toggleTimeline(app.id)} style={{
              fontFamily: "monospace", fontSize: 11, color: "#8ba396", background: "none",
              border: "1px solid #2a352f", borderRadius: 6, padding: "5px 10px", cursor: "pointer",
            }}>📅 Seguimiento {events[app.id]?.length ? `(${events[app.id].length})` : ""}</button>
          </div>

          {openTimelineId === app.id && (
            <div style={{
              background: "#0f1512", border: "1px solid #2a352f", borderRadius: 8,
              padding: 14, marginTop: 8, fontSize: 12.5,
            }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
                <select value={newEventType} onChange={e => setNewEventType(e.target.value)} style={{
                  background: "#1c2420", color: "#e8ede9", border: "1px solid #2a352f",
                  borderRadius: 6, padding: "6px 8px", fontSize: 12,
                }}>
                  <option value="postulado">Postulado</option>
                  <option value="entrevista">Entrevista</option>
                  <option value="rechazo">Rechazo</option>
                  <option value="oferta">Oferta recibida</option>
                  <option value="seguimiento">Seguimiento</option>
                  <option value="nota">Nota</option>
                </select>
                <input type="date" value={newEventDate} onChange={e => setNewEventDate(e.target.value)} style={{
                  background: "#1c2420", color: "#e8ede9", border: "1px solid #2a352f",
                  borderRadius: 6, padding: "6px 8px", fontSize: 12,
                }} />
                <input placeholder="Nota (opcional)" value={newEventNotes} onChange={e => setNewEventNotes(e.target.value)} style={{
                  background: "#1c2420", color: "#e8ede9", border: "1px solid #2a352f",
                  borderRadius: 6, padding: "6px 8px", fontSize: 12, flex: 1, minWidth: 140,
                }} />
                <button onClick={() => addEvent(app.id)} style={{
                  background: "#4fb3a9", color: "#08211d", border: "none", borderRadius: 6,
                  padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer",
                }}>+ Agregar</button>
              </div>

              {events[app.id]?.length ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {events[app.id].map((ev: any) => (
                    <div key={ev.id} style={{
                      display: "flex", gap: 8, alignItems: "baseline",
                      borderLeft: "2px solid #2a352f", paddingLeft: 10,
                    }}>
                      <span style={{ fontFamily: "monospace", fontSize: 11, color: "#8ba396", minWidth: 82 }}>{ev.event_date}</span>
                      <span style={{
                        fontSize: 11, fontFamily: "monospace", textTransform: "uppercase",
                        color: ev.event_type === "rechazo" ? "#c1595a" : ev.event_type === "oferta" ? "#4fb3a9" : "#d8a33d",
                      }}>{ev.event_type}</span>
                      {ev.notes && <span style={{ color: "#e8ede9" }}>{ev.notes}</span>}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: "#5a6e67", fontSize: 12 }}>Sin eventos registrados todavía.</div>
              )}
            </div>
          )}

          {openAtsId === app.id && app.ats_report && (
            <div style={{
              background: "#0f1512", border: "1px solid #2a352f", borderRadius: 8,
              padding: 14, marginTop: 8, fontSize: 12.5,
            }}>
              <div style={{ marginBottom: 10 }}>
                <span style={{ fontFamily: "monospace", color: "#8ba396" }}>Puntaje ATS estimado: </span>
                <span style={{
                  fontFamily: "monospace", fontWeight: 700,
                  color: app.ats_report.ats_score_estimado >= 75 ? "#4fb3a9" : app.ats_report.ats_score_estimado >= 50 ? "#d8a33d" : "#c1595a",
                }}>{app.ats_report.ats_score_estimado}/100</span>
              </div>
              {app.ats_report.keywords_encontradas?.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ color: "#8ba396", fontSize: 11, marginBottom: 4, fontFamily: "monospace" }}>✓ PALABRAS CLAVE ENCONTRADAS</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {app.ats_report.keywords_encontradas.map((k, i) => (
                      <span key={i} style={{ background: "#1c2420", color: "#4fb3a9", fontSize: 11, padding: "3px 8px", borderRadius: 10 }}>{k}</span>
                    ))}
                  </div>
                </div>
              )}
              {app.ats_report.keywords_faltantes?.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ color: "#8ba396", fontSize: 11, marginBottom: 4, fontFamily: "monospace" }}>✗ FALTAN EN TU PERFIL</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {app.ats_report.keywords_faltantes.map((k, i) => (
                      <span key={i} style={{ background: "#1c2420", color: "#c1595a", fontSize: 11, padding: "3px 8px", borderRadius: 10 }}>{k}</span>
                    ))}
                  </div>
                </div>
              )}
              {app.ats_report.resumen_cambios?.length > 0 && (
                <div>
                  <div style={{ color: "#8ba396", fontSize: 11, marginBottom: 4, fontFamily: "monospace" }}>CAMBIOS REALIZADOS</div>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {app.ats_report.resumen_cambios.map((c, i) => <li key={i} style={{ marginBottom: 2 }}>{c}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}

          {openLetterId === app.id && app.cover_letter && (
            <div style={{
              fontSize: 12.5, lineHeight: 1.6, whiteSpace: "pre-wrap", background: "#0f1512",
              border: "1px solid #2a352f", borderRadius: 8, padding: 14, marginTop: 8,
            }}>{app.cover_letter}</div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, gap: 10, flexWrap: "wrap" }}>
            <select value={app.status} onChange={e => updateStatus(app.id, e.target.value)} style={{
              fontFamily: "monospace", fontSize: 12, background: "#1c2420", color: "#e8ede9",
              border: "1px solid #2a352f", borderRadius: 6, padding: "6px 8px",
            }}>
              <option value="nuevo">Nuevo</option>
              <option value="revisando">Revisando</option>
              <option value="postulado">Postulado</option>
              <option value="descartado">Descartado</option>
            </select>
            <a href={app.job_postings.apply_url} target="_blank" rel="noopener noreferrer" style={{
              fontFamily: "monospace", fontSize: 12, padding: "7px 14px", borderRadius: 6,
              background: "#d8a33d", color: "#20180a", fontWeight: 700, textDecoration: "none",
            }}>Ir a postular →</a>
          </div>
        </div>
      ))}
    </div>
  );
}
