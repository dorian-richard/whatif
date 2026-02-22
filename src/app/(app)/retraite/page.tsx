"use client";

import { useMemo, useState } from "react";
import { useProfileStore } from "@/stores/useProfileStore";
import { getAnnualCA } from "@/lib/simulation-engine";
import { BUSINESS_STATUS_CONFIG } from "@/lib/constants";
import { fmt, cn } from "@/lib/utils";
import type { BusinessStatus } from "@/types";
import { Landmark, CalendarDays, TrendingUp, Banknote, Gauge, CircleAlert } from "@/components/ui/icons";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

/* ════════════════════════════════════════════════
   Constantes retraite
   ════════════════════════════════════════════════ */

/** Seuil de revenu cotise pour valider 1 trimestre (2025) */
const TRIMESTRE_THRESHOLD = 1747;
/** Plafond annuel de la securite sociale 2025 */
const PLAFOND_SS = 46368;
/** Abattement micro BNC */
const ABATTEMENT_MICRO = 0.34;
/** Age taux plein automatique */
const FULL_PENSION_AGE = 67;
/** Taux pension de base (50% du salaire moyen plafonné) */
const PENSION_RATE = 0.50;
/** Bonus complementaire CDI (AGIRC-ARRCO) ~15% de plus */
const CDI_COMPLEMENTAIRE_BONUS = 1.15;
/** Part des cotisations qui va à la retraite (estimé) */
const RETRAITE_RATE_TNS = 0.17;
const RETRAITE_RATE_SALARIE = 0.15;
/** Charges patronales CDI */
const CDI_CHARGES_PATRONALES = 0.42;

// SASU IR exclue : option IR limitee a 5 ans, pas pertinent pour la retraite long terme
const STATUTS: BusinessStatus[] = ["micro", "ei", "eurl_ir", "eurl_is", "sasu_is", "portage"];

const STATUT_COLORS: Record<string, string> = {
  micro: "#F4BE7E",
  ei: "#f97316",
  eurl_ir: "#5682F2",
  eurl_is: "#a78bfa",
  sasu_ir: "#f87171",
  sasu_is: "#4ade80",
  portage: "#06b6d4",
  cdi: "#8b8b9e",
};

/* ════════════════════════════════════════════════
   Computation
   ════════════════════════════════════════════════ */

interface RetraiteResult {
  key: string;
  label: string;
  color: string;
  revenuCotise: number;
  trimestresParAn: number;
  cotisationRetraite: number;
  pensionMensuelle: number;
  yearsToRetirement: number;
}

function getRevenuCotise(annualCA: number, status: BusinessStatus): number {
  if (status === "micro") return annualCA * (1 - ABATTEMENT_MICRO);
  if (status === "ei" || status === "eurl_ir" || status === "eurl_is") {
    return annualCA * (1 - BUSINESS_STATUS_CONFIG[status].urssaf);
  }
  // SASU / Portage: brut ~ CA * (1 - charges patronales 45%) / (1 + charges salariales)
  // Simplified: ~55% of CA
  return annualCA * 0.55;
}

function computeRetraite(
  annualCA: number,
  status: BusinessStatus,
  age: number,
): RetraiteResult {
  const cfg = BUSINESS_STATUS_CONFIG[status];
  const revenuCotise = getRevenuCotise(annualCA, status);
  const trimestres = Math.min(4, Math.floor(revenuCotise / TRIMESTRE_THRESHOLD));

  const isSalarie = status === "sasu_ir" || status === "sasu_is" || status === "portage";
  const retraiteRate = isSalarie ? RETRAITE_RATE_SALARIE : RETRAITE_RATE_TNS;
  const cotisation = revenuCotise * retraiteRate;

  const salaireMoyen = Math.min(revenuCotise, PLAFOND_SS);
  const pensionBase = salaireMoyen * PENSION_RATE / 12;
  // Assimilé salarié gets ~10% more from complémentaire vs TNS
  const pensionMensuelle = isSalarie ? pensionBase * 1.10 : pensionBase;

  return {
    key: status,
    label: cfg.label,
    color: STATUT_COLORS[status],
    revenuCotise,
    trimestresParAn: trimestres,
    cotisationRetraite: cotisation,
    pensionMensuelle,
    yearsToRetirement: Math.max(0, FULL_PENSION_AGE - age),
  };
}

