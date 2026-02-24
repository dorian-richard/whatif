import { BackButton } from "@/components/BackButton";

export const metadata = {
  title: "CGV - Freelens",
  description: "Conditions Générales de Vente de Freelens",
};

export default function CGVPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-16 space-y-8">
        <div>
          <BackButton />
        </div>

        <h1 className="text-3xl font-bold text-foreground">Conditions G&eacute;n&eacute;rales de Vente</h1>
        <p className="text-sm text-muted-foreground">Derni&egrave;re mise &agrave; jour : 24 f&eacute;vrier 2026</p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-muted-foreground">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">1. Objet</h2>
            <p>
              Les pr&eacute;sentes Conditions G&eacute;n&eacute;rales de Vente (CGV) r&eacute;gissent la souscription
              et l&apos;utilisation de l&apos;offre payante Freelens Pro, accessible sur <strong>freelens.io</strong>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">2. Vendeur</h2>
            <p>
              <strong>Dorian Richard</strong>, entrepreneur individuel.
              <br />Email : <strong>contact@freelens.io</strong>
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">3. Offres et tarifs</h2>
            <p>Freelens propose deux formules :</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Free</strong> : gratuit, acc&egrave;s limit&eacute; (3 clients, 1 sc&eacute;nario)</li>
              <li><strong>Pro</strong> : 9&euro;/mois ou 79&euro;/an (soit 2 mois offerts)</li>
            </ul>
            <p>
              Les prix sont indiqu&eacute;s en euros TTC. L&apos;&eacute;diteur se r&eacute;serve le droit de modifier
              les tarifs &agrave; tout moment. Toute modification sera communiqu&eacute;e aux abonn&eacute;s
              au moins 30 jours avant son entr&eacute;e en vigueur.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">4. Essai gratuit</h2>
            <p>
              Un essai gratuit de 14 jours est propos&eacute; sans n&eacute;cessit&eacute; de renseigner un moyen de paiement.
              &Agrave; l&apos;issue de l&apos;essai, l&apos;utilisateur peut souscrire au plan Pro ou continuer avec le plan Free.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">5. Souscription et paiement</h2>
            <p>
              La souscription au plan Pro s&apos;effectue en ligne sur freelens.io.
              Le paiement est g&eacute;r&eacute; par <strong>Stripe</strong> (certifi&eacute; PCI-DSS).
              Les moyens de paiement accept&eacute;s sont : Visa, Mastercard, American Express.
            </p>
            <p>
              L&apos;abonnement est &agrave; tacite reconduction. Le montant est d&eacute;bit&eacute; automatiquement
              au d&eacute;but de chaque p&eacute;riode de facturation (mois ou ann&eacute;e).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">6. R&eacute;siliation</h2>
            <p>
              L&apos;utilisateur peut r&eacute;silier son abonnement &agrave; tout moment depuis ses param&egrave;tres
              ou via le portail Stripe. La r&eacute;siliation prend effet &agrave; la fin de la p&eacute;riode
              de facturation en cours. L&apos;acc&egrave;s aux fonctionnalit&eacute;s Pro est maintenu
              jusqu&apos;&agrave; cette date.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">7. Droit de r&eacute;tractation</h2>
            <p>
              Conform&eacute;ment &agrave; l&apos;article L221-28 du Code de la consommation, le droit de r&eacute;tractation
              ne s&apos;applique pas aux services pleinement ex&eacute;cut&eacute;s avant la fin du d&eacute;lai de r&eacute;tractation
              avec l&apos;accord du consommateur. L&apos;essai gratuit de 14 jours permet de tester le service sans engagement.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">8. Nature du service</h2>
            <p>
              Freelens fournit des simulations et estimations financi&egrave;res &agrave; <strong>titre indicatif</strong>.
              Les r&eacute;sultats ne constituent en aucun cas un conseil fiscal, juridique ou comptable.
              L&apos;utilisateur reste seul responsable de ses d&eacute;cisions.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">9. Responsabilit&eacute;</h2>
            <p>
              La responsabilit&eacute; de l&apos;&eacute;diteur est limit&eacute;e au montant des sommes effectivement
              pay&eacute;es par l&apos;utilisateur au cours des 12 derniers mois.
              L&apos;&eacute;diteur ne saurait &ecirc;tre tenu responsable des dommages indirects.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">10. M&eacute;diation</h2>
            <p>
              En cas de litige, l&apos;utilisateur peut recourir gratuitement au service de m&eacute;diation
              de la consommation. Le m&eacute;diateur peut &ecirc;tre saisi en ligne via la plateforme
              europ&eacute;enne de r&egrave;glement en ligne des litiges :{" "}
              <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                ec.europa.eu/consumers/odr
              </a>
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">11. Droit applicable</h2>
            <p>
              Les pr&eacute;sentes CGV sont soumises au droit fran&ccedil;ais.
              En cas de litige non r&eacute;solu par la m&eacute;diation, les tribunaux fran&ccedil;ais seront seuls comp&eacute;tents.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
