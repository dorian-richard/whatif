"use client";

import { useMemo, useState } from "react";
import { useProfileStore } from "@/stores/useProfileStore";
import { getClientBaseCA } from "@/lib/simulation-engine";
import { BUSINESS_STATUS_CONFIG } from "@/lib/constants";
import { fmt, cn } from "@/lib/utils";
import type { BusinessStatus, RemunerationType } from "@/types";
import {
  Check,
  CircleAlert,
  TrendingUp,
  Shield,
  Banknote,
  HandCoins,
} from "@/components/ui/icons";

/** Statuts à comparer */
const STATUTS: BusinessStatus[] = ["micro", "eurl_ir", "eurl_is", "sasu_ir", "sasu_is"];

const STATUT_COLORS: Record<string, string> = {
  micro: "#F4BE7E",
  eurl_ir: "#5682F2",
  eurl_is: "#a78bfa",
  sasu_ir: "#f87171",
  sasu_is: "#4ade80",
};

const PFU_RATE = 0.30;
const MICRO_PLAFOND = 77700;

interface StatusResult {
  status: BusinessStatus;
  label: string;
  netAnnual: number;
  netMonthly: number;
  chargesSociales: number;
  impots: number;
  totalPrelevements: number;
  tauxEffectif: number;
  color: string;
  ineligible?: boolean;
  ineligibleReason?: string;
}

/**
 * Calcule le détail net/charges/impôts pour un statut donné.
 * Reprend la logique de computeNetFromCA mais décompose les résultats.
 */
function computeForStatus(
  annualCA: number,
  status: BusinessStatus,
  remunerationType: "salaire" | "dividendes" | "mixte" = "salaire",
  mixtePartSalaire: number = 50
): StatusResult {
  const cfg = BUSINESS_STATUS_CONFIG[status];
  const urssaf = cfg.urssaf;
  const ir = cfg.ir;
  const is = cfg.is;
  const color = STATUT_COLORS[status] ?? "#5682F2";

  let chargesSociales = 0;
  let impots = 0;
  let netAnnual = 0;

  if (status === "micro") {
    // Micro: URSSAF sur CA + IR sur CA
    chargesSociales = annualCA * urssaf;
    impots = annualCA * ir;
    netAnnual = annualCA - chargesSociales - impots;
  } else if (is === 0) {
    // IR structures (EI, EURL IR, SASU IR): URSSAF puis IR
    chargesSociales = annualCA * urssaf;
    const afterUrssaf = annualCA - chargesSociales;
    impots = afterUrssaf * ir;
    netAnnual = afterUrssaf - impots;
  } else {
    // IS structures (EURL IS, SASU IS)
    const isSASU = status === "sasu_is";

    if (remunerationType === "salaire") {
      chargesSociales = annualCA * urssaf;
      const afterUrssaf = annualCA - chargesSociales;
      impots = afterUrssaf * ir;
      netAnnual = afterUrssaf - impots;
    } else if (remunerationType === "dividendes") {
      const isAmount = annualCA * is;
      const afterIS = annualCA - isAmount;
      if (isSASU) {
        // PFU 30% flat
        const pfuAmount = afterIS * PFU_RATE;
        chargesSociales = afterIS * 0.172; // CSG/CRDS part
        impots = isAmount + afterIS * 0.128; // IS + IR part of PFU
        netAnnual = afterIS - pfuAmount;
      } else {
        // EURL: TNS sur dividendes + IR
        chargesSociales = afterIS * urssaf;
        const afterCharges = afterIS - chargesSociales;
        impots = isAmount + afterCharges * ir;
        netAnnual = afterCharges - afterCharges * ir;
      }
    } else {
      // Mixte
      const salaryCost = annualCA * (mixtePartSalaire / 100);
      const salaryCharges = salaryCost * urssaf;
      const salaryNet = salaryCost - salaryCharges;
      const salaryIR = salaryNet * ir;

      const remaining = Math.max(0, annualCA - salaryCost);
      const isAmount = remaining * is;
      const afterIS = remaining - isAmount;

      let divCharges = 0;
      let divIR = 0;
      let divNet = 0;

      if (isSASU) {
        divCharges = afterIS * 0.172;
        divIR = afterIS * 0.128;
        divNet = afterIS * (1 - PFU_RATE);
      } else {
        divCharges = afterIS * urssaf;
        const afterDivCharges = afterIS - divCharges;
        divIR = afterDivCharges * ir;
        divNet = afterDivCharges - divIR;
      }

      chargesSociales = salaryCharges + divCharges;
      impots = salaryIR + isAmount + divIR;
      netAnnual = (salaryNet - salaryIR) + divNet;
    }
  }

  const totalPrelevements = chargesSociales + impots;
  const tauxEffectif = annualCA > 0 ? totalPrelevements / annualCA : 0;

  const ineligible = status === "micro" && annualCA > MICRO_PLAFOND;

  return {
    status,
    label: cfg.label,
    netAnnual,
    netMonthly: netAnnual / 12,
    chargesSociales,
    impots,
    totalPrelevements,
    tauxEffectif,
    color,
    ineligible,
    ineligibleReason: ineligible ? `Plafond micro dépassé (${fmt(MICRO_PLAFOND)} €)` : undefined,
  };
}

