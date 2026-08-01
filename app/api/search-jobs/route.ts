import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { computeMatchScore, isRelevantForRole, computeEmbeddingMatchScore } from "@/lib/matching";
import { getEmbeddings } from "@/lib/embeddings";
import { shouldExcludeForVisa } from "@/lib/visaFilter";

type NormalizedJob = {
  source: string;
  role: string;
  company: string;
  location: string;
  work_mode: string;
  salary_range: string | null;
  description: string;
  apply_url: string;
  posted_at: string | null;
};

function stripHtml(html: string) {
  return (html || "").replace(/<[^>]+>/g, "").slice(0, 3000);
}

// --- Fuente 1: Remotive ---
async function fetchRemotive(role: string): Promise<NormalizedJob[]> {
  const res = await fetch(`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(role)}&limit=8`);
  if (!res.ok) { console.error(`[remotive] status ${res.status}`); return []; }
  const data = await res.json();
  return (data.jobs ?? []).map((job: any) => ({
    source: "remotive", role: job.title, company: job.company_name,
    location: job.candidate_required_location || "Remoto", work_mode: "remote_worldwide",
    salary_range: job.salary || null, description: stripHtml(job.description),
    apply_url: job.url, posted_at: job.publication_date || null,
  }));
}

// --- Fuente 2: Arbeitnow ---
async function fetchArbeitnow(role: string): Promise<NormalizedJob[]> {
  const res = await fetch(`https://www.arbeitnow.com/api/job-board-api?search=${encodeURIComponent(role)}`);
  if (!res.ok) { console.error(`[arbeitnow] status ${res.status}`); return []; }
  const data = await res.json();
  return (data.data ?? []).slice(0, 8).map((job: any) => ({
    source: "arbeitnow", role: job.title, company: job.company_name,
    location: job.location || (job.remote ? "Remoto" : "No especificado"),
    work_mode: job.remote ? "remote_worldwide" : "hybrid", salary_range: null,
    description: stripHtml(job.description), apply_url: job.url,
    posted_at: job.created_at ? new Date(job.created_at * 1000).toISOString() : null,
  }));
}

// --- Fuente 3: Jobicy ---
async function fetchJobicy(role: string): Promise<NormalizedJob[]> {
  const res = await fetch(`https://jobicy.com/api/v2/remote-jobs?count=8&tag=${encodeURIComponent(role)}`);
  if (!res.ok) { console.error(`[jobicy] status ${res.status}`); return []; }
  const data = await res.json();
  return (data.jobs ?? []).map((job: any) => ({
    source: "jobicy", role: job.jobTitle, company: job.companyName,
    location: job.jobGeo || "Remoto", work_mode: "remote_worldwide",
    salary_range: job.annualSalaryMin ? `${job.annualSalaryMin}-${job.annualSalaryMax} ${job.salaryCurrency || ""}` : null,
    description: stripHtml(job.jobExcerpt), apply_url: job.url, posted_at: job.pubDate || null,
  }));
}

// --- Fuente 4: Himalayas (empleos remotos, sin API key) ---
async function fetchHimalayas(role: string): Promise<NormalizedJob[]> {
  const res = await fetch(`https://himalayas.app/jobs/api?limit=8&search=${encodeURIComponent(role)}`);
  if (!res.ok) { console.error(`[himalayas] status ${res.status}`); return []; }
  const data = await res.json();
  return (data.jobs ?? []).map((job: any) => ({
    source: "himalayas", role: job.title, company: job.companyName,
    location: (job.locationRestrictions || []).join(", ") || "Remoto", work_mode: "remote_worldwide",
    salary_range: job.minSalary ? `${job.minSalary}-${job.maxSalary} ${job.salaryCurrency || ""}` : null,
    description: stripHtml(job.description), apply_url: job.applicationLink || job.guid,
    posted_at: job.pubDate || null,
  }));
}

// --- Fuente 5: Adzuna (opcional, requiere ADZUNA_APP_ID + ADZUNA_APP_KEY gratis en developer.adzuna.com) ---
async function fetchAdzuna(role: string): Promise<NormalizedJob[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) return []; // se salta silenciosamente si no está configurado
  const country = process.env.ADZUNA_COUNTRY || "us";
  const res = await fetch(
    `https://api.adzuna.com/v1/api/jobs/${country}/search/1?app_id=${appId}&app_key=${appKey}&results_per_page=8&what=${encodeURIComponent(role)}`
  );
  if (!res.ok) { console.error(`[adzuna] status ${res.status}`); return []; }
  const data = await res.json();
  return (data.results ?? []).map((job: any) => ({
    source: "adzuna", role: job.title, company: job.company?.display_name || "N/D",
    location: job.location?.display_name || "N/D", work_mode: "hybrid",
    salary_range: job.salary_min ? `${Math.round(job.salary_min)}-${Math.round(job.salary_max)}` : null,
    description: stripHtml(job.description), apply_url: job.redirect_url,
    posted_at: job.created || null,
  }));
}

