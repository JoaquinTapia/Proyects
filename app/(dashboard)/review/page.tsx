"use client";
import { useState, useEffect } from "react";

const STAR_LABELS = ["Muy malo", "Malo", "Regular", "Bueno", "Excelente"];

export default function ReviewPage() {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/reviews").then(() => {}); // solo para precalentar, no bloquea nada
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, comment }),
    });
    setSaving(false);
    if (!res.ok) { const d = await res.json(); setError(d.error || "Error al guardar"); return; }
    setDone(true);
  }

  return (
    <div style={{ maxWidth: 500, margin: "0 auto", padding: "32px 28px 80px" }}>
      <div style={{ fontFamily: "monospace", fontSize: 12, color: "#d8a33d", textTransform: "uppercase" }}>
        dejar una reseña
      </div>
      <h1 style={{ fontSize: 22, margin: "6px 0 8px" }}>¿Qué te ha parecido TalentIA?</h1>
      <p style={{ color: "#8ba396", fontSize: 13, marginBottom: 24 }}>
        Tu reseña se muestra en la página de inicio pública para otras personas que estén evaluando usar la app.
      </p>

      {done ? (
        <div style={{ color: "#4fb3a9", fontSize: 14 }}>✓ ¡Gracias! Tu reseña quedó guardada y visible en la página de inicio.</div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
            {[1, 2, 3, 4, 5].map(n => (
              <button type="button" key={n} onClick={() => setRating(n)} style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 28, color: n <= rating ? "#d8a33d" : "#3a453f",
              }}>★</button>
            ))}
          </div>
          <div style={{ color: "#8ba396", fontSize: 12, marginBottom: 18 }}>{STAR_LABELS[rating - 1]}</div>

          <textarea
            value={comment} onChange={e => setComment(e.target.value)} required
            placeholder="Cuenta tu experiencia usando la app..."
            style={{
              width: "100%", minHeight: 140, background: "#0f1512", border: "1px solid #2a352f",
              borderRadius: 8, padding: 12, color: "#e8ede9", fontSize: 14, outline: "none",
            }}
          />

          {error && <div style={{ color: "#c1595a", fontSize: 13, marginTop: 10 }}>{error}</div>}

          <button type="submit" disabled={saving} style={{
            marginTop: 16, padding: 12, borderRadius: 8, border: "none", width: "100%",
            background: "#d8a33d", color: "#20180a", fontWeight: 700, cursor: "pointer",
          }}>{saving ? "Guardando…" : "Publicar reseña"}</button>
        </form>
      )}
    </div>
  );
}
