"use client";

import { useProfileStore } from "@/stores/useProfileStore";
import { Slider } from "@/components/ui/slider";

export function StepSchedule() {
  const { workDaysPerWeek, adminHoursPerWeek, setProfile } = useProfileStore();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Ton rythme de travail</h2>
        <p className="text-sm text-gray-400 mb-6">
          Ces infos servent a des simulations realistes.
        </p>
      </div>

      <div className="space-y-8">
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
              <span className="text-base">📅</span> Jours de travail / semaine
            </label>
            <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
              {workDaysPerWeek}j
            </span>
          </div>
          <Slider
            value={[workDaysPerWeek]}
            onValueChange={([v]) => setProfile({ workDaysPerWeek: v })}
            min={3}
            max={6}
            step={1}
          />
          <div className="flex justify-between text-xs text-gray-300 mt-1">
            <span>3j</span>
            <span>6j</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
              <span className="text-base">📋</span> Heures admin / semaine
            </label>
            <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
              {adminHoursPerWeek}h
            </span>
          </div>
          <Slider
            value={[adminHoursPerWeek]}
            onValueChange={([v]) => setProfile({ adminHoursPerWeek: v })}
            min={0}
            max={20}
            step={1}
          />
          <div className="flex justify-between text-xs text-gray-300 mt-1">
            <span>0h</span>
            <span>20h</span>
          </div>
        </div>
      </div>
    </div>
  );
}
