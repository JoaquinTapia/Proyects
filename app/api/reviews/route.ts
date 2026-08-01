import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("id, rating, comment, created_at, profiles(full_name, headline)")
    .order("created_at", { ascending: false })
    .limit(12);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reviews: data });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { rating, comment } = await request.json();
  if (!rating || rating < 1 || rating > 5 || !comment?.trim()) {
    return NextResponse.json({ error: "Falta un puntaje (1-5) y un comentario" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("reviews")
    .upsert({ user_id: user.id, rating, comment: comment.trim() }, { onConflict: "user_id" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ review: data });
}