const SOURCES = [fetchRemotive, fetchArbeitnow, fetchJobicy, fetchHimalayas, fetchAdzuna];

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { data: preferences } = await supabase
    .from("preferences").select("*").eq("user_id", user.id).single();

  const { data: profile } = await supabase
    .from("profiles").select("cv_summary, headline, country, embedding").eq("id", user.id).single();

  if (!preferences?.target_roles?.length) {
    return NextResponse.json({ error: "Configura tus roles de búsqueda en /onboarding primero" }, { status: 400 });
  }

  let excludedByVisa = 0;
  let excludedByRelevance = 0;
  const errors: string[] = [];

  // --- Paso 1: recolectar todos los candidatos válidos (sin tocar la BD todavía) ---
  const candidates: { job: NormalizedJob; role: string }[] = [];
  const seenUrls = new Set<string>();

  for (const role of preferences.target_roles) {
    for (const fetchSource of SOURCES) {
      let jobs: NormalizedJob[] = [];
      try {
        jobs = await fetchSource(role);
        console.log(`[search-jobs] ${fetchSource.name} → "${role}": ${jobs.length} resultados`);
      } catch (e: any) {
        console.error(`[search-jobs] ${fetchSource.name} falló para "${role}":`, e.message);
        errors.push(`${fetchSource.name} falló para "${role}": ${e.message}`);
        continue;
      }

      for (const job of jobs) {
        if (!job.apply_url || !job.role || !job.company) continue;
        if (seenUrls.has(job.apply_url)) continue;

        const jobText = `${job.role} ${job.description}`;
        if (!isRelevantForRole(jobText, role)) { excludedByRelevance++; continue; }
        if (shouldExcludeForVisa(jobText, profile?.country)) { excludedByVisa++; continue; }

        seenUrls.add(job.apply_url);
        candidates.push({ job, role });
      }
    }
  }

  // --- Paso 2: embeddings en LOTE (una sola llamada para todos los candidatos, escalable) ---
  const profileEmbedding: number[] | null = (profile?.embedding as number[] | null) ?? null;
  let jobEmbeddings: (number[] | null)[] = candidates.map(() => null);

  if (profileEmbedding && candidates.length > 0) {
    const texts = candidates.map(c => `${c.job.role} en ${c.job.company}. ${c.job.description}`);
    const batchResult = await getEmbeddings(texts);
    if (batchResult) jobEmbeddings = batchResult;
  }

  // --- Paso 3: insertar en la base de datos con el puntaje ya calculado ---
  let inserted = 0;
  let updatedScores = 0;
  const bySource: Record<string, number> = {};

  for (let i = 0; i < candidates.length; i++) {
    const { job, role } = candidates[i];
    const jobEmbedding = jobEmbeddings[i];
    const jobText = `${job.role} ${job.description}`;

    const { data: existing } = await supabase
      .from("job_postings").select("id").eq("apply_url", job.apply_url).maybeSingle();

    let jobId = existing?.id;

    if (!jobId) {
      const { data: newJob, error: jobErr } = await supabase
        .from("job_postings")
        .insert({
          source: job.source, role: job.role, company: job.company,
          location: job.location, work_mode: job.work_mode,
          salary_range: job.salary_range, description: job.description,
          apply_url: job.apply_url, posted_at: job.posted_at,
          embedding: jobEmbedding,
        })
        .select("id").single();
      if (jobErr) { errors.push(jobErr.message); continue; }
      jobId = newJob.id;
    } else if (jobEmbedding) {
      await supabase.from("job_postings").update({ embedding: jobEmbedding }).eq("id", jobId);
    }

    const matchScore = (profileEmbedding && jobEmbedding)
      ? computeEmbeddingMatchScore(profileEmbedding, jobEmbedding)
      : computeMatchScore({
          profileText: `${profile?.headline || ""} ${profile?.cv_summary || ""}`,
          targetRoles: preferences.target_roles, jobText, matchedRole: role,
        });

    const { data: existingApp } = await supabase
      .from("applications").select("id, match_score")
      .eq("user_id", user.id).eq("job_id", jobId).maybeSingle();

    if (!existingApp) {
      const { error: appErr } = await supabase.from("applications").insert({
        user_id: user.id, job_id: jobId, status: "nuevo",
        match_score: matchScore,
        match_reason: `Coincide con tu búsqueda de "${role}" (fuente: ${job.source}).`,
      });
      if (!appErr) {
        inserted++;
        bySource[job.source] = (bySource[job.source] || 0) + 1;
      }
    } else if (existingApp.match_score == null) {
      await supabase.from("applications").update({ match_score: matchScore }).eq("id", existingApp.id);
      updatedScores++;
    }
  }

  return NextResponse.json({
    inserted, excludedByVisa, excludedByRelevance, updatedScores, bySource, errors,
    usingEmbeddings: !!profileEmbedding,
  });
}
