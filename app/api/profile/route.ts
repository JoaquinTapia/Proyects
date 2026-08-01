import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getEmbedding } from "@/lib/embeddings";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("*").eq("id", user.id).single();
  const { data: preferences } = await supabase
    .from("preferences").select("*").eq("user_id", user.id).single();

  return NextResponse.json({ profile, preferences });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await request.json();
  const { profile, preferences } = body;

  if (profile) {
    const { error } = await supabase
      .from("profiles")
      .update({ ...profile, updated_at: new Date().toISOString() })
      .eq("id", user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (preferences) {
    const { error } = await supabase
      .from("preferences")
      .upsert({ user_id: user.id, ...preferences, updated_at: new Date().toISOString() });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Recalcula el embedding del perfil combinando lo más relevante para el match semántico
  const { data: fullProfile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const { data: fullPrefs } = await supabase.from("preferences").select("*").eq("user_id", user.id).single();
  if (fullProfile) {
    const profileText = `${fullProfile.headline || ""}. Roles buscados: ${(fullPrefs?.target_roles || []).join(", ")}. ${fullProfile.cv_summary || ""}`;
    const embedding = await getEmbedding(profileText);
    if (embedding) {
      await supabase.from("profiles").update({ embedding }).eq("id", user.id);
    }
  }

  return NextResponse.json({ ok: true });
}
