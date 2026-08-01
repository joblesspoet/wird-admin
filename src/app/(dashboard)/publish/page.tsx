import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getAdminProfile } from "@/utils/admin";
import { PublishForm } from "./PublishForm";

function bumpVersion(version: string, type: "major" | "minor" | "patch") {
  const [major, minor, patch] = version.split(".").map(Number);
  if (type === "major") return `${major + 1}.0.0`;
  if (type === "minor") return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

export default async function PublishPage() {
  const profile = await getAdminProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();

  const [{ data: latestVersion }, { data: tokens }] = await Promise.all([
    supabase
      .from("content_versions")
      .select("version, published_at, changelog, dhikr_count")
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("push_tokens")
      .select("token")
      .gte(
        "last_active",
        new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
      ),
  ]);

  const activeDevices = tokens?.length ?? 0;

  // Count new zikr added since last publish
  let newZikrCount = 0;
  if (latestVersion) {
    const { count } = await supabase
      .from("dhikr")
      .select("id", { count: "exact", head: true })
      .gte("created_at", latestVersion.published_at);
    newZikrCount = count ?? 0;
  }

  const currentVersion = latestVersion?.version ?? "1.0.0";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Publish & Notify</h1>
        <p className="mt-1 text-sm text-gray-500">
          Publish a new version of the zikr library. Users with new zikr will
          get a push notification.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <p className="text-sm text-gray-500">Current Version</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            v{currentVersion}
          </p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <p className="text-sm text-gray-500">New Zikr Since Last Publish</p>
          <p
            className={`mt-1 text-2xl font-bold ${
              newZikrCount > 0 ? "text-emerald-600" : "text-gray-900"
            }`}
          >
            {newZikrCount}
          </p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <p className="text-sm text-gray-500">Active Devices</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {activeDevices}
          </p>
        </div>
      </div>

      {latestVersion && (
        <div className="mt-4 rounded-xl bg-gray-50 p-4 text-sm text-gray-600 ring-1 ring-gray-200">
          Last published on{" "}
          {new Date(latestVersion.published_at).toLocaleString()} —{" "}
          {latestVersion.changelog || `v${latestVersion.version}`}
        </div>
      )}

      <div className="mt-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
        <PublishForm
          currentVersion={currentVersion}
          bumpVersion={bumpVersion}
          newZikrCount={newZikrCount}
          activeDevices={activeDevices}
          adminId={profile.id}
        />
      </div>
    </div>
  );
}
