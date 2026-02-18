"use client";

import { useMemo, useState } from "react";
import { useProfileStore } from "@/stores/useProfileStore";
import { BUSINESS_STATUS_CONFIG } from "@/lib/constants";
import { fmt, cn } from "@/lib/utils";
import type { BusinessStatus } from "@/types";
import {
  Briefcase,
  Check,
  CircleAlert,
  TrendingUp,
  Banknote,
  Gauge,
  ArrowLeftRight,
} from "@/components/ui/icons";

const STATUTS: BusinessStatus[] = ["micro", "eurl_ir", "eurl_is", "sasu_ir", "sasu_is"];

const STATUT_COLORS: Record<string, string> = {
  micro: "#F4BE7E",
  eurl_ir: "#5682F2",
  eurl_is: "#a78bfa",
  sasu_ir: "#f87171",
  sasu_is: "#4ade80",
};

const CHARGES_SALARIALES = 0.23;
const MICRO_PLAFOND = 77700;

/* ── Avantages CDI ── */
interface AvantageCDI {
  id: string;
  label: string;
  desc: string;
  annualValue: (brutAnnuel: number) => number;
  defaultOn: boolean;
}

const AVANTAGES_CDI: AvantageCDI[] = [
  {
    id: "mutuelle",
    label: "Mutuelle employeur",
    desc: "~50 €/mois pris en charge",
    annualValue: () => 600,
    defaultOn: true,
  },
  {
    id: "tickets",
    label: "Tickets restaurant",
    desc: "~8 € × 218j × 60%",
    annualValue: () => 1047,
    defaultOn: true,
  },
  {
    id: "treizieme",
    label: "13ème mois",
    desc: "1 mois net supplémentaire",
    annualValue: (b) => Math.round((b * (1 - CHARGES_SALARIALES)) / 12),
    defaultOn: false,
  },
  {
    id: "interessement",
    label: "Intéressement / Participation",
    desc: "~2 000 €/an en moyenne",
    annualValue: () => 2000,
    defaultOn: false,
  },
  {
    id: "rtt",
    label: "RTT (~10 jours)",
    desc: "Valorisés au taux journalier net",
    annualValue: (b) =>
      Math.round(((b * (1 - CHARGES_SALARIALES)) / 218) * 10),
    defaultOn: false,
  },
];

/* ── Coûts freelance ── */
interface CoutFreelance {
  id: string;
  label: string;
  monthly: number;
}

const COUTS_FREELANCE: CoutFreelance[] = [
  { id: "mutuelle", label: "Mutuelle", monthly: 120 },
  { id: "comptable", label: "Comptable", monthly: 150 },
  { id: "rcpro", label: "RC Pro / Assurance", monthly: 25 },
  { id: "prevoyance", label: "Prévoyance", monthly: 50 },
];

/* ── Calculs ── */

/** Reverse: target net → required CA (salary mode) */
function reverseCA(
  targetNet: number,
  status: BusinessStatus,
  customIrRate?: number
): number {
  const cfg = BUSINESS_STATUS_CONFIG[status];
  const urssaf = cfg.urssaf;
  const ir = customIrRate ?? cfg.ir;

  if (status === "micro") return targetNet / (1 - urssaf - ir);
  return targetNet / ((1 - urssaf) * (1 - ir));
}

/** Forward: CA → net (salary mode) */
function forwardNet(
  annualCA: number,
  status: BusinessStatus,
  customIrRate?: number
): number {
  const cfg = BUSINESS_STATUS_CONFIG[status];
  const urssaf = cfg.urssaf;
  const ir = customIrRate ?? cfg.ir;

  if (status === "micro") return annualCA * (1 - urssaf - ir);
  return annualCA * (1 - urssaf) * (1 - ir);
}

function getDifficulty(
  tjm: number
): "accessible" | "moyen" | "ambitieux" | "difficile" {
  if (tjm <= 400) return "accessible";
  if (tjm <= 600) return "moyen";
  if (tjm <= 800) return "ambitieux";
  return "difficile";
}

const DIFFICULTY_CONFIG = {
  accessible: {
    label: "Accessible",
    color: "#4ade80",
    bg: "bg-[#4ade80]/10",
  },
  moyen: { label: "Moyen", color: "#F4BE7E", bg: "bg-[#F4BE7E]/10" },
  ambitieux: { label: "Ambitieux", color: "#f97316", bg: "bg-[#f97316]/10" },
  difficile: { label: "Difficile", color: "#f87171", bg: "bg-[#f87171]/10" },
};

