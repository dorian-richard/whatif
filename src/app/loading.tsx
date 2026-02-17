import Image from "next/image";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#07070e]">
      <div className="text-center">
        <div className="mx-auto mb-4 animate-pulse">
          <Image src="/logo.svg" alt="Freelens" width={48} height={48} className="rounded-2xl" />
        </div>
        <p className="text-sm text-[#5a5a6e]">Chargement...</p>
      </div>
    </div>
  );
}
