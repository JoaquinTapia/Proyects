import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractPdfTextByLayout } from "@/lib/pdfExtract";
import Anthropic from "@anthropic-ai/sdk";

type ExtractedCv = {
  personal_information: { name: string; email: string; phone: string; linkedin: string; location: string };
  professional_summary: string;
  work_experience: { company: string; position: string; start_date: string; end_date: string; bullets: string[] }[];
  education: { degree: string; institution: string; dates: string; details?: string }[];
  languages: string[];
  skills: string[];
  projects: string[];
  certifications: string[];
};

async function extractStructuredCv(layoutText: string): Promise<ExtractedCv | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `# ROL
Eres un sistema experto en extracción documental de currículums vitae.
NO eres un asistente de redacción. NO eres un reclutador. NO eres un optimizador de CV.
Tu única tarea es reconstruir exactamente el contenido del CV entregado. La prioridad absoluta es la fidelidad del documento.

# CONTEXTO IMPORTANTE SOBRE EL TEXTO DE ENTRADA
El texto viene marcado con "=== SECCIÓN LATERAL ===" y "=== SECCIÓN PRINCIPAL ===" porque se extrajo respetando las coordenadas reales de cada columna del PDF — dentro de cada sección, las líneas SÍ están en el orden correcto de arriba hacia abajo. Tu trabajo es juntar la información de ambas secciones en un único CV coherente (ej. si la sección lateral tiene "Educación" y la principal tiene "Experiencia", ambas pertenecen al mismo CV, no las mezcles entre sí como si fueran cargos).

# OBJETIVO
Extraer absolutamente toda la información contenida en el CV. No debes resumir, interpretar, mejorar, eliminar, inventar ni completar información faltante.

# REGLAS OBLIGATORIAS SOBRE EXPERIENCIA LABORAL (la parte más importante)
1. Cada experiencia laboral es un bloque ATÓMICO de 4 partes que SIEMPRE van juntas: cargo + empresa + fechas + sus bullets. Dentro de la "SECCIÓN PRINCIPAL", estas 4 partes aparecen en ese orden, una tras otra, para cada trabajo — NUNCA le asignes las fechas o bullets de un cargo a otro cargo distinto. Si un cargo aparece sin bullets debajo de él antes de que empiece el siguiente cargo, entonces ese cargo específico no tiene bullets — no le robes bullets de otro cargo para "completarlo".
2. Ordena los cargos en la salida por fecha, del más reciente al más antiguo (usa las fechas de inicio para ordenar).
3. Extrae TODOS los trabajos, todos los bullets de cada uno (no elimines, no fusiones, no resumas ninguno), todas las fechas exactas, todas las tecnologías, todas las cifras — cópialas tal cual, sin cambiar palabras ni redacción.
4. Antes de responder, verifica: ¿cada cargo tiene su empresa, sus fechas Y sus bullets correctos, sin mezclarlos con el cargo de al lado? ¿Copié todos los bullets de cada cargo? ¿Están todas las secciones (educación, skills, idiomas, proyectos, certificaciones, contacto)?

# SALIDA
Devuelve ÚNICAMENTE un JSON válido, sin explicaciones ni texto fuera del JSON, con esta forma exacta:
{
  "personal_information": { "name": "", "email": "", "phone": "", "linkedin": "", "location": "" },
  "professional_summary": "",
  "work_experience": [
    { "company": "", "position": "", "start_date": "", "end_date": "", "bullets": ["", ""] }
  ],
  "education": [
    { "degree": "", "institution": "", "dates": "", "details": "" }
  ],
  "languages": [""],
  "skills": [""],
  "projects": [""],
  "certifications": [""]
}

--- TEXTO EXTRAÍDO DEL PDF (por columnas, cada columna en orden correcto internamente) ---
${layoutText}`;

  const msg = await anthropic.messages.create({
    model: "claude-fable-5",
    max_tokens: 4000,
    messages: [{ role: "user", content: prompt }],
  });
  const textBlock = msg.content.find(b => b.type === "text");
  const raw = (textBlock as any)?.text ?? "";
  const clean = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

