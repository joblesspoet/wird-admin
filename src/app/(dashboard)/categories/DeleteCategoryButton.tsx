"use client";

import { useState, useTransition } from "react";
import { deleteCategory } from "@/app/actions/categories";

export function DeleteCategoryButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    if (!confirm("Are you sure you want to delete this category?")) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteCategory(id);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div>
      <button
        onClick={handleDelete}
        disabled={isPending}
        className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
      >
        {isPending ? "Deleting..." : "Delete"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
