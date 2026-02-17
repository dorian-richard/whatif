"use client";

import { useState } from "react";
import { useSimulatorStore } from "@/stores/useSimulatorStore";
import { motion } from "framer-motion";
import { PRESET_SCENARIOS, SCENARIO_CATEGORIES, type ScenarioCategory } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icons";

const TABS: ScenarioCategory[] = ["croissance", "equilibre", "risque"];

export function PresetScenarios() {
  const { activePreset, applyPreset, reset } = useSimulatorStore();
  const [activeTab, setActiveTab] = useState<ScenarioCategory | "all">("all");

  const filtered = activeTab === "all"
    ? PRESET_SCENARIOS
    : PRESET_SCENARIOS.filter((s) => s.cat === activeTab);

  return (
    <div className="bg-[#12121c] rounded-2xl p-4 border border-white/[0.06]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-white">Scénarios</h3>
        {activePreset && (
          <button
            onClick={reset}
            className="text-[11px] text-[#5a5a6e] hover:text-[#8b8b9e] transition-colors"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 mb-3">
        <button
          onClick={() => setActiveTab("all")}
          className={cn(
            "text-[11px] font-medium px-2.5 py-1 rounded-full transition-colors",
            activeTab === "all"
              ? "bg-gradient-to-r from-[#5682F2] to-[#7C5BF2] text-white"
              : "text-[#8b8b9e] hover:bg-white/[0.06]"
          )}
        >
          Tout
        </button>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "text-[11px] font-medium px-2.5 py-1 rounded-full transition-colors",
              activeTab === tab
                ? "bg-gradient-to-r from-[#5682F2] to-[#7C5BF2] text-white"
                : "text-[#8b8b9e] hover:bg-white/[0.06]"
            )}
          >
            {SCENARIO_CATEGORIES[tab]}
          </button>
        ))}
      </div>

      {/* Scenario pills */}
      <div className="flex flex-wrap gap-1.5">
        {filtered.map((p) => {
          const isActive = activePreset === p.id;
          return (
            <motion.button
              key={p.id}
              whileTap={{ scale: 0.96 }}
              onClick={() => applyPreset(p.id, p.changes)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 border",
                isActive
                  ? "bg-gradient-to-r from-[#5682F2] to-[#7C5BF2] border-transparent text-white shadow-md shadow-[#5682F2]/20"
                  : "bg-white/[0.04] border-white/[0.08] text-[#8b8b9e] hover:bg-white/[0.06]"
              )}
            >
              <Icon
                name={p.icon}
                className={cn("size-3.5", isActive ? "text-white" : "text-[#5682F2]")}
              />
              {p.title}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
