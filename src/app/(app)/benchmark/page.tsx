"use client";

import { useMemo, useState } from "react";
import { useProfileStore } from "@/stores/useProfileStore";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  TrendingUp,
  CircleAlert,
  Users,
} from "@/components/ui/icons";
import {
  METIERS,
  METIER_CATEGORIES as CATEGORIES,
  CATEGORY_COLORS,
  type Seniority,
  type TJMRange,
} from "@/lib/benchmark-data";
import { getAnnualCA, AVG_JOURS_OUVRES } from "@/lib/simulation-engine";

/* ════════════════════════════════════════════════
   Local config
   ════════════════════════════════════════════════ */

type Location = "paris" | "grande_ville" | "remote" | "province";

const SENIORITY_CONFIG: Record<
  Seniority,
  { label: string; years: string; color: string }
> = {
  junior: { label: "Junior", years: "0-2 ans", color: "#4ade80" },
  confirme: { label: "Confirm\u00e9", years: "2-5 ans", color: "#5682F2" },
  senior: { label: "Senior", years: "5-10 ans", color: "#F4BE7E" },
  expert: { label: "Expert", years: "10+ ans", color: "#a78bfa" },
};

/* Multiplicateurs calcul\u00e9s depuis les \u00e9carts Paris / Grandes villes / R\u00e9gions
   du barom\u00e8tre Silkhom 2025 (moyenne sur 50+ m\u00e9tiers IT). */
const LOCATIONS: Record<Location, { label: string; mult: number }> = {
  paris: { label: "Paris / IDF", mult: 1.0 },
  grande_ville: { label: "Lyon, Marseille, Nantes\u2026", mult: 0.9 },
  remote: { label: "Full remote", mult: 0.93 },
  province: { label: "Province", mult: 0.85 },
};

/* ── Helpers ── */

function applyLocation(range: TJMRange, mult: number): TJMRange {
  return {
    min: Math.round(range.min * mult),
    median: Math.round(range.median * mult),
    max: Math.round(range.max * mult),
  };
}

/** Estimate percentile (0-100) within a range */
function estimatePercentile(tjm: number, range: TJMRange): number {
  if (tjm <= range.min) return Math.max(1, Math.round((tjm / range.min) * 10));
  if (tjm <= range.median)
    return Math.round(
      10 + ((tjm - range.min) / (range.median - range.min)) * 40
    );
  if (tjm <= range.max)
    return Math.round(
      50 + ((tjm - range.median) / (range.max - range.median)) * 40
    );
  return Math.min(99, Math.round(90 + 9 * (1 - range.max / tjm)));
}

function percentileLabel(p: number): {
  label: string;
  color: string;
} {
  if (p >= 75) return { label: "Top " + (100 - p) + "%", color: "#4ade80" };
  if (p >= 50) return { label: "Top " + (100 - p) + "%", color: "#5682F2" };
  if (p >= 25) return { label: "Top " + (100 - p) + "%", color: "#F4BE7E" };
  return { label: "Bottom " + p + "%", color: "#f87171" };
}

/* ════════════════════════════════════════════════
   Component
   ════════════════════════════════════════════════ */

