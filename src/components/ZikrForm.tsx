"use client";

import { useState } from "react";

interface CategoryOption {
  id: string;
  label_en: string;
  label_ar: string | null;
  label_ur: string | null;
}

interface Zikr {
  id: string;
  arabic: string;
  transliteration: string;
  meaning: string;
  recommended_count: number;
  category_id: string | null;
  reference: string | null;
  description: string | null;
}

interface ZikrFormProps {
  categories: CategoryOption[];
  zikr?: Zikr;
  onSubmit: (formData: FormData) => Promise<{ error?: string } | undefined>;
  submitLabel: string;
  onCancelHref: string;
}

export function ZikrForm({
  categories,
  zikr,
  onSubmit,
  submitLabel,
  onCancelHref,
}: ZikrFormProps) {
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
        <label className={labelClass}>Arabic Text *</label>
        <textarea
          name="arabic"
          required
          dir="rtl"
          defaultValue={zikr?.arabic}
          rows={3}
          placeholder="سُبْحَانَ اللّٰه"
          className={`${inputClass} text-right text-xl`}
        />
      </div>

      <div>
        <label className={labelClass}>Transliteration *</label>
        <input
          name="transliteration"
          required
          defaultValue={zikr?.transliteration}
          placeholder="SubhanAllah"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>English Meaning *</label>
        <textarea
          name="meaning"
          required
          defaultValue={zikr?.meaning}
          rows={3}
          placeholder="Glory be to Allah"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Category *</label>
          <select
            name="category_id"
            required
            defaultValue={zikr?.category_id || ""}
            className={inputClass}
          >
            <option value="" disabled>
              Select category
            </option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label_en}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Recommended Count</label>
          <input
            name="recommended_count"
            type="number"
            min={1}
            defaultValue={zikr?.recommended_count ?? 33}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Reference (optional)</label>
        <input
          name="reference"
          defaultValue={zikr?.reference || ""}
          placeholder="e.g., Sahih Bukhari 6403"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Description (optional)</label>
        <textarea
          name="description"
          defaultValue={zikr?.description || ""}
          rows={3}
          placeholder="Additional details about this zikr..."
          className={inputClass}
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
