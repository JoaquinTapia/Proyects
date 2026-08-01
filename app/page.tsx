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

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 24px" }}>
      {/* NAV */}
      <nav style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "24px 0",
      }}>
        <div style={{ fontFamily: "monospace", fontSize: 15, fontWeight: 700, color: "#e8ede9", letterSpacing: "0.02em" }}>
          <Logo size={26} />
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link href="/login" style={navBtnGhost}>Iniciar sesión</Link>
          <Link href="/signup" style={navBtnSolid}>Crear cuenta</Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ padding: "64px 0 40px", textAlign: "center" }}>
        <div style={{
          display: "inline-block", fontFamily: "monospace", fontSize: 11.5, color: "#4fb3a9",
          border: "1px solid #24352f", borderRadius: 20, padding: "5px 14px", marginBottom: 22,
          textTransform: "uppercase", letterSpacing: "0.08em",
        }}>
          búsqueda de empleo, en pipeline
        </div>
        <h1 style={{
          fontSize: "clamp(32px, 5vw, 52px)", lineHeight: 1.08, fontWeight: 800,
          margin: "0 0 20px", letterSpacing: "-0.02em",
        }}>
          Tu búsqueda de trabajo,<br />
          <span style={{ color: "#d8a33d" }}>procesada como datos.</span>
        </h1>
        <p style={{ color: "#8ba396", fontSize: 17, maxWidth: 560, margin: "0 auto 32px", lineHeight: 1.5 }}>
          TalentIA busca ofertas en varios portales a la vez, filtra lo que realmente calza con tu perfil,
          y te prepara un CV y una carta adaptados — tú solo revisas y envías.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 56 }}>
          <Link href="/signup" style={{ ...navBtnSolid, padding: "13px 26px", fontSize: 14.5 }}>Empezar gratis</Link>
          <Link href="/login" style={{ ...navBtnGhost, padding: "13px 26px", fontSize: 14.5 }}>Ya tengo cuenta</Link>
        </div>

        <PipelineVisual />
      </section>

      {/* FEATURES */}
      <section style={{ padding: "40px 0 60px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 16 }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{
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
        <section style={{ padding: "20px 0 80px" }}>
          <div style={{ fontFamily: "monospace", fontSize: 12, color: "#d8a33d", textTransform: "uppercase", marginBottom: 8, textAlign: "center" }}>
            lo que dicen quienes ya la usan
          </div>
          <h2 style={{ textAlign: "center", fontSize: 24, marginBottom: 32 }}>Reseñas</h2>
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

      <footer style={{ borderTop: "1px solid #24352f", padding: "24px 0", textAlign: "center", color: "#5a6e67", fontSize: 12 }}>
        talentIA — hecho con Next.js, Supabase y Claude.
      </footer>
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

const FEATURES = [
  { icon: "🔍", title: "Búsqueda multi-fuente", desc: "Rastrea varios portales de empleo a la vez, sin que tengas que revisarlos uno por uno." },
  { icon: "🎯", title: "Filtro de relevancia", desc: "Descarta automáticamente ofertas que no calzan con tu perfil o que exigen visa que no tienes." },
  { icon: "✨", title: "CV + carta con IA", desc: "Adapta tu currículum real a cada oferta específica, optimizado para sistemas ATS." },
  { icon: "📊", title: "Análisis ATS", desc: "Te muestra tu puntaje estimado y qué palabras clave te faltan para calzar mejor." },
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
          <div key={i} className="pipeline-card" style={{
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
