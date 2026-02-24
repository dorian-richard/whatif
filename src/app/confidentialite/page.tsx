import { BackButton } from "@/components/BackButton";

export const metadata = {
  title: "Politique de Confidentialité - Freelens",
  description: "Politique de confidentialité et protection des données de Freelens",
};

export default function ConfidentialitePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-16 space-y-8">
        <div>
          <BackButton />
        </div>

        <h1 className="text-3xl font-bold text-foreground">Politique de Confidentialit&eacute;</h1>
        <p className="text-sm text-muted-foreground">Derni&egrave;re mise &agrave; jour : 23 f&eacute;vrier 2026</p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-muted-foreground">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">1. Responsable du traitement</h2>
            <p>
              Dorian Richard, &eacute;diteur de Freelens (<strong>freelens.io</strong>).
              <br />Contact : <strong>contact@freelens.io</strong>
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">2. Donn&eacute;es collect&eacute;es</h2>
            <p>Nous collectons uniquement les donn&eacute;es n&eacute;cessaires au fonctionnement du service :</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Donn&eacute;es d&apos;identification</strong> : adresse email</li>
              <li><strong>Donn&eacute;es de profil freelance</strong> : statut juridique, charges mensuelles, &eacute;pargne, taux personnalis&eacute;s, &acirc;ge</li>
              <li><strong>Donn&eacute;es clients</strong> : noms, types de facturation, montants (TJM, forfaits, missions)</li>
              <li><strong>Donn&eacute;es de paiement</strong> : g&eacute;r&eacute;es exclusivement par Stripe (nous ne stockons aucune donn&eacute;e bancaire)</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">3. Finalit&eacute;s du traitement</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Fournir le service de simulation financi&egrave;re</li>
              <li>Sauvegarder et synchroniser les donn&eacute;es entre appareils</li>
              <li>G&eacute;rer l&apos;abonnement et la facturation</li>
              <li>Am&eacute;liorer le service</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">4. Base l&eacute;gale</h2>
            <p>
              Le traitement est fond&eacute; sur l&apos;<strong>ex&eacute;cution du contrat</strong> (fourniture du service)
              et le <strong>consentement</strong> de l&apos;utilisateur lors de son inscription.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">5. Partage des donn&eacute;es</h2>
            <p>Vos donn&eacute;es ne sont <strong>jamais vendues</strong>. Elles sont uniquement partag&eacute;es avec :</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Supabase</strong> : h&eacute;bergement de la base de donn&eacute;es et authentification (serveurs UE)</li>
              <li><strong>Stripe</strong> : gestion des paiements (certifi&eacute; PCI-DSS)</li>
              <li><strong>Vercel</strong> : h&eacute;bergement du site web</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">6. Dur&eacute;e de conservation</h2>
            <p>
              Les donn&eacute;es sont conserv&eacute;es tant que le compte est actif.
              En cas de suppression du compte, les donn&eacute;es sont supprim&eacute;es sous 30 jours.
              Les donn&eacute;es de facturation sont conserv&eacute;es conform&eacute;ment aux obligations l&eacute;gales (10 ans).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">7. Vos droits (RGPD)</h2>
            <p>Conform&eacute;ment au R&egrave;glement G&eacute;n&eacute;ral sur la Protection des Donn&eacute;es, vous disposez des droits suivants :</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Acc&egrave;s</strong> : obtenir une copie de vos donn&eacute;es</li>
              <li><strong>Rectification</strong> : corriger vos donn&eacute;es</li>
              <li><strong>Suppression</strong> : demander l&apos;effacement de vos donn&eacute;es</li>
              <li><strong>Portabilit&eacute;</strong> : recevoir vos donn&eacute;es dans un format structur&eacute;</li>
              <li><strong>Opposition</strong> : vous opposer au traitement de vos donn&eacute;es</li>
            </ul>
            <p>
              Pour exercer ces droits, contactez-nous &agrave; <strong>contact@freelens.io</strong>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">8. Cookies</h2>
            <p>
              Freelens utilise uniquement des <strong>cookies strictement n&eacute;cessaires</strong> au fonctionnement du service
              (authentification, pr&eacute;f&eacute;rences de th&egrave;me). Aucun cookie publicitaire ou de suivi n&apos;est utilis&eacute;.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">9. S&eacute;curit&eacute;</h2>
            <p>
              Les donn&eacute;es sont prot&eacute;g&eacute;es par chiffrement en transit (HTTPS/TLS) et au repos.
              L&apos;acc&egrave;s &agrave; la base de donn&eacute;es est s&eacute;curis&eacute; par Row Level Security (RLS) via Supabase.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">10. Contact</h2>
            <p>
              Pour toute question relative &agrave; vos donn&eacute;es personnelles :
              <br /><strong>contact@freelens.io</strong>
            </p>
            <p>
              Vous pouvez &eacute;galement adresser une r&eacute;clamation &agrave; la <strong>CNIL</strong> (Commission Nationale de l&apos;Informatique et des Libert&eacute;s).
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
