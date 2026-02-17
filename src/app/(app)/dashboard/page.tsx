"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useProfileStore } from "@/stores/useProfileStore";
import { simulate, getClientBaseCA, computeNetFromCA, JOURS_OUVRES, AVG_JOURS_OUVRES } from "@/lib/simulation-engine";
import { DEFAULT_SIM, MONTHS_SHORT, BUSINESS_STATUS_CONFIG, SEASONALITY } from "@/lib/constants";
import { fmt, cn } from "@/lib/utils";
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
} from "@/components/ui/icons";

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

export default function DashboardPage() {
  const router = useRouter();
  const profile = useProfileStore();

  const projection = useMemo(
    () => simulate(profile.clients, DEFAULT_SIM, profile),
    [profile]
  );

  const totalCA = profile.clients.reduce((s, c) => s + getClientBaseCA(c), 0);
  const annualCA = projection.before.reduce((a, b) => a + b, 0);
  const expenses = profile.monthlyExpenses;

  const statusConfig = BUSINESS_STATUS_CONFIG[profile.businessStatus ?? "micro"];
  const urssafRate = profile.customUrssafRate ?? statusConfig.urssaf;
  const irRate = profile.customIrRate ?? statusConfig.ir;
  const netAfterAll = computeNetFromCA(annualCA, profile);
  const netMonthly = netAfterAll / 12;
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

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-5">
      {/* Meteo hero */}
      <div className={cn("bg-[#12121c] rounded-2xl border border-white/[0.06] overflow-hidden", meteoConfig.glow)}>
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
                  <p className="text-xs font-medium text-[#5a5a6e] uppercase tracking-wider mb-0.5">Météo business</p>
                  <h2 className="text-2xl font-bold text-white">{meteoConfig.label}</h2>
                  <p className="text-sm text-[#8b8b9e]">Score santé : <strong className={meteoConfig.color}>{healthScore}/100</strong></p>
                </div>
              </div>
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

      {/* Net revenue highlight */}
      <DashboardFinanceCards
        netMonthly={netMonthly}
        expenses={expenses}
        totalCA={totalCA}
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

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: <Wallet className="size-4 text-[#5682F2]" />, iconBg: "bg-[#5682F2]/15", label: "CA mensuel", value: `${fmt(totalCA)}\u20AC`, sub: `${fmt(annualCA)}\u20AC/an` },
          { icon: <Users className="size-4 text-[#5682F2]" />, iconBg: "bg-[#5682F2]/15", label: "Clients actifs", value: String(profile.clients.length), sub: `${totalDaysPerWeek}j/sem facturés` },
          { icon: <LifeBuoy className="size-4 text-[#4ade80]" />, iconBg: "bg-[#4ade80]/12", label: "Runway", value: `${runway.toFixed(1)} mois`, sub: `${fmt(profile.savings)}\u20AC de trésorerie` },
          { icon: <RefreshCw className="size-4 text-[#a78bfa]" />, iconBg: "bg-[#a78bfa]/12", label: "Récurrent", value: `${recurringPct.toFixed(0)}%`, sub: recurringPct >= 60 ? "Stable" : "À renforcer" },
          { icon: <Shield className="size-4 text-[#fbbf24]" />, iconBg: "bg-[#fbbf24]/12", label: "Top client", value: `${dependencyPct.toFixed(0)}%`, sub: dependencyPct > 50 ? "Risque concentration" : "Diversifié" },
          { icon: <CalendarDays className="size-4 text-[#4ade80]" />, iconBg: "bg-[#4ade80]/12", label: "Utilisation", value: `${utilizationPct.toFixed(0)}%`, sub: `${totalDaysPerWeek}/${profile.workDaysPerWeek}j par sem` },
          { icon: <BadgePercent className="size-4 text-[#F4BE7E]" />, iconBg: "bg-[#F4BE7E]/15", label: "Charges totales", value: `${effectiveChargesRate.toFixed(0)}%`, sub: `${fmt(Math.round(totalCharges))}\u20AC/an` },
          { icon: <Banknote className="size-4 text-[#4ade80]" />, iconBg: "bg-[#4ade80]/12", label: "Taux net effectif", value: `${annualCA > 0 ? ((netAfterAll / annualCA) * 100).toFixed(0) : 0}%`, sub: `${fmt(Math.round(netAfterAll))}\u20AC net fiscal/an` },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-[#12121c] rounded-xl p-4 border border-white/[0.06] hover:bg-[#1a1a26] transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <div className={cn("size-7 rounded-lg flex items-center justify-center", kpi.iconBg)}>{kpi.icon}</div>
              <span className="text-[11px] text-[#5a5a6e] font-medium uppercase tracking-wider">{kpi.label}</span>
            </div>
            <div className="text-xl font-bold text-white">{kpi.value}</div>
            <div className="text-[11px] text-[#5a5a6e] mt-0.5">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Monthly CA chart */}
      <DashboardChart projection={projection} expenses={expenses} netRate={annualCA > 0 ? netAfterAll / annualCA : 0} />

      {/* Client breakdown */}
      {profile.clients.length > 0 && (
        <div className="bg-[#12121c] rounded-2xl p-6 border border-white/[0.06]">
          <h3 className="text-sm font-bold text-white mb-4">Répartition clients</h3>
          <div className="space-y-3">
            {profile.clients.map((c) => {
              const ca = getClientBaseCA(c);
              const pct = totalCA > 0 ? (ca / totalCA) * 100 : 0;
              return (
                <div key={c.id} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.color ?? "#5682F2" }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-white truncate">{c.name}</span>
                      <span className="text-xs text-[#8b8b9e] shrink-0">{fmt(ca)}&euro;/mois &middot; {pct.toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/[0.06] rounded-full">
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

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Revenu net mensuel */}
        <div className="bg-[#12121c] rounded-xl border border-white/[0.06] overflow-hidden">
          <div className="flex h-full">
            <div className="w-1 shrink-0 bg-[#4ade80]" />
            <div className="flex-1 p-5">
              <div className="flex items-center gap-2 mb-1">
                <Banknote className="size-5 text-[#4ade80]" />
                <span className="text-xs font-semibold text-[#4ade80] uppercase tracking-wider">Revenu net mensuel</span>
              </div>
              <div className={cn("text-2xl font-bold", netMonthly - expenses > 0 ? "text-[#4ade80]" : "text-[#f87171]")}>
                {fmt(Math.round(netMonthly - expenses))}&euro;
              </div>
              <div className="text-[11px] text-[#5a5a6e] mt-1">
                CA {fmt(totalCA)}&euro; &rarr; net {fmt(Math.round(netMonthly))}&euro; &minus; charges {fmt(expenses)}&euro;
              </div>
              <div className="text-[10px] text-[#5a5a6e]/60 mt-0.5">{statusConfig.label} &middot; URSSAF {(urssafRate * 100).toFixed(0)}% + IR {(irRate * 100).toFixed(0)}%{statusConfig.is > 0 ? ` + IS ${(statusConfig.is * 100).toFixed(0)}%` : ""}{statusConfig.is > 0 && remunerationType ? ` \u00B7 ${remunerationType === "salaire" ? "Salaire" : remunerationType === "dividendes" ? "Dividendes" : "Mixte"}` : ""}</div>
            </div>
          </div>
        </div>

        {/* Net annuel */}
        <div className="bg-[#12121c] rounded-xl border border-white/[0.06] overflow-hidden">
          <div className="flex h-full">
            <div className="w-1 shrink-0 bg-[#5682F2]" />
            <div className="flex-1 p-5">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="size-5 text-[#5682F2]" />
                <span className="text-xs font-semibold text-[#5682F2] uppercase tracking-wider">Net annuel</span>
              </div>
              <div className={cn("text-2xl font-bold", netAfterExpenses > 0 ? "text-[#5682F2]" : "text-[#f87171]")}>
                {fmt(Math.round(netAfterExpenses))}&euro;
              </div>
              <div className="text-[11px] text-[#5a5a6e] mt-1">
                {fmt(Math.round(netAfterAll))}&euro; net fiscal &minus; {fmt(expenses * 12)}&euro; charges
              </div>
            </div>
          </div>
        </div>

        {/* Tresorerie fin d'annee */}
        <div className="bg-[#12121c] rounded-xl border border-white/[0.06] overflow-hidden">
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
                      : "bg-white/[0.06] text-[#5a5a6e] border-white/[0.06]"
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
              <div className="text-[11px] text-[#5a5a6e] mt-1">
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
        <div className="bg-[#12121c] rounded-xl p-4 border border-white/[0.06]">
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
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] rounded-lg border border-white/[0.06]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#4ade80]" />
                  <span className="text-[11px] text-[#5a5a6e]">Prudent</span>
                  <span className="text-sm font-bold text-[#4ade80]">{fmt(remPrudent)}&euro;</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] rounded-lg border border-white/[0.06]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#5682F2]" />
                  <span className="text-[11px] text-[#5a5a6e]">Confort</span>
                  <span className="text-sm font-bold text-[#5682F2]">{fmt(remConfort)}&euro;</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] rounded-lg border border-white/[0.06]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#fbbf24]" />
                  <span className="text-[11px] text-[#5a5a6e]">Max</span>
                  <span className="text-sm font-bold text-[#fbbf24]">{fmt(remMax)}&euro;</span>
                </div>
              </div>
              <p className="text-[10px] text-[#5a5a6e] mt-2">
                Base : {fmt(Math.round(netMonthly))}&euro; net/mois &minus; {fmt(expenses)}&euro; charges. Prudent garde 50% en trésorerie, confort 30%, max = 100% du disponible.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DashboardChart({ projection, expenses, netRate }: { projection: { before: number[] }; expenses: number; netRate: number }) {
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);
  const maxMonthly = Math.max(...projection.before, 1);

  return (
    <div className="bg-[#12121c] rounded-2xl p-6 border border-white/[0.06]">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-bold text-white">Projection mensuelle</h3>
          <div className="flex items-center gap-2.5 text-[10px] text-[#5a5a6e]">
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
            <div className="flex items-center gap-2 text-sm">
              <span className="font-bold text-white">{MONTHS_SHORT[hoveredMonth]}</span>
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
              <span className="text-[10px] text-[#5a5a6e]">{JOURS_OUVRES[hoveredMonth]}j</span>
            </div>
          );
        })()}
      </div>
      <div className="flex items-end gap-1 h-36">
        {MONTHS_SHORT.map((m, i) => {
          const ca = projection.before[i];
          const caPct = (ca / maxMonthly) * 100;
          const resultat = ca - expenses;
          const resultatVal = Math.max(0, resultat);
          const resultatPct = (resultatVal / maxMonthly) * 100;
          const netRevenue = ca * netRate - expenses;
          const netVal = Math.max(0, ca * netRate);
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
                isHovered ? "text-white font-semibold" : "text-[#5a5a6e]"
              )}>{m}</span>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-3 pt-3 border-t border-white/[0.06] text-xs text-[#8b8b9e]">
        <span>Jours ouvrés : {JOURS_OUVRES.reduce((a, b) => a + b, 0)}/an &middot; ~{AVG_JOURS_OUVRES.toFixed(0)}/mois</span>
        <span>Taux net : {(netRate * 100).toFixed(0)}% &middot; Charges : {fmt(expenses)}&euro;/mois</span>
      </div>
    </div>
  );
}
