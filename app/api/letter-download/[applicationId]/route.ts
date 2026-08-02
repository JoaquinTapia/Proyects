import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { renderLetterPdf } from "@/lib/pdf/letter";

export async function GET(_request: Request, { params }: { params: { applicationId: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { data: application } = await supabase
    .from("applications").select("cover_letter")
    .eq("id", params.applicationId).eq("user_id", user.id).single();

  if (!application?.cover_letter) {
    return NextResponse.json({ error: "Aún no se ha generado una carta para esta postulación" }, { status: 404 });
  }

  const { data: profile } = await supabase
    .from("profiles").select("full_name, phone").eq("id", user.id).single();

  const pdfBuffer = await renderLetterPdf({
    fullName: profile?.full_name || "",
    email: user.email || "",
    phone: profile?.phone || "",
    body: application.cover_letter,
  });

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="carta-motivacion.pdf"`,
    },
  });
}
