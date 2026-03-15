import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Simulateur salaire portage salarial 2026 — Freelens",
  description:
    "Calcule ton salaire net en portage salarial : frais de gestion, charges sociales, impôts. Comparaison avec micro-entreprise, SASU et EURL. Simulateur gratuit.",
  alternates: { canonical: "https://freelens.io/simulateur-salaire-portage-salarial" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Simulateur salaire portage salarial 2026 — Freelens",
  url: "https://freelens.io/simulateur-salaire-portage-salarial",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  description: "Simule ton salaire net en portage salarial avec les vrais taux 2026. Compare avec micro, SASU, EURL.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
};

export default function SimulateurPortageSalarialPage() {
  return (
    <div className="min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="max-w-3xl mx-auto px-6 py-16 space-y-10">

        <div className="space-y-6">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight">
            Simulateur salaire{" "}
            <span className="fn-gradient-text">portage salarial</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Le portage salarial te permet de facturer comme un ind&eacute;pendant tout en &eacute;tant salari&eacute;.
            Mais entre les <strong className="text-foreground">frais de gestion (8-12%)</strong>, les charges sociales et l&apos;IR,
            combien te reste-t-il vraiment ?
          </p>
        </div>

        {/* Comment ça marche */}
        <div className="bg-card rounded-2xl border border-border p-6 sm:p-8 space-y-6">
          <h2 className="text-xl font-bold text-foreground">Comment fonctionne le portage salarial ?</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { step: "1", title: "Tu factures ton client", desc: "Via la soci\u00e9t\u00e9 de portage qui \u00e9met la facture \u00e0 ton nom." },
              { step: "2", title: "Frais de gestion pr\u00e9lev\u00e9s", desc: "8 \u00e0 12% du CA HT selon la soci\u00e9t\u00e9 de portage. Non n\u00e9gociable." },
              { step: "3", title: "Charges sociales calcul\u00e9es", desc: "~50% du brut (r\u00e9gime g\u00e9n\u00e9ral salari\u00e9, incluant retraite et pr\u00e9voyance)." },
              { step: "4", title: "Salaire net vers\u00e9", desc: "Tu re\u00e7ois un bulletin de paie chaque mois. Environ 45-50% du CA HT." },
            ].map((item) => (
              <div key={item.step} className="flex gap-3">
                <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                  {item.step}
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">{item.title}</div>
                  <div className="text-sm text-muted-foreground">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Simulation */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Exemple : consultant &agrave; 500&euro;/jour</h2>
          <div className="text-sm text-muted-foreground leading-relaxed">
            <p>Pour un consultant &agrave; 500&euro;/jour, 218 jours travaill&eacute;s = <strong className="text-foreground">109 000&euro; de CA annuel HT</strong> :</p>
          </div>
          <div className="grid gap-3">
            {[
              { label: "CA annuel HT", value: "109 000\u20AC", color: "text-foreground" },
              { label: "Frais de gestion (10%)", value: "\u2212 10 900\u20AC", color: "text-[#f87171]" },
              { label: "Base brute", value: "98 100\u20AC", color: "text-foreground" },
              { label: "Charges sociales (~50%)", value: "\u2212 49 050\u20AC", color: "text-[#f87171]" },
              { label: "Salaire net avant IR", value: "49 050\u20AC", color: "text-[#4ade80] font-bold" },
              { label: "Soit net mensuel", value: "~4 088\u20AC/mois", color: "text-[#4ade80] font-bold" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-3 bg-card rounded-xl border border-border">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className={`text-sm font-semibold ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Comparaison */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Portage vs autres statuts (109 000&euro; CA)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-muted-foreground font-medium">Statut</th>
                  <th className="text-right py-2 text-muted-foreground font-medium">Net annuel</th>
                  <th className="text-right py-2 text-muted-foreground font-medium">% du CA</th>
                </tr>
              </thead>
              <tbody className="text-foreground">
                {[
                  { statut: "Portage salarial", net: "~49 050\u20AC", pct: "45,0%" },
                  { statut: "SASU IS (salaire)", net: "~53 400\u20AC", pct: "49,0%" },
                  { statut: "SASU IS (dividendes)", net: "~64 900\u20AC", pct: "59,5%" },
                  { statut: "EURL IS (salaire)", net: "~59 900\u20AC", pct: "55,0%" },
                  { statut: "Micro-entreprise", net: "Plafond d\u00e9pass\u00e9", pct: "\u2014" },
                ].map((row) => (
                  <tr key={row.statut} className="border-b border-border/50">
                    <td className="py-2.5">{row.statut}</td>
                    <td className="text-right font-semibold">{row.net}</td>
                    <td className="text-right text-muted-foreground">{row.pct}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Le portage reste le statut le <strong className="text-foreground">moins avantageux financi&egrave;rement</strong>,
            mais c&apos;est le plus simple : pas de cr&eacute;ation de soci&eacute;t&eacute;, pas de comptable, pas de formalit&eacute;s administratives.
            Id&eacute;al pour d&eacute;marrer ou tester une activit&eacute; freelance.
          </p>
        </div>

        {/* Avantages / Inconvénients */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Pour qui est fait le portage salarial ?</h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
            <p>
              Le portage est id&eacute;al si tu veux <strong className="text-foreground">tester le freelancing sans risque</strong> :
              tu gardes le statut de salari&eacute; (ch&ocirc;mage, retraite, pr&eacute;voyance), tu n&apos;as aucune formalit&eacute; juridique, et tu peux arr&ecirc;ter du jour au lendemain.
            </p>
            <p>
              En revanche, au-del&agrave; de <strong className="text-foreground">80 000&euro; de CA</strong>, les frais de gestion deviennent co&ucirc;teux.
              Cr&eacute;er une SASU ou EURL devient rentable d&egrave;s que ton activit&eacute; est stable.
            </p>
          </div>
        </div>

        {/* FAQ */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Questions fr&eacute;quentes</h2>
          <div className="space-y-3 text-sm">
            <div>
              <div className="font-semibold text-foreground">Ai-je droit au ch&ocirc;mage en portage salarial ?</div>
              <div className="text-muted-foreground">Oui, tu cotises au r&eacute;gime g&eacute;n&eacute;ral. Si ton contrat s&apos;arr&ecirc;te, tu peux pr&eacute;tendre &agrave; l&apos;ARE comme un salari&eacute; classique.</div>
            </div>
            <div>
              <div className="font-semibold text-foreground">Quel TJM minimum pour le portage ?</div>
              <div className="text-muted-foreground">La convention collective impose un salaire brut minimum de ~2 500&euro;/mois, soit un TJM plancher d&apos;environ 250-300&euro;/jour.</div>
            </div>
            <div>
              <div className="font-semibold text-foreground">Puis-je cumuler portage et micro-entreprise ?</div>
              <div className="text-muted-foreground">Oui, c&apos;est l&eacute;gal et courant. Tu peux avoir des clients en portage et d&apos;autres en micro, &agrave; condition de ne pas facturer le m&ecirc;me client dans les deux structures.</div>
            </div>
          </div>
        </div>

        <div className="text-center space-y-4 py-4">
          <Link
            href="/signup"
            className="inline-block px-10 py-4 bg-gradient-to-r from-[#5682F2] to-[#7C5BF2] text-white rounded-full text-lg font-bold hover:opacity-90 transition-opacity"
          >
            Simuler mon salaire en portage &rarr;
          </Link>
          <p className="text-sm text-muted-foreground/60">Sans carte bancaire &middot; Essai gratuit 7 jours</p>
        </div>

        <div className="text-xs text-muted-foreground/40 border-t border-border pt-6 space-y-2">
          <p>
            Voir aussi : <Link href="/comparateur-sasu-eurl" className="text-primary hover:underline">SASU vs EURL</Link>
            {" "}&middot;{" "}<Link href="/simulateur-revenus-freelance" className="text-primary hover:underline">Simulateur de revenus freelance</Link>
            {" "}&middot;{" "}<Link href="/devenir-freelance" className="text-primary hover:underline">Devenir freelance</Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
