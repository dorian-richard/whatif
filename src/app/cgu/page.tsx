import Link from "next/link";
import { Footer } from "@/components/Footer";

export const metadata = {
  title: "CGU - Freelens",
  description: "Conditions Générales d'Utilisation de Freelens",
};

export default function CGUPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-16 space-y-8">

        <h1 className="text-3xl font-bold text-foreground">Conditions G&eacute;n&eacute;rales d&apos;Utilisation</h1>
        <p className="text-sm text-muted-foreground">Derni&egrave;re mise &agrave; jour : 23 f&eacute;vrier 2026</p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-muted-foreground">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">1. Objet</h2>
            <p>
              Les pr&eacute;sentes Conditions G&eacute;n&eacute;rales d&apos;Utilisation (CGU) r&eacute;gissent l&apos;acc&egrave;s et l&apos;utilisation du service Freelens, accessible &agrave; l&apos;adresse <strong>freelens.io</strong>.
              Freelens est un outil de simulation financi&egrave;re destin&eacute; aux travailleurs ind&eacute;pendants (freelances).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">2. &Eacute;diteur</h2>
            <p>
              Freelens est &eacute;dit&eacute; par Dorian Richard, entrepreneur individuel.
              <br />Contact : <strong>contact@freelens.io</strong>
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">3. Acc&egrave;s au service</h2>
            <p>
              L&apos;acc&egrave;s au service n&eacute;cessite la cr&eacute;ation d&apos;un compte via une adresse email valide.
              L&apos;utilisateur est responsable de la confidentialit&eacute; de ses identifiants.
            </p>
            <p>
              Freelens propose une offre gratuite (Free) et une offre payante (Pro).
              Les fonctionnalit&eacute;s disponibles varient selon le plan souscrit.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">4. Nature du service</h2>
            <p>
              Freelens fournit des <strong>simulations et estimations financi&egrave;res &agrave; titre indicatif</strong>.
              Les calculs sont bas&eacute;s sur des taux moyens et des approximations simplifi&eacute;es.
              Ils ne constituent en aucun cas un conseil fiscal, juridique ou comptable.
            </p>
            <p>
              <strong>L&apos;utilisateur est seul responsable de ses d&eacute;cisions</strong> et doit consulter un expert-comptable ou un conseiller fiscal pour toute d&eacute;cision engageante.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">5. Abonnement Pro</h2>
            <p>
              L&apos;abonnement Pro est factur&eacute; mensuellement via Stripe.
              L&apos;utilisateur peut r&eacute;silier &agrave; tout moment depuis son espace de gestion Stripe.
              La r&eacute;siliation prend effet &agrave; la fin de la p&eacute;riode de facturation en cours.
            </p>
            <p>
              Aucun remboursement n&apos;est accord&eacute; pour la p&eacute;riode en cours, sauf disposition l&eacute;gale contraire.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">6. Donn&eacute;es personnelles</h2>
            <p>
              Les donn&eacute;es collect&eacute;es (email, param&egrave;tres de profil freelance, donn&eacute;es clients) sont strictement n&eacute;cessaires au fonctionnement du service.
              Elles ne sont jamais vendues, c&eacute;d&eacute;es ou partag&eacute;es &agrave; des tiers &agrave; des fins commerciales.
            </p>
            <p>
              Pour plus de d&eacute;tails, consulter notre <Link href="/confidentialite" className="text-primary hover:underline">Politique de Confidentialit&eacute;</Link>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">7. Propri&eacute;t&eacute; intellectuelle</h2>
            <p>
              L&apos;ensemble du contenu du site (textes, graphismes, logo, code source) est la propri&eacute;t&eacute; exclusive de Freelens.
              Toute reproduction, m&ecirc;me partielle, est interdite sans autorisation pr&eacute;alable.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">8. Limitation de responsabilit&eacute;</h2>
            <p>
              Freelens ne saurait &ecirc;tre tenu responsable des dommages directs ou indirects r&eacute;sultant de l&apos;utilisation du service,
              notamment des d&eacute;cisions prises sur la base des simulations propos&eacute;es.
            </p>
            <p>
              Le service est fourni &laquo; en l&apos;&eacute;tat &raquo; sans garantie d&apos;exactitude des calculs.
              Les taux fiscaux et sociaux &eacute;voluent r&eacute;guli&egrave;rement et peuvent ne pas &ecirc;tre &agrave; jour.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">9. Modification des CGU</h2>
            <p>
              Freelens se r&eacute;serve le droit de modifier les pr&eacute;sentes CGU &agrave; tout moment.
              Les utilisateurs seront inform&eacute;s des modifications substantielles par email ou notification dans l&apos;application.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">10. Droit applicable</h2>
            <p>
              Les pr&eacute;sentes CGU sont soumises au droit fran&ccedil;ais.
              En cas de litige, les tribunaux comp&eacute;tents seront ceux du ressort du si&egrave;ge de l&apos;&eacute;diteur.
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
