import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminProfile } from "@/utils/admin";
import { createCategory } from "@/app/actions/categories";
import { CategoryForm } from "@/components/CategoryForm";

export default async function NewCategoryPage() {
  const profile = await getAdminProfile();
  if (!profile) redirect("/login");

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
          <Link href="/categories" className="hover:text-gray-700">
            Categories
          </Link>
          <span>/</span>
          <span className="text-gray-900">Add Category</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Add Category</h1>
        <p className="mt-1 text-sm text-gray-500">
          Categories group zikr by theme (Morning, After Salah, etc.)
        </p>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
        <CategoryForm
          onSubmit={createCategory}
          submitLabel="Create Category"
          onCancelHref="/categories"
        />
      </div>
    </div>
  );
}
