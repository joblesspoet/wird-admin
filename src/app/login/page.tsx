import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-200">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-2xl text-white">
              🤲
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Wird Admin</h1>
            <p className="mt-1 text-sm text-gray-500">
              Sign in to manage the zikr library
            </p>
          </div>

          <LoginForm />

          <p className="mt-6 text-center text-xs text-gray-400">
            Wird Admin — Manage Zikr Library
          </p>
        </div>
      </div>
    </div>
  );
}
