import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import { renderTailoredCvPdf } from "@/lib/pdf/tailoredCv";
import { detectLanguage } from "@/lib/language";

type ExperienceItem = { title: string; company: string; dates: string; bullets: string[] };
type GeneratedCv = {
  summary: string;
  experience: ExperienceItem[];
  education: { degree: string; institution: string; dates: string }[];
  skills: string[];
  languages: string[];
  coverLetter: string;
  ats_report: {
    ats_score_estimado: number;
    keywords_encontradas: string[];
    keywords_faltantes: string[];
    resumen_cambios: string[];
  };
};

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { data: application, error: appErr } = await supabase
    .from("applications").select("*, job_postings(*)")
    .eq("id", params.id).eq("user_id", user.id).single();
  if (appErr || !application) return NextResponse.json({ error: "Postulación no encontrada" }, { status: 404 });

  const { data: profile } = await supabase
    .from("profiles").select("*").eq("id", user.id).single();
  if (!profile?.cv_summary) {
    return NextResponse.json({ error: "Completa tu perfil y sube tu CV en /onboarding primero" }, { status: 400 });
  }

  const { data: preferences } = await supabase
    .from("preferences").select("*").eq("user_id", user.id).single();

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({
      error: "ANTHROPIC_API_KEY no está definida en el servidor. Revisa tu .env.local y reinicia npm run dev."
    }, { status: 500 });
  }

  const job = application.job_postings;
  const jobLanguage = detectLanguage(`${job.role} ${job.description || ""}`);
  const languageNote = jobLanguage === "en"
    ? "La oferta está en INGLÉS: todo el contenido (summary, bullets, education, skills, languages, coverLetter) debe quedar en inglés profesional y natural."
    : "La oferta está en ESPAÑOL: todo el contenido debe quedar en español.";

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `Eres un experto en reclutamiento técnico, ATS (Applicant Tracking Systems) y redacción de currículums para cargos de tecnología.

Tu objetivo NO es crear un CV desde cero. Tu objetivo es tomar el CV original del candidato y adaptarlo para maximizar sus probabilidades de obtener una entrevista para la oferta laboral proporcionada.

# CONTEXTO DE BÚSQUEDA DEL CANDIDATO
El candidato busca activamente roles de: ${(preferences?.target_roles || []).join(", ") || "no especificado"}, nivel ${preferences?.seniority || "no especificado"}. Ten esto en cuenta como trasfondo de su carrera al priorizar qué destacar, pero la adaptación principal siempre debe ser para LA OFERTA ESPECÍFICA de abajo.

# REGLAS OBLIGATORIAS
1. Conserva TODAS las experiencias laborales del CV original. Nunca elimines un trabajo, nunca inventes uno nuevo, nunca reemplaces uno por otro.
2. Reescribe los bullets de cada experiencia para mayor impacto. Cada experiencia debe tener ENTRE 4 Y 8 bullets relevantes, específicos, cuantificables cuando el dato original lo permita, y orientados a resultados. Nunca dejes una experiencia con menos de 4 bullets si el CV original tiene suficiente material — profundiza y desglosa antes que resumir de más.
3. Optimiza para ATS: identifica las palabras clave técnicas presentes en la descripción de la oferta (ej. Python, Spark, Databricks, Azure, SQL, ETL, Machine Learning, CI/CD, Git, Docker, Kubernetes, Airflow, etc.) e incorpóralas naturalmente en los bullets SOLO cuando sean verdaderas para el candidato según su CV original. Nunca agregues una tecnología que el candidato no haya usado.
4. Prioriza (sin inventar nada) las experiencias y logros más relacionados con la oferta, dándoles más desarrollo y detalle que las menos relevantes.
5. Usa verbos de acción variados: Designed, Implemented, Developed, Optimized, Automated, Reduced, Improved, Led, Created, Built, Migrated, Integrated (tradúcelos si el resultado final es en español: Diseñé, Implementé, Desarrollé, Optimicé, Automaticé, Reduje, Mejoré, Lideré, Creé, Construí, Migré, Integré).
6. NO reduzcas el contenido general del CV. El resultado debe ser igual de extenso o más detallado que el original, nunca más corto. Si una experiencia ya está muy bien escrita, haz solo mejoras menores en vez de reescribirla entera.
7. NUNCA inventes logros, porcentajes, proyectos, certificaciones ni tecnologías que no estén en el CV original o que no puedas inferir razonablemente de él.
8. Mantén la información personal, educación, certificaciones e idiomas fieles al original — no inventes ni la omitas.

${languageNote}

# SALIDA
Responde SOLO con JSON válido, sin texto adicional, comentarios ni markdown, con esta forma EXACTA:
{
  "summary": "resumen de perfil de 3-4 líneas adaptado a la oferta",
  "experience": [
    { "title": "cargo", "company": "empresa", "dates": "mes año - mes año", "bullets": ["bullet 1", "bullet 2", "bullet 3", "bullet 4"] }
  ],
  "education": [
    { "degree": "título obtenido", "institution": "institución", "dates": "año - año" }
  ],
  "skills": ["habilidad técnica 1", "habilidad técnica 2"],
  "languages": ["Inglés avanzado"],
  "coverLetter": "carta de motivación completa, profesional, 4 párrafos, firmada con el nombre del candidato",
  "ats_report": {
    "ats_score_estimado": 0,
    "keywords_encontradas": ["palabras clave de la oferta que SÍ están presentes en el CV adaptado"],
    "keywords_faltantes": ["palabras clave importantes de la oferta que el candidato NO tiene y no se pudieron agregar por ser falsas"],
    "resumen_cambios": ["frase corta describiendo un cambio relevante que hiciste", "otro cambio", "otro cambio"]
  }
}

El "ats_score_estimado" es un número de 0 a 100 que representa qué tan bien el CV adaptado calza con la oferta en términos de palabras clave y relevancia — sé realista, no siempre pongas números altos.

--- CV ORIGINAL DEL CANDIDATO (texto crudo extraído de un PDF, puede tener errores de formato) ---
Nombre: ${profile.full_name}
Título profesional: ${profile.headline}
Años de experiencia: ${profile.years_experience}
Contacto: ${profile.phone} | ${profile.location}

${profile.cv_summary}

--- DESCRIPCIÓN COMPLETA DE LA OFERTA DE TRABAJO ---
Rol: ${job.role}
Empresa: ${job.company}
Ubicación/modalidad: ${job.location} (${job.work_mode})
Descripción: ${job.description || "(sin descripción detallada)"}
`;

  let parsed: GeneratedCv;
  try {
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    });
    const textBlock = msg.content.find(b => b.type === "text");
    const raw = (textBlock as any)?.text ?? "";
    const clean = raw.replace(/```json|```/g, "").trim();
    parsed = JSON.parse(clean);
  } catch (e: any) {
    return NextResponse.json({ error: "Error generando contenido con IA: " + e.message }, { status: 500 });
  }

  const pdfBuffer = await renderTailoredCvPdf({
    fullName: profile.full_name,
    headline: profile.headline,
    phone: profile.phone,
    location: profile.location,
    email: user.email!,
    summary: parsed.summary,
    experience: parsed.experience || [],
    education: parsed.education || [],
    skills: parsed.skills || [],
    languages: parsed.languages || [],
  });

  const filePath = `${user.id}/${application.id}.pdf`;
  const { error: uploadError } = await supabase.storage
    .from("tailored-cvs")
    .upload(filePath, pdfBuffer, { contentType: "application/pdf", upsert: true });
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { error: updateError } = await supabase
    .from("applications")
    .update({
      cv_tailored_url: filePath,
      cover_letter: parsed.coverLetter,
      match_reason: parsed.summary,
      ats_report: parsed.ats_report || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", application.id);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ ok: true, coverLetter: parsed.coverLetter, ats_report: parsed.ats_report });
}