export default function BenchmarkPage() {
  const { clients, role, setProfile, workDaysPerWeek, workedDaysPerYear } = useProfileStore();

  // TJM effectif = CA annuel réel / jours travaillés par an
  // Utilise getAnnualCA qui tient compte de la saisonnalité et des périodes contrats
  const userTJM = useMemo(() => {
    const annualCA = getAnnualCA(clients);
    if (annualCA <= 0) return null;

    const daysPerYear = workedDaysPerYear
      ? workedDaysPerYear
      : (workDaysPerWeek / 5) * AVG_JOURS_OUVRES * 12;

    return Math.round(annualCA / daysPerYear);
  }, [clients, workDaysPerWeek, workedDaysPerYear]);

  // Initialize m\u00e9tier from profile role (if set)
  const [selectedMetier, setSelectedMetier] = useState(
    () => {
      if (role && METIERS.some((m) => m.id === role)) return role;
      return "dev_fullstack";
    }
  );
  const [selectedSeniority, setSelectedSeniority] =
    useState<Seniority>("senior");
  const [selectedLocation, setSelectedLocation] =
    useState<Location>("paris");

  // Persist role selection to profile store
  const handleSelectMetier = (id: string) => {
    setSelectedMetier(id);
    setProfile({ role: id });
  };

  const metier = METIERS.find((m) => m.id === selectedMetier) ?? METIERS[2];
  const locMult = LOCATIONS[selectedLocation].mult;

  // Adjusted range for selected metier + seniority + location
  const adjustedRange = useMemo(
    () => applyLocation(metier.ranges[selectedSeniority], locMult),
    [metier, selectedSeniority, locMult]
  );

  const totalSpan = adjustedRange.max - adjustedRange.min;

  // User percentile
  const userPercentile = useMemo(() => {
    if (!userTJM) return null;
    return estimatePercentile(userTJM, adjustedRange);
  }, [userTJM, adjustedRange]);

  const userPctLabel = userPercentile
    ? percentileLabel(userPercentile)
    : null;

  // User position on bar (clamped 0-100%)
  const userBarPos = useMemo(() => {
    if (!userTJM || totalSpan <= 0) return null;
    return Math.max(
      0,
      Math.min(100, ((userTJM - adjustedRange.min) / totalSpan) * 100)
    );
  }, [userTJM, adjustedRange, totalSpan]);

  // All metiers sorted by median TJM for ranking table
  const sortedMetiers = useMemo(() => {
    return [...METIERS]
      .map((m) => ({
        ...m,
        adjusted: applyLocation(m.ranges[selectedSeniority], locMult),
      }))
      .sort((a, b) => b.adjusted.median - a.adjusted.median);
  }, [selectedSeniority, locMult]);

  const maxMedian = sortedMetiers[0]?.adjusted.median ?? 1;

  // Median position on bar
  const medianBarPos =
    totalSpan > 0
      ? ((adjustedRange.median - adjustedRange.min) / totalSpan) * 100
      : 50;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">
          Benchmark TJM march&eacute;
        </h1>
        <p className="text-[#8b8b9e]">
          Compare ton TJM aux r&eacute;f&eacute;rences du march&eacute;
          freelance fran&ccedil;ais.
        </p>
      </div>

      {/* User positioning */}
      {userTJM && userPctLabel && (
        <div className="bg-gradient-to-r from-[#5682F2]/10 to-[#F4BE7E]/10 rounded-2xl border border-white/[0.08] p-6">
          <div className="flex items-center gap-4">
            <div
              className="size-14 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${userPctLabel.color}15` }}
            >
              <TrendingUp
                className="size-7"
                style={{ color: userPctLabel.color }}
              />
            </div>
            <div className="flex-1">
              <div className="text-xs text-[#5a5a6e] uppercase tracking-wider">
                Ton TJM moyen
              </div>
              <div className="text-3xl font-bold text-white">
                {userTJM} &euro;/jour
              </div>
              <div className="text-sm text-[#8b8b9e] mt-0.5">
                {metier.label} {SENIORITY_CONFIG[selectedSeniority].label}{" "}
                &agrave; {LOCATIONS[selectedLocation].label}
              </div>
            </div>
            <div className="text-right">
              <div
                className="text-2xl font-bold"
                style={{ color: userPctLabel.color }}
              >
                {userPctLabel.label}
              </div>
              <div className="text-xs text-[#5a5a6e]">
                M&eacute;diane march&eacute; : {adjustedRange.median} &euro;
              </div>
            </div>
          </div>
        </div>
      )}

      {!userTJM && (
        <div className="bg-[#12121c] rounded-2xl border border-white/[0.06] p-5 flex items-center gap-3">
          <CircleAlert className="size-5 text-[#F4BE7E] shrink-0" />
          <p className="text-sm text-[#8b8b9e]">
            Ajoute des clients avec un TJM dans{" "}
            <span className="text-white font-medium">Param&egrave;tres</span>{" "}
            pour voir ton positionnement march&eacute;.
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="space-y-4">
        {/* Seniority + Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Seniority */}
          <div className="bg-[#12121c] rounded-2xl border border-white/[0.06] p-5">
            <div className="text-xs text-[#5a5a6e] uppercase tracking-wider mb-3">
              S&eacute;niorit&eacute;
            </div>
            <div className="flex gap-2 flex-wrap">
              {(Object.keys(SENIORITY_CONFIG) as Seniority[]).map((s) => {
                const cfg = SENIORITY_CONFIG[s];
                return (
                  <button
                    key={s}
                    onClick={() => setSelectedSeniority(s)}
                    className={cn(
                      "px-3 py-2 rounded-xl text-sm font-medium transition-all",
                      selectedSeniority === s
                        ? "ring-1 ring-[#5682F2]/30"
                        : "bg-white/[0.04] text-[#8b8b9e] hover:text-white hover:bg-white/[0.06]"
                    )}
                    style={
                      selectedSeniority === s
                        ? {
                            backgroundColor: `${cfg.color}15`,
                            color: cfg.color,
                          }
                        : undefined
                    }
                  >
                    <div>{cfg.label}</div>
                    <div className="text-[10px] opacity-60">{cfg.years}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Location */}
          <div className="bg-[#12121c] rounded-2xl border border-white/[0.06] p-5">
            <div className="text-xs text-[#5a5a6e] uppercase tracking-wider mb-3">
              Localisation
            </div>
            <div className="flex gap-2 flex-wrap">
              {(Object.keys(LOCATIONS) as Location[]).map((l) => {
                const loc = LOCATIONS[l];
                return (
                  <button
                    key={l}
                    onClick={() => setSelectedLocation(l)}
                    className={cn(
                      "px-3 py-2 rounded-xl text-sm font-medium transition-all",
                      selectedLocation === l
                        ? "bg-[#5682F2]/15 text-[#5682F2] ring-1 ring-[#5682F2]/30"
                        : "bg-white/[0.04] text-[#8b8b9e] hover:text-white hover:bg-white/[0.06]"
                    )}
                  >
                    <div>{loc.label}</div>
                    {loc.mult !== 1 && (
                      <div className="text-[10px] opacity-60">
                        {Math.round(loc.mult * 100)}% de Paris
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Metier selector by category */}
        <div className="bg-[#12121c] rounded-2xl border border-white/[0.06] p-5">
          <div className="text-xs text-[#5a5a6e] uppercase tracking-wider mb-4">
            M&eacute;tier
          </div>
          <div className="space-y-4">
            {CATEGORIES.map((cat) => (
              <div key={cat}>
                <div
                  className="text-xs font-semibold uppercase tracking-wider mb-2"
                  style={{ color: CATEGORY_COLORS[cat] ?? "#8b8b9e" }}
                >
                  {cat}
                </div>
                <div className="flex flex-wrap gap-2">
                  {METIERS.filter((m) => m.category === cat).map((m) => (
                    <button
                      key={m.id}
                      onClick={() => handleSelectMetier(m.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                        selectedMetier === m.id
                          ? "ring-1"
                          : "bg-white/[0.04] text-[#8b8b9e] hover:text-white hover:bg-white/[0.06]"
                      )}
                      style={
                        selectedMetier === m.id
                          ? {
                              backgroundColor: `${CATEGORY_COLORS[cat]}15`,
                              color: CATEGORY_COLORS[cat],
                              boxShadow: `0 0 0 1px ${CATEGORY_COLORS[cat]}40`,
                            }
                          : undefined
                      }
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Selected metier detail */}
      <div className="bg-[#12121c] rounded-2xl border border-white/[0.06] p-6">
        <div className="flex items-center gap-3 mb-6">
          <div
            className="size-10 rounded-xl flex items-center justify-center"
            style={{
              backgroundColor: `${CATEGORY_COLORS[metier.category]}15`,
            }}
          >
            <BarChart3
              className="size-5"
              style={{ color: CATEGORY_COLORS[metier.category] }}
            />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{metier.label}</h2>
            <p className="text-xs text-[#5a5a6e]">
              {SENIORITY_CONFIG[selectedSeniority].label} &middot;{" "}
              {LOCATIONS[selectedLocation].label}
            </p>
          </div>
          <div className="ml-auto text-right">
            <div className="text-xs text-[#5a5a6e]">TJM m&eacute;dian</div>
            <div
              className="text-2xl font-bold"
              style={{ color: CATEGORY_COLORS[metier.category] }}
            >
              {adjustedRange.median} &euro;
            </div>
          </div>
        </div>

        {/* Range visualization */}
        <div className="mb-2">
          <div className="flex justify-between text-xs text-[#5a5a6e] mb-2">
            <span>{adjustedRange.min} &euro;</span>
            <span>M&eacute;diane : {adjustedRange.median} &euro;</span>
            <span>{adjustedRange.max} &euro;</span>
          </div>

          {/* Bar */}
          <div className="relative h-4 bg-white/[0.04] rounded-full overflow-visible">
            {/* Full range fill */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#5682F2]/20 via-[#5682F2]/40 to-[#5682F2]/20" />

            {/* Median marker */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white/50"
              style={{ left: `${medianBarPos}%` }}
            />

            {/* User TJM marker */}
            {userBarPos !== null && (
              <div
                className="absolute -top-1 -bottom-1 flex items-center justify-center"
                style={{
                  left: `${userBarPos}%`,
                  transform: "translateX(-50%)",
                }}
              >
                <div className="w-4 h-6 rounded-full bg-[#F4BE7E] border-2 border-[#12121c] shadow-lg" />
              </div>
            )}
          </div>

          {/* User TJM label */}
          {userBarPos !== null && userTJM && (
            <div className="relative h-6 mt-1">
              <div
                className="absolute flex flex-col items-center"
                style={{
                  left: `${userBarPos}%`,
                  transform: "translateX(-50%)",
                }}
              >
                <span className="text-xs font-bold text-[#F4BE7E]">
                  Toi : {userTJM} &euro;
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Range details row */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center p-3 rounded-xl bg-white/[0.02]">
            <div className="text-xs text-[#5a5a6e] mb-1">Plancher</div>
            <div className="text-lg font-bold text-white">
              {adjustedRange.min} &euro;
            </div>
          </div>
          <div className="text-center p-3 rounded-xl bg-[#5682F2]/8 border border-[#5682F2]/15">
            <div className="text-xs text-[#5a5a6e] mb-1">M&eacute;diane</div>
            <div className="text-lg font-bold text-[#5682F2]">
              {adjustedRange.median} &euro;
            </div>
          </div>
          <div className="text-center p-3 rounded-xl bg-white/[0.02]">
            <div className="text-xs text-[#5a5a6e] mb-1">Plafond</div>
            <div className="text-lg font-bold text-white">
              {adjustedRange.max} &euro;
            </div>
          </div>
        </div>

        {/* Seniority comparison for this metier */}
        <div className="mt-6">
          <div className="text-xs text-[#5a5a6e] uppercase tracking-wider mb-3">
            &Eacute;volution par s&eacute;niorit&eacute;
          </div>
          <div className="space-y-2">
            {(Object.keys(SENIORITY_CONFIG) as Seniority[]).map((s) => {
              const r = applyLocation(metier.ranges[s], locMult);
              const isSelected = s === selectedSeniority;
              const cfg = SENIORITY_CONFIG[s];
              const barW = maxMedian > 0 ? (r.median / maxMedian) * 100 : 0;

              return (
                <button
                  key={s}
                  onClick={() => setSelectedSeniority(s)}
                  className={cn(
                    "flex items-center gap-3 w-full p-2.5 rounded-xl transition-all text-left",
                    isSelected
                      ? "bg-white/[0.04] border border-white/[0.08]"
                      : "hover:bg-white/[0.02]"
                  )}
                >
                  <div className="w-20 text-xs font-medium" style={{ color: cfg.color }}>
                    {cfg.label}
                  </div>
                  <div className="flex-1 h-2.5 bg-white/[0.04] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${barW}%`,
                        backgroundColor: isSelected ? cfg.color : `${cfg.color}60`,
                      }}
                    />
                  </div>
                  <div className="w-24 text-right">
                    <span className="text-sm font-bold text-white">
                      {r.min}-{r.max} &euro;
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Ranking table */}
      <div className="bg-[#12121c] rounded-2xl border border-white/[0.06] p-6">
        <div className="flex items-center gap-3 mb-5">
          <Users className="size-5 text-[#8b8b9e]" />
          <div>
            <h3 className="text-base font-bold text-white">
              Classement des m&eacute;tiers
            </h3>
            <p className="text-xs text-[#5a5a6e]">
              {SENIORITY_CONFIG[selectedSeniority].label} &middot;{" "}
              {LOCATIONS[selectedLocation].label} &middot; Tri&eacute; par TJM
              m&eacute;dian
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {sortedMetiers.map((m, i) => {
            const isSelected = m.id === selectedMetier;
            const catColor = CATEGORY_COLORS[m.category] ?? "#8b8b9e";
            const barW =
              maxMedian > 0 ? (m.adjusted.median / maxMedian) * 100 : 0;
            const isUserHere = userTJM !== null && isSelected;

            return (
              <button
                key={m.id}
                onClick={() => handleSelectMetier(m.id)}
                className={cn(
                  "flex items-center gap-3 w-full p-3 rounded-xl transition-all text-left",
                  isSelected
                    ? "border border-white/[0.1] bg-white/[0.03]"
                    : "hover:bg-white/[0.02]"
                )}
              >
                {/* Rank */}
                <div className="w-6 text-center text-xs font-bold text-[#5a5a6e]">
                  {i + 1}
                </div>

                {/* Category dot */}
                <div
                  className="size-2 rounded-full shrink-0"
                  style={{ backgroundColor: catColor }}
                />

                {/* Name */}
                <div className="w-36 shrink-0">
                  <div
                    className={cn(
                      "text-sm font-medium",
                      isSelected ? "text-white" : "text-[#8b8b9e]"
                    )}
                  >
                    {m.label}
                  </div>
                </div>

                {/* Bar */}
                <div className="flex-1 h-2.5 bg-white/[0.04] rounded-full overflow-hidden relative">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${barW}%`,
                      backgroundColor: isSelected ? catColor : `${catColor}40`,
                    }}
                  />
                  {isUserHere && userTJM && (
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-[#F4BE7E] border border-[#12121c]"
                      style={{
                        left: `${Math.max(0, Math.min(100, ((userTJM - m.adjusted.min) / (m.adjusted.max - m.adjusted.min)) * barW))}%`,
                      }}
                    />
                  )}
                </div>

                {/* Range */}
                <div className="w-28 text-right shrink-0">
                  <span className="text-sm font-bold text-white">
                    {m.adjusted.median} &euro;
                  </span>
                  <span className="text-xs text-[#5a5a6e] ml-1">
                    ({m.adjusted.min}-{m.adjusted.max})
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sources & disclaimer */}
      <div className="text-center text-xs text-[#5a5a6e] pb-8 space-y-1">
        <p>
          Sources : Barom&egrave;tre Silkhom 2025 (20 000+ placements IT),
          Embarq 2025. Multiplicateurs g&eacute;ographiques
          calcul&eacute;s sur les &eacute;carts Paris / Grandes villes /
          R&eacute;gions Silkhom.
        </p>
        <p>
          Les TJM r&eacute;els varient selon l&apos;exp&eacute;rience, le
          secteur, le type de mission et la n&eacute;gociation.
        </p>
      </div>
    </div>
  );
}
