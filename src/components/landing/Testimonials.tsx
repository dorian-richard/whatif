const TESTIMONIALS = [
  {
    name: "Marie L.",
    role: "Designer freelance",
    text: "J'ai enfin pu visualiser ce que 3 semaines de vacances me coûtaient vraiment. Spoiler : moins que je ne pensais grâce à mes forfaits.",
    avatar: "ML",
    color: "#5682F2",
  },
  {
    name: "Thomas R.",
    role: "Dev fullstack",
    text: "Avant de négocier ma hausse de TJM, j'ai simulé l'impact. Ça m'a donné la confiance pour demander +25%.",
    avatar: "TR",
    color: "#F4BE7E",
  },
  {
    name: "Sarah K.",
    role: "Consultante marketing",
    text: "Quand mon plus gros client est parti, j'avais déjà simulé le scénario. J'étais préparée financièrement.",
    avatar: "SK",
    color: "#4ade80",
  },
];

const STATS = [
  { value: "800+", label: "Freelances actifs" },
  { value: "12 000+", label: "Scénarios simulés" },
  { value: "4.8/5", label: "Note moyenne" },
  { value: "<2s", label: "Temps de calcul" },
];

export function Testimonials() {
  return (
    <section className="snap-section relative flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] bg-[#4ade80]/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-5xl mx-auto px-6 py-20 w-full">
        <div className="text-center mb-16">
          <span className="text-sm font-medium text-[#4ade80] uppercase tracking-widest mb-3 block">Témoignages</span>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Ils ont simulé avant de{" "}
            <span className="fn-gradient-text">décider</span>
          </h2>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {STATS.map((s) => (
            <div key={s.label} className="text-center py-4 bg-white/[0.03] border border-white/[0.06] rounded-2xl">
              <div className="text-2xl font-bold text-white mb-1">{s.value}</div>
              <div className="text-xs text-[#5a5a6e]">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Testimonial cards */}
        <div className="grid md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 hover:bg-white/[0.06] transition-all duration-300"
            >
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-[#F4BE7E]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-sm text-[#c0c0d0] mb-6 leading-relaxed">
                &ldquo;{t.text}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                  style={{ backgroundColor: `${t.color}30` }}
                >
                  {t.avatar}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{t.name}</div>
                  <div className="text-xs text-[#5a5a6e]">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
