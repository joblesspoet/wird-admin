"use client";

import { useState } from "react";

interface Category {
  id: string;
  label_en: string;
  label_ar: string | null;
  label_ur: string | null;
}

interface CategoryFormProps {
  category?: Category;
  onSubmit: (formData: FormData) => Promise<{ error?: string } | undefined>;
  submitLabel: string;
  onCancelHref: string;
}

export function CategoryForm({
  category,
  onSubmit,
  submitLabel,
  onCancelHref,
}: CategoryFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsPending(true);
    const formData = new FormData(e.currentTarget);
    const result = await onSubmit(formData);
    if (result?.error) {
      setError(result.error);
      setIsPending(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20";
  const labelClass = "mb-1 block text-sm font-medium text-gray-700";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label className={labelClass}>English Label *</label>
        <input
          name="label_en"
          required
          defaultValue={category?.label_en}
          placeholder="Morning Adhkar"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Arabic Label</label>
        <input
          name="label_ar"
          dir="rtl"
          defaultValue={category?.label_ar || ""}
          placeholder="أذكار الصباح"
          className={`${inputClass} text-right`}
        />
      </div>

      <div>
        <label className={labelClass}>Urdu Label</label>
        <input
          name="label_ur"
          dir="rtl"
          defaultValue={category?.label_ur || ""}
          placeholder="صبح کے اذکار"
          className={`${inputClass} text-right`}
        />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
        >
          {isPending ? "Saving..." : submitLabel}
        </button>
        <a
          href={onCancelHref}
          className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
