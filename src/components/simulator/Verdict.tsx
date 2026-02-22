"use client";

import type { ProjectionResult, SimulationParams, ClientData } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { fmt, cn } from "@/lib/utils";
import { getClientBaseCA } from "@/lib/simulation-engine";
import { CircleCheck, CircleMinus, CircleAlert, CircleX } from "@/components/ui/icons";

interface VerdictProps {
  projection: ProjectionResult;
  sim: SimulationParams;
  clients: ClientData[];
}

export function Verdict({ projection, sim, clients }: VerdictProps) {
  const beforeAnnual = projection.before.reduce((a, b) => a + b, 0);
  const afterAnnual = projection.after.reduce((a, b) => a + b, 0);
  const diff = afterAnnual - beforeAnnual;
  const pctDiff = beforeAnnual > 0 ? (diff / beforeAnnual) * 100 : 0;

  const forfaitClients = clients.filter((c) => c.billing === "forfait");
  const forfaitCA = forfaitClients.reduce((s, c) => s + getClientBaseCA(c), 0);

  const messages: string[] = [];

  if (sim.vacationWeeks > 0) {
    const base = `${sim.vacationWeeks} semaines de repos te coûtent ${fmt(Math.abs(diff))}\u20AC sur l'année — soit ${fmt(Math.abs(diff / sim.vacationWeeks))}\u20AC/semaine.`;
    if (forfaitClients.length > 0) {
      messages.push(
        `${base} Mais tes ${forfaitClients.length} forfait(s) (${fmt(forfaitCA)}\u20AC/mois) continuent de tourner.`
      );
    } else {
      messages.push(base);
    }
  }

  if (sim.rateChange > 0) {
    const tjmCount = clients.filter((c) => c.billing === "tjm").length;
    messages.push(
      `+${sim.rateChange}% de tarifs sur tes ${tjmCount} client(s) TJM génèrent ${diff >= 0 ? "+" : ""}${fmt(diff)}\u20AC/an.`
    );
  }

  if (sim.rateChange < 0) {
    messages.push(
      `Baisser tes tarifs de ${Math.abs(sim.rateChange)}% te coûte ${fmt(Math.abs(diff))}\u20AC/an.`
    );
  }

  if (sim.lostClientIndex >= 0 && sim.lostClientIndex < clients.length) {
    const lost = clients[sim.lostClientIndex];
    messages.push(
      `Perdre ${lost.name} = ${fmt(Math.abs(diff))}\u20AC de manque à gagner annuel. Commence à prospecter maintenant.`
    );
  }

  if (sim.newClients > 0) {
    messages.push(
      `${sim.newClients} nouveau(x) client(s) ajoutent ~${fmt(Math.max(0, diff))}\u20AC/an après montée en charge.`
    );
  }

  if (sim.workDaysPerWeek < 5) {
    const freedomDays = 5 - sim.workDaysPerWeek;
    messages.push(
      `Passer à ${sim.workDaysPerWeek}j/sem = ${freedomDays} jour(s) de liberté/sem, mais ${fmt(Math.abs(diff))}\u20AC de moins/an.`
    );
  }

  if (sim.expenseChange !== 0) {
    const sign = sim.expenseChange > 0 ? "+" : "";
    messages.push(
      `${sign}${fmt(sim.expenseChange)}\u20AC/mois de charges = ${sign}${fmt(sim.expenseChange * 12)}\u20AC/an sur ton budget.`
    );
  }

  if (messages.length === 0) {
    messages.push("Ajuste les paramètres pour voir l'impact de tes décisions.");
  }

  const statusIcon =
    pctDiff > 5 ? <CircleCheck className="size-7 text-[#4ade80]" /> :
    pctDiff > -5 ? <CircleMinus className="size-7 text-[#fbbf24]" /> :
    pctDiff > -15 ? <CircleAlert className="size-7 text-[#fbbf24]" /> :
    <CircleX className="size-7 text-[#f87171]" />;

  const toneKey = pctDiff > 5 ? "positive" : pctDiff > -5 ? "neutral" : "negative";

  const toneStyles = {
    positive: "bg-[#4ade80]/8 border-[#4ade80]/20",
    neutral: "bg-[#fbbf24]/8 border-[#fbbf24]/20",
    negative: "bg-[#f87171]/8 border-[#f87171]/20",
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={toneKey}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.25 }}
        className={cn("rounded-2xl p-5 border", toneStyles[toneKey])}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 shrink-0">{statusIcon}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-sm font-bold text-foreground">
                {pctDiff > 5
                  ? "Positif"
                  : pctDiff > -5
                    ? "Neutre"
                    : "Attention"}
              </h3>
              <span className={cn(
                "text-xs font-bold px-2 py-0.5 rounded-full shrink-0",
                pctDiff >= 0
                  ? "bg-[#4ade80]/12 text-[#4ade80]"
                  : "bg-[#f87171]/12 text-[#f87171]"
              )}>
                {pctDiff >= 0 ? "+" : ""}{pctDiff.toFixed(1)}%
              </span>
            </div>
            <div className="space-y-1.5">
              {messages.map((m, i) => (
                <p key={i} className="text-sm text-muted-foreground leading-relaxed">
                  <span className="text-muted-foreground/60 mr-1">&rarr;</span> {m}
                </p>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-border flex items-center gap-4 text-xs text-muted-foreground/60">
              <span>
                Variation :{" "}
                <strong className={pctDiff >= 0 ? "text-[#4ade80]" : "text-[#f87171]"}>
                  {diff >= 0 ? "+" : ""}{fmt(diff)}&euro;/an
                </strong>
              </span>
              <span>
                Mensuel :{" "}
                <strong className={pctDiff >= 0 ? "text-[#4ade80]" : "text-[#f87171]"}>
                  {diff >= 0 ? "+" : ""}{fmt(diff / 12)}&euro;/mois
                </strong>
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
