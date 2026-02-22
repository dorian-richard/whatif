"use client";

import { useMemo, useState } from "react";
import { useProfileStore } from "@/stores/useProfileStore";
import { getAnnualCA } from "@/lib/simulation-engine";
import { BUSINESS_STATUS_CONFIG } from "@/lib/constants";
import { fmt, cn } from "@/lib/utils";
import type { BusinessStatus, RemunerationType } from "@/types";
import { Shield, TrendingUp, Banknote, CalendarDays } from "@/components/ui/icons";

const STATUTS: BusinessStatus[] = ["micro", "ei", "eurl_ir", "eurl_is", "sasu_ir", "sasu_is"];

const STATUT_COLORS: Record<string, string> = {
  micro: "#F4BE7E",
  ei: "#f97316",
  eurl_ir: "#5682F2",
  eurl_is: "#a78bfa",
  sasu_ir: "#f87171",
  sasu_is: "#4ade80",
};

const PFU_RATE = 0.30;

interface AcreResult {
  status: BusinessStatus;
  label: string;
  regime: string;
  color: string;
  urssafNormal: number;
  urssafAcre: number;
  netNormal: number;
  netAcre: number;
  economieAnnuelle: number;
  economieMensuelle: number;
}

/**
 * Taux URSSAF avec ACRE :
 * - TNS (micro, ei, eurl_ir, eurl_is) : 50% de reduction sur le total
 * - SASU (assimile salarie) : seule la part patronale (~45%) est reduite de 50%,
 *   la part salariale (~22%) reste intacte. Soit : 0.65 - 0.225 = 0.425
 */
function getAcreUrssafRate(status: BusinessStatus): number {
  const cfg = BUSINESS_STATUS_CONFIG[status];
  if (status === "sasu_ir" || status === "sasu_is") {
    return cfg.urssaf - 0.225; // 0.425
  }
  return cfg.urssaf * 0.5;
}

/**
 * Calcul net identique au comparateur, avec urssaf paramétrable.
 */
function computeNet(
  annualCA: number,
  status: BusinessStatus,
  urssafRate: number,
  remunerationType: RemunerationType,
  mixtePartSalaire: number,
  customIrRate?: number,
): number {
  const cfg = BUSINESS_STATUS_CONFIG[status];
  const ir = customIrRate ?? cfg.ir;
  const is = cfg.is;

  if (status === "micro") {
    return annualCA * (1 - urssafRate - ir);
  }

  if (is === 0) {
    // IR structures
    if (status === "sasu_ir" && remunerationType === "dividendes") {
      return annualCA * (1 - ir);
    }
    if (status === "sasu_ir" && remunerationType === "mixte") {
      const salaryCost = annualCA * (mixtePartSalaire / 100);
      const salaryNet = salaryCost * (1 - urssafRate);
      const remaining = annualCA - salaryCost;
      return (salaryNet + remaining) * (1 - ir);
    }
    return annualCA * (1 - urssafRate) * (1 - ir);
  }

  // IS structures
  const isSASU = status === "sasu_is";

  if (remunerationType === "salaire") {
    return annualCA * (1 - urssafRate) * (1 - ir);
  }

  if (remunerationType === "dividendes") {
    const afterIS = annualCA * (1 - is);
    if (isSASU) return afterIS * (1 - PFU_RATE);
    return afterIS * (1 - urssafRate) * (1 - ir);
  }

  // Mixte
  const salaryCost = annualCA * (mixtePartSalaire / 100);
  const salaryNet = salaryCost * (1 - urssafRate);
  const salaryAfterIR = salaryNet * (1 - ir);

  const remaining = Math.max(0, annualCA - salaryCost);
  const afterIS = remaining * (1 - is);

  if (isSASU) {
    return salaryAfterIR + afterIS * (1 - PFU_RATE);
  }
  return salaryAfterIR + afterIS * (1 - urssafRate) * (1 - ir);
}

