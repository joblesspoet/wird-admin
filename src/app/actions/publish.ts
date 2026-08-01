"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { getAdminProfile } from "@/utils/admin";

function bumpVersion(version: string, type: "major" | "minor" | "patch") {
  const [major, minor, patch] = version.split(".").map(Number);
  if (type === "major") return `${major + 1}.0.0`;
  if (type === "minor") return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

export async function publishVersion(formData: FormData) {
  const profile = await getAdminProfile();
  if (!profile || profile.role !== "admin") {
    return { error: "Not authorized." };
  }

  const supabase = await createClient();

  const changeType = String(formData.get("change_type") || "patch") as
    | "major"
    | "minor"
    | "patch";
  const changelog = String(formData.get("changelog") || "").trim();
  const notify = formData.get("notify") === "true";

  // Get latest version
  const { data: latestVersion } = await supabase
    .from("content_versions")
    .select("version, published_at")
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  const currentVersion = latestVersion?.version ?? "1.0.0";
  const nextVersion = bumpVersion(currentVersion, changeType);

  // Get counts
  const [{ count: dhikrCount }, { count: categoryCount }] = await Promise.all([
    supabase.from("dhikr").select("id", { count: "exact", head: true }),
    supabase.from("categories").select("id", { count: "exact", head: true }),
  ]);

  // Insert new content version
  const { data: versionRow, error: versionError } = await supabase
    .from("content_versions")
    .insert({
      version: nextVersion,
      dhikr_count: dhikrCount ?? 0,
      category_count: categoryCount ?? 0,
      changelog: changelog || null,
      published_by: profile.id,
    })
    .select("id, version")
    .single();

  if (versionError) {
    return { error: versionError.message };
  }

  // Send push notification if requested
  if (notify) {
    const newZikrCount =
      changeType === "patch" ? 0 : await countNewZikrSince(supabase, latestVersion?.published_at);

    if (newZikrCount > 0) {
      try {
        await sendPushNotifications(supabase, newZikrCount, nextVersion, profile.id);
      } catch (e) {
        console.error("Push notification failed:", e);
        // Don't fail the publish if push fails
      }
    }
  }

  revalidatePath("/publish");
  revalidatePath("/dashboard");
  return {};
}

async function countNewZikrSince(supabase: any, since?: string) {
  if (!since) return 0;
  const { count } = await supabase
    .from("dhikr")
    .select("id", { count: "exact", head: true })
    .gte("created_at", since);
  return count ?? 0;
}

async function sendPushNotifications(
  supabase: any,
  newZikrCount: number,
  version: string,
  adminId: string
) {
  const { data: tokens } = await supabase
    .from("push_tokens")
    .select("token")
    .gte(
      "last_active",
      new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
    );

  if (!tokens?.length) return;

  // Load Expo SDK dynamically (installed lazily)
  const { default: Expo } = await import("expo-server-sdk");
  const expo = new Expo();

  const messages = tokens
    .filter((t: any) => Expo.isExpoPushToken(t.token))
    .map((t: any) => ({
      to: t.token,
      sound: "default",
      title: "✨ New Zikr Available",
      body: `${newZikrCount} new zikr added. Tap to sync now!`,
      data: { type: "new_zikr", count: newZikrCount, version },
    }));

  let sentCount = 0;
  const chunks = expo.chunkPushNotifications(messages);
  for (const chunk of chunks) {
    try {
      await expo.sendPushNotificationsAsync(chunk);
      sentCount += chunk.length;
    } catch (e) {
      console.error("Chunk send error:", e);
    }
  }

  await supabase.from("notification_logs").insert({
    title: "✨ New Zikr Available",
    body: `${newZikrCount} new zikr added. Tap to sync now!`,
    new_zikr_count: newZikrCount,
    version,
    recipients_count: sentCount,
    sent_by: adminId,
    status: "sent",
  });
}