export default function ComparateurPage() {
  const { clients, businessStatus, remunerationType, mixtePartSalaire, monthlyExpenses } =
    useProfileStore();

  // CA from clients
  const baseAnnualCA = useMemo(
    () => clients.reduce((sum, c) => sum + getClientBaseCA(c), 0) * 12,
    [clients]
  );

  const [caOverride, setCaOverride] = useState<number | null>(null);
  const annualCA = caOverride ?? baseAnnualCA;

  // Local remuneration controls (initialized from profile)
  const [localRemType, setLocalRemType] = useState<RemunerationType>(remunerationType ?? "salaire");
  const [localMixte, setLocalMixte] = useState(mixtePartSalaire ?? 50);

  // Compute for all statuts
  const results = useMemo(() => {
    return STATUTS.map((s) => {
      const remType = (s === "eurl_is" || s === "sasu_is") ? localRemType : "salaire";
      return computeForStatus(annualCA, s, remType, localMixte);
    });
  }, [annualCA, localRemType, localMixte]);

  // Best statut = highest net among eligible
  const best = useMemo(() => {
    const eligible = results.filter((r) => !r.ineligible);
    if (eligible.length === 0) return results[0];
    return eligible.reduce((a, b) => (a.netAnnual > b.netAnnual ? a : b));
  }, [results]);

  // Max net for bar scaling
  const maxNet = Math.max(...results.map((r) => r.netMonthly), 1);

  // Annual expenses
  const annualExpenses = monthlyExpenses * 12;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Comparateur de statuts</h1>
          <p className="text-[#8b8b9e]">
            Quel statut juridique est le plus avantageux pour ton CA ?
          </p>
        </div>

        {/* CA Slider */}
        <div className="bg-[#12121c] rounded-2xl border border-white/[0.06] p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs text-[#5a5a6e] uppercase tracking-wider mb-1">Chiffre d&apos;affaires annuel</div>
              <div className="text-3xl font-bold text-white">{fmt(annualCA)} &euro;</div>
            </div>
            {caOverride !== null && (
              <button
                onClick={() => setCaOverride(null)}
                className="text-xs text-[#5682F2] hover:underline"
              >
                Revenir au CA réel
              </button>
            )}
          </div>
          <input
            type="range"
            min={10000}
            max={300000}
            step={1000}
            value={annualCA}
            onChange={(e) => setCaOverride(Number(e.target.value))}
            className="w-full accent-[#5682F2] h-2 bg-white/[0.06] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#5682F2] [&::-webkit-slider-thumb]:shadow-lg"
          />
          <div className="flex justify-between text-xs text-[#5a5a6e] mt-2">
            <span>10 000 &euro;</span>
            <span>150 000 &euro;</span>
            <span>300 000 &euro;</span>
          </div>
        </div>

        {/* Remuneration type selector (for IS statuts) */}
        <div className="bg-[#12121c] rounded-2xl border border-white/[0.06] p-6">
          <div className="text-xs text-[#5a5a6e] uppercase tracking-wider mb-3">
            Mode de rémunération (EURL IS / SASU IS)
          </div>
          <div className="flex gap-2 mb-4">
            {([
              { value: "salaire" as const, label: "Salaire" },
              { value: "dividendes" as const, label: "Dividendes" },
              { value: "mixte" as const, label: "Mixte" },
            ]).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setLocalRemType(opt.value)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                  localRemType === opt.value
                    ? "bg-[#5682F2]/15 text-[#5682F2] ring-1 ring-[#5682F2]/30"
                    : "bg-white/[0.04] text-[#8b8b9e] hover:text-white hover:bg-white/[0.06]"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {localRemType === "mixte" && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[#8b8b9e]">Répartition salaire / dividendes</span>
                <span className="text-sm font-bold text-white">{localMixte}% / {100 - localMixte}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={localMixte}
                onChange={(e) => setLocalMixte(Number(e.target.value))}
                className="w-full accent-[#5682F2] h-2 bg-white/[0.06] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#5682F2] [&::-webkit-slider-thumb]:shadow-lg"
              />
              <div className="flex justify-between text-xs text-[#5a5a6e] mt-1">
                <span>100% Dividendes</span>
                <span>100% Salaire</span>
              </div>
            </div>
          )}
        </div>

        {/* Best status badge */}
        <div className="flex items-center gap-3 bg-[#12121c] rounded-2xl border border-white/[0.06] p-5">
          <div
            className="size-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${best.color}15` }}
          >
            <TrendingUp className="size-6" style={{ color: best.color }} />
          </div>
          <div>
            <div className="text-xs text-[#5a5a6e] uppercase tracking-wider">Meilleur statut pour toi</div>
            <div className="text-lg font-bold text-white">{best.label}</div>
            <div className="text-sm text-[#8b8b9e]">
              {fmt(best.netMonthly)} &euro;/mois net &middot; Taux effectif {Math.round(best.tauxEffectif * 100)}%
            </div>
          </div>
          {best.status === businessStatus && (
            <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#4ade80]/10 text-[#4ade80] text-xs font-semibold">
              <Check className="size-3.5" /> Ton statut actuel
            </div>
          )}
        </div>

        {/* Comparison cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          {results.map((r) => {
            const isBest = r.status === best.status && !r.ineligible;
            const isCurrent = r.status === businessStatus;
            const delta = r.netMonthly - best.netMonthly;
            const barWidth = maxNet > 0 ? (r.netMonthly / maxNet) * 100 : 0;
            const netAfterExpenses = r.netMonthly - monthlyExpenses;

            return (
              <div
                key={r.status}
                className={cn(
                  "bg-[#12121c] rounded-2xl border p-5 transition-all relative",
                  r.ineligible
                    ? "border-[#f87171]/20 opacity-60"
                    : isBest
                      ? "border-white/[0.15] ring-1 ring-white/[0.08]"
                      : "border-white/[0.06]"
                )}
              >
                {/* Tags */}
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  {r.ineligible && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#f87171]/15 text-[#f87171]">
                      Non éligible
                    </span>
                  )}
                  {isBest && (
                    <span
                      className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                      style={{ backgroundColor: `${r.color}20`, color: r.color }}
                    >
                      Optimal
                    </span>
                  )}
                  {isCurrent && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/[0.06] text-[#8b8b9e]">
                      Actuel
                    </span>
                  )}
                </div>
                {r.ineligible && r.ineligibleReason && (
                  <div className="text-[11px] text-[#f87171] mb-3">{r.ineligibleReason}</div>
                )}

                {/* Status name */}
                <div className="mb-4">
                  <h3 className="text-base font-bold text-white">{r.label}</h3>
                  <p className="text-xs text-[#5a5a6e] mt-0.5">
                    {BUSINESS_STATUS_CONFIG[r.status].regime}
                  </p>
                </div>

                {/* Net monthly - big number */}
                <div className="mb-4">
                  <div className="text-2xl font-bold" style={{ color: r.color }}>
                    {fmt(r.netMonthly)} &euro;
                    <span className="text-sm font-normal text-[#5a5a6e]">/mois</span>
                  </div>
                  {!isBest && delta < 0 && (
                    <div className="text-xs text-[#f87171] mt-0.5">
                      {fmt(delta)} &euro;/mois vs optimal
                    </div>
                  )}
                </div>

                {/* Visual bar */}
                <div className="h-2 bg-white/[0.04] rounded-full mb-5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${barWidth}%`, backgroundColor: r.color }}
                  />
                </div>

                {/* Breakdown */}
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[#8b8b9e]">
                      <Banknote className="size-3.5" />
                      <span>Charges sociales</span>
                    </div>
                    <span className="font-medium text-white">{fmt(r.chargesSociales / 12)} &euro;</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[#8b8b9e]">
                      <Shield className="size-3.5" />
                      <span>Impôts</span>
                    </div>
                    <span className="font-medium text-white">{fmt(r.impots / 12)} &euro;</span>
                  </div>
                  <div className="h-px bg-white/[0.06]" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[#8b8b9e]">
                      <HandCoins className="size-3.5" />
                      <span>Taux effectif</span>
                    </div>
                    <span className="font-bold text-white">{Math.round(r.tauxEffectif * 100)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[#8b8b9e]">
                      <CircleAlert className="size-3.5" />
                      <span>Reste après charges vie</span>
                    </div>
                    <span className={cn("font-bold", netAfterExpenses >= 0 ? "text-[#4ade80]" : "text-[#f87171]")}>
                      {fmt(netAfterExpenses)} &euro;
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Avantages / Inconvénients for best */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#12121c] rounded-2xl border border-white/[0.06] p-6">
            <h3 className="text-sm font-semibold text-[#4ade80] uppercase tracking-wider mb-4 flex items-center gap-2">
              <Check className="size-4" /> Avantages — {best.label}
            </h3>
            <ul className="space-y-2.5">
              {BUSINESS_STATUS_CONFIG[best.status].avantages.map((a, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[#8b8b9e]">
                  <Check className="size-4 text-[#4ade80] mt-0.5 shrink-0" />
                  {a}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-[#12121c] rounded-2xl border border-white/[0.06] p-6">
            <h3 className="text-sm font-semibold text-[#f87171] uppercase tracking-wider mb-4 flex items-center gap-2">
              <CircleAlert className="size-4" /> Inconvénients — {best.label}
            </h3>
            <ul className="space-y-2.5">
              {BUSINESS_STATUS_CONFIG[best.status].inconvenients.map((a, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[#8b8b9e]">
                  <CircleAlert className="size-4 text-[#f87171] mt-0.5 shrink-0" />
                  {a}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="text-center text-xs text-[#5a5a6e] pb-8">
          Simulation indicative basée sur des taux moyens. Consulte un expert-comptable pour un conseil personnalisé.
        </div>
      </div>
  );
}
