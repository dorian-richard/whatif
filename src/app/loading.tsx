export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#07070e]">
      <div className="text-center">
        <div className="mx-auto mb-4 animate-pulse">
          <span className="text-2xl font-bold text-white">Freelens</span>
        </div>
        <p className="text-sm text-[#5a5a6e]">Chargement...</p>
      </div>
    </div>
  );
}
