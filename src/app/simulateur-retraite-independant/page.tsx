import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Simulateur retraite indépendant 2026 — Freelens",
  description:
    "Estime ta retraite de freelance : trimestres validés, pension estimée selon ton statut (micro, SASU, EURL, portage). Simulateur gratuit en ligne.",
  alternates: { canonical: "https://freelens.io/simulateur-retraite-independant" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Simulateur retraite indépendant 2026 — Freelens",
  url: "https://freelens.io/simulateur-retraite-independant",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  description: "Estime ta pension de retraite freelance selon ton statut et ton CA. Trimestres validés, âge de départ.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
};

export default function SimulateurRetraiteIndependantPage() {
  return (
    <div className="min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="max-w-3xl mx-auto px-6 py-16 space-y-10">

        <div className="space-y-6">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight">
            Simulateur retraite{" "}
            <span className="fn-gradient-text">ind&eacute;pendant</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            La retraite est le grand angle mort des freelances. Combien de <strong className="text-foreground">trimestres valides-tu chaque ann&eacute;e</strong> ?
            Quelle pension peux-tu esp&eacute;rer ? La r&eacute;ponse d&eacute;pend enti&egrave;rement de ton statut et de ta r&eacute;mun&eacute;ration.
          </p>
        </div>

        {/* Trimestres par statut */}
        <div className="bg-card rounded-2xl border border-border p-6 sm:p-8 space-y-6">
          <h2 className="text-xl font-bold text-foreground">Trimestres valid&eacute;s selon ton statut</h2>
          <div className="text-sm text-muted-foreground leading-relaxed mb-4">
            <p>Pour valider <strong className="text-foreground">4 trimestres par an</strong> (le maximum), tu dois atteindre un revenu minimum :</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-muted-foreground font-medium">Statut</th>
                  <th className="text-right py-2 text-muted-foreground font-medium">R&eacute;gime</th>
                  <th className="text-right py-2 text-muted-foreground font-medium">CA min pour 4 trim.</th>
                </tr>
              </thead>
              <tbody className="text-foreground">
                {[
                  { statut: "Micro BNC", regime: "CIPAV / SSI", min: "~10 300\u20AC CA" },
                  { statut: "EI / EURL (TNS)", regime: "SSI", min: "~7 100\u20AC b\u00e9n\u00e9fice" },
                  { statut: "SASU (salaire)", regime: "R\u00e9gime g\u00e9n\u00e9ral", min: "~7 100\u20AC brut" },
                  { statut: "SASU (dividendes seuls)", regime: "Aucun", min: "\u26A0 0 trimestre valid\u00e9" },
                  { statut: "Portage salarial", regime: "R\u00e9gime g\u00e9n\u00e9ral", min: "~7 100\u20AC brut" },
                ].map((row) => (
                  <tr key={row.statut} className="border-b border-border/50">
                    <td className="py-2.5">{row.statut}</td>
                    <td className="text-right">{row.regime}</td>
                    <td className="text-right font-semibold">{row.min}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Le piège SASU dividendes */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Le pi&egrave;ge des dividendes en SASU</h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
            <p>
              Beaucoup de freelances en SASU IS choisissent de se r&eacute;mun&eacute;rer <strong className="text-foreground">100% en dividendes</strong> pour
              &eacute;viter les charges sociales (PFU 30% vs ~82% de charges sur salaire). C&apos;est fiscal&shy;ement optimal &agrave; court terme.
            </p>
            <p>
              Mais les dividendes <strong className="text-foreground">ne g&eacute;n&egrave;rent aucun droit &agrave; la retraite</strong> en SASU.
              Z&eacute;ro trimestre valid&eacute;, z&eacute;ro point retraite compl&eacute;mentaire. Apr&egrave;s 20 ans de freelance en full dividendes,
              ta pension sera proche de z&eacute;ro.
            </p>
            <p>
              <strong className="text-foreground">La solution</strong> : un mode de r&eacute;mun&eacute;ration mixte. Verse-toi un salaire minimum
              (~21 200&euro;/an brut, soit le SMIC) pour valider tes 4 trimestres, et compl&egrave;te en dividendes.
              L&apos;&eacute;cart de co&ucirc;t est d&apos;environ 5 000&euro;/an &mdash; le prix de ta retraite.
            </p>
          </div>
        </div>

        {/* Estimation pension */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Estimation de pension : freelance dev, 25 ans de carri&egrave;re</h2>
          <div className="grid gap-3">
            {[
              { mode: "SASU 100% dividendes", pension: "~0\u20AC/mois", comment: "Aucun trimestre valid\u00e9 en freelance" },
              { mode: "SASU mixte (SMIC + dividendes)", pension: "~800-1 000\u20AC/mois", comment: "Trimestres valid\u00e9s, mais points bas" },
              { mode: "SASU 100% salaire 4 000\u20AC net", pension: "~1 400-1 800\u20AC/mois", comment: "Cotisations compl\u00e8tes au r\u00e9gime g\u00e9n\u00e9ral" },
              { mode: "EURL TNS", pension: "~900-1 200\u20AC/mois", comment: "R\u00e9gime SSI, moins favorable" },
              { mode: "Micro-entreprise", pension: "~600-900\u20AC/mois", comment: "D\u00e9pend du CA, r\u00e9gime CIPAV/SSI" },
            ].map((item) => (
              <div key={item.mode} className="flex items-center justify-between p-3 bg-card rounded-xl border border-border">
                <div>
                  <div className="text-sm font-semibold text-foreground">{item.mode}</div>
                  <div className="text-xs text-muted-foreground">{item.comment}</div>
                </div>
                <div className="text-sm font-bold text-primary">{item.pension}</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground/60">
            Estimations indicatives pour 25 ans de carri&egrave;re freelance. La pension r&eacute;elle d&eacute;pend de ta carri&egrave;re ant&eacute;rieure, de ton &acirc;ge de d&eacute;part et des r&eacute;formes futures.
          </p>
        </div>

        {/* Ce que Freelens fait */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Ce que Freelens calcule pour toi</h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
            <p>
              Freelens int&egrave;gre un <strong className="text-foreground">simulateur de retraite</strong> qui prend en compte ton &acirc;ge, ton statut,
              ton CA, et ton mode de r&eacute;mun&eacute;ration pour estimer ta pension future et le nombre de trimestres valid&eacute;s.
            </p>
            <p>
              Tu vois l&apos;impact de chaque d&eacute;cision sur ta retraite : changer de statut, augmenter ton salaire, passer en mixte.
              Tout est calcul&eacute; en temps r&eacute;el.
            </p>
          </div>
        </div>

        {/* FAQ */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Questions fr&eacute;quentes</h2>
          <div className="space-y-3 text-sm">
            <div>
              <div className="font-semibold text-foreground">Combien de trimestres faut-il pour une retraite &agrave; taux plein ?</div>
              <div className="text-muted-foreground">Entre 167 et 172 trimestres selon ton ann&eacute;e de naissance (soit environ 42-43 ans de cotisation). L&apos;&acirc;ge l&eacute;gal de d&eacute;part est 64 ans depuis la r&eacute;forme 2023.</div>
            </div>
            <div>
              <div className="font-semibold text-foreground">Les ann&eacute;es de salariat comptent-elles ?</div>
              <div className="text-muted-foreground">Oui, tous les trimestres acquis avant le freelance sont conserv&eacute;s. Si tu as travaill&eacute; 10 ans en CDI avant de te lancer, tu as d&eacute;j&agrave; 40 trimestres valid&eacute;s.</div>
            </div>
            <div>
              <div className="font-semibold text-foreground">Existe-t-il des solutions compl&eacute;mentaires ?</div>
              <div className="text-muted-foreground">Oui : PER (Plan &Eacute;pargne Retraite), assurance vie, immobilier locatif. Ces solutions sont d&eacute;fiscalisables et compensent la faiblesse de la retraite obligatoire des ind&eacute;pendants.</div>
            </div>
          </div>
        </div>

        <div className="text-center space-y-4 py-4">
          <Link
            href="/signup"
            className="inline-block px-10 py-4 bg-gradient-to-r from-[#5682F2] to-[#7C5BF2] text-white rounded-full text-lg font-bold hover:opacity-90 transition-opacity"
          >
            Simuler ma retraite freelance &rarr;
          </Link>
          <p className="text-sm text-muted-foreground/60">Sans carte bancaire &middot; Essai gratuit 14 jours</p>
        </div>

        <div className="text-xs text-muted-foreground/40 border-t border-border pt-6 space-y-2">
          <p>
            Voir aussi : <Link href="/comparateur-sasu-eurl" className="text-primary hover:underline">SASU vs EURL</Link>
            {" "}&middot;{" "}<Link href="/simulateur-revenus-freelance" className="text-primary hover:underline">Simulateur de revenus</Link>
            {" "}&middot;{" "}<Link href="/simulateur-salaire-portage-salarial" className="text-primary hover:underline">Portage salarial</Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
