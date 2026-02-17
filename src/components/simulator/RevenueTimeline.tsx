"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { ProjectionResult } from "@/types";
import { MONTHS_SHORT } from "@/lib/constants";
import { fmt } from "@/lib/utils";

interface RevenueTimelineProps {
  projection: ProjectionResult;
}

export function RevenueTimeline({ projection }: RevenueTimelineProps) {
  const data = MONTHS_SHORT.map((month, i) => ({
    name: month,
    actuel: Math.round(projection.before[i]),
    simule: Math.round(projection.after[i]),
    diff: Math.round(projection.after[i] - projection.before[i]),
  }));

  const afterAnnual = projection.after.reduce((a, b) => a + b, 0);
  const beforeAnnual = projection.before.reduce((a, b) => a + b, 0);
  const totalDiff = afterAnnual - beforeAnnual;

  return (
    <div className="bg-[#12121c] rounded-2xl p-6 border border-white/[0.06]">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-bold text-white">Évolution</h3>
        <div className="flex gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-6 h-0.5 bg-[#5682F2] inline-block rounded-full" />
            <span className="text-[#8b8b9e]">Actuel</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-6 h-0.5 bg-gradient-to-r from-[#F4BE7E] to-[#F4BE7E] inline-block rounded-full" />
            <span className="text-[#8b8b9e]">Simulé</span>
          </span>
        </div>
      </div>
      {Math.abs(totalDiff) > 0.5 && (
        <p className="text-xs text-[#5a5a6e] mb-4">
          Différence annuelle :{" "}
          <span className={totalDiff >= 0 ? "text-[#4ade80] font-semibold" : "text-[#f87171] font-semibold"}>
            {totalDiff >= 0 ? "+" : ""}{fmt(totalDiff)}&euro;
          </span>
        </p>
      )}
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gradActuel" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5682F2" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#5682F2" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradSimule" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F4BE7E" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#F4BE7E" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="strokeSimule" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#F4BE7E" />
              <stop offset="100%" stopColor="#F4BE7E" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: "#5a5a6e" }}
            tickLine={false}
            axisLine={{ stroke: "rgba(255,255,255,0.04)" }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#5a5a6e" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
            width={40}
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
            formatter={(value: number, name: string) => [
              `${fmt(value)}\u20AC`,
              name === "actuel" ? "Actuel" : "Simulé",
            ]}
            labelStyle={{ fontWeight: 600, marginBottom: 4, color: "#fff" }}
            itemStyle={{ color: "#8b8b9e" }}
          />
          <Area
            type="monotone"
            dataKey="actuel"
            stroke="#5682F2"
            strokeWidth={2.5}
            fill="url(#gradActuel)"
            dot={{ r: 3, fill: "#5682F2", strokeWidth: 0 }}
            activeDot={{ r: 5, fill: "#5682F2", stroke: "#1a1a26", strokeWidth: 2 }}
          />
          <Area
            type="monotone"
            dataKey="simule"
            stroke="url(#strokeSimule)"
            strokeWidth={2.5}
            strokeDasharray="6 3"
            fill="url(#gradSimule)"
            dot={{ r: 3, fill: "#F4BE7E", strokeWidth: 0 }}
            activeDot={{ r: 5, fill: "#F4BE7E", stroke: "#1a1a26", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