function computeRetraiteCDI(annualCA: number, age: number): RetraiteResult {
  // CDI: employer cost = brut * (1 + charges patronales)
  // Approximate brut from similar freelance CA: brut ~ CA * 0.55 (same as SASU)
  const brutAnnuel = annualCA * 0.55;
  const trimestres = Math.min(4, Math.floor(brutAnnuel / TRIMESTRE_THRESHOLD));
  const cotisation = brutAnnuel * 0.17; // employer + employee retraite combined
  const salaireMoyen = Math.min(brutAnnuel, PLAFOND_SS);
  const pensionBase = salaireMoyen * PENSION_RATE / 12;
  const pensionMensuelle = pensionBase * CDI_COMPLEMENTAIRE_BONUS;

  return {
    key: "cdi",
    label: "CDI equivalent",
    color: STATUT_COLORS.cdi,
    revenuCotise: brutAnnuel,
    trimestresParAn: trimestres,
    cotisationRetraite: cotisation,
    pensionMensuelle,
    yearsToRetirement: Math.max(0, FULL_PENSION_AGE - age),
  };
}

/* ════════════════════════════════════════════════
   Component
   ════════════════════════════════════════════════ */

export default function RetraitePage() {
  const { clients, age: profileAge } = useProfileStore();

  const baseAnnualCA = useMemo(() => getAnnualCA(clients), [clients]);

  const [caOverride, setCaOverride] = useState<number | null>(null);
  const annualCA = caOverride ?? baseAnnualCA;
  const sliderMax = Math.max(300000, Math.ceil(baseAnnualCA / 50000) * 50000 + 50000);
  const [age, setAge] = useState(profileAge ?? 35);
  const [yearsContributed, setYearsContributed] = useState(Math.max(0, (profileAge ?? 35) - 22));

  const results = useMemo(() => {
    const freelance = STATUTS.map((s) => computeRetraite(annualCA, s, age));
    const cdi = computeRetraiteCDI(annualCA, age);
    return [...freelance, cdi];
  }, [annualCA, age]);

  const bestFreelance = useMemo(
    () => results.filter((r) => r.key !== "cdi").reduce((a, b) => (a.pensionMensuelle > b.pensionMensuelle ? a : b)),
    [results]
  );

  const cdiResult = results.find((r) => r.key === "cdi")!;

  // Chart data
  const chartData = results.map((r) => ({
    label: r.key === "cdi" ? "CDI" : BUSINESS_STATUS_CONFIG[r.key as BusinessStatus].label.split(" ")[0]
      + (r.key.includes("_") ? " " + r.key.split("_")[1].toUpperCase() : ""),
    pension: Math.round(r.pensionMensuelle),
    color: r.color,
  }));

  const yearsLeft = Math.max(0, FULL_PENSION_AGE - age);
  const totalTrimestresNeeded = 172; // ~43 years * 4 for taux plein (generation 1973+)
  const currentTrimestres = yearsContributed * 4;
  const futureTrimestres = Math.min(yearsLeft * 4, totalTrimestresNeeded - currentTrimestres);
  const totalTrimestres = currentTrimestres + futureTrimestres;
  const tauxPleinPct = Math.min(100, Math.round((totalTrimestres / totalTrimestresNeeded) * 100));

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-1">Retraite Freelance vs CDI</h1>
        <p className="text-muted-foreground">
          Compare ta pension de retraite estim&eacute;e selon ton statut freelance vs un CDI &eacute;quivalent.
        </p>
      </div>

      {/* Input sliders */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Age */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="text-xs text-muted-foreground/60 uppercase tracking-wider mb-1">Ton &acirc;ge</div>
          <div className="text-2xl font-bold text-foreground mb-3">{age} ans</div>
          <input
            type="range"
            min={20}
            max={65}
            value={age}
            onChange={(e) => {
              const newAge = Number(e.target.value);
              setAge(newAge);
              setYearsContributed(Math.min(yearsContributed, newAge - 18));
            }}
            className="w-full accent-[#5682F2] h-2 bg-muted rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#5682F2] [&::-webkit-slider-thumb]:shadow-lg"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground/60 mt-1">
            <span>20</span><span>65</span>
          </div>
        </div>

        {/* CA */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="text-xs text-muted-foreground/60 uppercase tracking-wider mb-1">CA annuel</div>
          <div className="text-2xl font-bold text-foreground mb-3">{fmt(annualCA)} &euro;</div>
          <input
            type="range"
            min={10000}
            max={sliderMax}
            step={1000}
            value={annualCA}
            onChange={(e) => setCaOverride(Number(e.target.value))}
            className="w-full accent-[#5682F2] h-2 bg-muted rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#5682F2] [&::-webkit-slider-thumb]:shadow-lg"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground/60 mt-1">
            <span>10k</span><span>{fmt(sliderMax / 1000)}k</span>
          </div>
        </div>

        {/* Years contributed */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="text-xs text-muted-foreground/60 uppercase tracking-wider mb-1">Ann&eacute;es d&eacute;j&agrave; cotis&eacute;es</div>
          <div className="text-2xl font-bold text-foreground mb-3">{yearsContributed} ans</div>
          <input
            type="range"
            min={0}
            max={Math.max(0, age - 18)}
            value={yearsContributed}
            onChange={(e) => setYearsContributed(Number(e.target.value))}
            className="w-full accent-[#5682F2] h-2 bg-muted rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#5682F2] [&::-webkit-slider-thumb]:shadow-lg"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground/60 mt-1">
            <span>0</span><span>{Math.max(0, age - 18)}</span>
          </div>
        </div>
      </div>

      {/* Trimestres progress */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 text-[#5682F2]" />
            <span className="text-sm font-semibold text-foreground">Progression trimestres</span>
          </div>
          <span className="text-sm text-muted-foreground">
            {currentTrimestres} acquis + {futureTrimestres} restants = {totalTrimestres} / {totalTrimestresNeeded}
          </span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden mb-2">
          <div className="h-full flex">
            <div
              className="h-full bg-[#5682F2]"
              style={{ width: `${(currentTrimestres / totalTrimestresNeeded) * 100}%` }}
            />
            <div
              className="h-full bg-[#5682F2]/30"
              style={{ width: `${(futureTrimestres / totalTrimestresNeeded) * 100}%` }}
            />
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground/60">
          <span>Taux plein estim&eacute; : {tauxPleinPct}%</span>
          <span>Retraite &agrave; {FULL_PENSION_AGE} ans ({yearsLeft} ans restants)</span>
        </div>
      </div>

      {/* Key insight */}
      <div className="flex items-center gap-4 bg-card rounded-2xl border border-border p-5">
        <div className="size-12 rounded-xl flex items-center justify-center bg-[#8b5cf6]/15">
          <Landmark className="size-6 text-[#8b5cf6]" />
        </div>
        <div className="flex-1">
          <div className="text-xs text-muted-foreground/60 uppercase tracking-wider mb-1">Pension estim&eacute;e (meilleur statut freelance)</div>
          <div className="text-xl font-bold" style={{ color: bestFreelance.color }}>
            {fmt(bestFreelance.pensionMensuelle)} &euro;/mois
            <span className="text-sm font-normal text-muted-foreground ml-2">
              en {bestFreelance.label}
            </span>
          </div>
          <div className="text-sm text-muted-foreground mt-0.5">
            vs {fmt(cdiResult.pensionMensuelle)} &euro;/mois en CDI &eacute;quivalent
            {cdiResult.pensionMensuelle > bestFreelance.pensionMensuelle && (
              <span className="text-[#f87171] ml-1">
                ({fmt(cdiResult.pensionMensuelle - bestFreelance.pensionMensuelle)} &euro; de plus)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h2 className="text-sm font-semibold text-foreground mb-6">Pension mensuelle estim&eacute;e par statut</h2>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "#5a5a6e" }}
              tickLine={false}
              axisLine={{ stroke: "rgba(255,255,255,0.04)" }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#5a5a6e" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `${v}\u20AC`}
              width={55}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.1)",
                backgroundColor: "#1a1a26",
                boxShadow: "0 8px 16px -4px rgba(0,0,0,0.4)",
                fontSize: "12px",
                padding: "12px",
                color: "#fff",
              }}
              formatter={(value: number) => [`${fmt(value)} \u20AC/mois`, "Pension estimee"]}
            />
            <Bar dataKey="pension" radius={[8, 8, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detail cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {results.map((r) => {
          const isCDI = r.key === "cdi";
          const isBest = r.key === bestFreelance.key;

          return (
            <div
              key={r.key}
              className={cn(
                "bg-card rounded-2xl border p-5",
                isBest ? "border-border ring-1 ring-border" : "border-border"
              )}
            >
              {/* Tags */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {isBest && (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                    style={{ backgroundColor: `${r.color}20`, color: r.color }}>
                    Meilleure pension
                  </span>
                )}
                {isCDI && (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground">
                    R&eacute;f&eacute;rence
                  </span>
                )}
              </div>

              <h3 className="text-base font-bold text-foreground mb-1">{r.label}</h3>
              <p className="text-xs text-muted-foreground/60 mb-4">
                {isCDI ? "Regime general (salarie)" : BUSINESS_STATUS_CONFIG[r.key as BusinessStatus].regime}
              </p>

              {/* Pension */}
              <div className="text-2xl font-bold mb-4" style={{ color: r.color }}>
                {fmt(r.pensionMensuelle)} &euro;
                <span className="text-sm font-normal text-muted-foreground/60">/mois</span>
              </div>

              {/* Details */}
              <div className="space-y-2.5 text-sm">
                {/* Trimestres */}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Trimestres/an</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4].map((q) => (
                      <div
                        key={q}
                        className={cn(
                          "size-3 rounded-full",
                          q <= r.trimestresParAn ? "bg-[#4ade80]" : "bg-muted"
                        )}
                      />
                    ))}
                    <span className="ml-1.5 font-medium text-foreground">{r.trimestresParAn}/4</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Revenu cotis&eacute;</span>
                  <span className="font-medium text-foreground">{fmt(r.revenuCotise)} &euro;/an</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Cotisation retraite</span>
                  <span className="font-medium text-foreground">{fmt(r.cotisationRetraite)} &euro;/an</span>
                </div>

                <div className="h-px bg-muted" />

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Retraite &agrave;</span>
                  <span className="font-medium text-foreground">{FULL_PENSION_AGE} ans ({r.yearsToRetirement} ans)</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Insight */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <CircleAlert className="size-5 text-[#F4BE7E]" />
          <h2 className="text-sm font-bold text-foreground">Points cl&eacute;s</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <TrendingUp className="size-4 text-[#4ade80] mt-0.5 shrink-0" />
            <span>
              La <strong className="text-foreground">SASU</strong> co&ucirc;te plus en charges mais offre
              une meilleure retraite gr&acirc;ce au r&eacute;gime g&eacute;n&eacute;ral (comme un salari&eacute;).
            </span>
          </div>
          <div className="flex items-start gap-2">
            <Banknote className="size-4 text-[#F4BE7E] mt-0.5 shrink-0" />
            <span>
              La <strong className="text-foreground">Micro/EI</strong> offre la pension la plus faible
              mais les charges les plus basses &mdash; &agrave; toi d&apos;&eacute;pargner la diff&eacute;rence.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <Gauge className="size-4 text-[#5682F2] mt-0.5 shrink-0" />
            <span>
              Le <strong className="text-foreground">CDI</strong> reste plus avantageux pour la retraite
              gr&acirc;ce &agrave; la compl&eacute;mentaire AGIRC-ARRCO financ&eacute;e par l&apos;employeur.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <Landmark className="size-4 text-[#a78bfa] mt-0.5 shrink-0" />
            <span>
              Compense avec une <strong className="text-foreground">&eacute;pargne retraite priv&eacute;e</strong> (PER, assurance vie)
              pour combler l&apos;&eacute;cart avec le CDI.
            </span>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="text-center text-xs text-muted-foreground/60 pb-8">
        Estimation indicative bas&eacute;e sur les taux 2025 (SMIC, plafond SS, seuils trimestres).
        La pension r&eacute;elle d&eacute;pend de l&apos;ensemble de ta carri&egrave;re, des r&eacute;gimes compl&eacute;mentaires et des r&eacute;formes futures.
        Consulte un conseiller retraite pour un bilan personnalis&eacute;.
      </div>
    </div>
  );
}
