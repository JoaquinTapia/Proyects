import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_request: Request, { params }: { params: { applicationId: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { data: application } = await supabase
    .from("applications").select("cv_tailored_url")
    .eq("id", params.applicationId).eq("user_id", user.id).single();

  if (!application?.cv_tailored_url) {
    return NextResponse.json({ error: "Aún no se ha generado un CV para esta postulación" }, { status: 404 });
  }

  const { data, error } = await supabase.storage
    .from("tailored-cvs")
    .createSignedUrl(application.cv_tailored_url, 60 * 5); // válido 5 minutos

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ url: data.signedUrl });
}
