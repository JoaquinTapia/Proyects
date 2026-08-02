import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/tracker");

  const { data: reviews } = await supabase
    .from("reviews")
    .select("rating, comment, profiles(full_name, headline)")
    .order("created_at", { ascending: false })
    .limit(6);

  const reviewCount = reviews?.length ?? 0;
  const avgRating = reviewCount > 0
    ? (reviews!.reduce((sum, r) => sum + r.rating, 0) / reviewCount).toFixed(1)
    : null;

  return (
    <div style={{ position: "relative" }}>
      {/* NAV */}
      <div style={{
        position: "sticky", top: 0, zIndex: 20, backdropFilter: "blur(10px)",
        background: "rgba(15,21,18,0.85)", borderBottom: "1px solid #1e2a24",
      }}>
        <nav style={{
          maxWidth: 1080, margin: "0 auto", padding: "16px 24px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <Logo size={24} />
          <div style={{ display: "flex", gap: 10 }}>
            <Link href="/login" style={navBtnGhost}>Iniciar sesión</Link>
            <Link href="/signup" style={navBtnSolid}>Crear cuenta</Link>
          </div>
        </nav>
      </div>

      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 24px" }}>
        {/* HERO */}
        <section style={{ padding: "72px 0 40px", textAlign: "center" }}>
          {avgRating && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "monospace",
              fontSize: 12, color: "#d8a33d", border: "1px solid #2a352f", borderRadius: 20,
              padding: "6px 16px", marginBottom: 24, background: "#141a17",
            }}>
              <span>{"★".repeat(Math.round(Number(avgRating)))}{"☆".repeat(5 - Math.round(Number(avgRating)))}</span>
              <span style={{ color: "#8ba396" }}>{avgRating}/5 según {reviewCount} reseña{reviewCount !== 1 ? "s" : ""}</span>
            </div>
          )}
          <h1 style={{
            fontSize: "clamp(34px, 5.5vw, 56px)", lineHeight: 1.06, fontWeight: 800,
            margin: "0 0 20px", letterSpacing: "-0.02em",
          }}>
            Tu búsqueda de trabajo,<br />
            <span style={{
              background: "linear-gradient(90deg, #d8a33d, #4fb3a9)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>procesada como datos.</span>
          </h1>
          <p style={{ color: "#8ba396", fontSize: 17, maxWidth: 560, margin: "0 auto 32px", lineHeight: 1.55 }}>
            TalentIA busca ofertas en varios portales a la vez, filtra lo que realmente calza con tu perfil
            usando IA, y te prepara un CV y una carta adaptados — tú solo revisas y envías.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 12, flexWrap: "wrap" }}>
            <Link href="/signup" style={{ ...navBtnSolid, padding: "14px 28px", fontSize: 15 }}>Empezar gratis →</Link>
            <Link href="/login" style={{ ...navBtnGhost, padding: "14px 28px", fontSize: 15 }}>Ya tengo cuenta</Link>
          </div>
          <div style={{ color: "#5a6e67", fontSize: 12, marginBottom: 56 }}>Sin auto-postulación oculta — tú siempre apruebas antes de enviar.</div>

          <PipelineVisual />
        </section>

        {/* CÓMO FUNCIONA */}
        <section style={{ padding: "50px 0" }}>
          <SectionEyebrow>proceso</SectionEyebrow>
          <h2 style={{ textAlign: "center", fontSize: 26, marginBottom: 36 }}>Cómo funciona</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
            {STEPS.map((s, i) => (
              <div key={s.title} style={{ position: "relative", padding: "0 4px" }}>
                <div style={{
                  fontFamily: "monospace", fontSize: 13, color: "#0f1512", fontWeight: 700,
                  background: "#d8a33d", width: 28, height: 28, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14,
                }}>{i + 1}</div>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{s.title}</div>
                <div style={{ color: "#8ba396", fontSize: 13.5, lineHeight: 1.5 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* FEATURES */}
        <section style={{ padding: "50px 0" }}>
          <SectionEyebrow>funcionalidades</SectionEyebrow>
          <h2 style={{ textAlign: "center", fontSize: 26, marginBottom: 36 }}>Todo lo que necesitas, en un solo lugar</h2>
          <style>{`.feature-card{transition:transform .18s ease,border-color .18s ease;}.feature-card:hover{transform:translateY(-4px);border-color:#3a4a43;}`}</style>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 16 }}>
            {FEATURES.map(f => (
              <div key={f.title} className="feature-card" style={{
                background: "#161d19", border: "1px solid #24352f", borderRadius: 12, padding: 22,
              }}>
                <div style={{ fontSize: 24, marginBottom: 10 }}>{f.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{f.title}</div>
                <div style={{ color: "#8ba396", fontSize: 13, lineHeight: 1.5 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* REVIEWS */}
        {reviews && reviews.length > 0 && (
          <section style={{ padding: "50px 0" }}>
            <SectionEyebrow>lo que dicen quienes ya la usan</SectionEyebrow>
            <h2 style={{ textAlign: "center", fontSize: 26, marginBottom: 36 }}>Reseñas</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
              {reviews.map((r: any, i) => (
                <div key={i} style={{
                  background: "#161d19", border: "1px solid #24352f", borderRadius: 12, padding: 20,
                }}>
                  <div style={{ color: "#d8a33d", fontSize: 15, marginBottom: 10 }}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</div>
                  <div style={{ fontSize: 13.5, lineHeight: 1.55, color: "#e8ede9", marginBottom: 14 }}>"{r.comment}"</div>
                  <div style={{ fontSize: 12, color: "#8ba396" }}>
                    {r.profiles?.full_name || "Usuario de TalentIA"}{r.profiles?.headline ? ` · ${r.profiles.headline}` : ""}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* FAQ */}
        <section style={{ padding: "50px 0" }}>
          <SectionEyebrow>preguntas frecuentes</SectionEyebrow>
          <h2 style={{ textAlign: "center", fontSize: 26, marginBottom: 32 }}>¿Tienes dudas?</h2>
          <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", flexDirection: "column", gap: 10 }}>
            {FAQS.map((f, i) => (
              <details key={i} style={{
                background: "#161d19", border: "1px solid #24352f", borderRadius: 10, padding: "14px 18px",
              }}>
                <summary style={{ cursor: "pointer", fontWeight: 600, fontSize: 14 }}>{f.q}</summary>
                <p style={{ color: "#8ba396", fontSize: 13.5, lineHeight: 1.55, marginTop: 10, marginBottom: 0 }}>{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA FINAL */}
        <section style={{ padding: "60px 0 40px", textAlign: "center" }}>
          <div style={{
            background: "linear-gradient(135deg, #161d19, #10221e)", border: "1px solid #24352f",
            borderRadius: 16, padding: "48px 24px",
          }}>
            <h2 style={{ fontSize: 26, marginBottom: 10 }}>Deja que la búsqueda trabaje para ti</h2>
            <p style={{ color: "#8ba396", marginBottom: 24, fontSize: 14 }}>Gratis para empezar. Sin tarjeta de crédito.</p>
            <Link href="/signup" style={{ ...navBtnSolid, padding: "14px 28px", fontSize: 15 }}>Crear mi cuenta →</Link>
          </div>
        </section>

        <footer style={{ borderTop: "1px solid #24352f", padding: "24px 0", textAlign: "center", color: "#5a6e67", fontSize: 12 }}>
          talentIA — hecho con Next.js, Supabase y Claude.
        </footer>
      </div>
    </div>
  );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: "monospace", fontSize: 12, color: "#d8a33d", textTransform: "uppercase", marginBottom: 8, textAlign: "center", letterSpacing: "0.06em" }}>
      {children}
    </div>
  );
}

const navBtnGhost: React.CSSProperties = {
  fontFamily: "monospace", fontSize: 13, color: "#8ba396", textDecoration: "none",
  padding: "9px 16px", borderRadius: 8, border: "1px solid #2a352f",
};
const navBtnSolid: React.CSSProperties = {
  fontFamily: "monospace", fontSize: 13, color: "#20180a", textDecoration: "none",
  padding: "9px 16px", borderRadius: 8, background: "#d8a33d", fontWeight: 700,
};

const STEPS = [
  { title: "Cuéntale a la IA quién eres", desc: "Sube tu CV una vez — TalentIA extrae y estructura tu experiencia real, sin inventar nada." },
  { title: "Deja que busque por ti", desc: "Rastrea varias fuentes de empleo a la vez y descarta lo que no calza con tu perfil o tus restricciones." },
  { title: "Revisa y postula", desc: "CV adaptado, carta y análisis ATS listos por oferta. Tú decides cuál enviar, y cuándo." },
];

const FEATURES = [
  { icon: "🔍", title: "Búsqueda multi-fuente", desc: "Rastrea varios portales de empleo a la vez, sin que tengas que revisarlos uno por uno." },
  { icon: "🎯", title: "Filtro de relevancia", desc: "Descarta automáticamente ofertas que no calzan con tu perfil o que exigen visa que no tienes." },
  { icon: "✨", title: "CV + carta con IA", desc: "Adapta tu currículum real a cada oferta específica, optimizado para sistemas ATS." },
  { icon: "📊", title: "Análisis ATS", desc: "Te muestra tu puntaje estimado y qué palabras clave te faltan para calzar mejor." },
  { icon: "🧠", title: "Match semántico", desc: "Usa embeddings para entender que 'Ingeniero de Datos' y 'Data Engineer' son lo mismo." },
  { icon: "📅", title: "Seguimiento", desc: "Registra entrevistas, rechazos y ofertas con fecha, todo en un solo tablero." },
];

const FAQS = [
  { q: "¿TalentIA postula por mí automáticamente?", a: "No. Prepara todo (CV adaptado, carta, análisis ATS) pero el envío final siempre lo haces tú, revisando cada postulación antes de enviarla." },
  { q: "¿Necesito tener un CV listo para empezar?", a: "Solo necesitas subir tu CV actual en PDF — TalentIA extrae y estructura tu experiencia automáticamente." },
  { q: "¿De dónde saca las ofertas de trabajo?", a: "De varias APIs públicas de portales de empleo remoto, respetando siempre sus términos de uso." },
  { q: "¿Es gratis?", a: "Crear tu cuenta y armar tu perfil es gratis. Algunas funciones de generación con IA pueden tener límites de uso." },
];

function PipelineVisual() {
  const stages = ["Nuevo", "Revisando", "Postulado"];
  return (
    <div style={{
      maxWidth: 640, margin: "0 auto", background: "#121815", border: "1px solid #24352f",
      borderRadius: 14, padding: "28px 24px", position: "relative", overflow: "hidden",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
        {stages.map((s, i) => (
          <div key={s} style={{ textAlign: "center", flex: 1 }}>
            <div style={{
              width: 14, height: 14, borderRadius: "50%", margin: "0 auto 10px",
              background: i === 0 ? "#4fb3a9" : "#2a352f", border: "2px solid #4fb3a9",
            }} />
            <div style={{ fontFamily: "monospace", fontSize: 11, color: "#8ba396", textTransform: "uppercase" }}>{s}</div>
          </div>
        ))}
        <div style={{
          position: "absolute", top: 6, left: "16%", right: "16%", height: 2, background: "#24352f", zIndex: -1,
        }} />
      </div>

      <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 8 }}>
        {[
          { role: "Senior Data Engineer", company: "Azumo", pct: "35%" },
          { role: "Machine Learning Engineer", company: "Hitachi Solutions", pct: "62%" },
          { role: "Data Analyst", company: "Itaú Chile", pct: "88%" },
        ].map((job, i) => (
          <div key={i} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            background: "#161d19", border: "1px solid #24352f", borderRadius: 8,
            padding: "10px 14px", fontSize: 12.5,
            animation: `slideIn 0.6s ease ${i * 0.15}s both`,
          }}>
            <div>
              <span style={{ fontWeight: 700 }}>{job.role}</span>
              <span style={{ color: "#8ba396" }}> · {job.company}</span>
            </div>
            <span style={{ fontFamily: "monospace", color: "#d8a33d" }}>{job.pct}</span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-14px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
