"use client";

import { useMemo, useState } from "react";
import { reverseCA } from "@/lib/simulation-engine";
import { BUSINESS_STATUS_CONFIG } from "@/lib/constants";
import { fmt } from "@/lib/utils";
import type { BusinessStatus, RemunerationType } from "@/types";
import { ToolCTA } from "./ToolCTA";

const STATUTS = Object.entries(BUSINESS_STATUS_CONFIG).map(([k, c]) => ({
  value: k as BusinessStatus,
  label: c.label,
}));

export function ObjectifTJMCalculator() {
  const [targetNet, setTargetNet] = useState(4000);
  const [status, setStatus] = useState<BusinessStatus>("micro");
  const [jours, setJours] = useState(18);
  const [remType, setRemType] = useState<RemunerationType>("salaire");
  const [mixte, setMixte] = useState(50);

  const showRem = BUSINESS_STATUS_CONFIG[status].is > 0 || status === "sasu_ir";

  const r = useMemo(() => {
    const annualNet = targetNet * 12;
    const ca = reverseCA(annualNet, status, showRem ? remType : "salaire", mixte);
    return { ca, tjm: ca / 12 / jours, taux: ca > 0 ? 1 - annualNet / ca : 0 };
  }, [targetNet, status, jours, remType, mixte, showRem]);

  return (
    <div className="bg-card rounded-2xl border border-border p-5 sm:p-7">
      <div className="space-y-5">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-foreground">Revenu net mensuel vis&eacute;</label>
            <span className="text-sm font-bold text-foreground">{fmt(targetNet)}&euro;/mois</span>
          </div>
          <input type="range" min={1500} max={12000} step={250} value={targetNet}
            onChange={(e) => setTargetNet(Number(e.target.value))} className="w-full accent-[#5682F2]" />
          <div className="flex justify-between text-[11px] text-muted-foreground/70 mt-1"><span>1 500&euro;</span><span>12 000&euro;</span></div>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Statut juridique</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as BusinessStatus)}
            className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#5682F2]/50">
            {STATUTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        {showRem && (
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
        )}
        {showRem && remType === "mixte" && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Part salaire</span>
              <span className="text-xs font-bold text-foreground">{mixte}%</span>
            </div>
            <input type="range" min={10} max={90} step={10} value={mixte}
              onChange={(e) => setMixte(Number(e.target.value))} className="w-full accent-[#5682F2]" />
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-foreground">Jours factur&eacute;s / mois</label>
            <span className="text-sm font-bold text-foreground">{jours} j</span>
          </div>
          <input type="range" min={5} max={23} step={1} value={jours}
            onChange={(e) => setJours(Number(e.target.value))} className="w-full accent-[#5682F2]" />
        </div>
      </div>

      <div className="mt-7 pt-6 border-t border-border text-center">
        <div className="text-sm text-muted-foreground mb-1">TJM n&eacute;cessaire</div>
        <div className="text-5xl font-bold fn-gradient-text mb-4">{fmt(Math.round(r.tjm))}&euro;<span className="text-xl font-normal text-muted-foreground/70">/jour</span></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted/40 rounded-xl p-3">
            <div className="text-[11px] text-muted-foreground/80 uppercase tracking-wider">CA annuel requis</div>
            <div className="text-lg font-bold text-foreground mt-1">{fmt(Math.round(r.ca))}&euro;</div>
          </div>
          <div className="bg-muted/40 rounded-xl p-3">
            <div className="text-[11px] text-muted-foreground/80 uppercase tracking-wider">Charges + imp&ocirc;ts</div>
            <div className="text-lg font-bold text-foreground mt-1">{Math.round(r.taux * 100)}%</div>
          </div>
        </div>
      </div>

      <ToolCTA line={`Voilà le TJM cible sur une base fixe. Avec Freelens, ajoute tes vrais clients et vois en temps réel si tu es sur la trajectoire de ton objectif — mois par mois.`} />

      <p className="text-[10px] text-muted-foreground/70 mt-4 text-center leading-relaxed">
        Estimations (bar&egrave;me IR progressif 2026, taux URSSAF). Consulte un expert-comptable pour ta situation exacte.
      </p>
    </div>
  );
}
