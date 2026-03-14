import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Simulateur de revenus freelance gratuit 2026 — Freelens",
  description:
    "Calcule ton revenu net freelance mois par mois : TJM, charges URSSAF, impôts, vacances. Micro-entreprise, EURL, SASU, portage. Outil gratuit en ligne.",
  alternates: { canonical: "https://freelens.io/simulateur-revenus-freelance" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Simulateur de revenus freelance — Freelens",
  url: "https://freelens.io/simulateur-revenus-freelance",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  description: "Calcule ton revenu net freelance mois par mois : TJM, charges URSSAF, impôts, vacances. Micro-entreprise, EURL, SASU, portage.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
};

export default function SimulateurRevenusPage() {
  return (
    <div className="min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="max-w-3xl mx-auto px-6 py-16 space-y-10">

        <div className="space-y-6">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight">
            Simulateur de revenus{" "}
            <span className="fn-gradient-text">freelance</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Combien vas-tu vraiment gagner en freelance ? Entre ton TJM, tes clients et tes vacances
            &mdash; Freelens calcule ton <strong className="text-foreground">CA brut et ton revenu net mois par mois</strong>,
            en int&eacute;grant automatiquement les cotisations URSSAF, l&apos;imp&ocirc;t sur le revenu et la saisonnalit&eacute;.
          </p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 sm:p-8 space-y-6">
          <h2 className="text-xl font-bold text-foreground">Comment &ccedil;a marche ?</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { step: "1", title: "Ajoute tes clients", desc: "TJM, forfait mensuel ou mission ponctuelle. 1 client en gratuit, illimité en Pro." },
              { step: "2", title: "Configure ton profil", desc: "Statut juridique (micro, EI, EURL, SASU, portage), charges fixes, \u00e9pargne." },
              { step: "3", title: "Ajuste tes param\u00e8tres", desc: "Vacances, jours travaill\u00e9s par semaine, saisonnalit\u00e9, variation de tarifs." },
              { step: "4", title: "Visualise tes revenus", desc: "Graphique 12 mois avec CA brut, net apr\u00e8s charges, et cumul annuel." },
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

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Pourquoi simuler ses revenus freelance ?</h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
            <p>
              En freelance, ton revenu net d&eacute;pend de nombreux facteurs : ton <strong className="text-foreground">taux journalier moyen (TJM)</strong>,
              ton nombre de jours travaill&eacute;s, tes vacances, la saisonnalit&eacute; de ton activit&eacute;, et surtout ton <strong className="text-foreground">statut juridique</strong>.
            </p>
            <p>
              Un d&eacute;veloppeur &agrave; 500&euro;/jour en micro-entreprise ne touche pas la m&ecirc;me chose qu&apos;en SASU.
              Les cotisations URSSAF varient de 21% (micro) &agrave; plus de 65% (SASU avec salaire).
              Sans simulation, tu navigues &agrave; l&apos;aveugle.
            </p>
            <p>
              Freelens int&egrave;gre les <strong className="text-foreground">taux URSSAF 2026</strong> et le <strong className="text-foreground">bar&egrave;me IR en vigueur</strong> pour te donner
              une projection fid&egrave;le de ce que tu gagneras r&eacute;ellement, mois par mois.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Statuts support&eacute;s</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              "Micro-entreprise (BNC/BIC)",
              "Entreprise individuelle (EI)",
              "EURL \u00e0 l\u2019IR ou \u00e0 l\u2019IS",
              "SASU \u00e0 l\u2019IR ou \u00e0 l\u2019IS",
              "Portage salarial",
            ].map((s) => (
              <div key={s} className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="size-1.5 rounded-full bg-primary shrink-0" />
                {s}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Questions fr&eacute;quentes</h2>
          <div className="space-y-3 text-sm">
            <div>
              <div className="font-semibold text-foreground">Le simulateur est-il gratuit ?</div>
              <div className="text-muted-foreground">Oui, 100% gratuit avec 1 client et 1 sc&eacute;nario. Le plan Pro d&eacute;bloque clients et sc&eacute;narios illimit&eacute;s.</div>
            </div>
            <div>
              <div className="font-semibold text-foreground">Les calculs sont-ils fiables ?</div>
              <div className="text-muted-foreground">Le moteur utilise les taux URSSAF 2026 et le bar&egrave;me IR en vigueur. Tu peux aussi ajuster manuellement les taux.</div>
            </div>
            <div>
              <div className="font-semibold text-foreground">Combien de temps prend la simulation ?</div>
              <div className="text-muted-foreground">Moins de 2 minutes. Tout est calcul&eacute; en temps r&eacute;el c&ocirc;t&eacute; client, sans attente serveur.</div>
            </div>
          </div>
        </div>

        <div className="text-center space-y-4 py-4">
          <Link
            href="/signup"
            className="inline-block px-10 py-4 bg-gradient-to-r from-[#5682F2] to-[#7C5BF2] text-white rounded-full text-lg font-bold hover:opacity-90 transition-opacity"
          >
            Simuler mes revenus gratuitement &rarr;
          </Link>
          <p className="text-sm text-muted-foreground/60">Sans carte bancaire &middot; Essai gratuit 14 jours</p>
        </div>

        <div className="text-xs text-muted-foreground/40 border-t border-border pt-6 space-y-2">
          <p>
            Voir aussi : <Link href="/comparateur-statuts-freelance" className="text-primary hover:underline">Comparateur de statuts freelance</Link>
            {" "}&middot;{" "}<Link href="/tjm-freelance" className="text-primary hover:underline">TJM freelance 2026</Link>
            {" "}&middot;{" "}<Link href="/devenir-freelance" className="text-primary hover:underline">Devenir freelance</Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
