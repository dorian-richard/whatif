"use client";

import { useMemo, useState } from "react";
import { useProfileStore } from "@/stores/useProfileStore";
import { getAnnualCA } from "@/lib/simulation-engine";
import { BUSINESS_STATUS_CONFIG } from "@/lib/constants";
import { fmt, cn } from "@/lib/utils";
import type { BusinessStatus } from "@/types";
import { Banknote, TrendingUp, PiggyBank, Shield, HandCoins, Target, Check } from "@/components/ui/icons";
import { ProBlur } from "@/components/ProBlur";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  computeSurplus,
  projectWealth,
  computeAllStatusWealth,
  computeMilestones,
  RISK_PROFILES,
  INVESTMENT_VEHICLES,
  type RiskProfile,
} from "@/lib/patrimoine-engine";

/* ════════════════════════════════════════════════
   Constantes
   ════════════════════════════════════════════════ */

const STATUT_COLORS: Record<string, string> = {
  micro: "#F4BE7E",
  ei: "#f97316",
  eurl_ir: "#5682F2",
  eurl_is: "#a78bfa",
  sasu_ir: "#f87171",
  sasu_is: "#4ade80",
  portage: "#06b6d4",
};

const fmtShort = (v: number) =>
  v >= 1_000_000
    ? `${(v / 1_000_000).toFixed(1)}M`
    : v >= 1_000
      ? `${Math.round(v / 1_000)}k`
      : `${v}`;

const SLIDER_CLASS =
  "w-full accent-[#5682F2] h-2 bg-muted rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#5682F2] [&::-webkit-slider-thumb]:shadow-lg";

/* ════════════════════════════════════════════════
   Component
   ════════════════════════════════════════════════ */

