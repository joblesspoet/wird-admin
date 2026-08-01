import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [dhikrResult, categoryResult, tokenResult, versionResult] =
    await Promise.all([
      supabase.from("dhikr").select("id", { count: "exact", head: true }),
      supabase.from("categories").select("id", { count: "exact", head: true }),
      supabase
        .from("push_tokens")
        .select("id", { count: "exact", head: true })
        .gte(
          "last_active",
          new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
        ),
      supabase
        .from("content_versions")
        .select("version, published_at, changelog")
        .order("id", { ascending: false })
        .limit(1)
        .single(),
    ]);

  const stats = [
    {
      label: "Total Zikr",
      value: dhikrResult.count ?? 0,
      href: "/zikr",
      color: "bg-emerald-500",
    },
    {
      label: "Categories",
      value: categoryResult.count ?? 0,
      href: "/categories",
      color: "bg-blue-500",
    },
    {
      label: "Active Devices",
      value: tokenResult.count ?? 0,
      href: "/publish",
      color: "bg-violet-500",
    },
    {
      label: "Current Version",
      value: versionResult.data?.version ?? "—",
      href: "/publish",
      color: "bg-amber-500",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of the zikr library and sync status
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200 transition-shadow hover:shadow-md"
          >
            <div className={`mb-3 h-1.5 w-10 rounded-full ${stat.color}`} />
            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            <p className="mt-1 text-sm text-gray-500">{stat.label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Last Published Version
          </h2>
          {versionResult.data ? (
            <div>
              <p className="text-2xl font-bold text-gray-900">
                v{versionResult.data.version}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {new Date(versionResult.data.published_at).toLocaleString()}
              </p>
              {versionResult.data.changelog && (
                <p className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
                  {versionResult.data.changelog}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No version published yet.</p>
          )}
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Quick Actions
          </h2>
          <div className="space-y-3">
            <Link
              href="/zikr/new"
              className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
            >
              Add New Zikr
              <span aria-hidden>→</span>
            </Link>
            <Link
              href="/publish"
              className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
            >
              Publish Changes & Notify Users
              <span aria-hidden>→</span>
            </Link>
            <Link
              href="/categories"
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
            >
              Manage Categories
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
