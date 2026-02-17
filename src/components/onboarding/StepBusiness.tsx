"use client";

import { useProfileStore } from "@/stores/useProfileStore";
import { BUSINESS_STATUS_CONFIG } from "@/lib/constants";
import type { BusinessStatus, RemunerationType } from "@/types";
import { cn } from "@/lib/utils";
import { Landmark, Check, X, Banknote, HandCoins, Users, Info } from "@/components/ui/icons";

export function StepBusiness() {
  const { businessStatus, remunerationType, setProfile } = useProfileStore();

  const config = BUSINESS_STATUS_CONFIG[businessStatus];

  const handleStatusChange = (key: BusinessStatus) => {
    setProfile({ businessStatus: key, customUrssafRate: undefined, remunerationType: undefined });
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-1">Ton statut juridique</h2>
      <p className="text-sm text-[#8b8b9e] mb-5">
        Détermine les taux de cotisations, d&apos;IR et d&apos;IS appliqués à tes revenus.
      </p>

      <div className="grid grid-cols-2 gap-2 mb-5">
        {(Object.entries(BUSINESS_STATUS_CONFIG) as [BusinessStatus, typeof BUSINESS_STATUS_CONFIG[BusinessStatus]][]).map(
          ([key, cfg]) => (
            <button
              key={key}
              onClick={() => handleStatusChange(key)}
              className={cn(
                "p-3 rounded-xl border text-left transition-all duration-150",
                businessStatus === key
                  ? "bg-[#5682F2]/15 border-[#5682F2]/30"
                  : "bg-white/[0.03] border-white/[0.06] hover:border-white/[0.1]"
              )}
            >
              <div className={cn(
                "text-xs font-semibold",
                businessStatus === key ? "text-[#5682F2]" : "text-white"
              )}>
                {cfg.label}
              </div>
              <div className="text-[10px] text-[#5a5a6e] mt-0.5 leading-relaxed">{cfg.desc}</div>
              <div className="flex flex-wrap gap-1 mt-1.5">
                <span className="text-[9px] bg-white/[0.06] text-[#8b8b9e] px-1.5 py-0.5 rounded font-medium">
                  {cfg.regime}
                </span>
                {cfg.plafond && (
                  <span className="text-[9px] bg-[#fbbf24]/10 text-[#fbbf24] px-1.5 py-0.5 rounded font-medium">
                    {cfg.plafond}
                  </span>
                )}
              </div>
            </button>
          )
        )}
      </div>

      {/* Detail for selected status */}
      <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Landmark className="size-4 text-[#5682F2]" />
          <span className="text-sm font-semibold text-white">{config.label}</span>
          <span className="text-[10px] bg-[#5682F2]/10 text-[#5682F2] px-2 py-0.5 rounded-full font-medium">{config.regime}</span>
        </div>

        <p className="text-[11px] text-[#8b8b9e] leading-relaxed">{config.details}</p>

        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-2 bg-white/[0.03] rounded-lg">
            <div className="text-lg font-bold text-[#5682F2]">
              {(config.urssaf * 100).toFixed(0)}%
            </div>
            <div className="text-[9px] text-[#5a5a6e] uppercase tracking-wider font-medium">Cotisations</div>
            <div className="text-[9px] text-[#5a5a6e]">
              {config.is > 0 ? "sur rémunération" : businessStatus === "micro" ? "sur le CA" : "sur bénéfice"}
            </div>
          </div>
          <div className="text-center p-2 bg-white/[0.03] rounded-lg">
            <div className="text-lg font-bold text-[#F4BE7E]">
              {(config.ir * 100).toFixed(1)}%
            </div>
            <div className="text-[9px] text-[#5a5a6e] uppercase tracking-wider font-medium">IR estimé</div>
            <div className="text-[9px] text-[#5a5a6e]">
              {businessStatus === "micro" ? "après abattement 34%" : "barème progressif"}
            </div>
          </div>
          {config.is > 0 && (
            <div className="text-center p-2 bg-white/[0.03] rounded-lg">
              <div className="text-lg font-bold text-[#a78bfa]">
                {(config.is * 100).toFixed(0)}%
              </div>
              <div className="text-[9px] text-[#5a5a6e] uppercase tracking-wider font-medium">IS</div>
              <div className="text-[9px] text-[#5a5a6e]">15% &le; 42 500&euro;, 25% après</div>
            </div>
          )}
        </div>

        {/* Avantages / Inconvenients compact */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/[0.06]">
          <ul className="space-y-0.5">
            {config.avantages.slice(0, 3).map((a) => (
              <li key={a} className="flex items-start gap-1 text-[10px] text-[#8b8b9e] leading-tight">
                <Check className="size-2.5 text-[#4ade80] shrink-0 mt-0.5" />
                {a}
              </li>
            ))}
          </ul>
          <ul className="space-y-0.5">
            {config.inconvenients.slice(0, 3).map((i) => (
              <li key={i} className="flex items-start gap-1 text-[10px] text-[#8b8b9e] leading-tight">
                <X className="size-2.5 text-[#f87171] shrink-0 mt-0.5" />
                {i}
              </li>
            ))}
          </ul>
        </div>

        {/* SASU IR: option to disable social charges */}
        {businessStatus === "sasu_ir" && (
          <div className="pt-3 border-t border-white/[0.06]">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={useProfileStore.getState().customUrssafRate === 0}
                onChange={() => {
                  const current = useProfileStore.getState().customUrssafRate;
                  setProfile({ customUrssafRate: current === 0 ? undefined : 0 });
                }}
                className="w-4 h-4 rounded border-white/[0.1] bg-white/[0.04] text-[#5682F2] focus:ring-[#5682F2]/40"
              />
              <div>
                <div className="text-xs font-medium text-white">Pas de rémunération président</div>
                <div className="text-[10px] text-[#5a5a6e]">0% de charges sociales, bénéfice imposé à l&apos;IR</div>
              </div>
            </label>
          </div>
        )}

        {/* Rémunération type — only for IS structures */}
        {(businessStatus === "eurl_is" || businessStatus === "sasu_is") && (
          <div className="pt-3 border-t border-white/[0.06]">
            <label className="text-xs font-semibold text-[#8b8b9e] mb-2 block">Mode de rémunération</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { key: "salaire" as RemunerationType, label: "Salaire", icon: <Banknote className="size-3.5 text-emerald-400" />, desc: `Charges ${(config.urssaf * 100).toFixed(0)}% + IR` },
                { key: "dividendes" as RemunerationType, label: "Dividendes", icon: <HandCoins className="size-3.5 text-purple-400" />, desc: businessStatus === "sasu_is" ? "IS + PFU 30%" : "IS + TNS + IR" },
                { key: "mixte" as RemunerationType, label: "Mixte", icon: <Users className="size-3.5 text-[#5682F2]" />, desc: "Salaire + dividendes" },
              ]).map((opt) => {
                const currentRemType = remunerationType ?? "salaire";
                return (
                  <button
                    key={opt.key}
                    onClick={() => setProfile({ remunerationType: opt.key })}
                    className={cn(
                      "p-2.5 rounded-xl border text-left transition-all duration-150",
                      currentRemType === opt.key
                        ? "bg-[#5682F2]/15 border-[#5682F2]/30"
                        : "bg-white/[0.03] border-white/[0.06] hover:border-white/[0.1]"
                    )}
                  >
                    <div className="flex items-center gap-1 mb-0.5">
                      {opt.icon}
                      <span className={cn(
                        "text-[11px] font-semibold",
                        currentRemType === opt.key ? "text-[#5682F2]" : "text-white"
                      )}>{opt.label}</span>
                    </div>
                    <div className="text-[9px] text-[#5a5a6e]">{opt.desc}</div>
                  </button>
                );
              })}
            </div>
            <div className="flex items-start gap-1.5 mt-2">
              <Info className="size-3 text-[#5a5a6e] shrink-0 mt-0.5" />
              <p className="text-[9px] text-[#5a5a6e]">
                {businessStatus === "sasu_is"
                  ? "SASU : dividendes au PFU 30% flat, sans cotisations TNS."
                  : "EURL : dividendes > 10% du capital soumis aux cotisations TNS (~45%)."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
