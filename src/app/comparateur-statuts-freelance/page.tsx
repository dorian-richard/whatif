import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Comparateur statuts freelance 2026 : micro, EURL, SASU, portage — Freelens",
  description:
    "Compare micro-entreprise, EI, EURL IR/IS, SASU IR/IS et portage salarial côte à côte. Calcul du net après charges et impôts selon ton CA réel. Gratuit.",
  alternates: { canonical: "https://freelens.io/comparateur-statuts-freelance" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Comparateur de statuts freelance — Freelens",
  url: "https://freelens.io/comparateur-statuts-freelance",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  description: "Compare micro-entreprise, EI, EURL IR/IS, SASU IR/IS et portage salarial côte à côte. Net après charges et impôts selon ton CA réel.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
};

export default function ComparateurStatutsPage() {
  return (
    <div className="min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="max-w-3xl mx-auto px-6 py-16 space-y-10">

        <div className="space-y-6">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight">
            Comparateur de statuts{" "}
            <span className="fn-gradient-text">freelance</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Micro-entreprise, EI, EURL, SASU ou portage salarial ? Le choix de ton statut juridique a un
            <strong className="text-foreground"> impact majeur sur ton revenu net</strong>.
            Freelens compare tous les statuts c&ocirc;te &agrave; c&ocirc;te, sur la base de ton CA r&eacute;el.
          </p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 sm:p-8 space-y-5">
          <h2 className="text-xl font-bold text-foreground">Ce que le comparateur calcule</h2>
          <div className="grid gap-3 sm:grid-cols-2 text-sm">
            {[
              { title: "Cotisations URSSAF", desc: "Taux r\u00e9els 2026 par statut : 25,6% en micro, 45% en EI, 65%+ en SASU" },
              { title: "Imp\u00f4t sur le revenu", desc: "Bar\u00e8me progressif IR appliqu\u00e9 au revenu imposable de chaque statut" },
              { title: "Imp\u00f4t sur les soci\u00e9t\u00e9s", desc: "Pour EURL IS et SASU IS : IS 15%/25% + flat tax sur dividendes" },
              { title: "Revenu net annuel", desc: "Ce qui reste apr\u00e8s toutes les charges, pour chaque statut" },
              { title: "Taux effectif", desc: "Pourcentage r\u00e9el de charges + imp\u00f4ts sur ton CA" },
              { title: "Diff\u00e9rence en euros", desc: "Combien tu gagnes ou perds en changeant de statut" },
            ].map((item) => (
              <div key={item.title}>
                <div className="font-semibold text-foreground">{item.title}</div>
                <div className="text-muted-foreground">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Quel statut choisir en freelance ?</h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
            <p>
              En dessous de <strong className="text-foreground">83 600&euro; de CA annuel</strong> (prestations BNC), la micro-entreprise est souvent le statut
              le plus simple et le plus avantageux gr&acirc;ce &agrave; ses cotisations r&eacute;duites (~26%) et son r&eacute;gime fiscal simplifi&eacute;.
            </p>
            <p>
              Au-del&agrave; de ce seuil, l&apos;<strong className="text-foreground">EURL &agrave; l&apos;IS</strong> ou la <strong className="text-foreground">SASU &agrave; l&apos;IS</strong> permettent
              d&apos;optimiser la r&eacute;mun&eacute;ration via un mix salaire + dividendes. La SASU offre une meilleure protection sociale
              (r&eacute;gime g&eacute;n&eacute;ral) mais co&ucirc;te plus cher en charges patronales.
            </p>
            <p>
              Le <strong className="text-foreground">portage salarial</strong> est id&eacute;al pour d&eacute;marrer sans cr&eacute;er de structure, mais les frais
              de gestion (7-10%) r&eacute;duisent le net. Freelens te montre exactement combien chaque statut te rapporte.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Tableau comparatif rapide</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-border rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left px-4 py-3 font-semibold text-foreground">Statut</th>
                  <th className="text-right px-4 py-3 font-semibold text-foreground">Charges</th>
                  <th className="text-center px-4 py-3 font-semibold text-foreground">Plafond CA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr><td className="px-4 py-2.5 text-foreground">Micro-entreprise</td><td className="px-4 py-2.5 text-right text-muted-foreground">~26%</td><td className="px-4 py-2.5 text-center text-muted-foreground">83 600&euro;</td></tr>
                <tr><td className="px-4 py-2.5 text-foreground">EI</td><td className="px-4 py-2.5 text-right text-muted-foreground">~45%</td><td className="px-4 py-2.5 text-center text-muted-foreground">Illimit&eacute;</td></tr>
                <tr><td className="px-4 py-2.5 text-foreground">EURL IR</td><td className="px-4 py-2.5 text-right text-muted-foreground">~45%</td><td className="px-4 py-2.5 text-center text-muted-foreground">Illimit&eacute;</td></tr>
                <tr><td className="px-4 py-2.5 text-foreground">EURL IS</td><td className="px-4 py-2.5 text-right text-muted-foreground">~35-50%</td><td className="px-4 py-2.5 text-center text-muted-foreground">Illimit&eacute;</td></tr>
                <tr><td className="px-4 py-2.5 text-foreground">SASU IR</td><td className="px-4 py-2.5 text-right text-muted-foreground">~65%</td><td className="px-4 py-2.5 text-center text-muted-foreground">Illimit&eacute;</td></tr>
                <tr><td className="px-4 py-2.5 text-foreground">SASU IS</td><td className="px-4 py-2.5 text-right text-muted-foreground">~45-65%</td><td className="px-4 py-2.5 text-center text-muted-foreground">Illimit&eacute;</td></tr>
                <tr><td className="px-4 py-2.5 text-foreground">Portage salarial</td><td className="px-4 py-2.5 text-right text-muted-foreground">~50-55%</td><td className="px-4 py-2.5 text-center text-muted-foreground">Illimit&eacute;</td></tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground/80">Taux indicatifs incluant cotisations + imp&ocirc;ts. Le calcul exact d&eacute;pend de ton CA et de ta situation.</p>
        </div>

        <div className="text-center space-y-4 py-4">
          <Link
            href="/signup"
            className="inline-block px-10 py-4 bg-gradient-to-r from-[#5682F2] to-[#7C5BF2] text-white rounded-full text-lg font-bold hover:opacity-90 transition-opacity"
          >
            Comparer les statuts gratuitement &rarr;
          </Link>
          <p className="text-sm text-muted-foreground/80">Sans carte bancaire &middot; R&eacute;sultat instantan&eacute;</p>
        </div>

        <div className="text-xs text-muted-foreground/80 border-t border-border pt-6 space-y-2">
          <p>
            Voir aussi : <Link href="/simulateur-revenus-freelance" className="text-primary hover:underline">Simulateur de revenus freelance</Link>
            {" "}&middot;{" "}<Link href="/tjm-freelance" className="text-primary hover:underline">TJM freelance 2025</Link>
            {" "}&middot;{" "}<Link href="/devenir-freelance" className="text-primary hover:underline">Devenir freelance</Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