export default function PatrimoinePage() {
  const {
    clients,
    monthlyExpenses,
    savings,
    businessStatus,
    remunerationType,
    mixtePartSalaire,
    age: profileAge,
    vacationDaysPerMonth,
  } = useProfileStore();

  const baseAnnualCA = useMemo(
    () => getAnnualCA(clients, vacationDaysPerMonth),
    [clients, vacationDaysPerMonth],
  );

  // Local state
  const [caOverride, setCaOverride] = useState<number | null>(null);
  const [investmentRate, setInvestmentRate] = useState(50);
  const [riskProfile, setRiskProfile] = useState<RiskProfile>("equilibre");
  const [horizon, setHorizon] = useState(20);

  const annualCA = caOverride ?? baseAnnualCA;
  const sliderMax = Math.max(300000, Math.ceil(baseAnnualCA / 50000) * 50000 + 50000);
  const annualReturn = RISK_PROFILES[riskProfile].rate;
  const age = profileAge ?? 35;

  // Profile object for computations
  const profile = useMemo(
    () => ({
      monthlyExpenses,
      savings,
      adminHoursPerWeek: 0,
      workDaysPerWeek: 5,
      businessStatus: businessStatus ?? ("micro" as const),
      remunerationType,
      mixtePartSalaire,
    }),
    [monthlyExpenses, savings, businessStatus, remunerationType, mixtePartSalaire],
  );

  // Current status surplus
  const currentSurplus = useMemo(
    () => computeSurplus(annualCA, profile),
    [annualCA, profile],
  );

  // Wealth projections for all 3 risk profiles
  const projections = useMemo(
    () => ({
      prudent: projectWealth(savings, currentSurplus.monthlySurplus, investmentRate / 100, 0.02, horizon),
      equilibre: projectWealth(savings, currentSurplus.monthlySurplus, investmentRate / 100, 0.05, horizon),
      dynamique: projectWealth(savings, currentSurplus.monthlySurplus, investmentRate / 100, 0.08, horizon),
    }),
    [savings, currentSurplus.monthlySurplus, investmentRate, horizon],
  );

  // Chart data
  const chartData = useMemo(
    () =>
      projections.equilibre.map((_, i) => ({
        year: `${i}`,
        Prudent: projections.prudent[i].capitalEnd,
        "\u00C9quilibr\u00E9": projections.equilibre[i].capitalEnd,
        Dynamique: projections.dynamique[i].capitalEnd,
      })),
    [projections],
  );

  // All-status comparison
  const statusComparison = useMemo(
    () => computeAllStatusWealth(annualCA, profile, savings, investmentRate / 100, annualReturn),
    [annualCA, profile, savings, investmentRate, annualReturn],
  );

  const currentStatusWealth = statusComparison.find((s) => s.status === profile.businessStatus);
  const bestStatus = statusComparison[0];

  // Milestones
  const milestones = useMemo(
    () =>
      computeMilestones(
        currentSurplus.monthlySurplus,
        investmentRate / 100,
        savings,
        monthlyExpenses,
        annualReturn,
      ),
    [currentSurplus.monthlySurplus, investmentRate, savings, monthlyExpenses, annualReturn],
  );

  // Independence age
  const independenceMilestone = milestones[3];
  const independenceAge =
    independenceMilestone?.monthsToReach != null
      ? age + Math.ceil(independenceMilestone.monthsToReach / 12)
      : null;

  // Key values for summary cards
  const wealth10 = projections[riskProfile][Math.min(10, horizon)]?.capitalEnd ?? 0;
  const wealth20 = horizon >= 20 ? (projections[riskProfile][20]?.capitalEnd ?? 0) : (projections[riskProfile][horizon]?.capitalEnd ?? 0);

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-1">Simulateur Patrimoine</h1>
        <p className="text-muted-foreground">
          Projette ta capacit&eacute; d&apos;&eacute;pargne et ton patrimoine selon ton statut. D&eacute;couvre quel statut maximise ta richesse &agrave; long terme.
        </p>
      </div>

      <ProBlur label="Le Simulateur Patrimoine est r&eacute;serv&eacute; au plan Pro">
        {/* ── Summary cards ── */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <Banknote className="size-4 text-[#4ade80]" />
              <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Surplus mensuel</span>
            </div>
            <div className={cn("text-xl font-bold", currentSurplus.monthlySurplus >= 0 ? "text-foreground" : "text-[#f87171]")}>
              {currentSurplus.monthlySurplus >= 0 ? fmt(currentSurplus.monthlySurplus) : `-${fmt(Math.abs(currentSurplus.monthlySurplus))}`}&nbsp;&euro;
            </div>
          </div>

          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="size-4 text-[#10b981]" />
              <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Patrimoine &agrave; 10 ans</span>
            </div>
            <div className="text-xl font-bold text-foreground">{fmt(wealth10)}&nbsp;&euro;</div>
          </div>

          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <PiggyBank className="size-4 text-[#a78bfa]" />
              <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Patrimoine &agrave; {horizon >= 20 ? 20 : horizon} ans</span>
            </div>
            <div className="text-xl font-bold text-foreground">{fmt(wealth20)}&nbsp;&euro;</div>
          </div>

          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="size-4 text-[#F4BE7E]" />
              <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Ind&eacute;pendance financi&egrave;re</span>
            </div>
            <div className="text-xl font-bold text-foreground">
              {independenceMilestone?.reached
                ? "Atteint \u2713"
                : independenceAge
                  ? `${independenceAge} ans`
                  : "Non atteignable"}
            </div>
          </div>
        </div>

        {/* ── Controls ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* CA */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <div className="text-xs text-muted-foreground/60 uppercase tracking-wider mb-1">CA annuel</div>
            <div className="text-2xl font-bold text-foreground mb-3">{fmt(annualCA)}&nbsp;&euro;</div>
            <input
              type="range"
              min={10000}
              max={sliderMax}
              step={1000}
              value={annualCA}
              onChange={(e) => setCaOverride(Number(e.target.value))}
              className={SLIDER_CLASS}
            />
            <div className="flex justify-between text-[10px] text-muted-foreground/60 mt-1">
              <span>10k</span><span>{fmtShort(sliderMax)}</span>
            </div>
          </div>

          {/* % investi */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <div className="text-xs text-muted-foreground/60 uppercase tracking-wider mb-1">Part investie du surplus</div>
            <div className="text-2xl font-bold text-[#10b981] mb-3">{investmentRate}%</div>
            <input
              type="range"
              min={10}
              max={90}
              step={5}
              value={investmentRate}
              onChange={(e) => setInvestmentRate(Number(e.target.value))}
              className="w-full accent-[#10b981] h-2 bg-muted rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#10b981] [&::-webkit-slider-thumb]:shadow-lg"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground/60 mt-1">
              <span>10%</span><span>90%</span>
            </div>
          </div>

          {/* Profil de risque */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <div className="text-xs text-muted-foreground/60 uppercase tracking-wider mb-1">Profil de risque</div>
            <div className="text-2xl font-bold mb-3" style={{ color: RISK_PROFILES[riskProfile].color }}>
              {RISK_PROFILES[riskProfile].rate * 100}%/an
            </div>
            <div className="flex gap-1.5">
              {(Object.keys(RISK_PROFILES) as RiskProfile[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setRiskProfile(key)}
                  className={cn(
                    "flex-1 text-[10px] font-semibold py-2 rounded-lg transition-all",
                    riskProfile === key
                      ? "text-white shadow-md"
                      : "bg-muted text-muted-foreground hover:bg-muted/80",
                  )}
                  style={riskProfile === key ? { backgroundColor: RISK_PROFILES[key].color } : undefined}
                >
                  {key === "prudent" ? "Prudent" : key === "equilibre" ? "\u00C9quilibr\u00E9" : "Dynamique"}
                </button>
              ))}
            </div>
          </div>

          {/* Horizon */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <div className="text-xs text-muted-foreground/60 uppercase tracking-wider mb-1">Horizon</div>
            <div className="text-2xl font-bold text-[#F4BE7E] mb-3">{horizon} ans</div>
            <input
              type="range"
              min={5}
              max={30}
              step={1}
              value={horizon}
              onChange={(e) => setHorizon(Number(e.target.value))}
              className="w-full accent-[#F4BE7E] h-2 bg-muted rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#F4BE7E] [&::-webkit-slider-thumb]:shadow-lg"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground/60 mt-1">
              <span>5 ans</span><span>30 ans</span>
            </div>
          </div>
        </div>

        {/* ── Wealth curve chart ── */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h2 className="text-sm font-semibold text-foreground mb-6">
            Projection patrimoine sur {horizon} ans
          </h2>
          <ResponsiveContainer width="100%" height={360}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradPrudent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5682F2" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#5682F2" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradEquilibre" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradDynamique" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F4BE7E" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#F4BE7E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="year"
                tick={{ fontSize: 10, fill: "#5a5a6e" }}
                tickLine={false}
                axisLine={{ stroke: "rgba(255,255,255,0.04)" }}
                label={{ value: "Ann\u00E9es", position: "insideBottomRight", offset: -5, fontSize: 10, fill: "#5a5a6e" }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#5a5a6e" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `${fmtShort(v)}\u20AC`}
                width={65}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  backgroundColor: "#1a1a26",
                  boxShadow: "0 8px 16px -4px rgba(0,0,0,0.4)",
                  fontSize: "12px",
                  padding: "12px",
                  color: "#fff",
                }}
                formatter={(value: number, name: string) => [`${fmt(value)} \u20AC`, name]}
                labelFormatter={(label) => `Ann\u00E9e ${label}`}
              />
              <Legend
                verticalAlign="top"
                height={36}
                iconType="circle"
                wrapperStyle={{ fontSize: "12px" }}
              />
              <Area
                type="monotone"
                dataKey="Prudent"
                stroke="#5682F2"
                fill="url(#gradPrudent)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey={"\u00C9quilibr\u00E9"}
                stroke="#10b981"
                fill="url(#gradEquilibre)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="Dynamique"
                stroke="#F4BE7E"
                fill="url(#gradDynamique)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* ── Key insight ── */}
        {bestStatus && currentStatusWealth && bestStatus.status !== profile.businessStatus && (
          <div className="flex items-center gap-4 bg-card rounded-2xl border border-border p-5">
            <div className="size-12 rounded-xl flex items-center justify-center bg-[#10b981]/15 shrink-0">
              <HandCoins className="size-6 text-[#10b981]" />
            </div>
            <div className="flex-1">
              <div className="text-xs text-muted-foreground/60 uppercase tracking-wider mb-1">Meilleur statut pour ton patrimoine</div>
              <div className="text-xl font-bold" style={{ color: bestStatus.color }}>
                {bestStatus.label}
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  +{fmt(bestStatus.wealth20y - currentStatusWealth.wealth20y)}&nbsp;&euro; sur 20 ans
                </span>
              </div>
              <div className="text-sm text-muted-foreground mt-0.5">
                Surplus de {fmt(bestStatus.monthlySurplus)}&nbsp;&euro;/mois vs {fmt(currentStatusWealth.monthlySurplus)}&nbsp;&euro;/mois en {currentStatusWealth.label}
              </div>
            </div>
          </div>
        )}

        {/* ── Status comparison table (desktop) ── */}
        <div className="hidden md:block bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Comparaison par statut</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground/60 uppercase tracking-wider">
                <th className="text-left px-5 py-3 font-medium">Statut</th>
                <th className="text-right px-5 py-3 font-medium">Net annuel</th>
                <th className="text-right px-5 py-3 font-medium">Surplus/mois</th>
                <th className="text-right px-5 py-3 font-medium">Patrimoine 10 ans</th>
                <th className="text-right px-5 py-3 font-medium">Patrimoine 20 ans</th>
              </tr>
            </thead>
            <tbody>
              {statusComparison.map((s, i) => {
                const isCurrent = s.status === profile.businessStatus;
                const isBest = i === 0;
                return (
                  <tr
                    key={s.status}
                    className={cn(
                      "border-b border-border last:border-0 transition-colors",
                      isCurrent && "bg-primary/5",
                    )}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                        <span className="font-medium text-foreground">{s.label}</span>
                        {isCurrent && (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary">Actuel</span>
                        )}
                        {isBest && (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ backgroundColor: `${s.color}20`, color: s.color }}>
                            Meilleur
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="text-right px-5 py-3 font-medium text-foreground">{fmt(s.annualNet)}&nbsp;&euro;</td>
                    <td className={cn("text-right px-5 py-3 font-medium", s.monthlySurplus >= 0 ? "text-[#4ade80]" : "text-[#f87171]")}>
                      {s.monthlySurplus >= 0 ? fmt(s.monthlySurplus) : `-${fmt(Math.abs(s.monthlySurplus))}`}&nbsp;&euro;
                    </td>
                    <td className="text-right px-5 py-3 font-medium text-foreground">{fmt(s.wealth10y)}&nbsp;&euro;</td>
                    <td className="text-right px-5 py-3 font-bold" style={{ color: s.color }}>{fmt(s.wealth20y)}&nbsp;&euro;</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Status comparison cards (mobile) ── */}
        <div className="md:hidden space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Comparaison par statut</h2>
          {statusComparison.map((s, i) => {
            const isCurrent = s.status === profile.businessStatus;
            const isBest = i === 0;
            return (
              <div
                key={s.status}
                className={cn(
                  "bg-card rounded-2xl border p-4",
                  isCurrent ? "border-primary/30" : "border-border",
                )}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="size-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="font-medium text-foreground text-sm">{s.label}</span>
                  {isCurrent && (
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary">Actuel</span>
                  )}
                  {isBest && (
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ backgroundColor: `${s.color}20`, color: s.color }}>
                      Meilleur
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Surplus/mois</div>
                    <div className={cn("font-bold", s.monthlySurplus >= 0 ? "text-[#4ade80]" : "text-[#f87171]")}>
                      {s.monthlySurplus >= 0 ? fmt(s.monthlySurplus) : `-${fmt(Math.abs(s.monthlySurplus))}`}&nbsp;&euro;
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Net annuel</div>
                    <div className="font-bold text-foreground">{fmt(s.annualNet)}&nbsp;&euro;</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Patrimoine 10 ans</div>
                    <div className="font-bold text-foreground">{fmt(s.wealth10y)}&nbsp;&euro;</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Patrimoine 20 ans</div>
                    <div className="font-bold" style={{ color: s.color }}>{fmt(s.wealth20y)}&nbsp;&euro;</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Milestones ── */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center gap-2 mb-5">
            <Target className="size-5 text-[#F4BE7E]" />
            <h2 className="text-sm font-bold text-foreground">Objectifs patrimoniaux</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {milestones.map((m) => {
              const pct = m.reached
                ? 100
                : m.monthsToReach != null
                  ? Math.min(100, Math.round((savings / m.targetAmount) * 100))
                  : 0;

              return (
                <div key={m.label} className="p-4 bg-muted/30 rounded-xl border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">{m.label}</span>
                    <span className="text-xs text-muted-foreground">{fmt(m.targetAmount)}&nbsp;&euro;</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: m.reached ? "#4ade80" : m.monthsToReach != null ? "#5682F2" : "#5a5a6e",
                      }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground/60">
                    {m.reached ? (
                      <span className="flex items-center gap-1 text-[#4ade80]"><Check className="size-3" /> D&eacute;j&agrave; atteint</span>
                    ) : m.monthsToReach != null ? (
                      m.monthsToReach < 12
                        ? `${m.monthsToReach} mois`
                        : `${Math.floor(m.monthsToReach / 12)} ans ${m.monthsToReach % 12 > 0 ? `${m.monthsToReach % 12} mois` : ""}`
                    ) : (
                      "Non atteignable avec les param\u00E8tres actuels"
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Investment vehicles ── */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <HandCoins className="size-5 text-[#a78bfa]" />
            <h2 className="text-sm font-bold text-foreground">V&eacute;hicules d&apos;investissement par statut</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {INVESTMENT_VEHICLES.map((cat) => {
              const isCurrent = cat.statuses.includes(profile.businessStatus);
              return (
                <div
                  key={cat.category}
                  className={cn(
                    "bg-card rounded-2xl border p-5",
                    isCurrent ? "border-primary/30 ring-1 ring-primary/20" : "border-border",
                  )}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="size-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="text-sm font-semibold text-foreground">{cat.category}</span>
                    {isCurrent && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary">Ton statut</span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {cat.vehicles.map((v) => (
                      <div key={v.name} className="flex items-start gap-2">
                        <div className="size-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: cat.color }} />
                        <div>
                          <span className="text-sm font-medium text-foreground">{v.name}</span>
                          <span className="text-xs text-muted-foreground ml-1.5">&mdash; {v.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Disclaimer ── */}
        <div className="text-center text-xs text-muted-foreground/60 pb-8">
          Simulation indicative bas&eacute;e sur des rendements moyens historiques. Les march&eacute;s financiers comportent des risques
          de perte en capital. Les v&eacute;hicules d&apos;investissement mentionn&eacute;s ne constituent pas un conseil financier.
          Consulte un conseiller en gestion de patrimoine pour un accompagnement personnalis&eacute;.
        </div>
      </ProBlur>
    </div>
  );
}
