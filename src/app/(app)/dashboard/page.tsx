"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useProfileStore } from "@/stores/useProfileStore";
import { simulate, getClientBaseCA, getClientMonthlyCA, computeNetFromCA, JOURS_OUVRES, AVG_JOURS_OUVRES } from "@/lib/simulation-engine";
import { DEFAULT_SIM, MONTHS_SHORT, BUSINESS_STATUS_CONFIG, SEASONALITY } from "@/lib/constants";
import { fmt, cn } from "@/lib/utils";
import { EarningsCounter } from "@/components/dashboard/EarningsCounter";
import {
  CloudSun,
  CloudRain,
  CloudLightning,
  Sun,
  Wallet,
  Users,
  LifeBuoy,
  RefreshCw,
  Shield,
  CalendarDays,
  BadgePercent,
  TrendingUp,
  SlidersHorizontal,
  Banknote,
  PiggyBank,
  Lightbulb,
  HandCoins,
  AlertTriangle,
  Download,
  FileText,
  Target,
} from "@/components/ui/icons";
import { Tooltip } from "@/components/ui/tooltip";
import { getUpcomingDeadlines, CATEGORY_CONFIG as DEADLINE_CATS } from "@/lib/fiscal-deadlines";
import { usePipelineStore } from "@/stores/usePipelineStore";
import { exportCSV, exportPDF } from "@/lib/export";
import { MonthlyBreakdown } from "@/components/simulator/MonthlyBreakdown";

type Meteo = "soleil" | "beau" | "variable" | "orageux";

function getMeteo(score: number): Meteo {
  if (score >= 80) return "soleil";
  if (score >= 60) return "beau";
  if (score >= 40) return "variable";
  return "orageux";
}

const METEO_CONFIG: Record<Meteo, { label: string; icon: typeof Sun; color: string; accent: string; glow: string }> = {
  soleil: { label: "Grand soleil", icon: Sun, color: "text-[#fbbf24]", accent: "#fbbf24", glow: "shadow-[0_0_24px_rgba(251,191,36,0.15)]" },
  beau: { label: "Beau temps", icon: CloudSun, color: "text-[#4ade80]", accent: "#4ade80", glow: "shadow-[0_0_24px_rgba(74,222,128,0.15)]" },
  variable: { label: "Variable", icon: CloudRain, color: "text-[#F4BE7E]", accent: "#F4BE7E", glow: "shadow-[0_0_24px_rgba(244,190,126,0.15)]" },
  orageux: { label: "Orageux", icon: CloudLightning, color: "text-[#f87171]", accent: "#f87171", glow: "shadow-[0_0_24px_rgba(248,113,113,0.15)]" },
};

