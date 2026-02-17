"use client";

import { useMemo, useState } from "react";
import { useProfileStore } from "@/stores/useProfileStore";
import { BUSINESS_STATUS_CONFIG } from "@/lib/constants";
import { AVG_JOURS_OUVRES } from "@/lib/simulation-engine";
import { fmt, cn } from "@/lib/utils";
import type { BusinessStatus, RemunerationType } from "@/types";
import {
  Check,
  CircleAlert,
  Target,
  TrendingUp,
  Banknote,
  CalendarDays,
  Gauge,
} from "@/components/ui/icons";

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

// TJM market benchmarks for difficulty badges
const TJM_SEUILS = {
  accessible: 400,
  moyen: 600,
  ambitieux: 800,
};

interface GoalResult {
  status: BusinessStatus;
  label: string;
  requiredCA: number;
  requiredTJM: number;
  requiredDaysPerWeek: number;
  tauxEffectif: number;
  color: string;
  ineligible: boolean;
  ineligibleReason?: string;
  difficulty: "accessible" | "moyen" | "ambitieux" | "difficile";
}

/**
 * Reverse calculation: given a desired annual net, find the required CA.
 */
function reverseCA(
  targetNet: number,
  status: BusinessStatus,
  remType: RemunerationType,
  mixtePartSalaire: number
): number {
  const cfg = BUSINESS_STATUS_CONFIG[status];
  const urssaf = cfg.urssaf;
  const ir = cfg.ir;
  const is = cfg.is;

  if (status === "micro") {
    // net = CA * (1 - urssaf - ir)
    return targetNet / (1 - urssaf - ir);
  }

  if (is === 0) {
    // IR structures: net = CA * (1 - urssaf) * (1 - ir)
    return targetNet / ((1 - urssaf) * (1 - ir));
  }

  // IS structures
  const isSASU = status === "sasu_is";

  if (remType === "salaire") {
    return targetNet / ((1 - urssaf) * (1 - ir));
  }

  if (remType === "dividendes") {
    if (isSASU) {
      // net = CA * (1 - is) * (1 - PFU)
      return targetNet / ((1 - is) * (1 - PFU_RATE));
    }
    // EURL: net = CA * (1 - is) * (1 - urssaf) * (1 - ir)
    return targetNet / ((1 - is) * (1 - urssaf) * (1 - ir));
  }

  // Mixte: split
  const salPart = mixtePartSalaire / 100;
  const divPart = 1 - salPart;

  // salaryNet = CA * salPart * (1-urssaf) * (1-ir)
  // divNet: remaining = CA * divPart, afterIS = remaining * (1-is)
  //   SASU: divNet = afterIS * (1-PFU)
  //   EURL: divNet = afterIS * (1-urssaf) * (1-ir)
  const salaryMultiplier = salPart * (1 - urssaf) * (1 - ir);
  const divMultiplier = isSASU
    ? divPart * (1 - is) * (1 - PFU_RATE)
    : divPart * (1 - is) * (1 - urssaf) * (1 - ir);

  const totalMultiplier = salaryMultiplier + divMultiplier;
  if (totalMultiplier <= 0) return Infinity;

  return targetNet / totalMultiplier;
}

function getDifficulty(tjm: number): GoalResult["difficulty"] {
  if (tjm <= TJM_SEUILS.accessible) return "accessible";
  if (tjm <= TJM_SEUILS.moyen) return "moyen";
  if (tjm <= TJM_SEUILS.ambitieux) return "ambitieux";
  return "difficile";
}

const DIFFICULTY_CONFIG = {
  accessible: { label: "Accessible", color: "#4ade80", bg: "bg-[#4ade80]/10" },
  moyen: { label: "Moyen", color: "#F4BE7E", bg: "bg-[#F4BE7E]/10" },
  ambitieux: { label: "Ambitieux", color: "#f97316", bg: "bg-[#f97316]/10" },
  difficile: { label: "Difficile", color: "#f87171", bg: "bg-[#f87171]/10" },
};

