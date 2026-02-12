export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50">
      <div className="text-center">
        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl mx-auto mb-4 animate-pulse">
          🔮
        </div>
        <p className="text-sm text-gray-400">Chargement...</p>
      </div>
    </div>
  );
}
