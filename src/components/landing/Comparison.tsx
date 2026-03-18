import { AnimateOnScroll } from "./AnimateOnScroll";

const FEATURES = [
  "Simulateur de revenus",
  "Comparateur de statuts",
  "Gestion des leads",
  "Suivi des paiements",
  "Calendrier des échéances fiscales",
  "Benchmark TJM",
  "À jour PLF 2026",
  "Gratuit",
  "Dédié freelance",
];

type Support = "yes" | "partial" | "no";

const TOOLS: { name: string; values: Support[] }[] = [
  { name: "Freelens", values: ["yes", "yes", "yes", "yes", "yes", "yes", "yes", "yes", "yes"] },
  { name: "Excel", values: ["partial", "no", "partial", "partial", "no", "no", "no", "yes", "no"] },
  { name: "Indy", values: ["no", "no", "no", "yes", "yes", "no", "no", "partial", "partial"] },
  { name: "Pennylane", values: ["no", "no", "no", "yes", "yes", "no", "no", "partial", "partial"] },
];

function StatusIcon({ status }: { status: Support }) {
  if (status === "yes") {
    return (
      <svg className="size-5 text-[#4ade80]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    );
  }
  if (status === "partial") {
    return (
      <svg className="size-5 text-[#F4BE7E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
      </svg>
    );
  }
  return (
    <svg className="size-5 text-muted-foreground/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export function Comparison() {
  return (
    <section className="snap-section relative flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-[#5682F2]/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20 w-full">
        <AnimateOnScroll>
          <div className="text-center mb-12">
            <span className="text-sm font-medium text-primary uppercase tracking-widest mb-3 block">Comparatif</span>
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
              Pourquoi{" "}
              <span className="fn-gradient-text">Freelens</span> ?
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Ton tableur Excel ne g&egrave;re pas l&apos;URSSAF. Indy ne simule pas ton net. Freelens fait les deux.
              <br />
              <span className="text-sm text-muted-foreground/80">Bar&egrave;mes et taux &agrave; jour du Projet de Loi de Finances 2026.</span>
            </p>
          </div>
        </AnimateOnScroll>

        <AnimateOnScroll delay={0.15}>
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full min-w-[500px] border-collapse">
              <thead>
                <tr>
                  <th className="text-left text-sm font-medium text-muted-foreground py-3 px-4" />
                  {TOOLS.map((tool, i) => (
                    <th
                      key={tool.name}
                      className={`text-center text-sm font-bold py-3 px-4 ${
                        i === 0
                          ? "text-foreground bg-[#5682F2]/10 rounded-t-xl"
                          : "text-muted-foreground"
                      }`}
                    >
                      {tool.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FEATURES.map((feature, fi) => (
                  <tr
                    key={feature}
                    className={fi < FEATURES.length - 1 ? "border-b border-border" : ""}
                  >
                    <td className="text-sm text-foreground font-medium py-3 px-4">
                      {feature}
                    </td>
                    {TOOLS.map((tool, ti) => (
                      <td
                        key={tool.name}
                        className={`text-center py-3 px-4 ${
                          ti === 0 ? "bg-[#5682F2]/10" : ""
                        } ${fi === FEATURES.length - 1 && ti === 0 ? "rounded-b-xl" : ""}`}
                      >
                        <div className="flex justify-center">
                          <StatusIcon status={tool.values[fi]} />
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
