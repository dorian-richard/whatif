import Link from "next/link";
import { Search } from "@/components/ui/icons";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#07070e] p-4">
      <div className="text-center max-w-sm">
        <div className="mb-4 flex justify-center">
          <div className="size-16 rounded-2xl bg-[#5682F2]/10 flex items-center justify-center">
            <Search className="size-8 text-[#5682F2]" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Page introuvable</h2>
        <p className="text-sm text-[#8b8b9e] mb-6">Cette page n&apos;existe pas ou a été déplacée.</p>
        <Link
          href="/"
          className="px-6 py-2.5 bg-gradient-to-r from-[#5682F2] to-[#7C5BF2] text-white rounded-full text-sm font-semibold hover:opacity-90 transition-opacity inline-block"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
