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
    <div className="min-h-screen flex items-center justify-center bg-[#07070e] p-4">
      <div className="text-center max-w-sm">
        <div className="mb-4 flex justify-center">
          <div className="size-16 rounded-2xl bg-[#f87171]/10 flex items-center justify-center">
            <AlertTriangle className="size-8 text-[#f87171]" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Oups, une erreur</h2>
        <p className="text-sm text-[#8b8b9e] mb-6">{error.message || "Quelque chose s'est mal passe."}</p>
        <button
          onClick={reset}
          className="px-6 py-2.5 bg-gradient-to-r from-[#5682F2] to-[#7C5BF2] text-white rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Reessayer
        </button>
      </div>
    </div>
  );
}
