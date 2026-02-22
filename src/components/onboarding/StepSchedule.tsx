"use client";

import { useProfileStore } from "@/stores/useProfileStore";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { CalendarDays, ClipboardList, Target } from "@/components/ui/icons";

export function StepSchedule() {
  const { workDaysPerWeek, workedDaysPerYear, adminHoursPerWeek, setProfile } = useProfileStore();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">Ton rythme de travail</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Ces infos servent à des simulations réalistes.
        </p>
      </div>

      <div className="space-y-8">
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <CalendarDays className="size-4 text-[#5682F2]" /> Jours de travail / semaine
            </label>
            <span className="text-sm font-bold text-[#5682F2] bg-[#5682F2]/10 px-2.5 py-1 rounded-md">
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
          <div className="flex justify-between text-xs text-muted-foreground/70 mt-1">
            <span>3j</span>
            <span>6j</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <Target className="size-4 text-teal-400" /> Jours travaillés / an
            </label>
            <span className="text-sm font-bold text-[#5682F2] bg-[#5682F2]/10 px-2.5 py-1 rounded-md">
              {workedDaysPerYear ?? 218}j
            </span>
          </div>
          <Slider
            value={[workedDaysPerYear ?? 218]}
            onValueChange={([v]) => setProfile({ workedDaysPerYear: v })}
            min={100}
            max={260}
            step={1}
          />
          <div className="flex justify-between text-xs text-muted-foreground/70 mt-1">
            <span>100j</span>
            <span>260j</span>
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <p className="text-[10px] text-muted-foreground/70">France : ~218j (hors vacances/fériés).</p>
            <button
              onClick={() => {
                const withVacation = workDaysPerWeek * 52 - 25;
                setProfile({ workedDaysPerYear: withVacation });
              }}
              className={cn(
                "text-[10px] font-medium px-2 py-0.5 rounded-full border transition-colors",
                (workedDaysPerYear ?? 218) === workDaysPerWeek * 52 - 25
                  ? "bg-[#5682F2]/15 text-[#5682F2] border-[#5682F2]/30"
                  : "bg-muted/50 text-muted-foreground border-border hover:border-border"
              )}
            >
              5 sem. congés ({workDaysPerWeek * 52 - 25}j)
            </button>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <ClipboardList className="size-4 text-[#5682F2]" /> Heures admin / semaine
            </label>
            <span className="text-sm font-bold text-[#5682F2] bg-[#5682F2]/10 px-2.5 py-1 rounded-md">
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
          <div className="flex justify-between text-xs text-muted-foreground/70 mt-1">
            <span>0h</span>
            <span>20h</span>
          </div>
        </div>
      </div>
    </div>
  );
}
