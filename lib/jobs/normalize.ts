export type NormalizedJob = {
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

export function stripHtml(html: string): string {
  return (html || "").replace(/<[^>]+>/g, "").slice(0, 3000);
}
