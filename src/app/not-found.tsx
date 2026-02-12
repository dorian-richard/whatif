import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50 p-4">
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-4">🔍</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Page introuvable</h2>
        <p className="text-sm text-gray-500 mb-6">Cette page n&apos;existe pas ou a ete deplacee.</p>
        <Link
          href="/"
          className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors inline-block"
        >
          Retour a l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
