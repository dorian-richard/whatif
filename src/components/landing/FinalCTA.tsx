import Link from "next/link";

export function FinalCTA() {
  return (
    <section className="snap-section relative flex flex-col items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#5682F2]/10 rounded-full blur-[150px]" />
        <div className="absolute top-1/3 right-1/3 w-[400px] h-[400px] bg-[#F4BE7E]/6 rounded-full blur-[120px]" />
      </div>

      <div className="relative text-center px-6 max-w-3xl mx-auto">
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
          Prêt à{" "}
          <span className="fn-gradient-text">piloter</span>
          {" "}ton activité ?
        </h2>
        <p className="text-lg text-[#8b8b9e] mb-10 max-w-xl mx-auto">
          Rejoins les freelances qui prennent des décisions éclairées.
          Dashboard, scénarios et fiscalité en 2 minutes.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Link
            href="/onboarding"
            className="px-10 py-4 bg-gradient-to-r from-[#5682F2] to-[#F4BE7E] text-white rounded-full text-lg font-bold hover:opacity-90 transition-opacity fn-glow-gold"
          >
            Commencer gratuitement &rarr;
          </Link>
        </div>
        <p className="text-sm text-[#5a5a6e]">
          Gratuit pour 3 clients &middot; Aucune carte requise &middot; Données 100% locales
        </p>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-0 w-full py-6 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="Freelens" className="w-5 h-5 rounded" />
            <span className="text-sm text-[#5a5a6e]">
              Freelens &mdash; Le copilote financier des freelances
            </span>
          </div>
          <div className="flex gap-6 text-sm text-[#5a5a6e]">
            <a href="#" className="hover:text-white transition-colors">CGU</a>
            <a href="#" className="hover:text-white transition-colors">Confidentialité</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </section>
  );
}
