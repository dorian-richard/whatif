import Link from "next/link";

export function Hero() {
  return (
    <section className="snap-section relative flex items-center justify-center overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#5682F2]/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#F4BE7E]/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-5xl mx-auto px-6 text-center pt-20">
        <div className="inline-flex items-center gap-2 bg-muted/30 border border-border px-4 py-1.5 rounded-full text-sm font-medium text-[#F4BE7E] mb-8 backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-[#F4BE7E] animate-pulse" />
          Le copilote financier des freelances
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold leading-[1.1] mb-6 tracking-tight">
          <span className="text-foreground">Anticipe</span>
          <br />
          <span className="text-foreground">avant de </span>
          <span className="fn-gradient-text">décider.</span>
        </h1>

        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          Simulateur, comparateur de statuts, benchmark TJM, transition CDI&nbsp;&rarr;&nbsp;Freelance et objectif revenu.
          Tous les outils pour piloter ton activité.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
          <Link
            href="/onboarding"
            className="px-8 py-3.5 bg-gradient-to-r from-[#5682F2] to-[#7C5BF2] text-white rounded-full text-lg font-semibold hover:opacity-90 transition-opacity fn-glow"
          >
            Essayer gratuitement &rarr;
          </Link>
          <a
            href="#demo"
            className="px-8 py-3.5 bg-muted/30 text-foreground rounded-full text-lg font-semibold hover:bg-muted transition-colors border border-border backdrop-blur-sm"
          >
            Voir la démo
          </a>
        </div>
        <div className="mb-12" />

        {/* Dashboard mockup */}
        <div className="relative mx-auto max-w-3xl">
          <div className="fn-glow rounded-2xl">
            <DashboardMockup />
          </div>
          {/* Fade bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
        </div>
      </div>
    </section>
  );
}

function DashboardMockup() {
  return (
    <div className="bg-card rounded-2xl border border-border p-6 text-left overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-2 mb-6">
        <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
        <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
        <div className="w-3 h-3 rounded-full bg-[#28c840]" />
        <div className="ml-4 flex-1 h-6 bg-muted/30 rounded-lg" />
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: "CA mensuel", value: "8 750 \u20AC", color: "#5682F2" },
          { label: "Net mensuel", value: "5 420 \u20AC", color: "#4ade80" },
          { label: "Clients actifs", value: "4", color: "#F4BE7E" },
          { label: "Récurrent", value: "78%", color: "#a78bfa" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-muted/30 rounded-xl p-3 border border-border">
            <div className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-1">{kpi.label}</div>
            <div className="text-lg font-bold text-foreground">{kpi.value}</div>
            <div className="w-full h-1 bg-muted/30 rounded-full mt-2">
              <div className="h-full rounded-full" style={{ width: "65%", backgroundColor: kpi.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* Chart area */}
      <div className="bg-muted/40 rounded-xl p-4 border border-border">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-muted-foreground font-medium">Projection 12 mois</span>
          <div className="flex gap-3 text-[10px]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#5682F2]" /> Actuel</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#F4BE7E]" /> Simulé</span>
          </div>
        </div>
        <svg viewBox="0 0 480 120" className="w-full h-auto">
          {/* Grid lines */}
          {[0, 30, 60, 90].map((y) => (
            <line key={y} x1="0" y1={y} x2="480" y2={y} stroke="rgba(255,255,255,0.04)" />
          ))}
          {/* Actuel line */}
          <defs>
            <linearGradient id="mockGrad1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5682F2" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#5682F2" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="mockGrad2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F4BE7E" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#F4BE7E" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M0,80 Q40,65 80,70 T160,55 T240,60 T320,45 T400,50 T480,40 V120 H0 Z" fill="url(#mockGrad1)" />
          <path d="M0,80 Q40,65 80,70 T160,55 T240,60 T320,45 T400,50 T480,40" fill="none" stroke="#5682F2" strokeWidth="2.5" />
          <path d="M0,85 Q40,75 80,80 T160,65 T240,70 T320,55 T400,45 T480,30 V120 H0 Z" fill="url(#mockGrad2)" />
          <path d="M0,85 Q40,75 80,80 T160,65 T240,70 T320,55 T400,45 T480,30" fill="none" stroke="#F4BE7E" strokeWidth="2" strokeDasharray="6 4" />
        </svg>
      </div>
    </div>
  );
}