// Convierte "Octubre 2025", "Mar 2023", "Actualidad" etc. a un número ordenable (año*12+mes).
// "Actualidad"/"presente"/vacío se trata como el más reciente posible.
function parseDateToSortable(dateStr: string): number {
  if (!dateStr) return -1;
  const s = dateStr.toLowerCase();
  if (/actualidad|presente|current|now/.test(s)) return 999999;
  const months: Record<string, number> = {
    ene: 1, feb: 2, mar: 3, abr: 4, may: 5, jun: 6, jul: 7, ago: 8, sep: 9, oct: 10, nov: 11, dic: 12,
    jan: 1, apr: 4, aug: 8, dec: 12,
  };
  const monthMatch = Object.keys(months).find(m => s.includes(m));
  const yearMatch = s.match(/\d{4}/);
  const year = yearMatch ? parseInt(yearMatch[0]) : 0;
  const month = monthMatch ? months[monthMatch] : 1;
  return year * 12 + month;
}

// Formateo determinístico en CÓDIGO (no IA) — cero riesgo de alterar contenido en este paso.
function formatCvAsText(cv: ExtractedCv): string {
  const lines: string[] = [];

  if (cv.professional_summary) lines.push("RESUMEN", cv.professional_summary, "");

  if (cv.work_experience?.length) {
    const sorted = cv.work_experience.slice().sort(
      (a, b) => parseDateToSortable(b.start_date) - parseDateToSortable(a.start_date)
    );
    lines.push("EXPERIENCIA LABORAL");
    for (const job of sorted) {
      lines.push(job.position || "(cargo no especificado)");
      lines.push(job.company || "");
      lines.push(`${job.start_date || "?"} - ${job.end_date || "?"}`);
      for (const b of job.bullets || []) lines.push(`- ${b}`);
      lines.push("");
    }
  }

  if (cv.education?.length) {
    lines.push("FORMACIÓN ACADÉMICA");
    for (const edu of cv.education) {
      lines.push(edu.degree || "", edu.institution || "", edu.dates || "");
      if (edu.details) lines.push(edu.details);
      lines.push("");
    }
  }

  if (cv.skills?.length) {
    lines.push("OTROS CONOCIMIENTOS / HABILIDADES");
    cv.skills.forEach(s => lines.push(`- ${s}`));
    lines.push("");
  }

  if (cv.projects?.length) {
    lines.push("PROYECTOS");
    cv.projects.forEach(p => lines.push(`- ${p}`));
    lines.push("");
  }

  if (cv.certifications?.length) {
    lines.push("CERTIFICACIONES");
    cv.certifications.forEach(c => lines.push(`- ${c}`));
    lines.push("");
  }

  if (cv.languages?.length) {
    lines.push("IDIOMAS");
    cv.languages.forEach(l => lines.push(`- ${l}`));
    lines.push("");
  }

  const pi = cv.personal_information;
  if (pi && (pi.email || pi.phone || pi.location || pi.linkedin)) {
    lines.push("CONTACTO");
    if (pi.email) lines.push(`Correo: ${pi.email}`);
    if (pi.phone) lines.push(`Teléfono: ${pi.phone}`);
    if (pi.location) lines.push(`Ubicación: ${pi.location}`);
    if (pi.linkedin) lines.push(`LinkedIn: ${pi.linkedin}`);
  }

  return lines.join("\n").trim();
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("cv") as File | null;
  if (!file) return NextResponse.json({ error: "No se envió ningún archivo" }, { status: 400 });
  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "Solo se aceptan archivos PDF" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  let extractedText = "";
  try {
    const layoutText = await extractPdfTextByLayout(buffer);
    const structured = await extractStructuredCv(layoutText.slice(0, 9000));
    extractedText = structured ? formatCvAsText(structured) : layoutText.slice(0, 6000);
  } catch (e) {
    console.error("Error extrayendo PDF:", e);
    return NextResponse.json({ error: "No se pudo leer el PDF. ¿Está dañado o protegido?" }, { status: 422 });
  }

  const filePath = `${user.id}/cv.pdf`;
  const { error: uploadError } = await supabase.storage
    .from("cvs")
    .upload(filePath, buffer, { contentType: "application/pdf", upsert: true });
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ cv_summary: extractedText, cv_file_url: filePath, updated_at: new Date().toISOString() })
    .eq("id", user.id);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ extractedText });
}
