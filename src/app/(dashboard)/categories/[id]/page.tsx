import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getAdminProfile } from "@/utils/admin";
import { updateCategory } from "@/app/actions/categories";
import { CategoryForm } from "@/components/CategoryForm";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await getAdminProfile();
  if (!profile) redirect("/login");

  const { id } = await params;

  const supabase = await createClient();
  const { data: category } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .single();

  if (!category) notFound();

  const handleUpdate = updateCategory.bind(null, id);

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
          <Link href="/categories" className="hover:text-gray-700">
            Categories
          </Link>
          <span>/</span>
          <span className="text-gray-900">Edit Category</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Category</h1>
        <p className="mt-1 text-sm text-gray-500">Update category details.</p>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
        <CategoryForm
          category={category}
          onSubmit={handleUpdate}
          submitLabel="Save Changes"
          onCancelHref="/categories"
        />
      </div>
    </div>
  );
}