/* ── Component ── */

export default function TransitionPage() {
  const { customIrRate, workDaysPerWeek } = useProfileStore();

  // CDI inputs
  const [salaireBrut, setSalaireBrut] = useState(45000);
  const [checkedAvantages, setCheckedAvantages] = useState<Set<string>>(
    () => new Set(AVANTAGES_CDI.filter((a) => a.defaultOn).map((a) => a.id))
  );

  // Freelance params
  const [vacationWeeks, setVacationWeeks] = useState(5);

  // TJM explorer
  const [explorerTJM, setExplorerTJM] = useState(500);

  // ── Derived values ──
  const cdiNetAnnuel = salaireBrut * (1 - CHARGES_SALARIALES);
  const cdiNetMensuel = cdiNetAnnuel / 12;

  const avantagesTotal = useMemo(() => {
    return AVANTAGES_CDI.filter((a) => checkedAvantages.has(a.id)).reduce(
      (sum, a) => sum + a.annualValue(salaireBrut),
      0
    );
  }, [checkedAvantages, salaireBrut]);

  const cdiPackageAnnuel = cdiNetAnnuel + avantagesTotal;
  const cdiPackageMensuel = cdiPackageAnnuel / 12;

  const freelanceCostsAnnuel = COUTS_FREELANCE.reduce(
    (s, c) => s + c.monthly * 12,
    0
  );
  const freelanceCostsMensuel = COUTS_FREELANCE.reduce(
    (s, c) => s + c.monthly,
    0
  );

  // Freelance must net: CDI package + own costs
  const targetFreelanceNet = cdiPackageAnnuel + freelanceCostsAnnuel;

  const workedDaysPerYear = (52 - vacationWeeks) * workDaysPerWeek;

  // ── Required TJM per status ──
  const results = useMemo(() => {
    return STATUTS.map((s) => {
      const requiredCA = reverseCA(targetFreelanceNet, s, customIrRate);
      const requiredTJM =
        workedDaysPerYear > 0 ? requiredCA / workedDaysPerYear : 0;
      const ineligible = s === "micro" && requiredCA > MICRO_PLAFOND;
      const difficulty = getDifficulty(requiredTJM);
      const color = STATUT_COLORS[s];
      const label = BUSINESS_STATUS_CONFIG[s].label;
      const tauxEffectif =
        requiredCA > 0 ? (requiredCA - targetFreelanceNet) / requiredCA : 0;

      return {
        status: s,
        label,
        requiredCA,
        requiredTJM,
        ineligible,
        difficulty,
        color,
        tauxEffectif,
      };
    });
  }, [targetFreelanceNet, customIrRate, workedDaysPerYear]);

  const best = useMemo(() => {
    const eligible = results.filter(
      (r) => !r.ineligible && isFinite(r.requiredTJM)
    );
    if (eligible.length === 0) return results[0];
    return eligible.reduce((a, b) =>
      a.requiredTJM < b.requiredTJM ? a : b
    );
  }, [results]);

  // ── TJM Explorer ──
  const explorerResults = useMemo(() => {
    const annualCA = explorerTJM * workedDaysPerYear;
    return STATUTS.map((s) => {
      const freelanceNetAnnuel = forwardNet(annualCA, s, customIrRate);
      const freelanceNetAfterCosts = freelanceNetAnnuel - freelanceCostsAnnuel;
      const deltaMensuel =
        freelanceNetAfterCosts / 12 - cdiPackageMensuel;
      const ineligible = s === "micro" && annualCA > MICRO_PLAFOND;

      return {
        status: s,
        label: BUSINESS_STATUS_CONFIG[s].label,
        color: STATUT_COLORS[s],
        netMensuel: freelanceNetAfterCosts / 12,
        deltaMensuel,
        ineligible,
      };
    });
  }, [
    explorerTJM,
    workedDaysPerYear,
    customIrRate,
    freelanceCostsAnnuel,
    cdiPackageMensuel,
  ]);

  const toggleAvantage = (id: string) => {
    setCheckedAvantages((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const maxExplorerNet = Math.max(
    ...explorerResults.map((r) => r.netMensuel),
    cdiPackageMensuel,
    1
  );

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">
          Transition CDI &rarr; Freelance
        </h1>
        <p className="text-[#8b8b9e]">
          Combien tu dois facturer en freelance pour gagner autant (ou plus)
          qu&apos;en CDI ?
        </p>
      </div>

      {/* CDI Salary */}
      <div className="bg-[#12121c] rounded-2xl border border-white/[0.06] p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="size-10 rounded-xl bg-[#5682F2]/10 flex items-center justify-center">
            <Briefcase className="size-5 text-[#5682F2]" />
          </div>
          <div>
            <div className="text-xs text-[#5a5a6e] uppercase tracking-wider">
              Mon salaire CDI
            </div>
            <div className="text-2xl font-bold text-white">
              {fmt(salaireBrut)} &euro;{" "}
              <span className="text-sm font-normal text-[#5a5a6e]">
                brut/an
              </span>
            </div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-sm text-[#8b8b9e]">
              {fmt(Math.round(salaireBrut / 12))} &euro;/mois brut
            </div>
            <div className="text-sm font-semibold text-white">
              {fmt(Math.round(cdiNetMensuel))} &euro;/mois net
            </div>
          </div>
        </div>
        <input
          type="range"
          min={20000}
          max={120000}
          step={1000}
          value={salaireBrut}
          onChange={(e) => setSalaireBrut(Number(e.target.value))}
          className="w-full accent-[#5682F2] h-2 bg-white/[0.06] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#5682F2] [&::-webkit-slider-thumb]:shadow-lg"
        />
        <div className="flex justify-between text-xs text-[#5a5a6e] mt-2">
          <span>20 000 &euro;</span>
          <span>70 000 &euro;</span>
          <span>120 000 &euro;</span>
        </div>
      </div>

      {/* Avantages CDI + Coûts freelance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Avantages CDI */}
        <div className="bg-[#12121c] rounded-2xl border border-white/[0.06] p-6">
          <div className="text-xs text-[#5a5a6e] uppercase tracking-wider mb-4">
            Avantages CDI
          </div>
          <div className="space-y-3">
            {AVANTAGES_CDI.map((a) => {
              const checked = checkedAvantages.has(a.id);
              const val = a.annualValue(salaireBrut);
              return (
                <button
                  key={a.id}
                  onClick={() => toggleAvantage(a.id)}
                  className={cn(
                    "flex items-center gap-3 w-full p-3 rounded-xl transition-all text-left",
                    checked
                      ? "bg-[#5682F2]/8 border border-[#5682F2]/20"
                      : "bg-white/[0.02] border border-white/[0.04] opacity-60"
                  )}
                >
                  <div
                    className={cn(
                      "size-5 rounded-md flex items-center justify-center text-xs shrink-0",
                      checked ? "bg-[#5682F2] text-white" : "bg-white/[0.06]"
                    )}
                  >
                    {checked && <Check className="size-3" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white">
                      {a.label}
                    </div>
                    <div className="text-xs text-[#5a5a6e]">{a.desc}</div>
                  </div>
                  <div className="text-sm font-semibold text-[#5682F2] shrink-0">
                    +{fmt(val)} &euro;/an
                  </div>
                </button>
              );
            })}
          </div>
          <div className="mt-4 pt-3 border-t border-white/[0.06] flex justify-between">
            <span className="text-sm text-[#8b8b9e]">Total avantages</span>
            <span className="text-sm font-bold text-[#5682F2]">
              +{fmt(avantagesTotal)} &euro;/an
            </span>
          </div>
        </div>

        {/* Coûts freelance */}
        <div className="bg-[#12121c] rounded-2xl border border-white/[0.06] p-6">
          <div className="text-xs text-[#5a5a6e] uppercase tracking-wider mb-4">
            Co&ucirc;ts freelance &agrave; pr&eacute;voir
          </div>
          <div className="space-y-3">
            {COUTS_FREELANCE.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]"
              >
                <span className="text-sm text-[#8b8b9e]">{c.label}</span>
                <span className="text-sm font-medium text-[#f87171]">
                  {c.monthly} &euro;/mois
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-white/[0.06] flex justify-between">
            <span className="text-sm text-[#8b8b9e]">Total co&ucirc;ts</span>
            <span className="text-sm font-bold text-[#f87171]">
              {freelanceCostsMensuel} &euro;/mois &middot;{" "}
              {fmt(freelanceCostsAnnuel)} &euro;/an
            </span>
          </div>

          {/* Vacation weeks */}
          <div className="mt-5 pt-4 border-t border-white/[0.06]">
            <div className="flex justify-between mb-2">
              <span className="text-xs text-[#5a5a6e] uppercase tracking-wider">
                Vacances
              </span>
              <span className="text-sm font-bold text-white">
                {vacationWeeks} sem. &middot; {workedDaysPerYear}j/an
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={12}
              step={1}
              value={vacationWeeks}
              onChange={(e) => setVacationWeeks(Number(e.target.value))}
              className="w-full accent-[#F4BE7E] h-2 bg-white/[0.06] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#F4BE7E] [&::-webkit-slider-thumb]:shadow-lg"
            />
          </div>
        </div>
      </div>

      {/* Summary card */}
      <div className="bg-gradient-to-r from-[#5682F2]/10 to-[#F4BE7E]/10 rounded-2xl border border-white/[0.08] p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="text-center">
            <div className="text-xs text-[#5a5a6e] uppercase tracking-wider mb-1">
              Package CDI total
            </div>
            <div className="text-2xl font-bold text-[#5682F2]">
              {fmt(Math.round(cdiPackageMensuel))} &euro;
              <span className="text-sm font-normal text-[#5a5a6e]">/mois</span>
            </div>
            <div className="text-xs text-[#5a5a6e]">
              {fmt(cdiPackageAnnuel)} &euro;/an
            </div>
          </div>
          <div className="flex justify-center">
            <div className="size-10 rounded-full bg-white/[0.06] flex items-center justify-center">
              <ArrowLeftRight className="size-5 text-[#8b8b9e]" />
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-[#5a5a6e] uppercase tracking-wider mb-1">
              Objectif freelance net
            </div>
            <div className="text-2xl font-bold text-[#F4BE7E]">
              {fmt(Math.round(targetFreelanceNet / 12))} &euro;
              <span className="text-sm font-normal text-[#5a5a6e]">/mois</span>
            </div>
            <div className="text-xs text-[#5a5a6e]">
              {fmt(targetFreelanceNet)} &euro;/an (CDI + co&ucirc;ts)
            </div>
          </div>
        </div>
      </div>

      {/* Best status badge */}
      <div className="flex items-center gap-3 bg-[#12121c] rounded-2xl border border-white/[0.06] p-5">
        <div
          className="size-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${best.color}15` }}
        >
          <TrendingUp className="size-6" style={{ color: best.color }} />
        </div>
        <div className="flex-1">
          <div className="text-xs text-[#5a5a6e] uppercase tracking-wider">
            TJM minimum pour &eacute;galer ton CDI
          </div>
          <div className="text-lg font-bold text-white">
            {fmt(best.requiredTJM)} &euro;/jour{" "}
            <span className="text-sm font-normal text-[#8b8b9e]">
              en {best.label}
            </span>
          </div>
        </div>
        <div
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-bold",
            DIFFICULTY_CONFIG[best.difficulty].bg
          )}
          style={{ color: DIFFICULTY_CONFIG[best.difficulty].color }}
        >
          {DIFFICULTY_CONFIG[best.difficulty].label}
        </div>
      </div>

      {/* Result cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        {results.map((r) => {
          const isBest = r.status === best.status && !r.ineligible;
          const diffCfg = DIFFICULTY_CONFIG[r.difficulty];

          return (
            <div
              key={r.status}
              className={cn(
                "bg-[#12121c] rounded-2xl border p-5 transition-all",
                r.ineligible
                  ? "border-[#f87171]/20 opacity-60"
                  : isBest
                    ? "border-white/[0.15] ring-1 ring-white/[0.08]"
                    : "border-white/[0.06]"
              )}
            >
              {/* Tags */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {r.ineligible && (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#f87171]/15 text-[#f87171]">
                    Non &eacute;ligible
                  </span>
                )}
                {isBest && (
                  <span
                    className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                    style={{
                      backgroundColor: `${r.color}20`,
                      color: r.color,
                    }}
                  >
                    Optimal
                  </span>
                )}
                <span
                  className={cn(
                    "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                    diffCfg.bg
                  )}
                  style={{ color: diffCfg.color }}
                >
                  {diffCfg.label}
                </span>
              </div>

              {r.ineligible && (
                <div className="text-[11px] text-[#f87171] mb-2">
                  Plafond micro d&eacute;pass&eacute; ({fmt(MICRO_PLAFOND)}{" "}
                  &euro;)
                </div>
              )}

              {/* Status name */}
              <h3 className="text-base font-bold text-white mb-0.5">
                {r.label}
              </h3>
              <p className="text-xs text-[#5a5a6e] mb-4">
                {BUSINESS_STATUS_CONFIG[r.status].regime}
              </p>

              {/* TJM - big number */}
              <div className="mb-4">
                <div className="text-2xl font-bold" style={{ color: r.color }}>
                  {fmt(r.requiredTJM)} &euro;
                  <span className="text-sm font-normal text-[#5a5a6e]">
                    /jour
                  </span>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#8b8b9e]">
                    <Banknote className="size-3.5" />
                    <span>CA requis</span>
                  </div>
                  <span className="font-medium text-white">
                    {fmt(r.requiredCA)} &euro;/an
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#8b8b9e]">
                    <Gauge className="size-3.5" />
                    <span>Taux effectif</span>
                  </div>
                  <span className="font-bold text-white">
                    {Math.round(r.tauxEffectif * 100)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* TJM Explorer */}
      <div className="bg-[#12121c] rounded-2xl border border-white/[0.06] p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs text-[#5a5a6e] uppercase tracking-wider mb-1">
              Explorateur TJM
            </div>
            <div className="text-3xl font-bold fn-gradient-text">
              {explorerTJM} &euro;/jour
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-[#5a5a6e]">CA annuel</div>
            <div className="text-lg font-bold text-white">
              {fmt(explorerTJM * workedDaysPerYear)} &euro;
            </div>
          </div>
        </div>
        <input
          type="range"
          min={200}
          max={1500}
          step={10}
          value={explorerTJM}
          onChange={(e) => setExplorerTJM(Number(e.target.value))}
          className="w-full accent-[#5682F2] h-2 bg-white/[0.06] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#5682F2] [&::-webkit-slider-thumb]:shadow-lg"
        />
        <div className="flex justify-between text-xs text-[#5a5a6e] mt-2 mb-6">
          <span>200 &euro;</span>
          <span>850 &euro;</span>
          <span>1 500 &euro;</span>
        </div>

        {/* CDI reference + freelance bars */}
        <div className="space-y-3">
          {/* CDI reference */}
          <div className="flex items-center gap-3">
            <div className="w-24 text-xs font-medium text-[#8b8b9e] text-right shrink-0">
              CDI actuel
            </div>
            <div className="flex-1 h-8 bg-white/[0.04] rounded-lg overflow-hidden relative">
              <div
                className="h-full rounded-lg bg-white/[0.12] transition-all duration-300"
                style={{
                  width: `${(cdiPackageMensuel / maxExplorerNet) * 100}%`,
                }}
              />
            </div>
            <div className="w-28 text-right shrink-0">
              <span className="text-sm font-bold text-white">
                {fmt(Math.round(cdiPackageMensuel))} &euro;
              </span>
            </div>
          </div>

          <div className="h-px bg-white/[0.06] my-1" />

          {/* Freelance bars */}
          {explorerResults.map((r) => {
            const barWidth =
              maxExplorerNet > 0
                ? (Math.max(0, r.netMensuel) / maxExplorerNet) * 100
                : 0;
            const isAbove = r.deltaMensuel >= 0;

            return (
              <div
                key={r.status}
                className={cn(
                  "flex items-center gap-3",
                  r.ineligible && "opacity-40"
                )}
              >
                <div
                  className="w-24 text-xs font-medium text-right shrink-0"
                  style={{ color: r.color }}
                >
                  {r.label}
                </div>
                <div className="flex-1 h-8 bg-white/[0.04] rounded-lg overflow-hidden relative">
                  <div
                    className="h-full rounded-lg transition-all duration-300"
                    style={{
                      width: `${barWidth}%`,
                      backgroundColor: `${r.color}40`,
                    }}
                  />
                  {/* CDI reference line */}
                  <div
                    className="absolute top-0 bottom-0 w-px bg-white/30"
                    style={{
                      left: `${(cdiPackageMensuel / maxExplorerNet) * 100}%`,
                    }}
                  />
                </div>
                <div className="w-28 text-right shrink-0">
                  <div className="text-sm font-bold text-white">
                    {fmt(Math.round(r.netMensuel))} &euro;
                  </div>
                  <div
                    className={cn(
                      "text-[10px] font-semibold",
                      isAbove ? "text-[#4ade80]" : "text-[#f87171]"
                    )}
                  >
                    {isAbove ? "+" : ""}
                    {fmt(Math.round(r.deltaMensuel))} &euro;
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="text-center text-xs text-[#5a5a6e] pb-8">
        Simulation indicative. Les charges salariales (~23%) et avantages sont
        estim&eacute;s. Consulte un expert-comptable pour un conseil
        personnalis&eacute;.
      </div>
    </div>
  );
}
