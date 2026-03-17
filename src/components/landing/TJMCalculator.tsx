"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { reverseCA } from "@/lib/simulation-engine";
import { BUSINESS_STATUS_CONFIG } from "@/lib/constants";
import { fmt } from "@/lib/utils";
import type { BusinessStatus, RemunerationType } from "@/types";
import { AnimateOnScroll } from "./AnimateOnScroll";

const STATUTS: { value: BusinessStatus; label: string }[] = Object.entries(BUSINESS_STATUS_CONFIG).map(
  ([key, cfg]) => ({ value: key as BusinessStatus, label: cfg.label })
);

export function TJMCalculator() {
  const [targetNet, setTargetNet] = useState(4000);
  const [status, setStatus] = useState<BusinessStatus>("micro");
  const [daysPerMonth, setDaysPerMonth] = useState(20);
  const [remType, setRemType] = useState<RemunerationType>("salaire");
  const [mixte, setMixte] = useState(50);

  const showRemOptions = BUSINESS_STATUS_CONFIG[status]?.is > 0 || status === "sasu_ir";

  const result = useMemo(() => {
    const annualNet = targetNet * 12;
    const effectiveRemType = showRemOptions ? remType : "salaire";
    const requiredCA = reverseCA(annualNet, status, effectiveRemType, mixte);
    const tjm = requiredCA / 12 / daysPerMonth;
    const tauxCharges = 1 - annualNet / requiredCA;
    return { requiredCA, tjm, tauxCharges };
  }, [targetNet, status, daysPerMonth, remType, mixte, showRemOptions]);

  return (
    <section id="calculateur" className="snap-section relative flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute bottom-1/3 right-1/3 w-[500px] h-[500px] bg-[#F4BE7E]/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20 w-full">
        <AnimateOnScroll>
          <div className="text-center mb-12">
            <span className="text-sm font-medium text-[#F4BE7E] uppercase tracking-widest mb-3 block">Calculateur</span>
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
              Quel TJM pour ton{" "}
              <span className="fn-gradient-text">objectif</span> ?
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Choisis ton revenu net cible, on calcule le TJM n&eacute;cessaire.
            </p>
          </div>
        </AnimateOnScroll>

        <AnimateOnScroll delay={0.15}>
          <div className="max-w-2xl mx-auto bg-card rounded-2xl border border-border p-6 sm:p-8">
            <div className="space-y-6">
              {/* Net target slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-foreground">Revenu net mensuel cible</label>
                  <span className="text-sm font-bold text-foreground">{fmt(targetNet)}&euro;/mois</span>
                </div>
                <input
                  type="range"
                  min={2000}
                  max={10000}
                  step={250}
                  value={targetNet}
                  onChange={(e) => setTargetNet(Number(e.target.value))}
                  className="w-full accent-[#5682F2]"
                />
                <div className="flex justify-between text-[11px] text-muted-foreground/70 mt-1">
                  <span>2 000&euro;</span>
                  <span>10 000&euro;</span>
                </div>
              </div>

              {/* Status select */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Statut juridique</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as BusinessStatus)}
                  className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#5682F2]/50"
                >
                  {STATUTS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              {/* Remuneration type (IS + SASU IR) */}
              {showRemOptions && (
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Type de r&eacute;mun&eacute;ration</label>
                  <div className="flex gap-2">
                    {([
                      { value: "salaire" as const, label: "Salaire" },
                      { value: "dividendes" as const, label: status === "sasu_ir" ? "Résultat" : "Dividendes" },
                      { value: "mixte" as const, label: "Mixte" },
                    ]).map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setRemType(opt.value)}
                        className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all border ${
                          remType === opt.value
                            ? "bg-[#5682F2]/15 text-[#5682F2] border-[#5682F2]/30"
                            : "bg-muted/30 text-muted-foreground border-border hover:bg-muted/50"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {remType === "mixte" && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">Part salaire</span>
                        <span className="text-xs font-bold text-foreground">{mixte}%</span>
                      </div>
                      <input
                        type="range"
                        min={10}
                        max={90}
                        step={10}
                        value={mixte}
                        onChange={(e) => setMixte(Number(e.target.value))}
                        className="w-full accent-[#5682F2]"
                      />
                      <div className="flex justify-between text-[10px] text-muted-foreground/70 mt-0.5">
                        <span>10% salaire</span>
                        <span>90% salaire</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Days per month slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-foreground">Jours travaill&eacute;s / mois</label>
                  <span className="text-sm font-bold text-foreground">{daysPerMonth}j</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={23}
                  step={1}
                  value={daysPerMonth}
                  onChange={(e) => setDaysPerMonth(Number(e.target.value))}
                  className="w-full accent-[#5682F2]"
                />
                <div className="flex justify-between text-[11px] text-muted-foreground/70 mt-1">
                  <span>10j</span>
                  <span>23j</span>
                </div>
              </div>
            </div>

            {/* Result */}
            <div className="mt-8 pt-6 border-t border-border text-center">
              <div className="text-sm text-muted-foreground mb-2">TJM recommand&eacute;</div>
              <div className="text-5xl font-bold fn-gradient-text mb-4">
                {fmt(Math.round(result.tjm))}&euro;
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-muted/40 rounded-xl p-3">
                  <div className="text-[11px] text-muted-foreground/80 uppercase tracking-wider">CA annuel requis</div>
                  <div className="text-lg font-bold text-foreground mt-1">{fmt(Math.round(result.requiredCA))}&euro;</div>
                </div>
                <div className="bg-muted/40 rounded-xl p-3">
                  <div className="text-[11px] text-muted-foreground/80 uppercase tracking-wider">Taux de charges</div>
                  <div className="text-lg font-bold text-foreground mt-1">{Math.round(result.tauxCharges * 100)}%</div>
                </div>
              </div>
              <Link
                href="/signup"
                className="inline-block px-8 py-3 bg-gradient-to-r from-[#5682F2] to-[#7C5BF2] text-white rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Affiner mon calcul &rarr;
              </Link>
              <p className="text-[10px] text-muted-foreground/80 mt-4 leading-relaxed">
                Estimations bas&eacute;es sur le bar&egrave;me IR 2026 et les taux URSSAF en vigueur. Consultez un expert-comptable pour une analyse personnalis&eacute;e.
              </p>
            </div>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
