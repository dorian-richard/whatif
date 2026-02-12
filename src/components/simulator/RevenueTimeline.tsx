"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
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

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-gray-800">Projection mois par mois</h3>
        <div className="flex gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-indigo-500 inline-block rounded" />
            Actuel
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-orange-500 inline-block rounded" />
            Simule
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorActuel" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorSimule" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.1} />
              <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} />
          <YAxis
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid #e5e7eb",
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
              fontSize: "12px",
            }}
            formatter={(value: number, name: string) => [
              `${fmt(value)}\u20AC`,
              name === "actuel" ? "Actuel" : "Simule",
            ]}
            labelStyle={{ fontWeight: 600 }}
          />
          <Area
            type="monotone"
            dataKey="actuel"
            stroke="#6366f1"
            strokeWidth={2.5}
            fill="url(#colorActuel)"
            dot={{ r: 3, fill: "#6366f1" }}
          />
          <Area
            type="monotone"
            dataKey="simule"
            stroke="#f97316"
            strokeWidth={2.5}
            strokeDasharray="6 4"
            fill="url(#colorSimule)"
            dot={{ r: 3, fill: "#f97316" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
