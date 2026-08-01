import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getAdminProfile } from "@/utils/admin";
import { DeleteZikrButton } from "./DeleteZikrButton";

export default async function ZikrListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const profile = await getAdminProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();
  const params = await searchParams;

  let query = supabase
    .from("dhikr")
    .select("*, categories!inner(label_en, label_ar, label_ur)")
    .order("sort_order", { ascending: true });

  if (params.category && params.category !== "all") {
    query = query.eq("category_id", params.category);
  }

  if (params.q) {
    query = query.or(
      `transliteration.ilike.%${params.q}%,arabic.ilike.%${params.q}%,meaning.ilike.%${params.q}%`
    );
  }

  const { data: zikrs, error } = await query;

  const { data: categories } = await supabase
    .from("categories")
    .select("id, label_en")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Failed to load zikr:", error);
  }

  const rows = zikrs ?? [];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Zikr Library</h1>
          <p className="mt-1 text-sm text-gray-500">
            {rows.length} zikr available
          </p>
        </div>
        <Link
          href="/zikr/new"
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add New Zikr
        </Link>
      </div>

      <form className="mb-6 flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          name="q"
          defaultValue={params.q}
          placeholder="Search by transliteration, Arabic, or meaning..."
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
        />
        <select
          name="category"
          defaultValue={params.category || "all"}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
        >
          <option value="all">All Categories</option>
          {(categories ?? []).map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.label_en}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
        >
          Filter
        </button>
      </form>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Zikr
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Transliteration
              </th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 md:table-cell">
                Category
              </th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 lg:table-cell">
                Count
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-gray-400">
                  No zikr found. Try adjusting your filters or add a new one.
                </td>
              </tr>
            )}
            {rows.map((zikr) => (
              <tr key={zikr.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p dir="rtl" className="text-xl text-gray-900">
                    {zikr.arabic}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-gray-900">
                    {zikr.transliteration}
                  </p>
                  <p className="mt-0.5 max-w-xs truncate text-xs text-gray-500">
                    {zikr.meaning}
                  </p>
                </td>
                <td className="hidden px-4 py-3 md:table-cell">
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                    {zikr.categories?.label_en || zikr.category}
                  </span>
                </td>
                <td className="hidden px-4 py-3 text-sm text-gray-600 lg:table-cell">
                  {zikr.recommended_count}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/zikr/${zikr.id}`}
                      className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100"
                    >
                      Edit
                    </Link>
                    <DeleteZikrButton id={zikr.id} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
