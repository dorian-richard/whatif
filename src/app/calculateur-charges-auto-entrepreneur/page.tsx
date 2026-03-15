import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Calculateur de charges auto-entrepreneur 2026 — Freelens",
  description:
    "Calcule tes charges auto-entrepreneur 2026 en 30 secondes : cotisations URSSAF, CFP, impôt sur le revenu, TVA. Simulateur gratuit en ligne avec les taux officiels.",
  alternates: { canonical: "https://freelens.io/calculateur-charges-auto-entrepreneur" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Calculateur de charges auto-entrepreneur 2026 — Freelens",
  url: "https://freelens.io/calculateur-charges-auto-entrepreneur",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  description: "Calcule tes charges auto-entrepreneur 2026 : cotisations URSSAF, CFP, impôt sur le revenu. Taux officiels 2026.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
};

export default function CalculateurChargesAutoEntrepreneurPage() {
  return (
    <div className="min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="max-w-3xl mx-auto px-6 py-16 space-y-10">

        <div className="space-y-6">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight">
            Calculateur de charges{" "}
            <span className="fn-gradient-text">auto-entrepreneur</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Combien de charges vas-tu payer en micro-entreprise ? Freelens calcule tes{" "}
            <strong className="text-foreground">cotisations URSSAF, ta contribution &agrave; la formation professionnelle et ton imp&ocirc;t sur le revenu</strong>{" "}
            en temps r&eacute;el, avec les taux officiels 2026.
          </p>
        </div>

        {/* Taux 2026 */}
        <div className="bg-card rounded-2xl border border-border p-6 sm:p-8 space-y-6">
          <h2 className="text-xl font-bold text-foreground">Taux de charges auto-entrepreneur 2026</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-muted-foreground font-medium">Cat&eacute;gorie</th>
                  <th className="text-right py-2 text-muted-foreground font-medium">BNC (services)</th>
                  <th className="text-right py-2 text-muted-foreground font-medium">BIC (commerce)</th>
                </tr>
              </thead>
              <tbody className="text-foreground">
                <tr className="border-b border-border/50">
                  <td className="py-2.5">Cotisations URSSAF</td>
                  <td className="text-right font-semibold">21,1%</td>
                  <td className="text-right font-semibold">12,3%</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2.5">Formation professionnelle (CFP)</td>
                  <td className="text-right font-semibold">0,2%</td>
                  <td className="text-right font-semibold">0,1%</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2.5">Total charges sociales</td>
                  <td className="text-right font-bold text-primary">21,3%</td>
                  <td className="text-right font-bold text-primary">12,4%</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2.5">Abattement forfaitaire IR</td>
                  <td className="text-right font-semibold">34%</td>
                  <td className="text-right font-semibold">71%</td>
                </tr>
                <tr>
                  <td className="py-2.5">Plafond de CA annuel</td>
                  <td className="text-right font-semibold">77 700&euro;</td>
                  <td className="text-right font-semibold">188 700&euro;</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Exemple chiffré */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Exemple concret : freelance &agrave; 5 000&euro;/mois</h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
            <p>
              Pour un freelance en <strong className="text-foreground">prestation de services (BNC)</strong> qui facture 5 000&euro; par mois, soit 60 000&euro; de CA annuel :
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: "CA annuel brut", value: "60 000\u20AC", color: "text-foreground" },
              { label: "Cotisations URSSAF (21,1%)", value: "\u2212 12 660\u20AC", color: "text-[#f87171]" },
              { label: "CFP (0,2%)", value: "\u2212 120\u20AC", color: "text-[#f87171]" },
              { label: "IR estim\u00e9 (~11% TMI)", value: "\u2212 4 356\u20AC", color: "text-[#f87171]" },
              { label: "Revenu net annuel", value: "42 864\u20AC", color: "text-[#4ade80] font-bold" },
              { label: "Revenu net mensuel", value: "3 572\u20AC", color: "text-[#4ade80] font-bold" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-3 bg-card rounded-xl border border-border">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className={`text-sm font-semibold ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Ce que Freelens calcule */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Ce que Freelens calcule pour toi</h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
            <p>
              Contrairement &agrave; un simple calcul de pourcentage, Freelens prend en compte ta{" "}
              <strong className="text-foreground">situation r&eacute;elle</strong> : nombre de clients, variation de CA mois par mois,
              jours de cong&eacute;s, saisonnalit&eacute; de ton activit&eacute;.
            </p>
            <p>
              Tu vois instantan&eacute;ment si tu approches du <strong className="text-foreground">plafond de 77 700&euro;</strong>,
              et Freelens te montre combien tu gagnerais en passant en EURL ou SASU si ton CA d&eacute;passe le seuil.
            </p>
            <p>
              Le moteur int&egrave;gre le <strong className="text-foreground">bar&egrave;me progressif de l&apos;IR 2026</strong> (0%, 11%, 30%, 41%, 45%)
              avec l&apos;abattement forfaitaire de 34% pour les BNC, pour un r&eacute;sultat fid&egrave;le &agrave; ta d&eacute;claration r&eacute;elle.
            </p>
          </div>
        </div>

        {/* ACRE */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Et si tu b&eacute;n&eacute;ficies de l&apos;ACRE ?</h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
            <p>
              L&apos;ACRE (Aide &agrave; la Cr&eacute;ation et &agrave; la Reprise d&apos;Entreprise) r&eacute;duit tes cotisations de{" "}
              <strong className="text-foreground">50% pendant 4 trimestres</strong>. Pour un BNC, tes cotisations passent
              de 21,1% &agrave; environ 10,6%.
            </p>
            <p>
              Sur 60 000&euro; de CA, l&apos;ACRE te fait &eacute;conomiser environ <strong className="text-foreground">6 330&euro; la premi&egrave;re ann&eacute;e</strong>.
            </p>
          </div>
        </div>

        {/* FAQ */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Questions fr&eacute;quentes</h2>
          <div className="space-y-3 text-sm">
            <div>
              <div className="font-semibold text-foreground">Quelle est la diff&eacute;rence entre charges sociales et imp&ocirc;ts ?</div>
              <div className="text-muted-foreground">Les charges sociales (URSSAF) financent ta protection sociale (sant&eacute;, retraite). L&apos;imp&ocirc;t sur le revenu (IR) est calcul&eacute; s&eacute;par&eacute;ment sur ton b&eacute;n&eacute;fice apr&egrave;s abattement.</div>
            </div>
            <div>
              <div className="font-semibold text-foreground">Dois-je facturer la TVA en auto-entrepreneur ?</div>
              <div className="text-muted-foreground">Non, tu es en franchise de TVA tant que ton CA reste sous 36 800&euro; (services) ou 91 900&euro; (commerce). Au-del&agrave;, tu deviens assujetti &agrave; la TVA.</div>
            </div>
            <div>
              <div className="font-semibold text-foreground">Que se passe-t-il si je d&eacute;passe le plafond micro ?</div>
              <div className="text-muted-foreground">Tu as un an de tol&eacute;rance. Si tu d&eacute;passes deux ann&eacute;es cons&eacute;cutives, tu bascules automatiquement en entreprise individuelle classique. Freelens te montre si SASU ou EURL serait plus avantageux.</div>
            </div>
          </div>
        </div>

        <div className="text-center space-y-4 py-4">
          <Link
            href="/signup"
            className="inline-block px-10 py-4 bg-gradient-to-r from-[#5682F2] to-[#7C5BF2] text-white rounded-full text-lg font-bold hover:opacity-90 transition-opacity"
          >
            Calculer mes charges gratuitement &rarr;
          </Link>
          <p className="text-sm text-muted-foreground/60">Sans carte bancaire &middot; Essai gratuit 14 jours</p>
        </div>

        <div className="text-xs text-muted-foreground/40 border-t border-border pt-6 space-y-2">
          <p>
            Voir aussi : <Link href="/simulateur-revenus-freelance" className="text-primary hover:underline">Simulateur de revenus freelance</Link>
            {" "}&middot;{" "}<Link href="/comparateur-sasu-eurl" className="text-primary hover:underline">Comparateur SASU vs EURL</Link>
            {" "}&middot;{" "}<Link href="/calcul-tva-freelance" className="text-primary hover:underline">Calcul TVA freelance</Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
