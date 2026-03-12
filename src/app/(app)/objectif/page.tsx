"use client";

import { useMemo, useState } from "react";
import { useProfileStore } from "@/stores/useProfileStore";
import { BUSINESS_STATUS_CONFIG } from "@/lib/constants";
import { AVG_JOURS_OUVRES, getAnnualCA, reverseCA, computeNetFromCA, computeIS } from "@/lib/simulation-engine";
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
  ArrowLeftRight,
  Info,
} from "@/components/ui/icons";

const STATUTS: BusinessStatus[] = ["micro", "eurl_ir", "eurl_is", "sasu_ir", "sasu_is", "portage"];

const STATUT_COLORS: Record<string, string> = {
  micro: "#F4BE7E",
  eurl_ir: "#5682F2",
  eurl_is: "#a78bfa",
  sasu_ir: "#f87171",
  sasu_is: "#4ade80",
  portage: "#06b6d4",
};

const MICRO_PLAFOND = 83600;

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
  tauxSocial: number;
  tauxFiscal: number;
  netResult: number; // net annuel (used in CA mode)
  color: string;
  ineligible: boolean;
  ineligibleReason?: string;
  difficulty: "accessible" | "moyen" | "ambitieux" | "difficile";
}

const PFU_RATE = 0.30;

/** Compute net from CA for a specific status (without needing a full profile) */
function computeNetForStatus(
  annualCA: number,
  status: BusinessStatus,
  remType: RemunerationType,
  mixtePartSalaire: number,
  customIrRate?: number
): number {
  const cfg = BUSINESS_STATUS_CONFIG[status];
  const urssaf = cfg.urssaf;
  const ir = customIrRate ?? cfg.ir;

  if (status === "micro") return annualCA * (1 - urssaf - ir);
  if (cfg.is === 0) return annualCA * (1 - urssaf) * (1 - ir);

  const isSASU = status === "sasu_is";
  if (remType === "salaire") return annualCA * (1 - urssaf) * (1 - ir);
  if (remType === "dividendes") {
    const isAmt = computeIS(annualCA);
    const afterIS = annualCA - isAmt;
    if (isSASU) return afterIS * (1 - PFU_RATE);
    return afterIS * (1 - urssaf) * (1 - ir);
  }
  // mixte
  const salPart = mixtePartSalaire / 100;
  const sCost = Math.min(annualCA * salPart, annualCA);
  const sNet = sCost * (1 - urssaf) * (1 - ir);
  const remaining = Math.max(0, annualCA - sCost);
  const isAmt = computeIS(remaining);
  const afterIS = remaining - isAmt;
  const dNet = isSASU ? afterIS * (1 - PFU_RATE) : afterIS * (1 - urssaf) * (1 - ir);
  return sNet + dNet;
}

