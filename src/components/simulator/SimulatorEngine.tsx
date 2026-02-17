"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useProfileStore } from "@/stores/useProfileStore";
import { useSimulatorStore } from "@/stores/useSimulatorStore";
import { simulate, getClientBaseCA, computeNetFromCA } from "@/lib/simulation-engine";
import { BUSINESS_STATUS_CONFIG } from "@/lib/constants";
import { fmt, cn } from "@/lib/utils";
import { Users, RefreshCw, Wallet, BarChart3, Banknote, HandCoins } from "@/components/ui/icons";
import { PresetScenarios } from "./PresetScenarios";
import { SliderPanel } from "./SliderPanel";
import { Verdict } from "./Verdict";
import { ImpactCards } from "./ImpactCards";
import { RevenueTimeline } from "./RevenueTimeline";
import { ClientComposition } from "./ClientComposition";
import { EmotionalMetrics } from "./EmotionalMetrics";
import { MonthlyBreakdown } from "./MonthlyBreakdown";

export function SimulatorEngine() {
  const profile = useProfileStore();
  const sim = useSimulatorStore();

  const totalCA = profile.clients.reduce((s, c) => s + getClientBaseCA(c), 0);

  const simParams = useMemo(
    () => ({
      vacationWeeks: sim.vacationWeeks,
      rateChange: sim.rateChange,
      rateChangeAfter: sim.rateChangeAfter,
      lostClientIndex: sim.lostClientIndex,
      newClients: sim.newClients,
      workDaysPerWeek: sim.workDaysPerWeek,
      expenseChange: sim.expenseChange,
    }),
    [
      sim.vacationWeeks,
      sim.rateChange,
      sim.rateChangeAfter,
      sim.lostClientIndex,
      sim.newClients,
      sim.workDaysPerWeek,
      sim.expenseChange,
    ]
  );

  const projection = useMemo(
    () => simulate(profile.clients, simParams, profile),
    [profile.clients, simParams, profile]
  );

  const recurringCA = profile.clients
    .filter((c) => c.billing === "tjm" || c.billing === "forfait")
    .reduce((s, c) => s + getClientBaseCA(c), 0);
  const recurringPct = totalCA > 0 ? (recurringCA / totalCA) * 100 : 0;

  const afterAnnual = projection.after.reduce((a, b) => a + b, 0);
  const beforeAnnual = projection.before.reduce((a, b) => a + b, 0);
  const annualDiff = afterAnnual - beforeAnnual;
  const annualPctDiff = beforeAnnual > 0 ? (annualDiff / beforeAnnual) * 100 : 0;

  const netAfterBefore = computeNetFromCA(beforeAnnual, profile);
  const netAfterAfter = computeNetFromCA(afterAnnual, profile);
  const expenses = profile.monthlyExpenses + sim.expenseChange;
  const netMonthlyBefore = netAfterBefore / 12 - profile.monthlyExpenses;
  const netMonthlyAfter = netAfterAfter / 12 - expenses;
  const statusConfig = BUSINESS_STATUS_CONFIG[profile.businessStatus ?? "micro"];
  const monthlySalary = profile.monthlySalary ?? 0;

  const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.06 } },
  } as const;
  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const } },
  };

  return (
    <motion.div className="space-y-5" variants={stagger} initial="hidden" animate="show">
      {/* Hero summary */}
      <motion.div variants={fadeUp} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#5682F2] via-[#4A6DE5] to-[#7C5BF2] p-6 shadow-xl shadow-[#5682F2]/10">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDE0djEyaDEyVjE0em0tMiAwSDIydjEyaDEyVjE0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-white/60 text-xs font-medium uppercase tracking-widest mb-1">
              Projection annuelle
            </p>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-white tracking-tight">
                {fmt(afterAnnual)}
              </span>
              <span className="text-lg text-white/60">&euro;/an</span>
              {Math.abs(annualDiff) > 0.5 && (
                <span className={cn(
                  "text-sm font-bold px-2 py-0.5 rounded-full",
                  annualPctDiff >= 0
                    ? "bg-[#4ade80]/20 text-[#4ade80]"
                    : "bg-[#f87171]/20 text-[#f87171]"
                )}>
                  {annualPctDiff >= 0 ? "+" : ""}{annualPctDiff.toFixed(1)}%
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1.5">
                <Banknote className="size-4 text-[#4ade80]" />
                <span className="text-sm text-[#4ade80] font-semibold">
                  Net : {fmt(Math.round(netMonthlyAfter))}&euro;/mois
                </span>
              </div>
              {Math.abs(netMonthlyAfter - netMonthlyBefore) > 1 && (
                <span className={cn(
                  "text-xs font-bold px-2 py-0.5 rounded-full",
                  netMonthlyAfter >= netMonthlyBefore
                    ? "bg-[#4ade80]/20 text-[#4ade80]"
                    : "bg-[#f87171]/20 text-[#f87171]"
                )}>
                  {netMonthlyAfter >= netMonthlyBefore ? "+" : ""}{fmt(Math.round(netMonthlyAfter - netMonthlyBefore))}&euro;
                </span>
              )}
              <span className="text-[10px] text-white/30">{statusConfig.label}</span>
            </div>
          </div>
          <div className="flex gap-5">
            {[
              { icon: <Wallet className="size-4" />, label: "CA mensuel", value: `${fmt(totalCA)}\u20AC` },
              { icon: <Banknote className="size-4" />, label: "Net mensuel", value: `${fmt(Math.round(netMonthlyAfter))}\u20AC` },
              { icon: <Users className="size-4" />, label: "Clients", value: String(profile.clients.length) },
              ...(monthlySalary > 0 ? [{
                icon: <HandCoins className="size-4" />,
                label: "Salaire",
                value: `${fmt(monthlySalary)}\u20AC`,
              }] : [{
                icon: <RefreshCw className="size-4" />,
                label: "Récurrent",
                value: `${recurringPct.toFixed(0)}%`,
              }]),
            ].map((item) => (
              <div key={item.label} className="text-center">
                <div className="flex justify-center text-white/60 mb-0.5">{item.icon}</div>
                <p className="text-[10px] text-white/60 uppercase tracking-wide">{item.label}</p>
                <p className="text-sm font-bold text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.div variants={fadeUp}><PresetScenarios /></motion.div>
      <motion.div variants={fadeUp}><SliderPanel /></motion.div>
      <motion.div variants={fadeUp}><Verdict projection={projection} sim={simParams} clients={profile.clients} /></motion.div>
      <motion.div variants={fadeUp}><ImpactCards projection={projection} profile={profile} sim={simParams} /></motion.div>
      <motion.div variants={fadeUp}><RevenueTimeline projection={projection} /></motion.div>
      <motion.div variants={fadeUp}><ClientComposition clients={profile.clients} lostClientIndex={sim.lostClientIndex} /></motion.div>
      <motion.div variants={fadeUp}>
        <EmotionalMetrics
          projection={projection}
          profile={profile}
          sim={simParams}
          clients={profile.clients}
        />
      </motion.div>
      <motion.div variants={fadeUp}>
        <MonthlyBreakdown
          projection={projection}
          clients={profile.clients}
          profile={profile}
          sim={simParams}
        />
      </motion.div>
    </motion.div>
  );
}
