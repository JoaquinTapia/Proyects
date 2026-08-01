import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { data, error } = await supabase
    .from("application_events")
    .select("*")
    .eq("application_id", params.id)
    .eq("user_id", user.id)
    .order("event_date", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ events: data });
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { event_type, event_date, notes } = await request.json();
  if (!event_type) return NextResponse.json({ error: "Falta el tipo de evento" }, { status: 400 });

  const { data, error } = await supabase
    .from("application_events")
    .insert({
      application_id: params.id, user_id: user.id,
      event_type, event_date: event_date || new Date().toISOString().slice(0, 10), notes,
    })
    .select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ event: data });
}
