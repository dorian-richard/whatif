import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "TJM freelance 2025 : combien facturer ? Benchmark + calculateur — Freelens",
  description:
    "Découvre les TJM du marché freelance français par métier (dev, data, design, product). Calcule ton TJM idéal selon ton objectif de revenu net. Gratuit.",
  alternates: { canonical: "https://freelens.io/tjm-freelance" },
};

export default function TJMFreelancePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-16 space-y-10">

        <div className="space-y-6">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight">
            TJM freelance 2025 :{" "}
            <span className="fn-gradient-text">combien facturer ?</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Le <strong className="text-foreground">taux journalier moyen (TJM)</strong> est la base de ta r&eacute;mun&eacute;ration en freelance.
            Trop bas, tu ne couvres pas tes charges. Trop haut, tu perds des missions.
            Freelens t&apos;aide &agrave; trouver le <strong className="text-foreground">TJM id&eacute;al</strong> pour ton profil.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">TJM moyens par m&eacute;tier en France (2025)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-border rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left px-4 py-3 font-semibold text-foreground">M&eacute;tier</th>
                  <th className="text-right px-4 py-3 font-semibold text-foreground">TJM junior</th>
                  <th className="text-right px-4 py-3 font-semibold text-foreground">TJM senior</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr><td className="px-4 py-2.5 text-foreground">D&eacute;veloppeur fullstack</td><td className="px-4 py-2.5 text-right text-muted-foreground">350&euro;</td><td className="px-4 py-2.5 text-right text-muted-foreground">600&euro;</td></tr>
                <tr><td className="px-4 py-2.5 text-foreground">D&eacute;veloppeur React / Next.js</td><td className="px-4 py-2.5 text-right text-muted-foreground">400&euro;</td><td className="px-4 py-2.5 text-right text-muted-foreground">650&euro;</td></tr>
                <tr><td className="px-4 py-2.5 text-foreground">Data Engineer / Scientist</td><td className="px-4 py-2.5 text-right text-muted-foreground">450&euro;</td><td className="px-4 py-2.5 text-right text-muted-foreground">750&euro;</td></tr>
                <tr><td className="px-4 py-2.5 text-foreground">DevOps / SRE</td><td className="px-4 py-2.5 text-right text-muted-foreground">450&euro;</td><td className="px-4 py-2.5 text-right text-muted-foreground">700&euro;</td></tr>
                <tr><td className="px-4 py-2.5 text-foreground">Product Manager</td><td className="px-4 py-2.5 text-right text-muted-foreground">400&euro;</td><td className="px-4 py-2.5 text-right text-muted-foreground">700&euro;</td></tr>
                <tr><td className="px-4 py-2.5 text-foreground">UX/UI Designer</td><td className="px-4 py-2.5 text-right text-muted-foreground">350&euro;</td><td className="px-4 py-2.5 text-right text-muted-foreground">600&euro;</td></tr>
                <tr><td className="px-4 py-2.5 text-foreground">Consultant marketing</td><td className="px-4 py-2.5 text-right text-muted-foreground">300&euro;</td><td className="px-4 py-2.5 text-right text-muted-foreground">550&euro;</td></tr>
                <tr><td className="px-4 py-2.5 text-foreground">CTO / Lead Tech</td><td className="px-4 py-2.5 text-right text-muted-foreground">600&euro;</td><td className="px-4 py-2.5 text-right text-muted-foreground">1 000&euro;+</td></tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground/60">
            Sources : Silkhom 2025, Malt 2024. Les TJM varient selon l&apos;exp&eacute;rience, la localisation et la sp&eacute;cialisation.
            Freelens propose un benchmark d&eacute;taill&eacute; sur 27 m&eacute;tiers.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Comment calculer ton TJM id&eacute;al ?</h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
            <p>
              La formule classique : <strong className="text-foreground">TJM = (Revenu net souhait&eacute; + Charges) / Jours travaill&eacute;s</strong>.
              Mais en pratique, c&apos;est plus complexe : les charges d&eacute;pendent de ton statut, l&apos;IR est progressif,
              et tu ne travailles pas 365 jours par an.
            </p>
            <p>
              L&apos;outil <strong className="text-foreground">Objectif Revenu</strong> de Freelens fait le calcul inverse automatiquement :
              tu rentres ton revenu net cible, et il te donne le TJM exact &agrave; facturer, en tenant compte de ton
              statut juridique, tes vacances et tes charges fixes.
            </p>
            <p>
              Par exemple, pour toucher <strong className="text-foreground">4 000&euro; net/mois</strong> en micro-entreprise avec 5 semaines de vacances,
              tu devras facturer environ <strong className="text-foreground">450-500&euro;/jour</strong>.
              En SASU, il faudra monter &agrave; <strong className="text-foreground">650-750&euro;/jour</strong> &agrave; cause des charges patronales.
            </p>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 sm:p-8 space-y-4">
          <h2 className="text-xl font-bold text-foreground">Les outils Freelens pour ton TJM</h2>
          <div className="space-y-3 text-sm">
            <div className="flex gap-3">
              <span className="size-2 rounded-full bg-[#5682F2] mt-1.5 shrink-0" />
              <div>
                <strong className="text-foreground">Benchmark TJM</strong>
                <span className="text-muted-foreground"> &mdash; Compare ton TJM aux r&eacute;f&eacute;rences march&eacute; sur 27 m&eacute;tiers tech</span>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="size-2 rounded-full bg-[#4ade80] mt-1.5 shrink-0" />
              <div>
                <strong className="text-foreground">Objectif Revenu</strong>
                <span className="text-muted-foreground"> &mdash; Calcule le TJM n&eacute;cessaire pour atteindre ton revenu net cible</span>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="size-2 rounded-full bg-[#F4BE7E] mt-1.5 shrink-0" />
              <div>
                <strong className="text-foreground">Simulateur</strong>
                <span className="text-muted-foreground"> &mdash; Projette ton CA et net mois par mois en fonction de ton TJM</span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center space-y-4 py-4">
          <Link
            href="/signup"
            className="inline-block px-10 py-4 bg-gradient-to-r from-[#5682F2] to-[#7C5BF2] text-white rounded-full text-lg font-bold hover:opacity-90 transition-opacity"
          >
            Calculer mon TJM id&eacute;al gratuitement &rarr;
          </Link>
          <p className="text-sm text-muted-foreground/60">Sans carte bancaire &middot; Benchmark 27 m&eacute;tiers inclus</p>
        </div>

        <div className="text-xs text-muted-foreground/40 border-t border-border pt-6 space-y-2">
          <p>
            Voir aussi : <Link href="/simulateur-revenus-freelance" className="text-primary hover:underline">Simulateur de revenus freelance</Link>
            {" "}&middot;{" "}<Link href="/comparateur-statuts-freelance" className="text-primary hover:underline">Comparateur de statuts</Link>
            {" "}&middot;{" "}<Link href="/devenir-freelance" className="text-primary hover:underline">Devenir freelance</Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
