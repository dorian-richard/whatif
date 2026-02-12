"use client";

import { useSimulatorStore } from "@/stores/useSimulatorStore";
import { motion } from "framer-motion";
import { PRESET_SCENARIOS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icons";

export function PresetScenarios() {
  const { activePreset, applyPreset } = useSimulatorStore();

  return (
    <div>
      <h2 className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-3">
        Scenarios rapides
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {PRESET_SCENARIOS.map((p) => (
          <motion.button
            key={p.id}
            whileTap={{ scale: 0.96 }}
            onClick={() => applyPreset(p.id, p.changes)}
            className={cn(
              "p-3 rounded-xl border text-left transition-colors",
              activePreset === p.id
                ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200"
                : "bg-white border-gray-100 hover:border-indigo-200 hover:shadow-md"
            )}
          >
            <Icon
              name={p.icon}
              className={cn(
                "size-5",
                activePreset === p.id ? "text-white" : "text-indigo-500"
              )}
            />
            <div
              className={cn(
                "text-xs font-semibold mt-1.5",
                activePreset === p.id ? "text-white" : "text-gray-800"
              )}
            >
              {p.title}
            </div>
            <div
              className={cn(
                "text-xs mt-0.5",
                activePreset === p.id ? "text-indigo-200" : "text-gray-400"
              )}
            >
              {p.desc}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