function Shimmer({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={cn("animate-pulse rounded-lg bg-muted/80", className)} style={style} />;
}

function DashboardSkeleton() {
  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-5">
      {/* Meteo hero skeleton */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center gap-4">
          <Shimmer className="size-16 rounded-2xl" />
          <div className="space-y-2 flex-1">
            <Shimmer className="h-3 w-24" />
            <Shimmer className="h-7 w-40" />
            <Shimmer className="h-4 w-32" />
          </div>
        </div>
      </div>

      {/* Finance cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-5 space-y-3">
            <Shimmer className="h-3 w-28" />
            <Shimmer className="h-8 w-24" />
            <Shimmer className="h-3 w-40" />
          </div>
        ))}
      </div>

      {/* KPI grid skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="bg-card rounded-xl p-4 border border-border space-y-2">
            <div className="flex items-center gap-2">
              <Shimmer className="size-7 rounded-lg" />
              <Shimmer className="h-2.5 w-16" />
            </div>
            <Shimmer className="h-6 w-20" />
            <Shimmer className="h-2.5 w-24" />
          </div>
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="bg-card rounded-2xl p-6 border border-border">
        <Shimmer className="h-4 w-40 mb-4" />
        <div className="flex items-end gap-1 h-36">
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <Shimmer className="w-full rounded-t" style={{ height: `${30 + Math.random() * 60}%` }} />
              <Shimmer className="h-2 w-5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const profile = useProfileStore();
  const isDbSynced = useProfileStore((s) => s.isDbSynced);

  const projection = useMemo(
    () => simulate(profile.clients, DEFAULT_SIM, profile),
    [profile]
  );

  const totalCA = profile.clients.reduce((s, c) => s + getClientBaseCA(c), 0);
  const annualCA = projection.before.reduce((a, b) => a + b, 0);
  const currentMonth = new Date().getMonth();
  const currentMonthCA = projection.before[currentMonth];
  const expenses = profile.monthlyExpenses;

  const statusConfig = BUSINESS_STATUS_CONFIG[profile.businessStatus ?? "micro"];
  const urssafRate = profile.customUrssafRate ?? statusConfig.urssaf;
  const irRate = profile.customIrRate ?? statusConfig.ir;
  const netAfterAll = computeNetFromCA(annualCA, profile);
  const netRate = annualCA > 0 ? netAfterAll / annualCA : 0;
  const netMonthly = currentMonthCA * netRate;
  const netAfterExpenses = netAfterAll - expenses * 12;
  const monthlySalary = profile.monthlySalary ?? 0;
  const annualSalary = monthlySalary * 12;
  const remunerationType = profile.remunerationType;
  const totalCharges = annualCA - netAfterAll;
  const effectiveChargesRate = annualCA > 0 ? (totalCharges / annualCA) * 100 : 0;

  const runway = expenses > 0 ? profile.savings / expenses : 99;

  const recurringCA = profile.clients
    .filter((c) => c.billing === "tjm" || c.billing === "forfait")
    .reduce((s, c) => s + getClientBaseCA(c), 0);
  const recurringPct = totalCA > 0 ? (recurringCA / totalCA) * 100 : 0;

  const clientCAs = profile.clients.map((c) => getClientBaseCA(c));
  const maxClientCA = Math.max(...clientCAs, 0);
  const dependencyPct = totalCA > 0 ? (maxClientCA / totalCA) * 100 : 0;

  const totalDaysPerWeek = profile.clients
    .filter((c) => c.billing === "tjm")
    .reduce((s, c) => s + (c.daysPerWeek ?? 0), 0);
  const utilizationPct = profile.workDaysPerWeek > 0
    ? Math.min(100, (totalDaysPerWeek / profile.workDaysPerWeek) * 100)
    : 0;

  // Health score (0-100)
  const scores = [
    Math.min(100, (runway / 6) * 100),              // runway score (6 mois = 100%)
    Math.min(100, recurringPct),                      // recurring score
    Math.min(100, 100 - Math.max(0, dependencyPct - 30)), // diversification (>30% bad)
    netAfterExpenses > 0 ? Math.min(100, (netAfterExpenses / (expenses * 12)) * 100) : 0, // profitability
    Math.min(100, utilizationPct),                    // utilization
    profile.clients.length >= 2 ? 100 : profile.clients.length * 50, // nb clients
  ];
  const healthScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const meteo = getMeteo(healthScore);
  const meteoConfig = METEO_CONFIG[meteo];
  const MeteoIcon = meteoConfig.icon;

  // Monthly CA mini-chart data
  const maxMonthly = Math.max(...projection.before, 1);

  // Fiscal deadlines coming up in 7 days
  const upcomingDeadlines = useMemo(
    () => getUpcomingDeadlines(profile.businessStatus, 7),
    [profile.businessStatus]
  );

  const prospects = usePipelineStore((s) => s.prospects);
  const weightedPipeline = prospects.reduce((s, p) => s + p.estimatedCA * (p.probability / 100), 0);

  if (!isDbSynced) return <DashboardSkeleton />;

  return (
    <div id="dashboard-content" className="max-w-6xl mx-auto p-4 md:p-6 space-y-5">
      {/* Fiscal deadline alert */}
      {upcomingDeadlines.length > 0 && (
        <div className="bg-[#f87171]/10 border border-[#f87171]/20 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="size-4 text-[#f87171]" />
            <span className="text-sm font-bold text-[#f87171]">
              {upcomingDeadlines.length} échéance{upcomingDeadlines.length > 1 ? "s" : ""} dans les 7 prochains jours
            </span>
          </div>
          <div className="space-y-1.5">
            {upcomingDeadlines.map((d, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <div className="size-2 rounded-full shrink-0" style={{ backgroundColor: DEADLINE_CATS[d.category].color }} />
                <span className="text-foreground font-medium">{d.label}</span>
                <span className="text-muted-foreground/60 text-xs">
                  {d.date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                </span>
                {d.estimateAmount && (
                  <span className="ml-auto text-xs font-semibold" style={{ color: DEADLINE_CATS[d.category].color }}>
                    ~{fmt(d.estimateAmount(annualCA, profile.businessStatus))} &euro;
                  </span>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={() => router.push("/calendrier")}
            className="mt-3 text-xs text-[#f87171] font-medium hover:underline"
          >
            Voir le calendrier fiscal &rarr;
          </button>
        </div>
      )}

      {/* Meteo hero */}
      <div className={cn("bg-card rounded-2xl border border-border overflow-hidden", meteoConfig.glow)}>
        <div className="flex">
          <div className="w-1 shrink-0 rounded-l-2xl" style={{ backgroundColor: meteoConfig.accent }} />
          <div className="flex-1 p-6">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div
                  className="size-16 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: `${meteoConfig.accent}15` }}
                >
                  <MeteoIcon className={cn("size-9", meteoConfig.color)} />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider mb-0.5">Météo business</p>
                  <h2 className="text-2xl font-bold text-foreground">{meteoConfig.label}</h2>
                  <p className="text-sm text-muted-foreground">Score santé : <strong className={meteoConfig.color}>{healthScore}/100</strong></p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const rows = [
                      ["Métrique", "Valeur"],
                      ["CA mensuel", `${fmt(currentMonthCA)}€`],
                      ["CA annuel", `${fmt(annualCA)}€`],
                      ["Clients actifs", String(profile.clients.length)],
                      ["Runway", `${runway.toFixed(1)} mois`],
                      ["Récurrent", `${recurringPct.toFixed(0)}%`],
                      ["Top client", `${dependencyPct.toFixed(0)}%`],
                      ["Utilisation", `${utilizationPct.toFixed(0)}%`],
                      ["Charges totales", `${effectiveChargesRate.toFixed(0)}%`],
                      ["Taux net effectif", `${annualCA > 0 ? ((netAfterAll / annualCA) * 100).toFixed(0) : 0}%`],
                      ["Net mensuel", `${fmt(Math.round(netMonthly - expenses))}€`],
                      ["Net annuel", `${fmt(Math.round(netAfterExpenses))}€`],
                      [],
                      ["Mois", "CA", "Résultat", "Net"],
                      ...MONTHS_SHORT.map((m, i) => {
                        const ca = projection.before[i];
                        const netR = annualCA > 0 ? netAfterAll / annualCA : 0;
                        return [m, `${fmt(ca)}€`, `${fmt(Math.round(ca - expenses))}€`, `${fmt(Math.round(ca * netR - expenses))}€`];
                      }),
                    ];
                    exportCSV(rows, "freelens-dashboard.csv");
                  }}
                  className="px-3 py-2 rounded-xl border border-border bg-card text-sm font-medium text-foreground hover:bg-muted transition-colors hidden sm:flex items-center gap-1.5"
                >
                  <Download className="size-3.5" /> CSV
                </button>
                <button
                  onClick={() => exportPDF("dashboard-content", "freelens-dashboard.pdf")}
                  className="px-3 py-2 rounded-xl border border-border bg-card text-sm font-medium text-foreground hover:bg-muted transition-colors hidden sm:flex items-center gap-1.5"
                >
                  <FileText className="size-3.5" /> PDF
                </button>
                <button
                  onClick={() => router.push("/simulator")}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#5682F2] to-[#7C5BF2] text-white rounded-full text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                  <SlidersHorizontal className="size-4" /> Simuler un scénario
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Earnings counter */}
      <EarningsCounter />

      {/* Net revenue highlight */}
      <DashboardFinanceCards
        netMonthly={netMonthly}
        expenses={expenses}
        totalCA={currentMonthCA}
        statusConfig={statusConfig}
        urssafRate={urssafRate}
        irRate={irRate}
        netAfterAll={netAfterAll}
        netAfterExpenses={netAfterExpenses}
        savings={profile.savings}
        monthlySalary={monthlySalary}
        annualSalary={annualSalary}
        remunerationType={remunerationType}
      />

      {/* KPI grid — horizontal scroll on mobile */}
      <div className="flex overflow-x-auto snap-x snap-mandatory gap-3 pb-1 md:grid md:grid-cols-4 md:overflow-visible md:pb-0">
        {[
          { icon: <Wallet className="size-4 text-[#5682F2]" />, iconBg: "bg-[#5682F2]/15", label: "CA mensuel", value: `${fmt(currentMonthCA)}\u20AC`, sub: `${fmt(annualCA)}\u20AC/an`, tip: "CA du mois en cours basé sur les jours ouvrés réels" },
          { icon: <Users className="size-4 text-[#5682F2]" />, iconBg: "bg-[#5682F2]/15", label: "Clients actifs", value: String(profile.clients.length), sub: `${totalDaysPerWeek}j/sem facturés`, tip: "Nombre de clients configurés dans ton profil" },
          { icon: <LifeBuoy className="size-4 text-[#4ade80]" />, iconBg: "bg-[#4ade80]/12", label: "Runway", value: `${runway.toFixed(1)} mois`, sub: `${fmt(profile.savings)}\u20AC de trésorerie`, tip: "Mois de trésorerie restante si ton CA tombe à zéro" },
          { icon: <RefreshCw className="size-4 text-[#a78bfa]" />, iconBg: "bg-[#a78bfa]/12", label: "Récurrent", value: `${recurringPct.toFixed(0)}%`, sub: recurringPct >= 60 ? "Stable" : "À renforcer", tip: "Part du CA en TJM ou forfait (revenu prévisible)" },
          { icon: <Shield className="size-4 text-[#fbbf24]" />, iconBg: "bg-[#fbbf24]/12", label: "Top client", value: `${dependencyPct.toFixed(0)}%`, sub: dependencyPct > 50 ? "Risque concentration" : "Diversifié", tip: "Part du CA venant de ton plus gros client. Au-dessus de 50% = risque de dépendance" },
          { icon: <CalendarDays className="size-4 text-[#4ade80]" />, iconBg: "bg-[#4ade80]/12", label: "Utilisation", value: `${utilizationPct.toFixed(0)}%`, sub: `${totalDaysPerWeek}/${profile.workDaysPerWeek}j par sem`, tip: "Jours facturés / jours disponibles par semaine" },
          { icon: <BadgePercent className="size-4 text-[#F4BE7E]" />, iconBg: "bg-[#F4BE7E]/15", label: "Charges totales", value: `${effectiveChargesRate.toFixed(0)}%`, sub: `${fmt(Math.round(totalCharges))}\u20AC/an`, tip: "Cotisations sociales + IR en % du CA brut" },
          { icon: <Banknote className="size-4 text-[#4ade80]" />, iconBg: "bg-[#4ade80]/12", label: "Taux net effectif", value: `${annualCA > 0 ? ((netAfterAll / annualCA) * 100).toFixed(0) : 0}%`, sub: `${fmt(Math.round(netAfterAll))}\u20AC net fiscal/an`, tip: "Ce qui te reste réellement après toutes les charges et impôts" },
          ...(prospects.length > 0 ? [{ icon: <Target className="size-4 text-[#a78bfa]" />, iconBg: "bg-[#a78bfa]/12", label: "Pipeline", value: `${fmt(Math.round(weightedPipeline))}\u20AC`, sub: `${prospects.length} prospect${prospects.length > 1 ? "s" : ""} en cours`, tip: "CA pondéré par probabilité de conversion de tes prospects" }] : []),
        ].map((kpi) => (
          <div key={kpi.label} className="min-w-[150px] snap-center shrink-0 md:min-w-0 md:shrink bg-card rounded-xl p-4 border border-border hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <div className={cn("size-7 rounded-lg flex items-center justify-center", kpi.iconBg)}>{kpi.icon}</div>
              <Tooltip content={kpi.tip}>
                <span className="text-[11px] text-muted-foreground/60 font-medium uppercase tracking-wider cursor-help">{kpi.label}</span>
              </Tooltip>
            </div>
            <div className="text-xl font-bold text-foreground">{kpi.value}</div>
            <div className="text-[11px] text-muted-foreground/60 mt-0.5">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Monthly CA chart */}
      <DashboardChart projection={projection} expenses={expenses} netRate={netRate} clients={profile.clients} profile={profile} />

      {/* Monthly breakdown table */}
      <MonthlyBreakdown projection={projection} clients={profile.clients} profile={profile} sim={DEFAULT_SIM} />

      {/* Client breakdown */}
      {profile.clients.length > 0 && (
        <div className="bg-card rounded-2xl p-6 border border-border">
          <h3 className="text-sm font-bold text-foreground mb-4">Répartition clients</h3>
          <div className="space-y-3">
            {profile.clients.map((c) => {
              const ca = getClientBaseCA(c);
              const pct = totalCA > 0 ? (ca / totalCA) * 100 : 0;
              return (
                <div key={c.id} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.color ?? "#5682F2" }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-foreground truncate">{c.name}</span>
                      <span className="text-xs text-muted-foreground shrink-0"><span className="hidden sm:inline">{fmt(ca)}&euro;/mois &middot; </span>{pct.toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${pct}%`, backgroundColor: c.color ?? "#5682F2" }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function DashboardFinanceCards({
  netMonthly, expenses, totalCA, statusConfig, urssafRate, irRate,
  netAfterAll, netAfterExpenses, savings, monthlySalary, annualSalary, remunerationType,
}: {
  netMonthly: number; expenses: number; totalCA: number;
  statusConfig: { label: string; ir: number; is: number };
  urssafRate: number; irRate: number; netAfterAll: number; netAfterExpenses: number;
  savings: number; monthlySalary: number; annualSalary: number;
  remunerationType?: string;
}) {
  const [includeRem, setIncludeRem] = useState(monthlySalary > 0);
  const treasuryValue = savings + netAfterExpenses - (includeRem ? annualSalary : 0);

  const available = netMonthly - expenses;
  const remMax = Math.max(0, Math.round(available));
  const remConfort = Math.max(0, Math.round(available * 0.7));
  const remPrudent = Math.max(0, Math.round(available * 0.5));

  const isIS = statusConfig.is > 0;
  const isDividendes = remunerationType === "dividendes";
  const isMixte = remunerationType === "mixte";

  // Labels adaptés selon le statut
  const monthlyLabel = isIS && (isDividendes || isMixte)
    ? "Résultat net mensuel"
    : "Revenu net mensuel";
  const annualLabel = isIS && (isDividendes || isMixte)
    ? "Résultat net annuel"
    : "Net annuel";
  const monthlySubtext = isIS && isDividendes
    ? "Si le résultat est distribué intégralement en dividendes"
    : isIS && isMixte
      ? "Part salaire + dividendes si résultat intégralement distribué"
      : undefined;
  const annualSubtext = isIS && isDividendes
    ? `Après IS + PFU/taxation dividendes sur ${fmt(Math.round(netAfterAll + expenses * 12))}\u20AC de CA`
    : isIS && isMixte
      ? `Après IS + charges salaire + taxation dividendes`
      : undefined;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Revenu / Résultat net mensuel */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="flex h-full">
            <div className="w-1 shrink-0 bg-[#4ade80]" />
            <div className="flex-1 p-5">
              <div className="flex items-center gap-2 mb-1">
                <Banknote className="size-5 text-[#4ade80]" />
                <span className="text-xs font-semibold text-[#4ade80] uppercase tracking-wider">{monthlyLabel}</span>
              </div>
              <div className={cn("text-2xl font-bold", netMonthly - expenses > 0 ? "text-[#4ade80]" : "text-[#f87171]")}>
                {fmt(Math.round(netMonthly - expenses))}&euro;
              </div>
              <div className="text-[11px] text-muted-foreground/60 mt-1">
                CA {fmt(totalCA)}&euro; &rarr; net {fmt(Math.round(netMonthly))}&euro; &minus; charges {fmt(expenses)}&euro;
              </div>
              <div className="text-[10px] text-muted-foreground/60 mt-0.5">{statusConfig.label} &middot; URSSAF {(urssafRate * 100).toFixed(0)}% + IR {(irRate * 100).toFixed(0)}%{isIS ? ` + IS ${(statusConfig.is * 100).toFixed(0)}%` : ""}{isIS && remunerationType ? ` \u00B7 ${isDividendes ? "Dividendes" : isMixte ? "Mixte" : "Salaire"}` : ""}</div>
              {monthlySubtext && (
                <div className="text-[10px] text-[#fbbf24]/70 mt-1 italic">{monthlySubtext}</div>
              )}
            </div>
          </div>
        </div>

        {/* Net / Résultat net annuel */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="flex h-full">
            <div className="w-1 shrink-0 bg-[#5682F2]" />
            <div className="flex-1 p-5">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="size-5 text-[#5682F2]" />
                <span className="text-xs font-semibold text-[#5682F2] uppercase tracking-wider">{annualLabel}</span>
              </div>
              <div className={cn("text-2xl font-bold", netAfterExpenses > 0 ? "text-[#5682F2]" : "text-[#f87171]")}>
                {fmt(Math.round(netAfterExpenses))}&euro;
              </div>
              <div className="text-[11px] text-muted-foreground/60 mt-1">
                {fmt(Math.round(netAfterAll))}&euro; net fiscal &minus; {fmt(expenses * 12)}&euro; charges
              </div>
              {annualSubtext && (
                <div className="text-[10px] text-[#fbbf24]/70 mt-1 italic">{annualSubtext}</div>
              )}
            </div>
          </div>
        </div>

        {/* Tresorerie fin d'annee */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="flex h-full">
            <div className="w-1 shrink-0 bg-[#F4BE7E]" />
            <div className="flex-1 p-5">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <PiggyBank className="size-5 text-[#F4BE7E]" />
                  <span className="text-xs font-semibold text-[#F4BE7E] uppercase tracking-wider">Trésorerie fin d&apos;année</span>
                </div>
                <button
                  onClick={() => setIncludeRem(!includeRem)}
                  className={cn(
                    "text-[10px] font-medium px-2 py-0.5 rounded-full border transition-colors",
                    includeRem
                      ? "bg-[#a78bfa]/12 text-[#a78bfa] border-[#a78bfa]/20"
                      : "bg-muted text-muted-foreground/60 border-border"
                  )}
                >
                  {includeRem
                    ? monthlySalary > 0 ? `\u2212 ${fmt(annualSalary)}\u20AC rem.` : "Rem. non définie"
                    : "Sans rem."}
                </button>
              </div>
              <div className={cn("text-2xl font-bold", treasuryValue >= 0 ? "text-[#F4BE7E]" : "text-[#f87171]")}>
                {fmt(Math.round(treasuryValue))}&euro;
              </div>
              <div className="text-[11px] text-muted-foreground/60 mt-1">
                {fmt(savings)}&euro; {netAfterExpenses >= 0 ? "+" : "\u2212"} {fmt(Math.abs(Math.round(netAfterExpenses)))}&euro; net{includeRem && monthlySalary > 0 ? ` \u2212 ${fmt(annualSalary)}\u20AC rem.` : ""}
              </div>
              {includeRem && monthlySalary === 0 && (
                <a href="/settings" className="text-[10px] text-[#a78bfa] underline mt-1 inline-block">Définir la rémunération &rarr;</a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Salary recommendation */}
      {available > 0 && (
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-start gap-3">
            <div className="size-8 rounded-lg bg-[#a78bfa]/12 flex items-center justify-center shrink-0 mt-0.5">
              <Lightbulb className="size-4 text-[#a78bfa]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-[#a78bfa]">Rémunération conseillée</span>
                {monthlySalary > 0 && (
                  <span className={cn(
                    "text-[10px] font-medium px-2 py-0.5 rounded-full",
                    monthlySalary <= remPrudent
                      ? "bg-[#4ade80]/12 text-[#4ade80]"
                      : monthlySalary <= remConfort
                        ? "bg-[#4ade80]/12 text-[#4ade80]"
                        : monthlySalary <= remMax
                          ? "bg-[#fbbf24]/12 text-[#fbbf24]"
                          : "bg-[#f87171]/12 text-[#f87171]"
                  )}>
                    <HandCoins className="size-3 inline -mt-0.5 mr-0.5" />
                    Actuel : {fmt(monthlySalary)}&euro;
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 rounded-lg border border-border">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#4ade80]" />
                  <span className="text-[11px] text-muted-foreground/60">Prudent</span>
                  <span className="text-sm font-bold text-[#4ade80]">{fmt(remPrudent)}&euro;</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 rounded-lg border border-border">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#5682F2]" />
                  <span className="text-[11px] text-muted-foreground/60">Confort</span>
                  <span className="text-sm font-bold text-[#5682F2]">{fmt(remConfort)}&euro;</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 rounded-lg border border-border">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#fbbf24]" />
                  <span className="text-[11px] text-muted-foreground/60">Max</span>
                  <span className="text-sm font-bold text-[#fbbf24]">{fmt(remMax)}&euro;</span>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground/60 mt-2">
                Base : {fmt(Math.round(netMonthly))}&euro; net/mois &minus; {fmt(expenses)}&euro; charges. Prudent garde 50% en trésorerie, confort 30%, max = 100% du disponible.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DashboardChart({ projection, expenses, netRate, clients, profile }: { projection: { before: number[] }; expenses: number; netRate: number; clients: import("@/types").ClientData[]; profile: import("@/types").FreelanceProfile }) {
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);
  const maxMonthly = Math.max(...projection.before, 1);

  const hoveredClientBreakdown = hoveredMonth !== null ? clients.map((c) => {
    const ca = getClientMonthlyCA(c, hoveredMonth, SEASONALITY[hoveredMonth], profile.vacationDaysPerMonth?.[hoveredMonth] ?? 0);
    return { name: c.name, ca, color: c.color ?? "#5682F2" };
  }).filter((c) => c.ca > 0) : [];

  return (
    <div className="bg-card rounded-2xl p-4 md:p-6 border border-border">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-bold text-foreground">Projection mensuelle</h3>
          <div className="flex items-center gap-2.5 text-[10px] text-muted-foreground/60">
            <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-[#5682F2]" /> CA</span>
            <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-[#F4BE7E]" /> Résultat</span>
            <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-[#4ade80]" /> Net</span>
          </div>
        </div>
        {hoveredMonth !== null && (() => {
          const ca = projection.before[hoveredMonth];
          const resultat = ca - expenses;
          const netRevenue = ca * netRate - expenses;
          return (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-bold text-foreground">{MONTHS_SHORT[hoveredMonth]}</span>
              <span className="text-xs text-[#5682F2] font-semibold">CA {fmt(ca)}&euro;</span>
              <span className={cn(
                "text-xs font-semibold px-1.5 py-0.5 rounded-full",
                resultat >= 0 ? "bg-[#F4BE7E]/15 text-[#F4BE7E]" : "bg-[#f87171]/12 text-[#f87171]"
              )}>
                Res. {fmt(Math.round(resultat))}&euro;
              </span>
              <span className={cn(
                "text-xs font-semibold px-1.5 py-0.5 rounded-full",
                netRevenue >= 0 ? "bg-[#4ade80]/12 text-[#4ade80]" : "bg-[#f87171]/12 text-[#f87171]"
              )}>
                Net {fmt(Math.round(netRevenue))}&euro;
              </span>
              <span className="text-[10px] text-muted-foreground/60">{JOURS_OUVRES[hoveredMonth]}j</span>
              {hoveredClientBreakdown.length > 1 && (
                <div className="flex items-center gap-2 ml-1">
                  {hoveredClientBreakdown.map((c, i) => (
                    <span key={i} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <span className="size-1.5 rounded-full inline-block" style={{ backgroundColor: c.color }} />
                      {c.name} <strong className="text-foreground/80">{fmt(Math.round(c.ca))}&euro;</strong>
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })()}
      </div>
      <div className="overflow-x-auto">
      <div className="flex items-end gap-1 h-36 min-w-[480px]">
        {MONTHS_SHORT.map((m, i) => {
          const ca = projection.before[i];
          const caPct = (ca / maxMonthly) * 100;
          const resultat = ca - expenses;
          const resultatVal = Math.max(0, resultat);
          const resultatPct = (resultatVal / maxMonthly) * 100;
          const netRevenue = ca * netRate - expenses;
          const netVal = Math.max(0, netRevenue);
          const netPct = (netVal / maxMonthly) * 100;
          const isHovered = hoveredMonth === i;
          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center gap-1 cursor-pointer"
              onMouseEnter={() => setHoveredMonth(i)}
              onMouseLeave={() => setHoveredMonth(null)}
            >
              <div className="w-full flex items-end justify-center gap-px" style={{ height: "112px" }}>
                <div
                  className={cn(
                    "w-1/3 max-w-[10px] rounded-t transition-all duration-150",
                    isHovered ? "bg-[#5682F2]" : "bg-[#5682F2]/40"
                  )}
                  style={{ height: `${Math.max(2, caPct)}%` }}
                />
                <div
                  className={cn(
                    "w-1/3 max-w-[10px] rounded-t transition-all duration-150",
                    resultat >= 0
                      ? isHovered ? "bg-[#F4BE7E]" : "bg-[#F4BE7E]/40"
                      : isHovered ? "bg-[#f87171]" : "bg-[#f87171]/40"
                  )}
                  style={{ height: `${Math.max(2, resultatPct)}%` }}
                />
                <div
                  className={cn(
                    "w-1/3 max-w-[10px] rounded-t transition-all duration-150",
                    netRevenue >= 0
                      ? isHovered ? "bg-[#4ade80]" : "bg-[#4ade80]/40"
                      : isHovered ? "bg-[#f87171]" : "bg-[#f87171]/40"
                  )}
                  style={{ height: `${Math.max(2, netPct)}%` }}
                />
              </div>
              <span className={cn(
                "text-[9px] transition-colors",
                isHovered ? "text-foreground font-semibold" : "text-muted-foreground/60"
              )}>{m}</span>
            </div>
          );
        })}
      </div>
      </div>
      <div className="flex justify-between mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
        <span>Jours ouvrés : {JOURS_OUVRES.reduce((a, b) => a + b, 0)}/an &middot; ~{AVG_JOURS_OUVRES.toFixed(0)}/mois</span>
        <span>Taux net : {(netRate * 100).toFixed(0)}% &middot; Charges : {fmt(expenses)}&euro;/mois</span>
      </div>
    </div>
  );
}
