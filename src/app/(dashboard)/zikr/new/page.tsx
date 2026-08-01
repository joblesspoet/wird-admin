import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getAdminProfile } from "@/utils/admin";
import { createZikr } from "@/app/actions/zikr";
import { ZikrForm } from "@/components/ZikrForm";

export default async function NewZikrPage() {
  const profile = await getAdminProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, label_en, label_ar, label_ur")
    .order("sort_order", { ascending: true });

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
          <Link href="/zikr" className="hover:text-gray-700">
            Zikr Library
          </Link>
          <span>/</span>
          <span className="text-gray-900">Add New Zikr</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Add New Zikr</h1>
        <p className="mt-1 text-sm text-gray-500">
          Create a new zikr entry. Fields marked * are required.
        </p>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
        <ZikrForm
          categories={categories ?? []}
          onSubmit={createZikr}
          submitLabel="Create Zikr"
          onCancelHref="/zikr"
        />
      </div>
    </div>
  );
}
