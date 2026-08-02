import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await request.json();
  const { data, error } = await supabase
    .from("applications")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", params.id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ application: data });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  // Antes de borrar, guardamos la URL en la papelera para no volver a sugerirla
  const { data: app } = await supabase
    .from("applications").select("job_id, job_postings(apply_url)")
    .eq("id", params.id).eq("user_id", user.id).single();

  const applyUrl = (app as any)?.job_postings?.apply_url;
  if (applyUrl) {
    await supabase.from("dismissed_jobs").upsert(
      { user_id: user.id, job_id: app!.job_id, apply_url: applyUrl },
      { onConflict: "user_id,apply_url" }
    );
  }

  const { error } = await supabase
    .from("applications")
    .delete()
    .eq("id", params.id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
