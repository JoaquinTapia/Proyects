import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TrackerBoard from "@/components/TrackerBoard";

export default async function TrackerPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: preferences } = await supabase
    .from("preferences")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const profileComplete = !!(
    profile?.full_name && profile?.headline && profile?.years_experience != null &&
    preferences?.target_roles?.length && preferences?.work_mode && preferences?.seniority
  );

  if (!profileComplete) redirect("/onboarding");

  const { data: applications } = await supabase
    .from("applications")
    .select("*, job_postings(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return <TrackerBoard initialApplications={applications ?? []} profile={profile} userEmail={user.email!} />;
}
