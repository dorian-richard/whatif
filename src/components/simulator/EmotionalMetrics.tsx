"use client";

import type { ReactNode } from "react";
import type { ProjectionResult, FreelanceProfile, SimulationParams, ClientData } from "@/types";
import { cn, fmt } from "@/lib/utils";
import { getClientBaseCA, computeNetFromCA } from "@/lib/simulation-engine";
import { BUSINESS_STATUS_CONFIG } from "@/lib/constants";
import {
  CalendarDays,
  Wallet,
  LifeBuoy,
  RefreshCw,
  Users,
  BadgePercent,
  Timer,
  Shield,
  Banknote,
  HandCoins,
} from "@/components/ui/icons";

type Verdict = "bon" | "ok" | "attention" | "risque";

interface MetricItem {
  icon: ReactNode;
  label: string;
  explanation: string;
  before: number;
  after: number;
  unit: string;
  reverse: boolean;
  verdict: Verdict;
  maxValue?: number;
  group: "finances" | "securite" | "temps";
}

const VERDICT_CONFIG: Record<Verdict, { label: string; color: string; bg: string; border: string }> = {
  bon: { label: "Bon", color: "text-[#4ade80]", bg: "bg-[#4ade80]/12", border: "border-[#4ade80]/20" },
  ok: { label: "OK", color: "text-[#5682F2]", bg: "bg-[#5682F2]/12", border: "border-[#5682F2]/20" },
  attention: { label: "Attention", color: "text-[#fbbf24]", bg: "bg-[#fbbf24]/12", border: "border-[#fbbf24]/20" },
  risque: { label: "Risque", color: "text-[#f87171]", bg: "bg-[#f87171]/12", border: "border-[#f87171]/20" },
};

const GROUP_CONFIG = {
  finances: { label: "Finances", color: "text-[#4ade80]" },
  securite: { label: "Sécurité & risques", color: "text-[#fbbf24]" },
  temps: { label: "Temps & capacité", color: "text-[#5682F2]" },
} as const;

