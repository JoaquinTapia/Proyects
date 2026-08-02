import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { computeMatchScore, isRelevantForRole, computeEmbeddingMatchScore } from "@/lib/matching";
import { getEmbeddings } from "@/lib/embeddings";
import { shouldExcludeForVisa } from "@/lib/visaFilter";
import { SOURCES } from "@/lib/jobs/fetchers";
import { NormalizedJob } from "@/lib/jobs/normalize";
import { createDeduper } from "@/lib/jobs/deduplicate";
import { createSourceCapper } from "@/lib/jobs/ranking";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { data: preferences } = await supabase
    .from("preferences").select("*").eq("user_id", user.id).single();

  const { data: profile } = await supabase
    .from("profiles").select("cv_summary, headline, country, embedding").eq("id", user.id).single();

  const { data: dismissed } = await supabase
    .from("dismissed_jobs").select("apply_url").eq("user_id", user.id);
  const dismissedUrls = new Set((dismissed ?? []).map(d => d.apply_url));

  if (!preferences?.target_roles?.length) {
    return NextResponse.json({ error: "Configura tus roles de búsqueda en /onboarding primero" }, { status: 400 });
  }

  let excludedByVisa = 0;
  let excludedByRelevance = 0;
  let excludedByDismissed = 0;
  const errors: string[] = [];

  // --- Paso 1: recolectar candidatos válidos de todas las fuentes ---
  const candidates: { job: NormalizedJob; role: string }[] = [];
  const deduper = createDeduper();

  for (const role of preferences.target_roles) {
    for (const fetchSource of SOURCES) {
      let jobs: NormalizedJob[] = [];
      try {
        jobs = await fetchSource(role);
        console.log(`[search-jobs] ${fetchSource.name} → "${role}": ${jobs.length} resultados en crudo`);
      } catch (e: any) {
        console.error(`[search-jobs] ${fetchSource.name} falló para "${role}":`, e.message);
        errors.push(`${fetchSource.name} falló para "${role}": ${e.message}`);
        continue;
      }

      const capper = createSourceCapper();
      let accepted = 0;
      for (const job of jobs) {
        if (!capper.canAcceptMore()) break;
        if (!job.apply_url || !job.role || !job.company) continue;
        if (deduper.isDuplicate(job.apply_url)) continue;
        if (dismissedUrls.has(job.apply_url)) { excludedByDismissed++; continue; }

        const jobText = `${job.role} ${job.description}`;
        if (!isRelevantForRole(jobText, role)) { excludedByRelevance++; continue; }
        if (shouldExcludeForVisa(jobText, profile?.country)) { excludedByVisa++; continue; }

        candidates.push({ job, role });
        capper.accept();
        accepted++;
      }
      console.log(`[search-jobs] ${fetchSource.name} → "${role}": ${accepted} pasaron el filtro de relevancia`);
    }
  }

  // --- Paso 2: embeddings en lote (una sola llamada para todos los candidatos) ---
  const profileEmbedding: number[] | null = (profile?.embedding as number[] | null) ?? null;
  let jobEmbeddings: (number[] | null)[] = candidates.map(() => null);

  if (profileEmbedding && candidates.length > 0) {
    const texts = candidates.map(c => `${c.job.role} en ${c.job.company}. ${c.job.description}`);
    const batchResult = await getEmbeddings(texts);
    if (batchResult) jobEmbeddings = batchResult;
  }

  // --- Paso 3: insertar en la base de datos ---
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
    inserted, excludedByVisa, excludedByRelevance, excludedByDismissed, updatedScores, bySource, errors,
    usingEmbeddings: !!profileEmbedding,
  });
}
