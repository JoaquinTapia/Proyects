"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const inputStyle: React.CSSProperties = {
  background: "#0f1512", border: "1px solid #2a352f", borderRadius: 8,
  padding: "10px 12px", color: "#e8ede9", fontSize: 14, outline: "none", width: "100%",
};
const labelStyle: React.CSSProperties = {
  fontFamily: "monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em",
  color: "#8ba396", marginBottom: 6, display: "block",
};

export default function AgregarOfertaPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    role: "", company: "", apply_url: "", location: "", work_mode: "remote_worldwide", description: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error || "Error al guardar"); return; }
    setDone(true);
    setTimeout(() => router.push("/tracker"), 900);
  }

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "32px 28px 80px" }}>
      <div style={{ fontFamily: "monospace", fontSize: 12, color: "#d8a33d", textTransform: "uppercase" }}>
        agregar oferta manual
      </div>
      <h1 style={{ fontSize: 22, margin: "6px 0 8px" }}>Agrega una oferta que encontraste</h1>
      <p style={{ color: "#8ba396", fontSize: 13, marginBottom: 24, lineHeight: 1.5 }}>
        Útil para ofertas de LinkedIn u otros sitios que el buscador automático no cubre.
        Copia y pega el texto de la descripción — con eso calculamos tu match y podemos generar el CV/carta adaptados.
      </p>

      {error && <div style={{ color: "#c1595a", marginBottom: 16, fontSize: 13 }}>{error}</div>}
      {done && <div style={{ color: "#4fb3a9", marginBottom: 16, fontSize: 13 }}>✓ Agregada, redirigiendo al tracker…</div>}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={labelStyle}>Rol</label>
          <input style={inputStyle} required value={form.role} onChange={e => set("role", e.target.value)} placeholder="Senior Data Engineer" />
        </div>
        <div>
          <label style={labelStyle}>Empresa</label>
          <input style={inputStyle} required value={form.company} onChange={e => set("company", e.target.value)} placeholder="MPS Group LLC" />
        </div>
        <div>
          <label style={labelStyle}>Link de la publicación</label>
          <input style={inputStyle} required type="url" value={form.apply_url} onChange={e => set("apply_url", e.target.value)} placeholder="https://linkedin.com/jobs/view/..." />
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Ubicación</label>
            <input style={inputStyle} value={form.location} onChange={e => set("location", e.target.value)} placeholder="México / Remoto" />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Modalidad</label>
            <select style={inputStyle} value={form.work_mode} onChange={e => set("work_mode", e.target.value)}>
              <option value="remote_worldwide">Remoto (cualquier país)</option>
              <option value="remote_local">Remoto (mi país)</option>
              <option value="hybrid">Híbrido</option>
              <option value="onsite">Presencial</option>
            </select>
          </div>
        </div>
        <div>
          <label style={labelStyle}>Descripción de la oferta (pégala completa)</label>
          <textarea style={{ ...inputStyle, minHeight: 180, fontFamily: "monospace", fontSize: 12 }}
            value={form.description} onChange={e => set("description", e.target.value)}
            placeholder="Pega aquí el texto completo de la publicación..." />
        </div>

        <button type="submit" disabled={saving} style={{
          padding: 12, borderRadius: 8, border: "none", background: "#d8a33d",
          color: "#20180a", fontWeight: 700, cursor: "pointer",
        }}>{saving ? "Guardando…" : "Agregar al tracker"}</button>
      </form>
    </div>
  );
}
