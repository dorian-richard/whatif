import { Footer } from "@/components/Footer";

export const metadata = {
  title: "Mentions Légales - Freelens",
  description: "Mentions légales de Freelens",
};

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-16 space-y-8">

        <h1 className="text-3xl font-bold text-foreground">Mentions L&eacute;gales</h1>
        <p className="text-sm text-muted-foreground">Derni&egrave;re mise &agrave; jour : 24 f&eacute;vrier 2026</p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-muted-foreground">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">1. &Eacute;diteur du site</h2>
            <p>
              <strong>Freelens</strong> est &eacute;dit&eacute; par :
            </p>
            <ul className="list-none space-y-1">
              <li><strong>Nom</strong> : Dorian Richard</li>
              <li><strong>Statut</strong> : Entrepreneur individuel</li>
              <li><strong>Email</strong> : contact@freelens.io</li>
              <li><strong>Site</strong> : freelens.io</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">2. H&eacute;bergement</h2>
            <p>Le site est h&eacute;berg&eacute; par :</p>
            <ul className="list-none space-y-1">
              <li><strong>Vercel Inc.</strong></li>
              <li>440 N Barranca Ave #4133</li>
              <li>Covina, CA 91723, &Eacute;tats-Unis</li>
              <li>Site : vercel.com</li>
            </ul>
            <p>La base de donn&eacute;es est h&eacute;berg&eacute;e par :</p>
            <ul className="list-none space-y-1">
              <li><strong>Supabase Inc.</strong></li>
              <li>970 Toa Payoh North #07-04</li>
              <li>Singapour 318992</li>
              <li>Serveurs de donn&eacute;es situ&eacute;s dans l&apos;Union Europ&eacute;enne</li>
              <li>Site : supabase.com</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">3. Propri&eacute;t&eacute; intellectuelle</h2>
            <p>
              L&apos;ensemble du contenu du site Freelens (textes, graphismes, logo, code source, design)
              est la propri&eacute;t&eacute; exclusive de Dorian Richard, sauf mention contraire.
              Toute reproduction, m&ecirc;me partielle, est interdite sans autorisation pr&eacute;alable &eacute;crite.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">4. Donn&eacute;es personnelles</h2>
            <p>
              Le traitement des donn&eacute;es personnelles est d&eacute;taill&eacute; dans notre{" "}
              <a href="/confidentialite" className="text-primary hover:underline">Politique de Confidentialit&eacute;</a>.
              <br />
              Conform&eacute;ment au RGPD, vous disposez d&apos;un droit d&apos;acc&egrave;s, de rectification et de suppression
              de vos donn&eacute;es en contactant <strong>contact@freelens.io</strong>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">5. Cookies</h2>
            <p>
              Le site utilise uniquement des cookies strictement n&eacute;cessaires au fonctionnement du service
              (authentification, pr&eacute;f&eacute;rences de th&egrave;me). Aucun cookie publicitaire ou de suivi n&apos;est utilis&eacute;.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">6. Limitation de responsabilit&eacute;</h2>
            <p>
              Les informations fournies par Freelens sont donn&eacute;es &agrave; titre indicatif et ne constituent
              en aucun cas un conseil fiscal, juridique ou comptable. L&apos;&eacute;diteur ne saurait &ecirc;tre tenu
              responsable des d&eacute;cisions prises sur la base des simulations propos&eacute;es.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">7. Droit applicable</h2>
            <p>
              Les pr&eacute;sentes mentions l&eacute;gales sont soumises au droit fran&ccedil;ais.
              En cas de litige, les tribunaux fran&ccedil;ais seront seuls comp&eacute;tents.
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
