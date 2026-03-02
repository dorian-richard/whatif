"use client";

import { useMemo } from "react";
import { useProfileStore } from "@/stores/useProfileStore";
import { computeRadar, type RadarAxis, type Meteo } from "@/lib/radar-engine";
import { cn } from "@/lib/utils";
import { ProBlur } from "@/components/ProBlur";
import {
  Gauge,
  TrendingUp,
  BadgePercent,
  Wallet,
  HandCoins,
  Landmark,
  Shield,
  Sun,
  CloudSun,
  CloudRain,
  CloudLightning,
} from "@/components/ui/icons";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";

/* ════════════════════════════════════════════════
   Config
   ════════════════════════════════════════════════ */

const AXIS_ICONS: Record<string, typeof Gauge> = {
  revenus: TrendingUp,
  fiscalite: BadgePercent,
  tresorerie: Wallet,
  patrimoine: HandCoins,
  retraite: Landmark,
  risque: Shield,
};

const AXIS_COLORS: Record<string, string> = {
  revenus: "#5682F2",
  fiscalite: "#a78bfa",
  tresorerie: "#F4BE7E",
  patrimoine: "#10b981",
  retraite: "#06b6d4",
  risque: "#f97316",
};

const VERDICT_CONFIG = {
  bon: { bg: "bg-[#4ade80]/12", border: "border-[#4ade80]/20", color: "text-[#4ade80]", label: "Bon" },
  ok: { bg: "bg-[#5682F2]/12", border: "border-[#5682F2]/20", color: "text-[#5682F2]", label: "OK" },
  attention: { bg: "bg-[#fbbf24]/12", border: "border-[#fbbf24]/20", color: "text-[#fbbf24]", label: "Attention" },
  risque: { bg: "bg-[#f87171]/12", border: "border-[#f87171]/20", color: "text-[#f87171]", label: "Risque" },
};

const METEO_CONFIG: Record<Meteo, { label: string; icon: typeof Sun; color: string; accent: string; glow: string }> = {
  soleil: { label: "Grand soleil", icon: Sun, color: "text-[#fbbf24]", accent: "#fbbf24", glow: "shadow-[0_0_24px_rgba(251,191,36,0.15)]" },
  beau: { label: "Beau temps", icon: CloudSun, color: "text-[#4ade80]", accent: "#4ade80", glow: "shadow-[0_0_24px_rgba(74,222,128,0.15)]" },
  variable: { label: "Variable", icon: CloudRain, color: "text-[#F4BE7E]", accent: "#F4BE7E", glow: "shadow-[0_0_24px_rgba(244,190,126,0.15)]" },
  orageux: { label: "Orageux", icon: CloudLightning, color: "text-[#f87171]", accent: "#f87171", glow: "shadow-[0_0_24px_rgba(248,113,113,0.15)]" },
};

/* ════════════════════════════════════════════════
   Components
   ════════════════════════════════════════════════ */

function ScoreRing({ score, color, size = 56 }: { score: number; color: string; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);

  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={5} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={5}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        className="transition-all duration-700 ease-out"
      />
    </svg>
  );
}

function AxisCard({ axis }: { axis: RadarAxis }) {
  const Icon = AXIS_ICONS[axis.key] ?? Gauge;
  const color = AXIS_COLORS[axis.key] ?? "#5682F2";
  const verdict = VERDICT_CONFIG[axis.verdict];

  return (
    <div className="bg-card rounded-2xl border border-border p-5 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
            <Icon className="size-5" style={{ color }} />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">{axis.label}</div>
            <span className={cn("text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded", verdict.bg, verdict.border, verdict.color, "border")}>
              {verdict.label}
            </span>
          </div>
        </div>
        <div className="relative flex items-center justify-center">
          <ScoreRing score={axis.score} color={color} size={48} />
          <span className="absolute text-xs font-bold text-foreground">{axis.score}</span>
        </div>
      </div>

      {/* Detail */}
      <div className="text-xs text-muted-foreground">{axis.detail}</div>

      {/* Recommendation */}
      <div className="text-xs text-muted-foreground/80 italic border-t border-border pt-2">
        {axis.recommendation}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   Page
   ════════════════════════════════════════════════ */

export default function RadarPage() {
  const profile = useProfileStore();

  const result = useMemo(
    () => computeRadar(profile, profile.clients, profile.vacationDaysPerMonth),
    [profile],
  );

  const meteoConfig = METEO_CONFIG[result.meteo];
  const MeteoIcon = meteoConfig.icon;

  const chartData = result.axes.map((a) => ({
    axis: a.label,
    score: a.score,
  }));

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-1">Radar Freelance</h1>
        <p className="text-muted-foreground">
          Ton score de santé financière en un coup d&apos;œil.
        </p>
      </div>

      <ProBlur label="Le Radar Freelance est réservé au plan Pro">
        {/* ── Hero: Global Score + Radar Chart ── */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Score section */}
            <div className="flex flex-col items-center gap-3 md:min-w-[200px]">
              <div className={cn("size-20 rounded-2xl flex items-center justify-center", meteoConfig.glow)} style={{ backgroundColor: `${meteoConfig.accent}15` }}>
                <MeteoIcon className={cn("size-10", meteoConfig.color)} />
              </div>
              <div className="text-center">
                <div className="text-4xl font-black text-foreground">{result.globalScore}</div>
                <div className="text-xs text-muted-foreground/60 uppercase tracking-wider">sur 100</div>
              </div>
              <span className={cn("text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full", meteoConfig.color)} style={{ backgroundColor: `${meteoConfig.accent}15` }}>
                {meteoConfig.label}
              </span>
            </div>

            {/* Radar Chart */}
            <div className="flex-1 w-full min-h-[300px]">
              <ResponsiveContainer width="100%" height={320}>
                <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="75%">
                  <PolarGrid stroke="rgba(255,255,255,0.08)" />
                  <PolarAngleAxis
                    dataKey="axis"
                    tick={{ fontSize: 11, fill: "var(--color-muted-foreground, #8b8b9e)" }}
                  />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    dataKey="score"
                    stroke="#5682F2"
                    fill="#5682F2"
                    fillOpacity={0.15}
                    strokeWidth={2}
                    dot={{ r: 4, fill: "#5682F2", strokeWidth: 0 }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ── Axis Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {result.axes.map((axis) => (
            <AxisCard key={axis.key} axis={axis} />
          ))}
        </div>

        {/* ── Legend ── */}
        <div className="flex flex-wrap justify-center gap-4">
          {(["bon", "ok", "attention", "risque"] as const).map((v) => {
            const cfg = VERDICT_CONFIG[v];
            return (
              <div key={v} className="flex items-center gap-1.5">
                <div className={cn("size-2.5 rounded-full", cfg.bg, "border", cfg.border)} />
                <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">{cfg.label}</span>
              </div>
            );
          })}
        </div>

        {/* ── Disclaimer ── */}
        <div className="text-center text-xs text-muted-foreground/60 pb-8">
          Estimations indicatives basées sur ton profil. Ne constitue pas un conseil fiscal ou financier.
        </div>
      </ProBlur>
    </div>
  );
}
