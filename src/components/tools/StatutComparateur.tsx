"use client";

import { useMemo, useState } from "react";
import { computeNetFromCA } from "@/lib/simulation-engine";
import { BUSINESS_STATUS_CONFIG, MICRO_PLAFOND } from "@/lib/constants";
import { fmt } from "@/lib/utils";
import type { BusinessStatus, RemunerationType, FreelanceProfile } from "@/types";
import { ToolCTA } from "./ToolCTA";

const STATUT_COLORS: Record<string, string> = {
  micro: "#F4BE7E", ei: "#94a3b8", eurl_ir: "#5682F2", eurl_is: "#a78bfa",
  sasu_ir: "#f87171", sasu_is: "#4ade80", portage: "#06b6d4",
};

function buildProfile(status: BusinessStatus, remType: RemunerationType, mixte: number): FreelanceProfile {
  return {
    monthlyExpenses: 0, savings: 0, adminHoursPerWeek: 0, workDaysPerWeek: 5,
    businessStatus: status, remunerationType: remType, mixtePartSalaire: mixte, nbParts: 1,
  };
}

export function StatutComparateur({
  statuses = ["micro", "ei", "eurl_ir", "eurl_is", "sasu_ir", "sasu_is", "portage"],
}: { statuses?: BusinessStatus[] }) {
  const [tjm, setTjm] = useState(500);
  const [jours, setJours] = useState(18);
  const [remType, setRemType] = useState<RemunerationType>("salaire");

  const annualCA = tjm * jours * 12;

  const results = useMemo(() => {
    const rows = statuses.map((s) => {
      const isFlexible = BUSINESS_STATUS_CONFIG[s].is > 0 || s === "sasu_ir";
      const net = computeNetFromCA(annualCA, buildProfile(s, isFlexible ? remType : "salaire", 50));
      return {
        status: s,
        label: BUSINESS_STATUS_CONFIG[s].label,
        color: STATUT_COLORS[s] ?? "#5682F2",
        net,
        netMois: net / 12,
        ineligible: s === "micro" && annualCA > MICRO_PLAFOND,
      };
    });
    return rows.sort((a, b) => b.net - a.net);
  }, [annualCA, remType, statuses]);

  const eligible = results.filter((r) => !r.ineligible);
  const best = eligible[0] ?? results[0];
  const maxNet = Math.max(...results.map((r) => r.netMois), 1);

  return (
    <div className="bg-card rounded-2xl border border-border p-5 sm:p-7">
      {/* Inputs */}
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-foreground">TJM</label>
            <span className="text-sm font-bold text-foreground">{fmt(tjm)}&euro;/j</span>
          </div>
          <input type="range" min={150} max={1500} step={10} value={tjm}
            onChange={(e) => setTjm(Number(e.target.value))} className="w-full accent-[#5682F2]" />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-foreground">Jours / mois</label>
            <span className="text-sm font-bold text-foreground">{jours} j</span>
          </div>
          <input type="range" min={5} max={23} step={1} value={jours}
            onChange={(e) => setJours(Number(e.target.value))} className="w-full accent-[#5682F2]" />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
        <div className="text-sm text-muted-foreground">CA annuel : <span className="font-bold text-foreground">{fmt(annualCA)}&euro;</span></div>
        <div className="flex gap-1.5">
          {([
            { value: "salaire" as const, label: "Salaire" },
            { value: "dividendes" as const, label: "Dividendes" },
            { value: "mixte" as const, label: "Mixte" },
          ]).map((opt) => (
            <button key={opt.value} onClick={() => setRemType(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                remType === opt.value ? "bg-[#5682F2]/15 text-[#5682F2] border-[#5682F2]/30" : "bg-muted/30 text-muted-foreground border-border"
              }`}>{opt.label}</button>
          ))}
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground/60 mt-1">Le mode de r&eacute;mun&eacute;ration s&apos;applique aux statuts &agrave; l&apos;IS (EURL IS, SASU IS) et SASU IR.</p>

      {/* Best */}
      <div className="mt-5 flex items-center gap-3 bg-muted/30 border border-border rounded-xl p-4">
        <div className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: best.color }} />
        <div>
          <div className="text-[11px] text-muted-foreground/80 uppercase tracking-wider">Le plus avantageux pour toi</div>
          <div className="text-base font-bold text-foreground">{best.label} &middot; {fmt(Math.round(best.netMois))}&euro;/mois net</div>
        </div>
      </div>

      {/* Bars */}
      <div className="mt-4 space-y-2.5">
        {results.map((r) => (
          <div key={r.status} className={r.ineligible ? "opacity-40" : ""}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="font-medium text-foreground">{r.label}{r.ineligible && <span className="text-[10px] text-[#f87171] ml-2">plafond dépassé</span>}</span>
              <span className="font-bold text-foreground">{fmt(Math.round(r.netMois))}&euro;/mois</span>
            </div>
            <div className="h-2.5 bg-muted/40 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(3, (r.netMois / maxNet) * 100)}%`, backgroundColor: r.color }} />
            </div>
          </div>
        ))}
      </div>

      <ToolCTA line={`Ceci compare des statuts sur un TJM fixe. Avec Freelens, compare sur ton CA RÉEL, avec le mix salaire/dividendes optimisé, et pilote ton vrai net toute l'année.`} />

      <p className="text-[10px] text-muted-foreground/70 mt-4 text-center leading-relaxed">
        Estimations (bar&egrave;me IR 2026, taux URSSAF, IS, PFU, PUMa). Le choix d&eacute;pend aussi de ta protection sociale et de ta situation. Consulte un expert-comptable.
      </p>
    </div>
  );
}
