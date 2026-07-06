"use client";

import { useMemo, useState } from "react";
import { computeIR } from "@/lib/simulation-engine";
import { BUSINESS_STATUS_CONFIG, MICRO_PLAFOND } from "@/lib/constants";
import { fmt } from "@/lib/utils";
import { ToolCTA } from "./ToolCTA";

const URSSAF_MICRO = BUSINESS_STATUS_CONFIG.micro.urssaf; // 25.6% BNC 2026
const ABATTEMENT_BNC = 0.34;

export function ChargesMicroCalculator() {
  const [caMensuel, setCaMensuel] = useState(4000);
  const [liberatoire, setLiberatoire] = useState(false);

  const r = useMemo(() => {
    const caAnnuel = caMensuel * 12;
    const urssaf = caAnnuel * URSSAF_MICRO;
    // IR : versement libératoire 2,2% du CA, sinon barème progressif sur 66% du CA (abattement 34%)
    const ir = liberatoire ? caAnnuel * 0.022 : computeIR(caAnnuel * (1 - ABATTEMENT_BNC));
    const net = caAnnuel - urssaf - ir;
    return { caAnnuel, urssaf, ir, net, netMois: net / 12, taux: caAnnuel > 0 ? (urssaf + ir) / caAnnuel : 0 };
  }, [caMensuel, liberatoire]);

  const overPlafond = r.caAnnuel > MICRO_PLAFOND;

  return (
    <div className="bg-card rounded-2xl border border-border p-5 sm:p-7">
      <div className="space-y-5">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-foreground">Ton chiffre d&apos;affaires mensuel</label>
            <span className="text-sm font-bold text-foreground">{fmt(caMensuel)}&euro;/mois</span>
          </div>
          <input type="range" min={500} max={8000} step={100} value={caMensuel}
            onChange={(e) => setCaMensuel(Number(e.target.value))} className="w-full accent-[#5682F2]" />
          <div className="flex justify-between text-[11px] text-muted-foreground/70 mt-1"><span>500&euro;</span><span>8 000&euro;</span></div>
        </div>

        <label className="flex items-center gap-2.5 text-sm text-foreground cursor-pointer">
          <input type="checkbox" checked={liberatoire} onChange={(e) => setLiberatoire(e.target.checked)} className="accent-[#5682F2] size-4" />
          Versement lib&eacute;ratoire de l&apos;IR (2,2%)
          <span className="text-[11px] text-muted-foreground/70">si &eacute;ligible (RFR sous seuil)</span>
        </label>
      </div>

      <div className="mt-7 pt-6 border-t border-border">
        <div className="text-center mb-4">
          <div className="text-sm text-muted-foreground mb-1">Ce qu&apos;il te reste vraiment</div>
          <div className="text-5xl font-bold fn-gradient-text">{fmt(Math.round(r.netMois))}&euro;<span className="text-xl font-normal text-muted-foreground/70">/mois</span></div>
          <div className="text-xs text-muted-foreground/70 mt-1">taux de pr&eacute;l&egrave;vement global : {Math.round(r.taux * 100)}%</div>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="bg-muted/40 rounded-xl p-3 text-center">
            <div className="text-[10px] text-muted-foreground/80 uppercase tracking-wider">Cotisations URSSAF</div>
            <div className="text-base font-bold text-[#f87171] mt-1">{fmt(Math.round(r.urssaf / 12))}&euro;</div>
            <div className="text-[10px] text-muted-foreground/60">/mois &middot; {Math.round(URSSAF_MICRO * 100)}%</div>
          </div>
          <div className="bg-muted/40 rounded-xl p-3 text-center">
            <div className="text-[10px] text-muted-foreground/80 uppercase tracking-wider">Imp&ocirc;t revenu</div>
            <div className="text-base font-bold text-[#F4BE7E] mt-1">{fmt(Math.round(r.ir / 12))}&euro;</div>
            <div className="text-[10px] text-muted-foreground/60">/mois</div>
          </div>
          <div className="bg-muted/40 rounded-xl p-3 text-center">
            <div className="text-[10px] text-muted-foreground/80 uppercase tracking-wider">Net</div>
            <div className="text-base font-bold text-[#4ade80] mt-1">{fmt(Math.round(r.netMois))}&euro;</div>
            <div className="text-[10px] text-muted-foreground/60">/mois</div>
          </div>
        </div>
        {overPlafond && (
          <div className="mt-3 text-xs text-[#f87171] bg-[#f87171]/10 border border-[#f87171]/20 rounded-xl px-3 py-2 text-center">
            Tu d&eacute;passes le plafond micro-entreprise ({fmt(MICRO_PLAFOND)}&euro;/an). Il faudra basculer en EI, EURL ou SASU.
          </div>
        )}
      </div>

      <ToolCTA line={`Ceci suppose un CA régulier. Avec Freelens, suis tes vraies cotisations et ton net réel mois par mois, avec ton calendrier d'échéances URSSAF et ta trésorerie.`} />

      <p className="text-[10px] text-muted-foreground/70 mt-4 text-center leading-relaxed">
        Micro-entreprise BNC 2026 : cotisations {Math.round(URSSAF_MICRO * 100)}% du CA, abattement forfaitaire 34%, bar&egrave;me IR progressif. Estimation indicative.
      </p>
    </div>
  );
}
