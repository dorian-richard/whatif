import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Comparateur SASU vs EURL 2026 — Quel statut choisir ? — Freelens",
  description:
    "SASU ou EURL ? Compare charges sociales, fiscalité, dividendes, protection sociale et coût de création. Simulateur gratuit avec les vrais chiffres 2026.",
  alternates: { canonical: "https://freelens.io/comparateur-sasu-eurl" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Comparateur SASU vs EURL 2026 — Freelens",
  url: "https://freelens.io/comparateur-sasu-eurl",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  description: "Compare SASU et EURL : charges, fiscalité, dividendes, protection sociale. Chiffres 2026.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
};

export default function ComparateurSasuEurlPage() {
  return (
    <div className="min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="max-w-3xl mx-auto px-6 py-16 space-y-10">

        <div className="space-y-6">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight">
            SASU vs EURL :{" "}
            <span className="fn-gradient-text">quel statut choisir ?</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Le choix entre SASU et EURL est la d&eacute;cision la plus structurante pour un freelance qui quitte la micro-entreprise.
            Charges sociales, fiscalit&eacute;, dividendes, retraite &mdash; tout change.{" "}
            <strong className="text-foreground">Voici la comparaison compl&egrave;te avec les chiffres 2026.</strong>
          </p>
        </div>

        {/* Tableau comparatif */}
        <div className="bg-card rounded-2xl border border-border p-6 sm:p-8 space-y-6">
          <h2 className="text-xl font-bold text-foreground">Comparaison d&eacute;taill&eacute;e</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-muted-foreground font-medium">Crit&egrave;re</th>
                  <th className="text-center py-2 font-semibold text-[#5682F2]">SASU IS</th>
                  <th className="text-center py-2 font-semibold text-[#a78bfa]">EURL IS</th>
                </tr>
              </thead>
              <tbody className="text-foreground">
                {[
                  { label: "R\u00e9gime social du dirigeant", sasu: "Assimil\u00e9 salari\u00e9", eurl: "TNS (ind\u00e9pendant)" },
                  { label: "Charges sociales sur salaire", sasu: "~82% du net", eurl: "~45% du net" },
                  { label: "Dividendes", sasu: "PFU 30% (flat tax)", eurl: "Cotisations TNS au-del\u00e0 de 10% du capital" },
                  { label: "Protection sociale", sasu: "Identique \u00e0 un salari\u00e9", eurl: "Protection TNS (inf\u00e9rieure)" },
                  { label: "Retraite", sasu: "R\u00e9gime g\u00e9n\u00e9ral (meilleur)", eurl: "SSI (moins favorable)" },
                  { label: "IS", sasu: "15% \u2264 42 500\u20AC, 25% au-del\u00e0", eurl: "15% \u2264 42 500\u20AC, 25% au-del\u00e0" },
                  { label: "Cr\u00e9ation (co\u00fbt moyen)", sasu: "300-800\u20AC", eurl: "300-800\u20AC" },
                  { label: "Comptable (annuel)", sasu: "1 500-3 000\u20AC", eurl: "1 200-2 500\u20AC" },
                  { label: "Cession de parts", sasu: "Libre (actions)", eurl: "Agr\u00e9ment requis (parts)" },
                ].map((row) => (
                  <tr key={row.label} className="border-b border-border/50">
                    <td className="py-2.5 text-muted-foreground">{row.label}</td>
                    <td className="text-center py-2.5 font-medium">{row.sasu}</td>
                    <td className="text-center py-2.5 font-medium">{row.eurl}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Simulation chiffrée */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Simulation : freelance d&eacute;veloppeur &agrave; 120 000&euro; de CA</h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
            <p>
              Prenons un d&eacute;veloppeur &agrave; 550&euro;/jour, 218 jours travaill&eacute;s, soit <strong className="text-foreground">119 900&euro; de CA annuel</strong>.
              Voici ce qu&apos;il garde selon le statut et le mode de r&eacute;mun&eacute;ration :
            </p>
          </div>
          <div className="grid gap-3">
            {[
              { mode: "SASU IS \u2014 100% salaire", net: "~58 200\u20AC", pct: "48,5%", note: "Protection sociale maximale" },
              { mode: "SASU IS \u2014 100% dividendes", net: "~71 400\u20AC", pct: "59,6%", note: "Aucune cotisation retraite" },
              { mode: "SASU IS \u2014 mixte 40/60", net: "~66 100\u20AC", pct: "55,1%", note: "Compromis charges/protection" },
              { mode: "EURL IS \u2014 100% salaire", net: "~65 900\u20AC", pct: "55,0%", note: "Charges TNS plus l\u00e9g\u00e8res" },
              { mode: "EURL IS \u2014 100% dividendes", net: "~63 800\u20AC", pct: "53,2%", note: "Cotisations TNS sur dividendes > 10% capital" },
            ].map((item) => (
              <div key={item.mode} className="flex items-center justify-between p-3 bg-card rounded-xl border border-border">
                <div>
                  <div className="text-sm font-semibold text-foreground">{item.mode}</div>
                  <div className="text-xs text-muted-foreground">{item.note}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-[#4ade80]">{item.net}</div>
                  <div className="text-xs text-muted-foreground">{item.pct} du CA</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quand choisir quoi */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Quand choisir la SASU ?</h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
            <p>
              La SASU est id&eacute;ale si tu veux une <strong className="text-foreground">protection sociale &eacute;quivalente &agrave; un salari&eacute;</strong> (mutuelle, retraite au r&eacute;gime g&eacute;n&eacute;ral, pr&eacute;voyance).
              C&apos;est aussi le meilleur choix si tu pr&eacute;vois de te r&eacute;mun&eacute;rer en dividendes : le <strong className="text-foreground">PFU &agrave; 30% est pr&eacute;visible et plafonn&eacute;</strong>, contrairement aux cotisations TNS de l&apos;EURL.
            </p>
            <p>
              La SASU est &eacute;galement privil&eacute;gi&eacute;e pour <strong className="text-foreground">lever des fonds</strong> ou accueillir des associ&eacute;s (passage en SAS simplifi&eacute;).
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Quand choisir l&apos;EURL ?</h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
            <p>
              L&apos;EURL est plus avantageuse si tu te r&eacute;mun&egrave;res <strong className="text-foreground">principalement en salaire</strong> : les cotisations TNS (~45%)
              sont nettement inf&eacute;rieures aux charges salariales SASU (~82%). Tu gardes plus en net imm&eacute;diat.
            </p>
            <p>
              Attention aux dividendes en EURL : au-del&agrave; de 10% du capital social, ils sont soumis aux <strong className="text-foreground">cotisations TNS (~45%)</strong>,
              ce qui les rend moins avantageux qu&apos;en SASU.
            </p>
          </div>
        </div>

        {/* FAQ */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Questions fr&eacute;quentes</h2>
          <div className="space-y-3 text-sm">
            <div>
              <div className="font-semibold text-foreground">Peut-on passer de SASU &agrave; EURL (ou l&apos;inverse) ?</div>
              <div className="text-muted-foreground">Pas directement. Il faut dissoudre la premi&egrave;re soci&eacute;t&eacute; et en cr&eacute;er une nouvelle. C&apos;est co&ucirc;teux et administrativement lourd &mdash; d&apos;o&ugrave; l&apos;importance de bien choisir d&egrave;s le d&eacute;part.</div>
            </div>
            <div>
              <div className="font-semibold text-foreground">Quel capital social pour d&eacute;marrer ?</div>
              <div className="text-muted-foreground">1&euro; minimum l&eacute;gal dans les deux cas. En pratique, 1 000&euro; &agrave; 5 000&euro; donne plus de cr&eacute;dibilit&eacute; et permet de mieux g&eacute;rer la tr&eacute;sorerie initiale.</div>
            </div>
            <div>
              <div className="font-semibold text-foreground">Et le portage salarial ?</div>
              <div className="text-muted-foreground">Le portage est une alternative sans cr&eacute;ation de soci&eacute;t&eacute; : tu es salari&eacute; de la soci&eacute;t&eacute; de portage. Pratique pour d&eacute;marrer, mais les frais de gestion (8-12%) r&eacute;duisent ton net.</div>
            </div>
          </div>
        </div>

        <div className="text-center space-y-4 py-4">
          <Link
            href="/signup"
            className="inline-block px-10 py-4 bg-gradient-to-r from-[#5682F2] to-[#7C5BF2] text-white rounded-full text-lg font-bold hover:opacity-90 transition-opacity"
          >
            Comparer SASU vs EURL avec mes chiffres &rarr;
          </Link>
          <p className="text-sm text-muted-foreground/60">Sans carte bancaire &middot; Essai gratuit 7 jours</p>
        </div>

        <div className="text-xs text-muted-foreground/40 border-t border-border pt-6 space-y-2">
          <p>
            Voir aussi : <Link href="/calculateur-charges-auto-entrepreneur" className="text-primary hover:underline">Charges auto-entrepreneur 2026</Link>
            {" "}&middot;{" "}<Link href="/comparateur-statuts-freelance" className="text-primary hover:underline">Comparateur tous statuts</Link>
            {" "}&middot;{" "}<Link href="/simulateur-revenus-freelance" className="text-primary hover:underline">Simulateur de revenus</Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
