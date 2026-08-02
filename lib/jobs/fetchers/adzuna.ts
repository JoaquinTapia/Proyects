import { NormalizedJob, stripHtml } from "../normalize";

// Opcional: requiere ADZUNA_APP_ID + ADZUNA_APP_KEY gratis en developer.adzuna.com.
// Buena fuente para cobertura por país específico (ADZUNA_COUNTRY=cl, mx, es, etc.)
export async function fetchAdzuna(role: string): Promise<NormalizedJob[]> {
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
