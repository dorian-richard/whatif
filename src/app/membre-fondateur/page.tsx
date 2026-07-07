import type { Metadata } from "next";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Membre Fondateur — Freelens",
  description: "Rejoins les membres fondateurs de Freelens : accès Pro à vie à tarif réduit, accès direct au fondateur, et tu orientes la roadmap.",
  robots: { index: false, follow: false }, // offre ciblée outreach — pas une page SEO
};

// 👉 Remplace par ton Stripe Payment Link (env NEXT_PUBLIC_FOUNDER_LINK).
// Crée-le en 30 s : Stripe → Payment links → nouveau lien, prix annuel 95€.
const FOUNDER_LINK = process.env.NEXT_PUBLIC_FOUNDER_LINK || "/signup";

const INCLUS = [
  "Ton vrai net après URSSAF ET impôt sur le revenu, mois par mois",
  "Comparateur de statuts (micro, EURL, SASU, portage) avec mix salaire/dividendes",
  "Facturation : devis & factures PDF, relances, conversion 1 clic",
  "Trésorerie prévisionnelle 12 mois avec alerte de seuil",
  "Pipeline commercial (mini-CRM) + suivi des paiements",
  "Calendrier fiscal synchronisé avec ton statut",
  "Benchmark TJM (27 métiers), projection retraite, ACRE, holding",
  "Assistant IA Facto + export PDF/CSV",
];

export default function MembreFondateurPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-[#5682F2]/10 rounded-full blur-[130px]" />
        </div>

        <div className="relative max-w-3xl mx-auto px-6 py-16 sm:py-24 text-center">
          <span className="inline-block text-xs font-semibold text-[#F4BE7E] uppercase tracking-widest mb-4 border border-[#F4BE7E]/30 rounded-full px-3 py-1">
            20 places &middot; Offre de lancement
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight mb-5">
            Deviens <span className="fn-gradient-text">Membre Fondateur</span> de Freelens
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto mb-8">
            Le pilotage complet de ton activit&eacute; freelance &mdash; ton vrai net, tes factures,
            ta tr&eacute;sorerie, ton pipeline. Tarif fondateur bloqu&eacute; <strong className="text-foreground">&agrave; vie</strong>.
          </p>

          {/* Prix */}
          <div className="inline-flex items-baseline gap-3 mb-2">
            <span className="text-5xl font-bold text-foreground">95&euro;</span>
            <span className="text-lg text-muted-foreground">/an</span>
            <span className="text-lg text-muted-foreground/60 line-through">190&euro;</span>
          </div>
          <div className="text-sm text-[#4ade80] font-medium mb-8">&minus;50% garanti &agrave; vie tant que tu restes abonn&eacute;</div>

          <a
            href={FOUNDER_LINK}
            className="inline-block px-10 py-4 bg-gradient-to-r from-[#5682F2] to-[#7C5BF2] text-white rounded-full text-lg font-bold hover:opacity-90 transition-opacity fn-glow"
          >
            Rejoindre les fondateurs &rarr;
          </a>
          <p className="text-xs text-muted-foreground/70 mt-4">
            Garantie satisfait ou rembours&eacute; 30 jours &middot; Sans engagement au-del&agrave; de la 1re ann&eacute;e
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 pb-20 space-y-10">
        {/* Inclus */}
        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8">
          <h2 className="text-xl font-bold text-foreground mb-5">Tout Freelens Pro, inclus</h2>
          <ul className="grid sm:grid-cols-2 gap-3">
            {INCLUS.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <svg className="size-4 text-[#4ade80] mt-0.5 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3.1 3.1 6.8-6.8a1 1 0 011.4 0z" clipRule="evenodd" /></svg>
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Pourquoi fondateur */}
        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8">
          <h2 className="text-xl font-bold text-foreground mb-5">En plus, en tant que fondateur</h2>
          <div className="space-y-4 text-sm text-muted-foreground">
            <p><strong className="text-foreground">Accès direct à moi.</strong> Je construis Freelens en solo. Tu me parles directement (email / visio), pas à un support anonyme.</p>
            <p><strong className="text-foreground">Tu orientes la roadmap.</strong> Tes besoins passent en priorité. Ce que tu demandes, je le construis en premier.</p>
            <p><strong className="text-foreground">Ton tarif ne bougera jamais.</strong> Le prix montera pour les suivants ; toi, tu restes à 95&euro;/an à vie.</p>
          </div>
        </div>

        {/* CTA final */}
        <div className="text-center">
          <a
            href={FOUNDER_LINK}
            className="inline-block px-10 py-4 bg-gradient-to-r from-[#5682F2] to-[#7C5BF2] text-white rounded-full text-lg font-bold hover:opacity-90 transition-opacity"
          >
            Rejoindre les fondateurs &rarr;
          </a>
          <p className="text-xs text-muted-foreground/70 mt-3">Garantie 30 jours &middot; Paiement s&eacute;curis&eacute; Stripe</p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
