"use client";

import { AlertTriangle } from "@/components/ui/icons";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50 p-4">
      <div className="text-center max-w-sm">
        <div className="mb-4 flex justify-center"><AlertTriangle className="size-12 text-red-400" /></div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Oups, une erreur</h2>
        <p className="text-sm text-gray-500 mb-6">{error.message || "Quelque chose s'est mal passe."}</p>
        <button
          onClick={reset}
          className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
        >
          Reessayer
        </button>
      </div>
    </div>
  );
}
