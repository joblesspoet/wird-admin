"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { publishVersion } from "@/app/actions/publish";

interface PublishFormProps {
  currentVersion: string;
  bumpVersion: (
    version: string,
    type: "major" | "minor" | "patch"
  ) => string;
  newZikrCount: number;
  activeDevices: number;
  adminId: string;
}

export function PublishForm({
  currentVersion,
  bumpVersion,
  newZikrCount,
  activeDevices,
  adminId,
}: PublishFormProps) {
  const [changeType, setChangeType] = useState<
    "patch" | "minor" | "major"
  >(newZikrCount > 0 ? "minor" : "patch");
  const [changelog, setChangelog] = useState("");
  const [notify, setNotify] = useState(newZikrCount > 0);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const nextVersion = bumpVersion(currentVersion, changeType);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData();
    formData.set("change_type", changeType);
    formData.set("changelog", changelog);
    formData.set("notify", notify ? "true" : "false");

    startTransition(async () => {
      const result = await publishVersion(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        alert("Version published successfully!");
      }
    });
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
        <label className={labelClass}>Version Change Type</label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {(
            [
              { value: "patch", label: "Patch", desc: "Fixes / edits (no notify)" },
              { value: "minor", label: "Minor", desc: "New zikr added (notify)" },
              { value: "major", label: "Major", desc: "Big changes (notify)" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setChangeType(opt.value);
                if (opt.value !== "patch") setNotify(true);
              }}
              className={`rounded-lg border p-3 text-left transition-colors ${
                changeType === opt.value
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-gray-200 bg-white hover:bg-gray-50"
              }`}
            >
              <p className="text-sm font-semibold text-gray-900">{opt.label}</p>
              <p className="mt-0.5 text-xs text-gray-500">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-600">
          New version:
          <span className="ml-1 font-bold text-gray-900">v{nextVersion}</span>
        </div>
      </div>

      <div>
        <label className={labelClass}>Changelog (optional)</label>
        <textarea
          value={changelog}
          onChange={(e) => setChangelog(e.target.value)}
          rows={3}
          placeholder="Describe what changed in this version..."
          className={inputClass}
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
        <div>
          <p className="text-sm font-medium text-gray-900">
            Send push notification
          </p>
          <p className="text-xs text-gray-500">
            {activeDevices} active devices will be notified
          </p>
        </div>
        <label className="relative inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            checked={notify}
            onChange={(e) => setNotify(e.target.checked)}
            disabled={newZikrCount === 0}
            className="peer sr-only"
          />
          <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-emerald-600 peer-checked:after:translate-x-full peer-disabled:opacity-50" />
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
        >
          {isPending
            ? "Publishing..."
            : `Publish v${nextVersion}`}
        </button>
        <Link
          href="/dashboard"
          className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
