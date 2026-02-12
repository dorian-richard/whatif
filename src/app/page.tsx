import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50 flex items-center justify-center p-4">
      <div className="text-center max-w-2xl">
        <div className="inline-flex items-center gap-3 mb-6">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-4xl shadow-lg shadow-indigo-200">
            🔮
          </div>
          <h1 className="text-5xl font-bold text-gray-900">WhatIf</h1>
        </div>
        <p className="text-xl text-gray-500 mb-8">
          Chaque decision de freelance a un prix.
          <br />
          <strong className="text-gray-700">
            WhatIf te le montre avant que tu la prennes.
          </strong>
        </p>
        <Link
          href="/onboarding"
          className="inline-block px-8 py-3 bg-indigo-600 text-white rounded-xl text-lg font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
        >
          Commencer gratuitement →
        </Link>
      </div>
    </div>
  );
}
