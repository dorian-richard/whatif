"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useProfileStore } from "@/stores/useProfileStore";
import { useSimulatorStore } from "@/stores/useSimulatorStore";
import { simulate, getClientBaseCA } from "@/lib/simulation-engine";
import { fmt } from "@/lib/utils";
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

  // Summary bar: recurring vs ponctual
  const recurringCA = profile.clients
    .filter((c) => c.billing === "tjm" || c.billing === "forfait")
    .reduce((s, c) => s + getClientBaseCA(c), 0);
  const ponctualCA = totalCA - recurringCA;
  const recurringPct = totalCA > 0 ? (recurringCA / totalCA) * 100 : 0;

  const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.07 } },
  } as const;
  const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
  };

  return (
    <motion.div className="space-y-5" variants={stagger} initial="hidden" animate="show">
      {/* Summary bar */}
      <motion.div variants={fadeUp} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
          <div className="text-center">
            <span className="text-gray-400 text-xs block">CA mensuel</span>
            <span className="font-bold text-gray-900">{fmt(totalCA)}&euro;</span>
          </div>
          <div className="w-px h-8 bg-gray-100" />
          <div className="text-center">
            <span className="text-gray-400 text-xs block">Recurrent</span>
            <span className="font-bold text-indigo-600">{recurringPct.toFixed(0)}%</span>
          </div>
          <div className="w-px h-8 bg-gray-100" />
          <div className="text-center">
            <span className="text-gray-400 text-xs block">Clients</span>
            <span className="font-bold text-gray-900">{profile.clients.length}</span>
          </div>
          <div className="w-px h-8 bg-gray-100" />
          <div className="text-center">
            <span className="text-gray-400 text-xs block">Stabilite</span>
            <span
              className={`font-bold ${
                recurringPct >= 60
                  ? "text-emerald-600"
                  : recurringPct >= 40
                    ? "text-amber-500"
                    : "text-red-500"
              }`}
            >
              {recurringPct >= 60 ? "Forte" : recurringPct >= 40 ? "Moyenne" : "Faible"}
            </span>
          </div>
        </div>
      </motion.div>

      <motion.div variants={fadeUp}><PresetScenarios /></motion.div>
      <motion.div variants={fadeUp}><SliderPanel /></motion.div>
      <motion.div variants={fadeUp}><Verdict projection={projection} sim={simParams} clients={profile.clients} /></motion.div>
      <motion.div variants={fadeUp}><ImpactCards projection={projection} /></motion.div>
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
