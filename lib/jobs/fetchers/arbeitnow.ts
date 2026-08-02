import { NormalizedJob, stripHtml } from "../normalize";

// IMPORTANTE: la API pública de Arbeitnow NO soporta búsqueda por texto libre —
// el parámetro "search" no existe en su documentación oficial y se ignora si se envía.
// Por eso traemos su página completa por defecto y dejamos que el filtro de
// relevancia (lib/matching) decida qué es relevante para el rol buscado.
export async function fetchArbeitnow(_role: string): Promise<NormalizedJob[]> {
  const res = await fetch(`https://www.arbeitnow.com/api/job-board-api`);
  if (!res.ok) { console.error(`[arbeitnow] status ${res.status}`); return []; }
  const data = await res.json();
  return (data.data ?? []).map((job: any) => ({
    source: "arbeitnow", role: job.title, company: job.company_name,
    location: job.location || (job.remote ? "Remoto" : "No especificado"),
    work_mode: job.remote ? "remote_worldwide" : "hybrid", salary_range: null,
    description: stripHtml(job.description), apply_url: job.url,
    posted_at: job.created_at ? new Date(job.created_at * 1000).toISOString() : null,
  }));
}
