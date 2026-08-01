import { createClient } from "@/utils/supabase/server";

export async function getAdminProfile() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("admin_profiles")
    .select("id, email, full_name, role, is_active")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.is_active) return null;

  return {
    id: user.id,
    email: user.email,
    fullName: profile.full_name || user.email,
    role: profile.role,
  };
}

export async function requireAdmin() {
  const profile = await getAdminProfile();
  if (!profile || profile.role !== "admin") return null;
  return profile;
}
