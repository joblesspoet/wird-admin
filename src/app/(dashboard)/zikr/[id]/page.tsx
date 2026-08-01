import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getAdminProfile } from "@/utils/admin";
import { updateZikr } from "@/app/actions/zikr";
import { ZikrForm } from "@/components/ZikrForm";

export default async function EditZikrPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await getAdminProfile();
  if (!profile) redirect("/login");

  const { id } = await params;

  const supabase = await createClient();

  const [{ data: zikr }, { data: categories }] = await Promise.all([
    supabase.from("dhikr").select("*").eq("id", id).single(),
    supabase
      .from("categories")
      .select("id, label_en, label_ar, label_ur")
      .order("sort_order", { ascending: true }),
  ]);

  if (!zikr) notFound();

  const handleUpdate = updateZikr.bind(null, id);

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
          <Link href="/zikr" className="hover:text-gray-700">
            Zikr Library
          </Link>
          <span>/</span>
          <span className="text-gray-900">Edit Zikr</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Zikr</h1>
        <p className="mt-1 text-sm text-gray-500">
          Update the details for this zikr entry.
        </p>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
        <ZikrForm
          categories={categories ?? []}
          zikr={zikr}
          onSubmit={handleUpdate}
          submitLabel="Save Changes"
          onCancelHref="/zikr"
        />
      </div>
    </div>
  );
}
