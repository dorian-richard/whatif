import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Devenir freelance en 2026 : guide complet pour se lancer — Freelens",
  description:
    "Tout ce qu'il faut savoir pour devenir freelance : choisir son statut, fixer son TJM, trouver des clients, gérer ses finances. Guide pratique gratuit.",
  alternates: { canonical: "https://freelens.io/devenir-freelance" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Devenir freelance en 2026 : guide complet pour se lancer",
  url: "https://freelens.io/devenir-freelance",
  author: { "@type": "Organization", name: "Freelens", url: "https://freelens.io" },
  publisher: { "@type": "Organization", name: "Freelens", logo: { "@type": "ImageObject", url: "https://freelens.io/logo.webp" } },
  description: "Tout ce qu'il faut savoir pour devenir freelance : choisir son statut, fixer son TJM, trouver des clients, gérer ses finances.",
  datePublished: "2025-01-15",
  dateModified: "2025-03-01",
};

export default function DevenirFreelancePage() {
  return (
    <div className="min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="max-w-3xl mx-auto px-6 py-16 space-y-10">

        <div className="space-y-6">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight">
            Devenir freelance en 2026 :{" "}
            <span className="fn-gradient-text">le guide complet</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Tu veux <strong className="text-foreground">quitter le salariat</strong> et te lancer en freelance ?
            Ce guide couvre les &eacute;tapes cl&eacute;s : statut juridique, TJM, clients, finances.
            Freelens t&apos;accompagne avec des outils concrets pour chaque d&eacute;cision.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">&Eacute;tape 1 &mdash; Choisir son statut juridique</h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
            <p>
              Le statut d&eacute;termine tes <strong className="text-foreground">charges sociales, ta fiscalit&eacute; et ta protection</strong>.
              En 2026, les principales options sont :
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                { name: "Micro-entreprise", desc: "Simple, ~26% de charges. Idéal pour démarrer sous 83 600€ de CA." },
                { name: "EI au réel", desc: "Charges ~45%, mais déduction des frais réels. Pas de plafond CA." },
                { name: "EURL", desc: "Société unipersonnelle, IR ou IS. Optimisation rémunération/dividendes." },
                { name: "SASU", desc: "Président assimilé salarié. Charges élevées (~65%) mais meilleure couverture." },
                { name: "Portage salarial", desc: "Statut salarié sans créer de société. Frais de gestion ~8-10%." },
              ].map((s) => (
                <div key={s.name} className="bg-card border border-border rounded-xl p-3">
                  <div className="text-sm font-semibold text-foreground">{s.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">{s.desc}</div>
                </div>
              ))}
            </div>
            <p>
              Pour comparer l&apos;impact r&eacute;el sur ton revenu net, utilise le{" "}
              <Link href="/comparateur-statuts-freelance" className="text-primary hover:underline font-medium">
                comparateur de statuts Freelens
              </Link>.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">&Eacute;tape 2 &mdash; Fixer son TJM</h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
            <p>
              Ton <strong className="text-foreground">taux journalier moyen (TJM)</strong> d&eacute;pend de ton m&eacute;tier,
              ton exp&eacute;rience et ta localisation. En France en 2025, les TJM tech varient de 300&euro; (junior marketing)
              &agrave; 1 000&euro;+ (CTO/Lead Tech).
            </p>
            <p>
              La r&egrave;gle d&apos;or : <strong className="text-foreground">ne fixe pas ton TJM au feeling</strong>.
              Calcule-le &agrave; partir de ton revenu net cible en int&eacute;grant charges, imp&ocirc;ts et vacances.
              Un TJM trop bas et tu ne couvres pas tes charges. Trop haut et tu perds des missions.
            </p>
            <p>
              Consulte le{" "}
              <Link href="/tjm-freelance" className="text-primary hover:underline font-medium">
                benchmark TJM par m&eacute;tier
              </Link>{" "}
              pour te situer sur le march&eacute;.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">&Eacute;tape 3 &mdash; Trouver ses premiers clients</h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
            <p>
              Les canaux les plus efficaces pour d&eacute;marrer :
            </p>
            <div className="space-y-2">
              {[
                { title: "Réseau personnel", desc: "Anciens collègues, managers, contacts LinkedIn. Souvent le premier client vient de là." },
                { title: "Plateformes freelance", desc: "Malt, Crème de la Crème, Comet, Le Hibou. Idéal pour les premières missions." },
                { title: "Candidature directe", desc: "Contacte les entreprises qui recrutent des CDI sur ton profil — propose une mission freelance." },
                { title: "Contenu & personal branding", desc: "Articles, posts LinkedIn, side projects. Prend du temps mais génère des leads qualifiés." },
              ].map((item) => (
                <div key={item.title} className="flex gap-3">
                  <span className="size-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <div>
                    <span className="text-foreground font-medium">{item.title}</span>
                    <span className="text-muted-foreground"> &mdash; {item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">&Eacute;tape 4 &mdash; G&eacute;rer ses finances</h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
            <p>
              En freelance, personne ne g&egrave;re ta paie &agrave; ta place. Tu dois anticiper :
            </p>
            <div className="space-y-2">
              {[
                "Les cotisations URSSAF (trimestrielles ou mensuelles)",
                "L'impôt sur le revenu (acomptes ou versement libératoire)",
                "Les périodes creuses (été, fin d'année)",
                "L'épargne de précaution (3 à 6 mois de charges)",
                "La TVA si tu dépasses le seuil de franchise",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="size-1.5 rounded-full bg-[#F4BE7E] mt-1.5 shrink-0" />
                  {item}
                </div>
              ))}
            </div>
            <p>
              Freelens automatise cette gestion avec un{" "}
              <Link href="/simulateur-revenus-freelance" className="text-primary hover:underline font-medium">
                simulateur de revenus mois par mois
              </Link>{" "}
              et un simulateur de tr&eacute;sorerie pr&eacute;visionnelle.
            </p>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 sm:p-8 space-y-4">
          <h2 className="text-xl font-bold text-foreground">Les outils Freelens pour se lancer</h2>
          <div className="space-y-3 text-sm">
            <div className="flex gap-3">
              <span className="size-2 rounded-full bg-[#5682F2] mt-1.5 shrink-0" />
              <div>
                <strong className="text-foreground">Comparateur de statuts</strong>
                <span className="text-muted-foreground"> &mdash; Compare 7 statuts juridiques sur ton CA r&eacute;el</span>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="size-2 rounded-full bg-[#4ade80] mt-1.5 shrink-0" />
              <div>
                <strong className="text-foreground">Objectif Revenu</strong>
                <span className="text-muted-foreground"> &mdash; Trouve le TJM exact pour ton revenu net cible</span>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="size-2 rounded-full bg-[#F4BE7E] mt-1.5 shrink-0" />
              <div>
                <strong className="text-foreground">Simulateur</strong>
                <span className="text-muted-foreground"> &mdash; Projette CA et net mois par mois avec charges et imp&ocirc;ts</span>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="size-2 rounded-full bg-[#a78bfa] mt-1.5 shrink-0" />
              <div>
                <strong className="text-foreground">Benchmark TJM</strong>
                <span className="text-muted-foreground"> &mdash; R&eacute;f&eacute;rences march&eacute; sur 27 m&eacute;tiers tech</span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center space-y-4 py-4">
          <Link
            href="/signup"
            className="inline-block px-10 py-4 bg-gradient-to-r from-[#5682F2] to-[#7C5BF2] text-white rounded-full text-lg font-bold hover:opacity-90 transition-opacity"
          >
            Commencer gratuitement &rarr;
          </Link>
          <p className="text-sm text-muted-foreground/60">Sans carte bancaire &middot; Tous les outils inclus</p>
        </div>

        <div className="text-xs text-muted-foreground/40 border-t border-border pt-6 space-y-2">
          <p>
            Voir aussi : <Link href="/simulateur-revenus-freelance" className="text-primary hover:underline">Simulateur de revenus freelance</Link>
            {" "}&middot;{" "}<Link href="/comparateur-statuts-freelance" className="text-primary hover:underline">Comparateur de statuts</Link>
            {" "}&middot;{" "}<Link href="/tjm-freelance" className="text-primary hover:underline">TJM freelance 2025</Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
