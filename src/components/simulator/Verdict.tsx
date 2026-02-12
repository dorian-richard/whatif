"use client";

import type { ProjectionResult, SimulationParams, ClientData } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { fmt } from "@/lib/utils";
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
    const base = `${sim.vacationWeeks} semaines de repos te coutent ${fmt(Math.abs(diff))}\u20AC sur l'annee — soit ${fmt(Math.abs(diff / sim.vacationWeeks))}\u20AC/semaine.`;
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
      `+${sim.rateChange}% de tarifs sur tes ${tjmCount} client(s) TJM generent ${diff >= 0 ? "+" : ""}${fmt(diff)}\u20AC/an.`
    );
  }

  if (sim.rateChange < 0) {
    messages.push(
      `Baisser tes tarifs de ${Math.abs(sim.rateChange)}% te coute ${fmt(Math.abs(diff))}\u20AC/an.`
    );
  }

  if (sim.lostClientIndex >= 0 && sim.lostClientIndex < clients.length) {
    const lost = clients[sim.lostClientIndex];
    messages.push(
      `Perdre ${lost.name} = ${fmt(Math.abs(diff))}\u20AC de manque a gagner annuel. Commence a prospecter maintenant.`
    );
  }

  if (sim.newClients > 0) {
    messages.push(
      `${sim.newClients} nouveau(x) client(s) ajoutent ~${fmt(Math.max(0, diff))}\u20AC/an apres montee en charge.`
    );
  }

  if (sim.workDaysPerWeek < 5) {
    const freedomDays = 5 - sim.workDaysPerWeek;
    messages.push(
      `Passer a ${sim.workDaysPerWeek}j/sem = ${freedomDays} jour(s) de liberte/sem, mais ${fmt(Math.abs(diff))}\u20AC de moins/an.`
    );
  }

  if (messages.length === 0) {
    messages.push("Ajuste les parametres pour voir l'impact de tes decisions.");
  }

  const statusIcon =
    pctDiff > 5 ? <CircleCheck className="size-7 text-emerald-500" /> :
    pctDiff > -5 ? <CircleMinus className="size-7 text-amber-500" /> :
    pctDiff > -15 ? <CircleAlert className="size-7 text-orange-500" /> :
    <CircleX className="size-7 text-red-500" />;

  const tone =
    pctDiff > 5
      ? "bg-emerald-50 border-emerald-200"
      : pctDiff > -5
        ? "bg-amber-50 border-amber-200"
        : "bg-red-50 border-red-200";

  const toneKey = pctDiff > 5 ? "positive" : pctDiff > -5 ? "neutral" : "negative";

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={toneKey}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.25 }}
        className={`rounded-2xl p-5 border ${tone}`}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5">{statusIcon}</div>
          <div>
            <h3 className="text-sm font-bold text-gray-800 mb-1">
              {pctDiff > 5
                ? "Ce scenario te profite"
                : pctDiff > -5
                  ? "Impact modere"
                  : "Attention, impact significatif"}
            </h3>
            {messages.map((m, i) => (
              <p key={i} className="text-sm text-gray-600 mb-1">
                &rarr; {m}
              </p>
            ))}
            <p className="text-xs text-gray-400 mt-2">
              Variation annuelle :{" "}
              <strong className={pctDiff >= 0 ? "text-emerald-600" : "text-red-600"}>
                {pctDiff >= 0 ? "+" : ""}
                {pctDiff.toFixed(1)}%
              </strong>{" "}
              soit{" "}
              <strong>
                {diff >= 0 ? "+" : ""}
                {fmt(diff)}&euro;
              </strong>
            </p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