export default function ObjectifPage() {
  const { workDaysPerWeek, monthlyExpenses, remunerationType, mixtePartSalaire } =
    useProfileStore();

  const [targetNet, setTargetNet] = useState(4000);
  const [vacationWeeks, setVacationWeeks] = useState(5);
  const [localRemType, setLocalRemType] = useState<RemunerationType>(remunerationType ?? "salaire");
  const [localMixte, setLocalMixte] = useState(mixtePartSalaire ?? 50);

  // Worked days per year
  const workedWeeks = 52 - vacationWeeks;
  const workedDaysPerYear = workedWeeks * workDaysPerWeek;

  const targetAnnualNet = targetNet * 12;

  const results = useMemo((): GoalResult[] => {
    return STATUTS.map((s) => {
      const cfg = BUSINESS_STATUS_CONFIG[s];
      const color = STATUT_COLORS[s] ?? "#5682F2";
      const remType = (s === "eurl_is" || s === "sasu_is") ? localRemType : "salaire";

      const requiredCA = reverseCA(targetAnnualNet, s, remType, localMixte);
      const requiredTJM = workedDaysPerYear > 0 ? requiredCA / workedDaysPerYear : 0;
      const requiredDaysPerWeek = workedWeeks > 0 && requiredTJM > 0
        ? requiredCA / (workedWeeks * requiredTJM)
        : 0;

      const tauxEffectif = requiredCA > 0 ? (requiredCA - targetAnnualNet) / requiredCA : 0;

      const ineligible = s === "micro" && requiredCA > MICRO_PLAFOND;

      return {
        status: s,
        label: cfg.label,
        requiredCA,
        requiredTJM,
        requiredDaysPerWeek,
        tauxEffectif,
        color,
        ineligible,
        ineligibleReason: ineligible ? `CA requis dépasse le plafond micro (${fmt(MICRO_PLAFOND)} €)` : undefined,
        difficulty: getDifficulty(requiredTJM),
      };
    });
  }, [targetAnnualNet, localRemType, localMixte, workedDaysPerYear, workedWeeks]);

  // Best = lowest required TJM among eligible
  const best = useMemo(() => {
    const eligible = results.filter((r) => !r.ineligible && isFinite(r.requiredTJM));
    if (eligible.length === 0) return results[0];
    return eligible.reduce((a, b) => (a.requiredTJM < b.requiredTJM ? a : b));
  }, [results]);

  const maxTJM = Math.max(...results.filter((r) => isFinite(r.requiredTJM)).map((r) => r.requiredTJM), 1);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Objectif Revenu</h1>
        <p className="text-[#8b8b9e]">
          Combien tu dois facturer pour atteindre ton objectif de revenu net ?
        </p>
      </div>

      {/* Goal slider */}
      <div className="bg-[#12121c] rounded-2xl border border-white/[0.06] p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs text-[#5a5a6e] uppercase tracking-wider mb-1">Mon objectif net mensuel</div>
            <div className="text-3xl font-bold fn-gradient-text">{fmt(targetNet)} &euro;/mois</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-[#5a5a6e]">Soit par an</div>
            <div className="text-lg font-bold text-white">{fmt(targetAnnualNet)} &euro;</div>
          </div>
        </div>
        <input
          type="range"
          min={1500}
          max={15000}
          step={100}
          value={targetNet}
          onChange={(e) => setTargetNet(Number(e.target.value))}
          className="w-full accent-[#5682F2] h-2 bg-white/[0.06] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#5682F2] [&::-webkit-slider-thumb]:shadow-lg"
        />
        <div className="flex justify-between text-xs text-[#5a5a6e] mt-2">
          <span>1 500 &euro;</span>
          <span>8 000 &euro;</span>
          <span>15 000 &euro;</span>
        </div>
      </div>

      {/* Vacation + Remuneration controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Vacation weeks */}
        <div className="bg-[#12121c] rounded-2xl border border-white/[0.06] p-6">
          <div className="text-xs text-[#5a5a6e] uppercase tracking-wider mb-3">Semaines de vacances</div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl font-bold text-white">{vacationWeeks} sem.</span>
            <span className="text-sm text-[#8b8b9e]">{workedDaysPerYear} jours travaillés/an</span>
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

        {/* Remuneration type */}
        <div className="bg-[#12121c] rounded-2xl border border-white/[0.06] p-6">
          <div className="text-xs text-[#5a5a6e] uppercase tracking-wider mb-3">
            Rémunération (IS)
          </div>
          <div className="flex gap-2 mb-3">
            {([
              { value: "salaire" as const, label: "Salaire" },
              { value: "dividendes" as const, label: "Dividendes" },
              { value: "mixte" as const, label: "Mixte" },
            ]).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setLocalRemType(opt.value)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  localRemType === opt.value
                    ? "bg-[#5682F2]/15 text-[#5682F2] ring-1 ring-[#5682F2]/30"
                    : "bg-white/[0.04] text-[#8b8b9e] hover:text-white"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {localRemType === "mixte" && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-[#8b8b9e]">Salaire / Dividendes</span>
                <span className="text-xs font-bold text-white">{localMixte}% / {100 - localMixte}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={localMixte}
                onChange={(e) => setLocalMixte(Number(e.target.value))}
                className="w-full accent-[#5682F2] h-1.5 bg-white/[0.06] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#5682F2]"
              />
            </div>
          )}
        </div>
      </div>

      {/* Best status recommendation */}
      <div className="flex items-center gap-3 bg-[#12121c] rounded-2xl border border-white/[0.06] p-5">
        <div
          className="size-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${best.color}15` }}
        >
          <Target className="size-6" style={{ color: best.color }} />
        </div>
        <div className="flex-1">
          <div className="text-xs text-[#5a5a6e] uppercase tracking-wider">Statut le plus avantageux</div>
          <div className="text-lg font-bold text-white">{best.label}</div>
          <div className="text-sm text-[#8b8b9e]">
            TJM minimum {fmt(best.requiredTJM)} &euro; &middot; CA requis {fmt(best.requiredCA)} &euro;/an
          </div>
        </div>
        <div className={cn("px-3 py-1.5 rounded-full text-xs font-bold", DIFFICULTY_CONFIG[best.difficulty].bg)}
          style={{ color: DIFFICULTY_CONFIG[best.difficulty].color }}>
          {DIFFICULTY_CONFIG[best.difficulty].label}
        </div>
      </div>

      {/* Result cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        {results.map((r) => {
          const isBest = r.status === best.status && !r.ineligible;
          const barWidth = maxTJM > 0 && isFinite(r.requiredTJM) ? (r.requiredTJM / maxTJM) * 100 : 0;
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
                <span
                  className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider", diffCfg.bg)}
                  style={{ color: diffCfg.color }}
                >
                  {diffCfg.label}
                </span>
              </div>

              {r.ineligible && r.ineligibleReason && (
                <div className="text-[11px] text-[#f87171] mb-2">{r.ineligibleReason}</div>
              )}

              {/* Status name */}
              <h3 className="text-base font-bold text-white mb-1">{r.label}</h3>
              <p className="text-xs text-[#5a5a6e] mb-4">{BUSINESS_STATUS_CONFIG[r.status].regime}</p>

              {/* TJM - big number */}
              <div className="mb-4">
                <div className="text-2xl font-bold" style={{ color: r.color }}>
                  {fmt(r.requiredTJM)} &euro;
                  <span className="text-sm font-normal text-[#5a5a6e]">/jour</span>
                </div>
              </div>

              {/* TJM bar (inverted: lower = better) */}
              <div className="h-2 bg-white/[0.04] rounded-full mb-5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${barWidth}%`, backgroundColor: r.color }}
                />
              </div>

              {/* Details */}
              <div className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#8b8b9e]">
                    <Banknote className="size-3.5" />
                    <span>CA requis</span>
                  </div>
                  <span className="font-medium text-white">{fmt(r.requiredCA)} &euro;</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#8b8b9e]">
                    <Gauge className="size-3.5" />
                    <span>Taux effectif</span>
                  </div>
                  <span className="font-bold text-white">{Math.round(r.tauxEffectif * 100)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#8b8b9e]">
                    <CalendarDays className="size-3.5" />
                    <span>Jours/sem requis</span>
                  </div>
                  <span className="font-bold text-white">{r.requiredDaysPerWeek.toFixed(1)}j</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Context: expenses reminder */}
      <div className="bg-[#12121c] rounded-2xl border border-white/[0.06] p-5">
        <div className="flex items-center gap-3">
          <CircleAlert className="size-5 text-[#F4BE7E] shrink-0" />
          <div className="text-sm text-[#8b8b9e]">
            Ton objectif de <strong className="text-white">{fmt(targetNet)} &euro; net/mois</strong> inclut tes charges de vie.
            Avec <strong className="text-white">{fmt(monthlyExpenses)} &euro;/mois</strong> de charges,
            il te reste <strong className={cn(targetNet - monthlyExpenses >= 0 ? "text-[#4ade80]" : "text-[#f87171]")}>
              {fmt(targetNet - monthlyExpenses)} &euro;
            </strong> d&apos;épargne/loisirs.
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="text-center text-xs text-[#5a5a6e] pb-8">
        Simulation indicative basée sur des taux moyens et {workedDaysPerYear} jours travaillés/an.
        Consulte un expert-comptable pour un conseil personnalisé.
      </div>
    </div>
  );
}
