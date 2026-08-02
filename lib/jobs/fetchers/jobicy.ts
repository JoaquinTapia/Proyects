import { NormalizedJob, stripHtml } from "../normalize";

export async function fetchJobicy(role: string): Promise<NormalizedJob[]> {
  const res = await fetch(`https://jobicy.com/api/v2/remote-jobs?count=50&tag=${encodeURIComponent(role)}`);
  if (!res.ok) { console.error(`[jobicy] status ${res.status}`); return []; }
  const data = await res.json();
  return (data.jobs ?? []).map((job: any) => ({
    source: "jobicy", role: job.jobTitle, company: job.companyName,
    location: job.jobGeo || "Remoto", work_mode: "remote_worldwide",
    salary_range: job.annualSalaryMin ? `${job.annualSalaryMin}-${job.annualSalaryMax} ${job.salaryCurrency || ""}` : null,
    description: stripHtml(job.jobExcerpt), apply_url: job.url, posted_at: job.pubDate || null,
  }));
}