export default function AcrePage() {
  const { clients, remunerationType, mixtePartSalaire, customIrRate } = useProfileStore();

  const baseAnnualCA = useMemo(() => getAnnualCA(clients), [clients]);

  const [caOverride, setCaOverride] = useState<number | null>(null);
  const annualCA = caOverride ?? baseAnnualCA;
  const sliderMax = Math.max(300000, Math.ceil(baseAnnualCA / 50000) * 50000 + 50000);

  const [localRemType, setLocalRemType] = useState<RemunerationType>(remunerationType ?? "salaire");
  const [localMixte, setLocalMixte] = useState(mixtePartSalaire ?? 50);

  const results = useMemo(() => {
    return STATUTS.map((s): AcreResult => {
      const cfg = BUSINESS_STATUS_CONFIG[s];
      const remType = (s === "eurl_is" || s === "sasu_is" || s === "sasu_ir") ? localRemType : "salaire";
      const normalUrssaf = cfg.urssaf;
      const acreUrssaf = getAcreUrssafRate(s);

      const netNormal = computeNet(annualCA, s, normalUrssaf, remType, localMixte, customIrRate);
      const netAcre = computeNet(annualCA, s, acreUrssaf, remType, localMixte, customIrRate);
      const economie = netAcre - netNormal;

      return {
        status: s,
        label: cfg.label,
        regime: cfg.regime,
        color: STATUT_COLORS[s],
        urssafNormal: normalUrssaf,
        urssafAcre: acreUrssaf,
        netNormal,
        netAcre,
        economieAnnuelle: economie,
        economieMensuelle: economie / 12,
      };
    });
  }, [annualCA, localRemType, localMixte, customIrRate]);

  const bestSaving = useMemo(
    () => results.reduce((a, b) => (a.economieAnnuelle > b.economieAnnuelle ? a : b)),
    [results]
  );

  const totalSavingForCurrentStatus = results.find(
    (r) => r.status === useProfileStore.getState().businessStatus
  )?.economieAnnuelle ?? 0;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-1">Simulateur ACRE</h1>
        <p className="text-muted-foreground">
          Calcule tes &eacute;conomies avec l&apos;ACRE : -50% de charges sociales pendant 4 trimestres.
        </p>
      </div>

      {/* CA Slider */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs text-muted-foreground/60 uppercase tracking-wider mb-1">Chiffre d&apos;affaires annuel</div>
            <div className="text-3xl font-bold text-foreground">{fmt(annualCA)} &euro;</div>
          </div>
          {caOverride !== null && (
            <button onClick={() => setCaOverride(null)} className="text-xs text-primary hover:underline">
              Revenir au CA r&eacute;el
            </button>
          )}
        </div>
        <input
          type="range"
          min={10000}
          max={sliderMax}
          step={1000}
          value={annualCA}
          onChange={(e) => setCaOverride(Number(e.target.value))}
          className="w-full accent-[#5682F2] h-2 bg-muted rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#5682F2] [&::-webkit-slider-thumb]:shadow-lg"
        />
        <div className="flex justify-between text-xs text-muted-foreground/60 mt-2">
          <span>10 000 &euro;</span>
          <span>{fmt(Math.round(sliderMax / 2))} &euro;</span>
          <span>{fmt(sliderMax)} &euro;</span>
        </div>
      </div>

      {/* Remuneration type */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="text-xs text-muted-foreground/60 uppercase tracking-wider mb-3">
          Mode de r&eacute;mun&eacute;ration (SASU IR / EURL IS / SASU IS)
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
                  ? "bg-primary/15 text-primary ring-1 ring-primary/30"
                  : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {localRemType === "mixte" && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">R&eacute;partition salaire / dividendes</span>
              <span className="text-sm font-bold text-foreground">{localMixte}% / {100 - localMixte}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={localMixte}
              onChange={(e) => setLocalMixte(Number(e.target.value))}
              className="w-full accent-[#5682F2] h-2 bg-muted rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#5682F2] [&::-webkit-slider-thumb]:shadow-lg"
            />
            <div className="flex justify-between text-xs text-muted-foreground/60 mt-1">
              <span>100% Dividendes</span>
              <span>100% Salaire</span>
            </div>
          </div>
        )}
      </div>

      {/* Best saving summary */}
      <div className="flex items-center gap-4 bg-card rounded-2xl border border-border p-5">
        <div className="size-12 rounded-xl flex items-center justify-center bg-[#06b6d4]/15">
          <Shield className="size-6 text-[#06b6d4]" />
        </div>
        <div className="flex-1">
          <div className="text-xs text-muted-foreground/60 uppercase tracking-wider">
            &Eacute;conomie ACRE max sur 12 mois
          </div>
          <div className="text-2xl font-bold text-[#4ade80]">
            +{fmt(bestSaving.economieAnnuelle)} &euro;/an
          </div>
          <div className="text-sm text-muted-foreground">
            avec {bestSaving.label} &middot; soit +{fmt(bestSaving.economieMensuelle)} &euro;/mois de net
          </div>
        </div>
      </div>

      {/* Comparison grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {results.map((r) => {
          const isBest = r.status === bestSaving.status;
          return (
            <div
              key={r.status}
              className={cn(
                "bg-card rounded-2xl border p-5 transition-all",
                isBest ? "border-border ring-1 ring-border" : "border-border"
              )}
            >
              {isBest && (
                <span
                  className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3"
                  style={{ backgroundColor: `${r.color}20`, color: r.color }}
                >
                  Meilleure &eacute;conomie
                </span>
              )}

              <div className="mb-4">
                <h3 className="text-base font-bold text-foreground">{r.label}</h3>
                <p className="text-xs text-muted-foreground/60 mt-0.5">{r.regime}</p>
              </div>

              {/* URSSAF rate before/after */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 text-center p-3 rounded-xl bg-muted/40 border border-border">
                  <div className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-1">Sans ACRE</div>
                  <div className="text-lg font-bold text-[#f87171]">{Math.round(r.urssafNormal * 100)}%</div>
                </div>
                <TrendingUp className="size-5 text-[#4ade80] shrink-0" />
                <div className="flex-1 text-center p-3 rounded-xl bg-[#4ade80]/5 border border-[#4ade80]/15">
                  <div className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-1">Avec ACRE</div>
                  <div className="text-lg font-bold text-[#4ade80]">{Math.round(r.urssafAcre * 100)}%</div>
                </div>
              </div>

              {/* Net before/after */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Net mensuel sans ACRE</span>
                  <span className="font-medium text-foreground">{fmt(r.netNormal / 12)} &euro;</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Net mensuel avec ACRE</span>
                  <span className="font-bold" style={{ color: r.color }}>{fmt(r.netAcre / 12)} &euro;</span>
                </div>
              </div>

              {/* Savings */}
              <div className="p-3 rounded-xl bg-[#4ade80]/5 border border-[#4ade80]/15 text-center">
                <div className="text-xs text-muted-foreground/60 mb-0.5">&Eacute;conomie ACRE / an</div>
                <div className="text-xl font-bold text-[#4ade80]">+{fmt(r.economieAnnuelle)} &euro;</div>
                <div className="text-xs text-muted-foreground">soit +{fmt(r.economieMensuelle)} &euro;/mois</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ACRE Timeline */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center gap-2 mb-5">
          <CalendarDays className="size-5 text-[#06b6d4]" />
          <h2 className="text-base font-bold text-foreground">Dur&eacute;e de l&apos;ACRE</h2>
        </div>
        <div className="grid grid-cols-5 gap-3">
          {[1, 2, 3, 4].map((q) => (
            <div
              key={q}
              className="text-center p-4 rounded-xl bg-[#4ade80]/5 border border-[#4ade80]/15"
            >
              <div className="text-xs text-muted-foreground/60 mb-1">Trimestre {q}</div>
              <div className="text-sm font-bold text-[#4ade80]">-50%</div>
              <div className="text-[10px] text-muted-foreground mt-1">charges r&eacute;duites</div>
            </div>
          ))}
          <div className="text-center p-4 rounded-xl bg-muted/40 border border-border">
            <div className="text-xs text-muted-foreground/60 mb-1">Trimestre 5+</div>
            <div className="text-sm font-bold text-muted-foreground">Taux normal</div>
            <div className="text-[10px] text-muted-foreground/60 mt-1">fin ACRE</div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground/60 mt-4">
          L&apos;ACRE s&apos;applique pendant les 4 premiers trimestres civils suivant la cr&eacute;ation de l&apos;entreprise.
          La r&eacute;duction est automatique pour les cr&eacute;ateurs &eacute;ligibles (demandeurs d&apos;emploi, b&eacute;n&eacute;ficiaires RSA, &lt;25 ans, etc.).
        </p>
      </div>

      {/* Disclaimer */}
      <div className="text-center text-xs text-muted-foreground/60 pb-8">
        Simulation indicative. L&apos;ACRE r&eacute;duit de 50% les cotisations sociales (URSSAF) pendant 4 trimestres.
        Pour la SASU, seule la part patronale est r&eacute;duite. Consulte un expert-comptable pour un conseil personnalis&eacute;.
      </div>
    </div>
  );
}
