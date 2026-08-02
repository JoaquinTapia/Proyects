import { NormalizedJob, stripHtml } from "../normalize";

// Igual que Arbeitnow: su parámetro "search" puede no filtrar de forma confiable,
// así que pedimos más volumen y confiamos en nuestro propio filtro de relevancia.
export async function fetchHimalayas(role: string): Promise<NormalizedJob[]> {
  const res = await fetch(`https://himalayas.app/jobs/api?limit=50&search=${encodeURIComponent(role)}`);
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
