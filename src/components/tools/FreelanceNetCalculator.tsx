"use client";

import { useMemo, useState } from "react";
import { computeNetFromCA } from "@/lib/simulation-engine";
import { BUSINESS_STATUS_CONFIG, MICRO_PLAFOND } from "@/lib/constants";
import { fmt } from "@/lib/utils";
import type { BusinessStatus, RemunerationType, FreelanceProfile } from "@/types";
import { ToolCTA } from "./ToolCTA";

const STATUTS = Object.entries(BUSINESS_STATUS_CONFIG).map(([k, c]) => ({
  value: k as BusinessStatus,
  label: c.label,
}));

function buildProfile(status: BusinessStatus, remType: RemunerationType, mixte: number): FreelanceProfile {
  return {
    monthlyExpenses: 0,
    savings: 0,
    adminHoursPerWeek: 0,
    workDaysPerWeek: 5,
    businessStatus: status,
    remunerationType: remType,
    mixtePartSalaire: mixte,
    nbParts: 1,
  };
}

export function FreelanceNetCalculator({ defaultStatus = "micro" }: { defaultStatus?: BusinessStatus }) {
  const [tjm, setTjm] = useState(500);
  const [jours, setJours] = useState(18);
  const [status, setStatus] = useState<BusinessStatus>(defaultStatus);
  const [remType, setRemType] = useState<RemunerationType>("salaire");
  const [mixte, setMixte] = useState(50);

  const showRem = BUSINESS_STATUS_CONFIG[status].is > 0 || status === "sasu_ir";

  const r = useMemo(() => {
    const ca = tjm * jours * 12;
    const net = computeNetFromCA(ca, buildProfile(status, showRem ? remType : "salaire", mixte));
    return { ca, net, netMois: net / 12, taux: ca > 0 ? 1 - net / ca : 0 };
  }, [tjm, jours, status, remType, mixte, showRem]);

  const overPlafond = status === "micro" && r.ca > MICRO_PLAFOND;

  return (
    <div className="bg-card rounded-2xl border border-border p-5 sm:p-7">
      <div className="space-y-5">
        {/* TJM */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-foreground">Ton TJM (taux journalier)</label>
            <span className="text-sm font-bold text-foreground">{fmt(tjm)}&euro;/jour</span>
          </div>
          <input type="range" min={150} max={1500} step={10} value={tjm}
            onChange={(e) => setTjm(Number(e.target.value))} className="w-full accent-[#5682F2]" />
          <div className="flex justify-between text-[11px] text-muted-foreground/70 mt-1"><span>150&euro;</span><span>1 500&euro;</span></div>
        </div>

        {/* Jours / mois */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-foreground">Jours factur&eacute;s / mois</label>
            <span className="text-sm font-bold text-foreground">{jours} j</span>
          </div>
          <input type="range" min={5} max={23} step={1} value={jours}
            onChange={(e) => setJours(Number(e.target.value))} className="w-full accent-[#5682F2]" />
          <div className="flex justify-between text-[11px] text-muted-foreground/70 mt-1"><span>5 j</span><span>23 j</span></div>
        </div>

        {/* Statut */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Statut juridique</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as BusinessStatus)}
            className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#5682F2]/50">
            {STATUTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        {/* Rémunération (IS + SASU IR) */}
        {showRem && (
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Type de r&eacute;mun&eacute;ration</label>
            <div className="flex gap-2">
              {([
                { value: "salaire" as const, label: "Salaire" },
                { value: "dividendes" as const, label: status === "sasu_ir" ? "Résultat" : "Dividendes" },
                { value: "mixte" as const, label: "Mixte" },
              ]).map((opt) => (
                <button key={opt.value} onClick={() => setRemType(opt.value)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all border ${
                    remType === opt.value ? "bg-[#5682F2]/15 text-[#5682F2] border-[#5682F2]/30" : "bg-muted/30 text-muted-foreground border-border hover:bg-muted/50"
                  }`}>{opt.label}</button>
              ))}
            </div>
            {remType === "mixte" && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Part salaire</span>
                  <span className="text-xs font-bold text-foreground">{mixte}%</span>
                </div>
                <input type="range" min={10} max={90} step={10} value={mixte}
                  onChange={(e) => setMixte(Number(e.target.value))} className="w-full accent-[#5682F2]" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Résultat */}
      <div className="mt-7 pt-6 border-t border-border text-center">
        <div className="text-sm text-muted-foreground mb-1">Ton revenu net estim&eacute;</div>
        <div className="text-5xl font-bold fn-gradient-text mb-1">{fmt(Math.round(r.netMois))}&euro;<span className="text-xl font-normal text-muted-foreground/70">/mois</span></div>
        <div className="text-xs text-muted-foreground/70 mb-4">soit {fmt(Math.round(r.net))}&euro; net / an</div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted/40 rounded-xl p-3">
            <div className="text-[11px] text-muted-foreground/80 uppercase tracking-wider">CA annuel</div>
            <div className="text-lg font-bold text-foreground mt-1">{fmt(Math.round(r.ca))}&euro;</div>
          </div>
          <div className="bg-muted/40 rounded-xl p-3">
            <div className="text-[11px] text-muted-foreground/80 uppercase tracking-wider">Charges + imp&ocirc;ts</div>
            <div className="text-lg font-bold text-foreground mt-1">{Math.round(r.taux * 100)}%</div>
          </div>
        </div>
        {overPlafond && (
          <div className="mt-3 text-xs text-[#f87171] bg-[#f87171]/10 border border-[#f87171]/20 rounded-xl px-3 py-2">
            CA au-dessus du plafond micro ({fmt(MICRO_PLAFOND)}&euro;) &mdash; compare avec EURL / SASU.
          </div>
        )}
      </div>

      <ToolCTA line={`Ceci est une estimation sur un TJM fixe. Avec Freelens, suis ton VRAI net mois par mois — tes vrais clients, ta saisonnalité, tes vacances, tes factures et ta trésorerie.`} />

      <p className="text-[10px] text-muted-foreground/70 mt-4 text-center leading-relaxed">
        Estimations bas&eacute;es sur le bar&egrave;me IR progressif 2026 et les taux URSSAF en vigueur. Consulte un expert-comptable pour ta situation exacte (foyer fiscal, etc.).
      </p>
    </div>
  );
}
