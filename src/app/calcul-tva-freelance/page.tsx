import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Calcul TVA freelance 2026 — Seuils, franchise, déclaration — Freelens",
  description:
    "Tout sur la TVA freelance en 2026 : seuils de franchise, calcul TVA collectée vs déductible, déclaration mensuelle ou trimestrielle. Simulateur gratuit.",
  alternates: { canonical: "https://freelens.io/calcul-tva-freelance" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Calcul TVA freelance 2026 — Freelens",
  url: "https://freelens.io/calcul-tva-freelance",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  description: "Calcul TVA freelance 2026 : seuils de franchise, déclaration, TVA collectée vs déductible.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
};

export default function CalculTvaFreelancePage() {
  return (
    <div className="min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="max-w-3xl mx-auto px-6 py-16 space-y-10">

        <div className="space-y-6">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight">
            Calcul TVA{" "}
            <span className="fn-gradient-text">freelance 2026</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            La TVA est l&apos;imp&ocirc;t le plus complexe pour un freelance : franchise, seuils, d&eacute;claration mensuelle ou trimestrielle,
            TVA collect&eacute;e vs d&eacute;ductible. <strong className="text-foreground">Voici tout ce que tu dois savoir en 2026.</strong>
          </p>
        </div>

        {/* Seuils */}
        <div className="bg-card rounded-2xl border border-border p-6 sm:p-8 space-y-6">
          <h2 className="text-xl font-bold text-foreground">Seuils de franchise de TVA 2026</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-muted-foreground font-medium">Activit&eacute;</th>
                  <th className="text-right py-2 text-muted-foreground font-medium">Seuil de base</th>
                  <th className="text-right py-2 text-muted-foreground font-medium">Seuil major&eacute;</th>
                </tr>
              </thead>
              <tbody className="text-foreground">
                <tr className="border-b border-border/50">
                  <td className="py-2.5">Prestations de services (BNC)</td>
                  <td className="text-right font-semibold">36 800&euro;</td>
                  <td className="text-right font-semibold">39 100&euro;</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2.5">Vente de marchandises (BIC)</td>
                  <td className="text-right font-semibold">91 900&euro;</td>
                  <td className="text-right font-semibold">101 000&euro;</td>
                </tr>
                <tr>
                  <td className="py-2.5">Avocats, auteurs, artistes</td>
                  <td className="text-right font-semibold">47 600&euro;</td>
                  <td className="text-right font-semibold">58 600&euro;</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            En dessous du <strong className="text-foreground">seuil de base</strong>, tu es en franchise de TVA : tu ne factures pas de TVA et tu ne la r&eacute;cup&egrave;res pas.
            Si tu d&eacute;passes le <strong className="text-foreground">seuil major&eacute;</strong>, tu deviens assujetti imm&eacute;diatement.
          </p>
        </div>

        {/* Comment ça marche */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">TVA collect&eacute;e vs TVA d&eacute;ductible</h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
            <p>
              Quand tu es assujetti &agrave; la TVA, tu dois comprendre deux notions :
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="p-4 bg-card rounded-xl border border-border">
              <div className="text-sm font-semibold text-[#f97316] mb-1">TVA collect&eacute;e</div>
              <div className="text-sm text-muted-foreground">La TVA que tu factures &agrave; tes clients (g&eacute;n&eacute;ralement 20% du HT). Tu la collectes pour l&apos;&Eacute;tat.</div>
            </div>
            <div className="p-4 bg-card rounded-xl border border-border">
              <div className="text-sm font-semibold text-[#4ade80] mb-1">TVA d&eacute;ductible</div>
              <div className="text-sm text-muted-foreground">La TVA que tu paies sur tes achats professionnels (mat&eacute;riel, logiciels, d&eacute;placements). Tu la r&eacute;cup&egrave;res.</div>
            </div>
          </div>
          <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
            <div className="text-sm font-semibold text-primary mb-1">TVA &agrave; reverser = TVA collect&eacute;e &minus; TVA d&eacute;ductible</div>
            <div className="text-sm text-muted-foreground">
              Si tu factures 10 000&euro; HT (soit 2 000&euro; de TVA) et que tu as 500&euro; de TVA d&eacute;ductible sur tes achats,
              tu reverses <strong className="text-foreground">1 500&euro;</strong> &agrave; l&apos;&Eacute;tat.
            </div>
          </div>
        </div>

        {/* Exemple */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Exemple : freelance &agrave; 6 000&euro; HT/mois</h2>
          <div className="grid gap-3">
            {[
              { label: "CA mensuel HT", value: "6 000\u20AC" },
              { label: "TVA collect\u00e9e (20%)", value: "1 200\u20AC" },
              { label: "CA TTC factur\u00e9", value: "7 200\u20AC" },
              { label: "TVA d\u00e9ductible (achats ~300\u20AC HT)", value: "\u2212 60\u20AC" },
              { label: "TVA \u00e0 reverser", value: "1 140\u20AC/mois" },
              { label: "TVA annuelle", value: "13 680\u20AC/an" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-3 bg-card rounded-xl border border-border">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className="text-sm font-semibold text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Déclaration */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Quand d&eacute;clarer sa TVA ?</h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
            <p>
              En <strong className="text-foreground">r&eacute;gime r&eacute;el simplifi&eacute;</strong> (CA &lt; 840 000&euro;), tu fais 2 acomptes semestriels
              et une d&eacute;claration annuelle (CA12). En <strong className="text-foreground">r&eacute;gime r&eacute;el normal</strong>, tu d&eacute;clares chaque mois (CA3).
            </p>
            <p>
              Freelens int&egrave;gre automatiquement tes &eacute;ch&eacute;ances TVA dans le <strong className="text-foreground">calendrier fiscal</strong>,
              avec le montant estim&eacute; bas&eacute; sur ton CA r&eacute;el du mois.
            </p>
          </div>
        </div>

        {/* FAQ */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Questions fr&eacute;quentes</h2>
          <div className="space-y-3 text-sm">
            <div>
              <div className="font-semibold text-foreground">Dois-je facturer la TVA en micro-entreprise ?</div>
              <div className="text-muted-foreground">Non, tant que tu restes sous le seuil de franchise (36 800&euro; en services). Tu ajoutes la mention &laquo; TVA non applicable, art. 293 B du CGI &raquo; sur tes factures.</div>
            </div>
            <div>
              <div className="font-semibold text-foreground">La TVA est-elle un co&ucirc;t pour le freelance ?</div>
              <div className="text-muted-foreground">Non, la TVA est neutre pour le freelance assujetti : tu collectes et tu reverse. C&apos;est une avance de tr&eacute;sorerie, pas une charge. En revanche, en franchise de TVA, tu ne r&eacute;cup&egrave;res pas la TVA sur tes achats.</div>
            </div>
            <div>
              <div className="font-semibold text-foreground">Que se passe-t-il si je d&eacute;passe le seuil en cours d&apos;ann&eacute;e ?</div>
              <div className="text-muted-foreground">Tu deviens assujetti &agrave; la TVA le 1er jour du mois de d&eacute;passement du seuil major&eacute;. Tu dois alors facturer la TVA sur toutes tes prestations &agrave; partir de cette date.</div>
            </div>
          </div>
        </div>

        <div className="text-center space-y-4 py-4">
          <Link
            href="/signup"
            className="inline-block px-10 py-4 bg-gradient-to-r from-[#5682F2] to-[#7C5BF2] text-white rounded-full text-lg font-bold hover:opacity-90 transition-opacity"
          >
            Calculer ma TVA gratuitement &rarr;
          </Link>
          <p className="text-sm text-muted-foreground/80">Sans carte bancaire &middot; Essai gratuit 7 jours</p>
        </div>

        <div className="text-xs text-muted-foreground/80 border-t border-border pt-6 space-y-2">
          <p>
            Voir aussi : <Link href="/calculateur-charges-auto-entrepreneur" className="text-primary hover:underline">Charges auto-entrepreneur</Link>
            {" "}&middot;{" "}<Link href="/simulateur-revenus-freelance" className="text-primary hover:underline">Simulateur de revenus</Link>
            {" "}&middot;{" "}<Link href="/comparateur-sasu-eurl" className="text-primary hover:underline">SASU vs EURL</Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
