import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { computeMatchScore } from "@/lib/matching";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { data, error } = await supabase
    .from("applications")
    .select("*, job_postings(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ applications: data });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await request.json();
  const { role, company, apply_url, description, location, work_mode } = body;

  if (!role || !company || !apply_url) {
    return NextResponse.json({ error: "Rol, empresa y link son obligatorios" }, { status: 400 });
  }

  // 1) crea (o reutiliza) la oferta en el catálogo compartido
  const { data: existingJob } = await supabase
    .from("job_postings").select("id").eq("apply_url", apply_url).maybeSingle();

  let jobId = existingJob?.id;
  if (!jobId) {
    const { data: job, error: jobError } = await supabase
      .from("job_postings")
      .insert({ role, company, apply_url, location, work_mode, description, source: "manual" })
      .select().single();
    if (jobError) return NextResponse.json({ error: jobError.message }, { status: 500 });
    jobId = job.id;
  }

  // 2) calcular el match con el perfil del usuario
  const { data: profile } = await supabase
    .from("profiles").select("cv_summary, headline").eq("id", user.id).single();
  const { data: preferences } = await supabase
    .from("preferences").select("target_roles").eq("user_id", user.id).single();

  const matchScore = computeMatchScore({
    profileText: `${profile?.headline || ""} ${profile?.cv_summary || ""}`,
    targetRoles: preferences?.target_roles || [],
    jobText: `${role} ${description || ""}`,
  });

  // 3) crea la postulación asociada al usuario
  const { data: application, error: appError } = await supabase
    .from("applications")
    .insert({
      user_id: user.id, job_id: jobId, status: "nuevo",
      match_score: matchScore,
      match_reason: "Agregada manualmente por ti.",
    })
    .select("*, job_postings(*)")
    .single();
  if (appError) return NextResponse.json({ error: appError.message }, { status: 500 });

  return NextResponse.json({ application });
}