/** Breakdown taux effectif into social charges vs fiscal (IR/IS) */
function computeTauxBreakdown(
  status: BusinessStatus,
  requiredCA: number,
  remType: RemunerationType,
  mixtePartSalaire: number,
  customIrRate?: number
): { social: number; fiscal: number } {
  if (requiredCA <= 0) return { social: 0, fiscal: 0 };
  const cfg = BUSINESS_STATUS_CONFIG[status];
  const urssaf = cfg.urssaf;
  const ir = customIrRate ?? cfg.ir;

  if (status === "micro") return { social: urssaf, fiscal: ir };
  if (cfg.is === 0) return { social: urssaf, fiscal: (1 - urssaf) * ir };

  const isSASU = status === "sasu_is";
  if (remType === "salaire") return { social: urssaf, fiscal: (1 - urssaf) * ir };

  if (remType === "dividendes") {
    const isAmt = computeIS(requiredCA);
    const afterIS = requiredCA - isAmt;
    if (isSASU) {
      return {
        social: (afterIS * 0.172) / requiredCA,
        fiscal: (isAmt + afterIS * 0.128) / requiredCA,
      };
    }
    const socialAmt = afterIS * urssaf;
    const irAmt = (afterIS - socialAmt) * ir;
    return { social: socialAmt / requiredCA, fiscal: (isAmt + irAmt) / requiredCA };
  }

  // Mixte
  const salPart = mixtePartSalaire / 100;
  const salCost = requiredCA * salPart;
  const salSocialAmt = salCost * urssaf;
  const salIRAmt = (salCost - salSocialAmt) * ir;
  const remaining = requiredCA - salCost;
  const isAmt = computeIS(remaining);
  const afterIS = remaining - isAmt;
  let divSocialAmt: number, divIRAmt: number;
  if (isSASU) {
    divSocialAmt = afterIS * 0.172;
    divIRAmt = afterIS * 0.128;
  } else {
    divSocialAmt = afterIS * urssaf;
    divIRAmt = (afterIS - divSocialAmt) * ir;
  }
  return {
    social: (salSocialAmt + divSocialAmt) / requiredCA,
    fiscal: (isAmt + salIRAmt + divIRAmt) / requiredCA,
  };
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
  const { clients, businessStatus, workDaysPerWeek, monthlyExpenses, remunerationType, mixtePartSalaire, customIrRate, vacationDaysPerMonth } =
    useProfileStore();

  const profile = useProfileStore();

  // Compute user's actual monthly net from their profile data
  const userMonthlyNet = useMemo(() => {
    const annualCA = getAnnualCA(clients, vacationDaysPerMonth);
    if (annualCA <= 0) return 4000; // fallback
    const netAnnual = computeNetFromCA(annualCA, profile);
    return Math.round(netAnnual / 12 / 100) * 100; // round to nearest 100
  }, [clients, vacationDaysPerMonth, profile]);

  const [inputMode, setInputMode] = useState<"net" | "ca">("net");
  const [targetNet, setTargetNet] = useState<number | null>(null);
  const effectiveTargetNet = targetNet ?? userMonthlyNet;
  const [targetMonthlyCA, setTargetMonthlyCA] = useState<number>(8000);

  // Compute vacation weeks from profile vacation days
  const profileVacationWeeks = useMemo(() => {
    if (!vacationDaysPerMonth) return 5;
    const totalDays = vacationDaysPerMonth.reduce((s, d) => s + d, 0);
    return Math.round(totalDays / 5); // 5 days per week
  }, [vacationDaysPerMonth]);

  const [vacationWeeks, setVacationWeeks] = useState<number | null>(null);
  const effectiveVacationWeeks = vacationWeeks ?? profileVacationWeeks;
  const [localRemType, setLocalRemType] = useState<RemunerationType>(remunerationType ?? "salaire");
  const [localMixte, setLocalMixte] = useState(mixtePartSalaire ?? 50);

  // Worked days per year
  const workedWeeks = 52 - effectiveVacationWeeks;
  const workedDaysPerYear = workedWeeks * workDaysPerWeek;

  const targetAnnualNet = effectiveTargetNet * 12;

  const targetAnnualCA = targetMonthlyCA * 12;

  const results = useMemo((): GoalResult[] => {
    return STATUTS.map((s) => {
      const cfg = BUSINESS_STATUS_CONFIG[s];
      const color = STATUT_COLORS[s] ?? "#5682F2";
      const remType = (s === "eurl_is" || s === "sasu_is" || s === "sasu_ir") ? localRemType : "salaire";

      let requiredCA: number;
      let netResult: number;

      if (inputMode === "net") {
        requiredCA = reverseCA(targetAnnualNet, s, remType, localMixte, customIrRate);
        netResult = targetAnnualNet;
      } else {
        requiredCA = targetAnnualCA;
        netResult = computeNetForStatus(targetAnnualCA, s, remType, localMixte, customIrRate);
      }

      const requiredTJM = workedDaysPerYear > 0 ? requiredCA / workedDaysPerYear : 0;
      const requiredDaysPerWeek = workedWeeks > 0 && requiredTJM > 0
        ? requiredCA / (workedWeeks * requiredTJM)
        : 0;

      const tauxEffectif = requiredCA > 0 ? (requiredCA - netResult) / requiredCA : 0;
      const breakdown = computeTauxBreakdown(s, requiredCA, remType, localMixte, customIrRate);

      const ineligible = s === "micro" && requiredCA > MICRO_PLAFOND;

      return {
        status: s,
        label: cfg.label,
        requiredCA,
        requiredTJM,
        requiredDaysPerWeek,
        tauxEffectif,
        tauxSocial: breakdown.social,
        tauxFiscal: breakdown.fiscal,
        netResult,
        color,
        ineligible,
        ineligibleReason: ineligible ? `CA requis dépasse le plafond micro (${fmt(MICRO_PLAFOND)} €)` : undefined,
        difficulty: getDifficulty(requiredTJM),
      };
    });
  }, [targetAnnualNet, targetAnnualCA, inputMode, localRemType, localMixte, workedDaysPerYear, workedWeeks, customIrRate]);

  // Best = lowest required TJM (net mode) or highest net result (CA mode)
  const best = useMemo(() => {
    const eligible = results.filter((r) => !r.ineligible && isFinite(r.requiredTJM));
    if (eligible.length === 0) return results[0];
    if (inputMode === "ca") {
      return eligible.reduce((a, b) => (a.netResult > b.netResult ? a : b));
    }
    return eligible.reduce((a, b) => (a.requiredTJM < b.requiredTJM ? a : b));
  }, [results, inputMode]);

  const maxTJM = Math.max(...results.filter((r) => isFinite(r.requiredTJM)).map((r) => r.requiredTJM), 1);
  const maxNet = Math.max(...results.map((r) => r.netResult), 1);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-1">Objectif Revenu</h1>
        <p className="text-muted-foreground">
          Combien tu dois facturer pour atteindre ton objectif de revenu net ?
        </p>
      </div>

      {/* Mode toggle + Goal slider */}
      <div className="bg-card rounded-2xl border border-border p-6">
        {/* Mode toggle */}
        <div className="flex items-center gap-2 mb-5">
          <button
            onClick={() => setInputMode("net")}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all",
              inputMode === "net"
                ? "bg-primary/15 text-primary ring-1 ring-primary/30"
                : "bg-muted/50 text-muted-foreground hover:text-foreground"
            )}
          >
            Net mensuel
          </button>
          <ArrowLeftRight className="size-3.5 text-muted-foreground/40" />
          <button
            onClick={() => setInputMode("ca")}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all",
              inputMode === "ca"
                ? "bg-primary/15 text-primary ring-1 ring-primary/30"
                : "bg-muted/50 text-muted-foreground hover:text-foreground"
            )}
          >
            CA brut mensuel
          </button>
        </div>

        {inputMode === "net" ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs text-muted-foreground/60 uppercase tracking-wider mb-1">Mon objectif net mensuel</div>
                <div className="flex items-baseline gap-3">
                  <input
                    type="number"
                    min={500}
                    max={50000}
                    step={100}
                    value={effectiveTargetNet}
                    onChange={(e) => setTargetNet(Math.max(500, Number(e.target.value)))}
                    className="text-3xl font-bold fn-gradient-text bg-transparent border-none outline-none w-32 tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-lg text-muted-foreground/60">&euro;/mois</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground/60">Soit par an</div>
                <div className="text-lg font-bold text-foreground">{fmt(targetAnnualNet)} &euro;</div>
              </div>
            </div>
            <input
              type="range"
              min={1500}
              max={25000}
              step={100}
              value={Math.min(effectiveTargetNet, 25000)}
              onChange={(e) => setTargetNet(Number(e.target.value))}
              className="w-full accent-[#5682F2] h-2 bg-muted rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#5682F2] [&::-webkit-slider-thumb]:shadow-lg"
            />
            <div className="flex justify-between text-xs text-muted-foreground/60 mt-2">
              <span>1 500 &euro;</span>
              <span>12 500 &euro;</span>
              <span>25 000 &euro;</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs text-muted-foreground/60 uppercase tracking-wider mb-1">Mon CA brut mensuel</div>
                <div className="flex items-baseline gap-3">
                  <input
                    type="number"
                    min={1000}
                    max={100000}
                    step={500}
                    value={targetMonthlyCA}
                    onChange={(e) => setTargetMonthlyCA(Math.max(1000, Number(e.target.value)))}
                    className="text-3xl font-bold fn-gradient-text bg-transparent border-none outline-none w-32 tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-lg text-muted-foreground/60">&euro;/mois</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground/60">Soit par an</div>
                <div className="text-lg font-bold text-foreground">{fmt(targetAnnualCA)} &euro;</div>
              </div>
            </div>
            <input
              type="range"
              min={2000}
              max={40000}
              step={500}
              value={Math.min(targetMonthlyCA, 40000)}
              onChange={(e) => setTargetMonthlyCA(Number(e.target.value))}
              className="w-full accent-[#5682F2] h-2 bg-muted rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#5682F2] [&::-webkit-slider-thumb]:shadow-lg"
            />
            <div className="flex justify-between text-xs text-muted-foreground/60 mt-2">
              <span>2 000 &euro;</span>
              <span>20 000 &euro;</span>
              <span>40 000 &euro;</span>
            </div>
          </>
        )}
      </div>

      {/* Vacation + Remuneration controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Vacation weeks */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="text-xs text-muted-foreground/60 uppercase tracking-wider mb-3">Semaines de vacances</div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl font-bold text-foreground">{effectiveVacationWeeks} sem.</span>
            <span className="text-sm text-muted-foreground">{workedDaysPerYear} jours travaillés/an</span>
          </div>
          <input
            type="range"
            min={0}
            max={12}
            step={1}
            value={effectiveVacationWeeks}
            onChange={(e) => setVacationWeeks(Number(e.target.value))}
            className="w-full accent-[#F4BE7E] h-2 bg-muted rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#F4BE7E] [&::-webkit-slider-thumb]:shadow-lg"
          />
        </div>

        {/* Remuneration type */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="text-xs text-muted-foreground/60 uppercase tracking-wider mb-3">
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
                    ? "bg-primary/15 text-primary ring-1 ring-primary/30"
                    : "bg-muted/50 text-muted-foreground hover:text-foreground"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {localRemType === "mixte" && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-muted-foreground">Salaire / Dividendes</span>
                <span className="text-xs font-bold text-foreground">{localMixte}% / {100 - localMixte}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={localMixte}
                onChange={(e) => setLocalMixte(Number(e.target.value))}
                className="w-full accent-[#5682F2] h-1.5 bg-muted rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#5682F2]"
              />
            </div>
          )}
        </div>
      </div>

      {/* Best status recommendation */}
      <div className="flex items-center gap-3 bg-card rounded-2xl border border-border p-5">
        <div
          className="size-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${best.color}15` }}
        >
          <Target className="size-6" style={{ color: best.color }} />
        </div>
        <div className="flex-1">
          <div className="text-xs text-muted-foreground/60 uppercase tracking-wider">Statut le plus avantageux</div>
          <div className="text-lg font-bold text-foreground">{best.label}</div>
          <div className="text-sm text-muted-foreground">
            {inputMode === "net" ? (
              <>TJM minimum {fmt(best.requiredTJM)} &euro; &middot; CA requis {fmt(best.requiredCA)} &euro;/an</>
            ) : (
              <>Net {fmt(best.netResult / 12)} &euro;/mois &middot; TJM équivalent {fmt(best.requiredTJM)} &euro;</>
            )}
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
          const barWidth = inputMode === "net"
            ? (maxTJM > 0 && isFinite(r.requiredTJM) ? (r.requiredTJM / maxTJM) * 100 : 0)
            : (maxNet > 0 ? (r.netResult / maxNet) * 100 : 0);
          const diffCfg = DIFFICULTY_CONFIG[r.difficulty];

          return (
            <div
              key={r.status}
              className={cn(
                "bg-card rounded-2xl border p-5 transition-all",
                r.ineligible
                  ? "border-[#f87171]/20 opacity-60"
                  : isBest
                    ? "border-border ring-1 ring-border"
                    : "border-border"
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
              <h3 className="text-base font-bold text-foreground mb-1">{r.label}</h3>
              <p className="text-xs text-muted-foreground/60 mb-4">{BUSINESS_STATUS_CONFIG[r.status].regime}</p>

              {/* Big number: TJM (net mode) or Net mensuel (CA mode) */}
              <div className="mb-4">
                {inputMode === "net" ? (
                  <div className="text-2xl font-bold" style={{ color: r.color }}>
                    {fmt(r.requiredTJM)} &euro;
                    <span className="text-sm font-normal text-muted-foreground/60">/jour</span>
                  </div>
                ) : (
                  <div className="text-2xl font-bold" style={{ color: r.color }}>
                    {fmt(r.netResult / 12)} &euro;
                    <span className="text-sm font-normal text-muted-foreground/60">/mois net</span>
                  </div>
                )}
              </div>

              {/* Bar */}
              <div className="h-2 bg-muted/50 rounded-full mb-5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${barWidth}%`, backgroundColor: r.color }}
                />
              </div>

              {/* Details */}
              <div className="space-y-2.5 text-sm">
                {inputMode === "net" ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Banknote className="size-3.5" />
                      <span>CA requis</span>
                    </div>
                    <span className="font-medium text-foreground">{fmt(r.requiredCA)} &euro;</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CalendarDays className="size-3.5" />
                      <span>TJM équiv.</span>
                    </div>
                    <span className="font-medium text-foreground">{fmt(r.requiredTJM)} &euro;</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Gauge className="size-3.5" />
                    <span>Taux effectif</span>
                  </div>
                  <span className="font-bold text-foreground">{Math.round(r.tauxEffectif * 100)}%</span>
                </div>
                {/* Breakdown: cotisations sociales + impôts */}
                <div className="ml-5.5 space-y-1 text-xs text-muted-foreground/80">
                  <div className="flex items-center justify-between">
                    <span>Cotisations sociales</span>
                    <span>{Math.round(r.tauxSocial * 100)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Impôts (IR/IS)</span>
                    <span>{Math.round(r.tauxFiscal * 100)}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CalendarDays className="size-3.5" />
                    <span>Jours/sem requis</span>
                  </div>
                  <span className="font-bold text-foreground">{r.requiredDaysPerWeek.toFixed(1)}j</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Context: expenses reminder */}
      {inputMode === "net" && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center gap-3">
            <CircleAlert className="size-5 text-[#F4BE7E] shrink-0" />
            <div className="text-sm text-muted-foreground">
              Ton objectif de <strong className="text-foreground">{fmt(effectiveTargetNet)} &euro; net/mois</strong> inclut tes charges de vie.
              Avec <strong className="text-foreground">{fmt(monthlyExpenses)} &euro;/mois</strong> de charges,
              il te reste <strong className={cn(effectiveTargetNet - monthlyExpenses >= 0 ? "text-[#4ade80]" : "text-[#f87171]")}>
                {fmt(effectiveTargetNet - monthlyExpenses)} &euro;
              </strong> d&apos;épargne/loisirs.
            </div>
          </div>
        </div>
      )}

      {/* Info: taux effectif explanation */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <div className="flex items-center gap-3">
          <Info className="size-5 text-muted-foreground/60 shrink-0" />
          <div className="text-sm text-muted-foreground">
            Le <strong className="text-foreground">taux effectif</strong> inclut les cotisations sociales (URSSAF)
            <strong> et </strong> l&apos;impôt sur le revenu/sociétés.
            Un comptable peut indiquer un taux inférieur s&apos;il ne montre que les cotisations sociales.
            <strong className="text-foreground"> Hors TVA.</strong>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="text-center text-xs text-muted-foreground/60 pb-8">
        Simulation indicative &middot; Hors TVA &middot; {workedDaysPerYear} jours travaillés/an &middot; Taux moyens.
        Consulte un expert-comptable pour un conseil personnalisé.
      </div>
    </div>
  );
}
