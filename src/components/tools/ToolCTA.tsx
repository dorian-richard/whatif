import Link from "next/link";

/**
 * CTA "cheval de Troie" : après la valeur gratuite du calculateur,
 * on bascule vers le produit de pilotage (pas un simulateur jetable).
 */
export function ToolCTA({ line }: { line: string }) {
  return (
    <div className="mt-6 rounded-2xl bg-gradient-to-r from-[#5682F2]/10 to-[#7C5BF2]/10 border border-[#5682F2]/20 p-5 sm:p-6 text-center">
      <p className="text-sm sm:text-base text-foreground mb-4 leading-relaxed">{line}</p>
      <Link
        href="/signup"
        className="inline-block px-8 py-3 bg-gradient-to-r from-[#5682F2] to-[#7C5BF2] text-white rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
      >
        Cr&eacute;er mon compte gratuit &rarr;
      </Link>
      <p className="text-[11px] text-muted-foreground/70 mt-3">
        Gratuit &middot; Sans carte bancaire &middot; Ton vrai net, mois par mois
      </p>
    </div>
  );
}
