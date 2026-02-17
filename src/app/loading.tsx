export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#07070e]">
      <div className="text-center">
        <div className="mx-auto mb-4 animate-pulse">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Freelens" className="h-14 w-auto opacity-80" />
        </div>
        <p className="text-sm text-[#5a5a6e]">Chargement...</p>
      </div>
    </div>
  );
}
