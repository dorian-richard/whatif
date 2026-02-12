const TESTIMONIALS = [
  {
    name: "Marie L.",
    role: "Designer freelance",
    text: "J'ai enfin pu visualiser ce que 3 semaines de vacances me coutaient vraiment. Spoiler : moins que je ne pensais grace a mes forfaits.",
    avatar: "ML",
  },
  {
    name: "Thomas R.",
    role: "Dev fullstack",
    text: "Avant de negocier ma hausse de TJM, j'ai simule l'impact. Ca m'a donne la confiance pour demander +25%.",
    avatar: "TR",
  },
  {
    name: "Sarah K.",
    role: "Consultante marketing",
    text: "Quand mon plus gros client est parti, j'avais deja simule le scenario. J'etais preparee financierement.",
    avatar: "SK",
  },
];

export function Testimonials() {
  return (
    <section className="py-20 px-4 bg-gray-50/50">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Ils ont simule avant de decider
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="bg-white rounded-2xl p-6 border border-gray-100">
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                &ldquo;{t.text}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-bold">
                  {t.avatar}
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-800">{t.name}</div>
                  <div className="text-xs text-gray-400">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