function ProgressRing({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  return (
    <svg className="size-11 -rotate-90" viewBox="0 0 44 44">
      <circle cx="22" cy="22" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
      <circle
        cx="22" cy="22" r={radius} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round"
        strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
        className="transition-all duration-500 ease-out"
      />
    </svg>
  );
}

interface EmotionalMetricsProps {
  projection: ProjectionResult;
  profile: FreelanceProfile;
  sim: SimulationParams;
  clients: ClientData[];
}

export function EmotionalMetrics({ projection, profile, sim, clients }: EmotionalMetricsProps) {
  const afterAnnual = projection.after.reduce((a, b) => a + b, 0);
  const beforeAnnual = projection.before.reduce((a, b) => a + b, 0);

  const freedomDaysBefore = (5 - profile.workDaysPerWeek) * 52;
  const freedomDaysAfter = (5 - sim.workDaysPerWeek) * 52 + sim.vacationWeeks * 5;

  const expenses = profile.monthlyExpenses + sim.expenseChange;
  const savingsEndBefore = profile.savings + beforeAnnual - profile.monthlyExpenses * 12;
  const savingsEndAfter = profile.savings + afterAnnual - expenses * 12;

  const runwayBefore =
    profile.monthlyExpenses > 0 ? profile.savings / profile.monthlyExpenses : 99;
  const runwayAfter = expenses > 0 ? profile.savings / expenses : 99;

  const recurringCA = clients
    .filter((c) => c.billing === "tjm" || c.billing === "forfait")
    .reduce((s, c) => s + getClientBaseCA(c), 0);
  const totalBaseCA = clients.reduce((s, c) => s + getClientBaseCA(c), 0);
  const recurringPct = totalBaseCA > 0 ? (recurringCA / totalBaseCA) * 100 : 0;

  const clientCAs = clients.map((c) => getClientBaseCA(c));
  const maxClientCA = Math.max(...clientCAs, 0);
  const dependencyPct = totalBaseCA > 0 ? (maxClientCA / totalBaseCA) * 100 : 0;

  const statusConfig = BUSINESS_STATUS_CONFIG[profile.businessStatus ?? "micro"];
  const urssafRate = profile.customUrssafRate ?? statusConfig.urssaf;

  const netBefore = computeNetFromCA(beforeAnnual, profile);
  const netAfter = computeNetFromCA(afterAnnual, profile);
  const totalChargesBefore = beforeAnnual - netBefore;
  const totalChargesAfter = afterAnnual - netAfter;
  const chargesRateAfter = afterAnnual > 0 ? (totalChargesAfter / afterAnnual) * 100 : 0;
  const netMonthlyBefore = netBefore / 12 - profile.monthlyExpenses;
  const netMonthlyAfter = netAfter / 12 - expenses;

  const monthlySalary = profile.monthlySalary ?? 0;

  const workingDaysBefore = profile.workDaysPerWeek * 52;
  const workingDaysAfter = sim.workDaysPerWeek * (52 - sim.vacationWeeks);

  const utilizationBefore = workingDaysBefore > 0 ? Math.min(100, (workingDaysBefore / (5 * 52)) * 100) : 0;
  const utilizationAfter = workingDaysAfter > 0 ? Math.min(100, (workingDaysAfter / (5 * 52)) * 100) : 0;

  const metrics: MetricItem[] = [
    {
      icon: <Banknote className="size-5 text-[#4ade80]" />,
      label: "Revenu net mensuel",
      explanation: `Ce qu'il vous reste chaque mois après impôts (${(urssafRate * 100).toFixed(0)}% URSSAF + IR) et charges fixes (${fmt(expenses)}\u20AC)`,
      before: Math.round(netMonthlyBefore),
      after: Math.round(netMonthlyAfter),
      unit: "\u20AC",
      reverse: false,
      verdict: netMonthlyAfter > 3000 ? "bon" : netMonthlyAfter > 1500 ? "ok" : netMonthlyAfter > 0 ? "attention" : "risque",
      group: "finances",
    },
    ...(monthlySalary > 0 ? [{
      icon: <HandCoins className="size-5 text-[#a78bfa]" />,
      label: "Reste après rémunération",
      explanation: `Après vous être versé ${fmt(monthlySalary)}\u20AC/mois de salaire, il reste ce montant en trésorerie d'entreprise`,
      before: Math.round(netMonthlyBefore - monthlySalary),
      after: Math.round(netMonthlyAfter - monthlySalary),
      unit: "\u20AC" as string,
      reverse: false,
      verdict: (netMonthlyAfter - monthlySalary) > 500 ? "bon" as Verdict : (netMonthlyAfter - monthlySalary) > 0 ? "ok" as Verdict : "risque" as Verdict,
      group: "finances" as const,
    }] as MetricItem[] : []),
    {
      icon: <BadgePercent className="size-5 text-[#F4BE7E]" />,
      label: "Charges & prélèvements",
      explanation: `Total annuel des prélèvements (URSSAF${statusConfig.is > 0 ? `, IS${profile.remunerationType === "dividendes" || profile.remunerationType === "mixte" ? ", PFU/charges dividendes" : ""}` : ""}, IR). Taux effectif : ${chargesRateAfter.toFixed(0)}% (${statusConfig.label})`,
      before: Math.round(totalChargesBefore),
      after: Math.round(totalChargesAfter),
      unit: "\u20AC",
      reverse: true,
      verdict: chargesRateAfter < 40 ? "bon" : chargesRateAfter < 55 ? "ok" : "attention",
      group: "finances",
    },
    {
      icon: <Wallet className="size-5 text-[#5682F2]" />,
      label: "Trésorerie fin d'année",
      explanation: "Solde prévu au 31 décembre : épargne actuelle + revenus nets - charges annuelles",
      before: Math.round(savingsEndBefore),
      after: Math.round(savingsEndAfter),
      unit: "\u20AC",
      reverse: false,
      verdict: savingsEndAfter > expenses * 6 ? "bon" : savingsEndAfter > expenses * 3 ? "ok" : savingsEndAfter > 0 ? "attention" : "risque",
      group: "securite",
    },
    {
      icon: <LifeBuoy className="size-5 text-[#5682F2]" />,
      label: "Matelas de sécurité",
      explanation: "Combien de mois vous pouvez tenir sans aucun revenu, avec votre trésorerie actuelle",
      before: parseFloat(runwayBefore.toFixed(1)),
      after: parseFloat(runwayAfter.toFixed(1)),
      unit: " mois",
      reverse: false,
      maxValue: 24,
      verdict: runwayAfter >= 6 ? "bon" : runwayAfter >= 3 ? "ok" : runwayAfter >= 1 ? "attention" : "risque",
      group: "securite",
    },
    {
      icon: <RefreshCw className="size-5 text-[#5682F2]" />,
      label: "Revenu prévisible",
      explanation: "Part du CA qui revient chaque mois (TJM réguliers + forfaits). Plus c'est haut, plus vos revenus sont stables",
      before: Math.round(recurringPct),
      after: Math.round(recurringPct),
      unit: "%",
      reverse: false,
      maxValue: 100,
      verdict: recurringPct >= 70 ? "bon" : recurringPct >= 40 ? "ok" : "attention",
      group: "securite",
    },
    {
      icon: <Users className="size-5 text-[#fbbf24]" />,
      label: "Dépendance client",
      explanation: "Part de votre CA que représente votre plus gros client. Au-dessus de 50%, la perte de ce client serait critique",
      before: Math.round(dependencyPct),
      after: Math.round(dependencyPct),
      unit: "%",
      reverse: true,
      maxValue: 100,
      verdict: dependencyPct <= 30 ? "bon" : dependencyPct <= 50 ? "ok" : dependencyPct <= 70 ? "attention" : "risque",
      group: "securite",
    },
    {
      icon: <CalendarDays className="size-5 text-[#5682F2]" />,
      label: "Jours libres",
      explanation: "Jours non travaillés dans l'année : week-ends supplémentaires + vacances. Plus de temps pour vous",
      before: freedomDaysBefore,
      after: freedomDaysAfter,
      unit: "j",
      reverse: false,
      maxValue: 120,
      verdict: freedomDaysAfter >= 40 ? "bon" : freedomDaysAfter >= 15 ? "ok" : "attention",
      group: "temps",
    },
    {
      icon: <Timer className="size-5 text-[#4ade80]" />,
      label: "Jours facturés",
      explanation: "Nombre total de jours travaillés et facturés sur l'année. Attention au risque de surcharge",
      before: workingDaysBefore,
      after: workingDaysAfter,
      unit: "j",
      reverse: true,
      maxValue: 260,
      verdict: workingDaysAfter <= 220 ? "bon" : workingDaysAfter <= 240 ? "ok" : "attention",
      group: "temps",
    },
    {
      icon: <Shield className="size-5 text-[#a78bfa]" />,
      label: "Taux d'occupation",
      explanation: "Pourcentage du temps disponible (lun-ven) effectivement facturé. 100% = aucune marge pour l'imprévu",
      before: Math.round(utilizationBefore),
      after: Math.round(utilizationAfter),
      unit: "%",
      reverse: false,
      maxValue: 100,
      verdict: utilizationAfter <= 80 ? "bon" : utilizationAfter <= 90 ? "ok" : "attention",
      group: "temps",
    },
  ];

  const groups = (["finances", "securite", "temps"] as const).map((g) => ({
    key: g,
    ...GROUP_CONFIG[g],
    items: metrics.filter((m) => m.group === g),
  }));

  return (
    <div className="bg-[#12121c] rounded-2xl p-6 border border-white/[0.06]">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-white">Impact du scénario</h3>
        <span className="text-[10px] text-[#5a5a6e] uppercase tracking-wider">{metrics.length} indicateurs</span>
      </div>
      <p className="text-[11px] text-[#5a5a6e] mb-5">
        Comparaison avant / après votre scénario. Les badges indiquent la santé de chaque indicateur.
      </p>

      <div className="space-y-6">
        {groups.map((group) => (
          <div key={group.key}>
            <h4 className={cn("text-xs font-bold uppercase tracking-wider mb-3", group.color)}>
              {group.label}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {group.items.map((m, i) => {
                const diff = m.after - m.before;
                const isPositive = m.reverse ? diff < 0 : diff > 0;
                const isNeutral = Math.abs(diff) < 0.5;
                const vc = VERDICT_CONFIG[m.verdict];
                const ringColor = vc.color === "text-[#4ade80]" ? "#4ade80"
                  : vc.color === "text-[#5682F2]" ? "#5682F2"
                    : vc.color === "text-[#fbbf24]" ? "#fbbf24"
                      : "#f87171";

                return (
                  <div
                    key={i}
                    className={cn(
                      "relative p-4 rounded-xl border transition-all duration-200",
                      vc.bg, vc.border, "hover:brightness-110"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {m.maxValue ? (
                        <div className="relative shrink-0">
                          <ProgressRing value={Math.abs(m.after)} max={m.maxValue} color={ringColor} />
                          <div className="absolute inset-0 flex items-center justify-center">{m.icon}</div>
                        </div>
                      ) : (
                        <div className="size-11 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0">
                          {m.icon}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-xs font-semibold text-white truncate">{m.label}</p>
                          <span className={cn(
                            "text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0",
                            vc.color, vc.bg
                          )}>
                            {vc.label}
                          </span>
                        </div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-lg font-bold text-white tracking-tight">
                            {Math.abs(m.after) > 999 ? fmt(m.after) : m.after}
                            <span className="text-xs font-normal text-[#5a5a6e] ml-0.5">{m.unit}</span>
                          </span>
                          {!isNeutral && (
                            <span className={cn(
                              "text-[11px] font-bold px-1.5 py-0.5 rounded-full",
                              isPositive ? "bg-[#4ade80]/12 text-[#4ade80]" : "bg-[#f87171]/12 text-[#f87171]"
                            )}>
                              {diff > 0 ? "+" : ""}
                              {Math.abs(diff) > 999 ? fmt(diff) : diff.toFixed(1)}
                              {m.unit}
                            </span>
                          )}
                        </div>
                        {!isNeutral && (
                          <p className="text-[10px] text-[#5a5a6e] mt-0.5">
                            Avant : {Math.abs(m.before) > 999 ? fmt(m.before) : m.before}{m.unit}
                          </p>
                        )}
                      </div>
                    </div>
                    <p className="text-[10px] text-[#8b8b9e]/60 mt-2 leading-relaxed">{m.explanation}</p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
