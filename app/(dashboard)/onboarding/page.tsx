"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const inputStyle: React.CSSProperties = {
  background: "#0f1512", border: "1px solid #2a352f", borderRadius: 8,
  padding: "10px 12px", color: "#e8ede9", fontSize: 14, outline: "none", width: "100%",
};
const labelStyle: React.CSSProperties = {
  fontFamily: "monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em",
  color: "#8ba396", marginBottom: 6, display: "block",
};
const fieldWrap: React.CSSProperties = { marginBottom: 16 };

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cvUploading, setCvUploading] = useState(false);
  const [cvExtracted, setCvExtracted] = useState<string | null>(null);

  const [form, setForm] = useState({
    full_name: "", headline: "", phone: "", location: "", linkedin_url: "", country: "",
    years_experience: "", cv_summary: "",
    target_roles: "", work_mode: "remote_worldwide", min_salary: "", currency: "USD",
    seniority: "mid", preferred_countries: "",
  });

  useEffect(() => {
    fetch("/api/profile").then(r => r.json()).then(({ profile, preferences }) => {
      if (profile) setForm(f => ({
        ...f,
        full_name: profile.full_name || "", headline: profile.headline || "",
        phone: profile.phone || "", location: profile.location || "",
        linkedin_url: profile.linkedin_url || "", country: profile.country || "",
        years_experience: profile.years_experience?.toString() || "",
        cv_summary: profile.cv_summary || "",
      }));
      if (preferences) setForm(f => ({
        ...f,
        target_roles: (preferences.target_roles || []).join(", "),
        work_mode: preferences.work_mode || "remote_worldwide",
        min_salary: preferences.min_salary?.toString() || "",
        currency: preferences.currency || "USD",
        seniority: preferences.seniority || "mid",
        preferred_countries: (preferences.preferred_countries || []).join(", "),
      }));
    });
  }, []);

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleCvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCvUploading(true);
    setError(null);
    const fd = new FormData();
    fd.append("cv", file);
    const res = await fetch("/api/cv-upload", { method: "POST", body: fd });
    const data = await res.json();
    setCvUploading(false);
    if (!res.ok) { setError(data.error || "Error al subir el CV"); return; }
    setCvExtracted(data.extractedText);
    set("cv_summary", data.extractedText);
  }

  async function handleFinish() {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profile: {
          full_name: form.full_name, headline: form.headline, phone: form.phone,
          location: form.location, linkedin_url: form.linkedin_url, country: form.country,
          years_experience: form.years_experience ? parseInt(form.years_experience) : null,
          cv_summary: form.cv_summary,
        },
        preferences: {
          target_roles: form.target_roles.split(",").map(s => s.trim()).filter(Boolean),
          work_mode: form.work_mode,
          min_salary: form.min_salary ? parseFloat(form.min_salary) : null,
          currency: form.currency,
          seniority: form.seniority,
          preferred_countries: form.preferred_countries.split(",").map(s => s.trim()).filter(Boolean),
        },
      }),
    });
    setSaving(false);
    if (!res.ok) { const d = await res.json(); setError(d.error || "Error al guardar"); return; }
    router.push("/tracker");
    router.refresh();
  }

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "40px 20px 80px" }}>
      <div style={{ fontFamily: "monospace", fontSize: 12, color: "#d8a33d", textTransform: "uppercase" }}>
        configuración inicial · paso {step} de 3
      </div>
      <h1 style={{ fontSize: 24, margin: "6px 0 24px" }}>
        {step === 1 && "Cuéntanos sobre ti"}
        {step === 2 && "Sube tu CV"}
        {step === 3 && "¿Qué trabajo buscas?"}
      </h1>

      {error && <div style={{ color: "#c1595a", marginBottom: 16, fontSize: 13 }}>{error}</div>}

      {step === 1 && (
        <div>
          <div style={fieldWrap}>
            <label style={labelStyle}>Nombre completo</label>
            <input style={inputStyle} value={form.full_name} onChange={e => set("full_name", e.target.value)} />
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>Título profesional (ej: Data Engineer)</label>
            <input style={inputStyle} value={form.headline} onChange={e => set("headline", e.target.value)} />
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>Años de experiencia</label>
            <input style={inputStyle} type="number" value={form.years_experience} onChange={e => set("years_experience", e.target.value)} />
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>Teléfono</label>
            <input style={inputStyle} value={form.phone} onChange={e => set("phone", e.target.value)} />
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>Ubicación</label>
            <input style={inputStyle} value={form.location} onChange={e => set("location", e.target.value)} />
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>País (nacionalidad / residencia legal) — usado para filtrar ofertas que exigen visa de otro país</label>
            <input style={inputStyle} value={form.country} onChange={e => set("country", e.target.value)} placeholder="Chile" />
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>URL de tu LinkedIn</label>
            <input style={inputStyle} value={form.linkedin_url} onChange={e => set("linkedin_url", e.target.value)} />
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <div style={fieldWrap}>
            <label style={labelStyle}>Sube tu CV en PDF</label>
            <input type="file" accept="application/pdf" onChange={handleCvUpload} style={{ color: "#e8ede9" }} />
            {cvUploading && <div style={{ color: "#8ba396", fontSize: 13, marginTop: 8 }}>Leyendo tu CV…</div>}
            {cvExtracted && <div style={{ color: "#4fb3a9", fontSize: 13, marginTop: 8 }}>✓ Texto extraído correctamente. Revísalo abajo y ajústalo si hace falta.</div>}
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>Resumen / experiencia (extraído de tu CV, edítalo si quieres)</label>
            <textarea style={{ ...inputStyle, minHeight: 220, fontFamily: "monospace", fontSize: 12 }}
              value={form.cv_summary} onChange={e => set("cv_summary", e.target.value)} />
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <div style={fieldWrap}>
            <label style={labelStyle}>Roles que buscas (separados por coma)</label>
            <input style={inputStyle} placeholder="Data Engineer, ML Engineer, Analytics Lead"
              value={form.target_roles} onChange={e => set("target_roles", e.target.value)} />
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>Modalidad</label>
            <select style={inputStyle} value={form.work_mode} onChange={e => set("work_mode", e.target.value)}>
              <option value="remote_worldwide">Remoto (cualquier país)</option>
              <option value="remote_local">Remoto (mi país)</option>
              <option value="hybrid">Híbrido</option>
              <option value="onsite">Presencial</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ ...fieldWrap, flex: 1 }}>
              <label style={labelStyle}>Salario mínimo esperado</label>
              <input style={inputStyle} type="number" value={form.min_salary} onChange={e => set("min_salary", e.target.value)} />
            </div>
            <div style={{ ...fieldWrap, width: 100 }}>
              <label style={labelStyle}>Moneda</label>
              <select style={inputStyle} value={form.currency} onChange={e => set("currency", e.target.value)}>
                <option value="USD">USD</option>
                <option value="CLP">CLP</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>Nivel de seniority</label>
            <select style={inputStyle} value={form.seniority} onChange={e => set("seniority", e.target.value)}>
              <option value="junior">Junior</option>
              <option value="mid">Semi-senior</option>
              <option value="senior">Senior</option>
              <option value="lead">Lead</option>
            </select>
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>Países preferidos (opcional, separados por coma)</label>
            <input style={inputStyle} placeholder="Chile, México, España"
              value={form.preferred_countries} onChange={e => set("preferred_countries", e.target.value)} />
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
        {step > 1 && (
          <button onClick={() => setStep(step - 1)} style={{
            flex: 1, padding: 12, borderRadius: 8, border: "1px solid #2a352f",
            background: "transparent", color: "#8ba396", cursor: "pointer",
          }}>Atrás</button>
        )}
        {step < 3 ? (
          <button onClick={() => setStep(step + 1)} style={{
            flex: 2, padding: 12, borderRadius: 8, border: "none",
            background: "#4fb3a9", color: "#08211d", fontWeight: 700, cursor: "pointer",
          }}>Siguiente</button>
        ) : (
          <button onClick={handleFinish} disabled={saving} style={{
            flex: 2, padding: 12, borderRadius: 8, border: "none",
            background: "#d8a33d", color: "#20180a", fontWeight: 700, cursor: "pointer",
          }}>{saving ? "Guardando…" : "Finalizar y ver mi tracker"}</button>
        )}
      </div>
    </div>
  );
}
