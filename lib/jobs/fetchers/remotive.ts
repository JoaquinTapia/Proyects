import { NormalizedJob, stripHtml } from "../normalize";

// Remotive sí soporta búsqueda por texto (ilike parcial sobre título/descripción).
export async function fetchRemotive(role: string): Promise<NormalizedJob[]> {
  const res = await fetch(`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(role)}&limit=50`);
  if (!res.ok) { console.error(`[remotive] status ${res.status}`); return []; }
  const data = await res.json();
  return (data.jobs ?? []).map((job: any) => ({
    source: "remotive", role: job.title, company: job.company_name,
    location: job.candidate_required_location || "Remoto", work_mode: "remote_worldwide",
    salary_range: job.salary || null, description: stripHtml(job.description),
    apply_url: job.url, posted_at: job.publication_date || null,
  }));
}
