"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProfileStore, type SubscriptionStatus } from "@/stores/useProfileStore";
import { Slider } from "@/components/ui/slider";
import { fmt, cn } from "@/lib/utils";
import { BUSINESS_STATUS_CONFIG } from "@/lib/constants";
import { getClientBaseCA } from "@/lib/simulation-engine";
import type { BusinessStatus, RemunerationType } from "@/types";
import { CalendarDays, ClipboardList, Receipt, Landmark, HandCoins, Target, Banknote, Users, Check, X, Info, Briefcase, Sun, Moon, Monitor } from "@/components/ui/icons";
import { useTheme } from "next-themes";
import { MONTHS_SHORT } from "@/lib/constants";
import { METIERS, METIER_CATEGORIES, CATEGORY_COLORS } from "@/lib/benchmark-data";
import { getEffectiveStatus, getTrialDaysRemaining } from "@/lib/subscription";

export default function SettingsPage() {
  const router = useRouter();
  const profile = useProfileStore();
  const currentConfig = BUSINESS_STATUS_CONFIG[profile.businessStatus ?? "micro"];
  const [deleteConfirm, setDeleteConfirm] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  // Refresh subscription status when page gets focus (returning from Stripe portal)
  useEffect(() => {
    async function refreshSubscription() {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) return;
        const data = await res.json();
        if (data.subscriptionStatus) {
          profile.setSubscriptionStatus(data.subscriptionStatus as SubscriptionStatus);
        }
      } catch { /* ignore */ }
    }

    const onFocus = () => refreshSubscription();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleUpgrade = async (plan: "monthly" | "annual") => {
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert("Erreur checkout : " + (data.error || "erreur inconnue"));
    } catch (err) {
      console.error("Checkout error:", err);
      alert("Erreur de connexion au checkout.");
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      {/* Business status */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="mb-5">
          <h2 className="text-sm font-bold text-foreground">Statut juridique</h2>
          <p className="text-[11px] text-muted-foreground/60 mt-1">Détermine les taux de cotisations sociales, d&apos;IR et d&apos;IS appliqués à tes revenus.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {(Object.entries(BUSINESS_STATUS_CONFIG) as [BusinessStatus, typeof BUSINESS_STATUS_CONFIG[BusinessStatus]][]).map(
            ([key, config]) => (
              <button
                key={key}
                onClick={() => profile.setProfile({ businessStatus: key })}
                className={cn(
                  "p-3 rounded-xl border text-left transition-all duration-150",
                  profile.businessStatus === key
                    ? "bg-primary/15 border-primary/30"
                    : "bg-muted/20 border-border hover:border-border"
                )}
              >
                <div className={cn(
                  "text-xs font-semibold",
                  profile.businessStatus === key ? "text-primary" : "text-foreground"
                )}>
                  {config.label}
                </div>
                <div className="text-[10px] text-muted-foreground/60 mt-0.5 leading-relaxed">{config.desc}</div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[9px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-medium">
                    {config.regime}
                  </span>
                  {config.plafond && (
                    <span className="text-[9px] bg-[#fbbf24]/10 text-[#fbbf24] px-1.5 py-0.5 rounded font-medium">
                      {config.plafond}
                    </span>
                  )}
                </div>
              </button>
            )
          )}
        </div>

        {/* Detail panel for selected status */}
        <div className="mt-4 p-4 bg-muted/20 rounded-xl border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Landmark className="size-4 text-primary" />
            <span className="text-sm font-bold text-foreground">{currentConfig.label}</span>
            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{currentConfig.regime}</span>
          </div>

          <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">{currentConfig.details}</p>

          {/* Rates summary */}
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="text-center p-2 bg-muted/20 rounded-lg">
              <div className="text-lg font-bold text-primary">{(currentConfig.urssaf * 100).toFixed(1).replace(/\.0$/, "")}%</div>
              <div className="text-[9px] text-muted-foreground/60 uppercase tracking-wider font-medium">
                {profile.businessStatus === "sasu_ir" ? "Prélèvements sociaux" : "Cotisations"}
              </div>
              <div className="text-[9px] text-muted-foreground/60">
                {currentConfig.is > 0 ? "sur rémunération" : profile.businessStatus === "micro" ? "sur le CA" : profile.businessStatus === "sasu_ir" ? "CSG/CRDS sur résultat" : "sur bénéfice"}
              </div>
            </div>
            <div className="text-center p-2 bg-muted/20 rounded-lg">
              <div className="text-lg font-bold text-[#F4BE7E]">{(currentConfig.ir * 100).toFixed(1)}%</div>
              <div className="text-[9px] text-muted-foreground/60 uppercase tracking-wider font-medium">IR estimé</div>
              <div className="text-[9px] text-muted-foreground/60">
                {profile.businessStatus === "micro" ? "après abattement 34%" : "barème progressif"}
              </div>
            </div>
            <div className="text-center p-2 bg-muted/20 rounded-lg">
              <div className="text-lg font-bold text-[#a78bfa]">{currentConfig.is > 0 ? `${(currentConfig.is * 100).toFixed(0)}%` : "\u2014"}</div>
              <div className="text-[9px] text-muted-foreground/60 uppercase tracking-wider font-medium">IS</div>
              <div className="text-[9px] text-muted-foreground/60">
                {currentConfig.is > 0 ? "15% \u2264 42 500\u20AC, 25% après" : "Non applicable"}
              </div>
            </div>
          </div>

          {/* Avantages / Inconvenients */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] font-semibold text-[#4ade80] uppercase tracking-wider mb-1.5">Avantages</div>
              <ul className="space-y-1">
                {currentConfig.avantages.map((a) => (
                  <li key={a} className="flex items-start gap-1.5 text-[10px] text-muted-foreground leading-tight">
                    <Check className="size-3 text-[#4ade80] shrink-0 mt-0.5" />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-[10px] font-semibold text-[#f87171] uppercase tracking-wider mb-1.5">Inconvenients</div>
              <ul className="space-y-1">
                {currentConfig.inconvenients.map((i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[10px] text-muted-foreground leading-tight">
                    <X className="size-3 text-[#f87171] shrink-0 mt-0.5" />
                    {i}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Warnings */}
          {currentConfig.warnings && currentConfig.warnings.length > 0 && (
            <div className="mt-3 p-3 bg-[#fbbf24]/12 border border-[#fbbf24]/20 rounded-lg">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Info className="size-3 text-[#fbbf24]" />
                <span className="text-[10px] font-semibold text-[#fbbf24] uppercase tracking-wider">Points de vigilance</span>
              </div>
              {currentConfig.warnings.map((w, i) => (
                <p key={i} className="text-[10px] text-muted-foreground leading-relaxed">{w}</p>
              ))}
            </div>
          )}
        </div>

        {/* Custom IR rate */}
        <div className="mt-4 p-4 bg-muted/20 rounded-xl border border-border">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-muted-foreground">Taux IR personnalisé</label>
            <div className="flex items-center gap-2">
              {profile.customIrRate != null && (
                <button
                  onClick={() => profile.setProfile({ customIrRate: undefined })}
                  className="text-[10px] text-muted-foreground/60 hover:text-red-400 transition-colors"
                >
                  Réinitialiser
                </button>
              )}
              <span className="text-sm font-bold text-primary">
                {((profile.customIrRate ?? currentConfig.ir) * 100).toFixed(0)}%
              </span>
            </div>
          </div>
          <Slider
            value={[(profile.customIrRate ?? currentConfig.ir) * 100]}
            onValueChange={([v]) => profile.setProfile({ customIrRate: v / 100 })}
            min={0}
            max={45}
            step={0.5}
          />
          <div className="flex items-start gap-1.5 mt-2">
            <Info className="size-3 text-muted-foreground/60 shrink-0 mt-0.5" />
            <p className="text-[10px] text-muted-foreground/60">
              Défaut : {(currentConfig.ir * 100).toFixed(1)}% pour {currentConfig.label}. Ajustez selon votre tranche marginale réelle (11%, 30%, 41% ou 45%).
            </p>
          </div>
        </div>

        {/* SASU IR: prélèvements sociaux rate choice */}
        {profile.businessStatus === "sasu_ir" && (
          <div className="mt-4 p-4 bg-muted/20 rounded-xl border border-border space-y-3">
            <div className="text-sm font-medium text-foreground">Taux de prélèvements sociaux</div>
            <div className="text-[10px] text-muted-foreground leading-relaxed">
              Le résultat est imposé à l&apos;IR au nom de l&apos;associé unique (transparence fiscale). Les prélèvements sociaux (CSG/CRDS) s&apos;appliquent sur le résultat fiscal.
            </div>
            <div className="flex gap-2">
              {([
                { rate: 0.097, label: "9,7%", desc: "Revenus professionnels (position EC)" },
                { rate: 0.172, label: "17,2%", desc: "Provisionnement prudent" },
              ]).map(({ rate, label, desc }) => (
                <button
                  key={rate}
                  onClick={() => profile.setProfile({ customUrssafRate: rate === 0.097 ? undefined : rate })}
                  className={cn(
                    "flex-1 p-3 rounded-xl text-left transition-all border",
                    (profile.customUrssafRate ?? 0.097) === rate
                      ? "bg-primary/10 border-primary/30 ring-1 ring-primary/20"
                      : "bg-muted/15 border-border hover:bg-muted/25"
                  )}
                >
                  <div className="text-sm font-bold text-foreground">{label}</div>
                  <div className="text-[10px] text-muted-foreground">{desc}</div>
                </button>
              ))}
            </div>
            <div className="flex items-start gap-1.5 pt-2 border-t border-border">
              <Info className="size-3 text-[#fbbf24] shrink-0 mt-0.5" />
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                L&apos;administration fiscale conteste parfois le taux de 9,7% en requalifiant les revenus en revenus du patrimoine (17,2%). Par prudence, provisionnez sur la base de 17,2%. Paiement auprès de l&apos;URSSAF par courrier uniquement.
              </p>
            </div>
          </div>
        )}

        {/* Remuneration type — only for IS structures */}
        {(profile.businessStatus === "eurl_is" || profile.businessStatus === "sasu_is") && (
          <div className="mt-4 p-4 bg-muted/25 rounded-xl border border-border">
            <label className="text-sm font-medium text-muted-foreground mb-3 block">Mode de rémunération</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {([
                { key: "salaire" as RemunerationType, label: "Salaire", icon: <Banknote className="size-4 text-emerald-400" />, desc: `Charges ${(currentConfig.urssaf * 100).toFixed(0)}% + IR, pas d'IS` },
                { key: "dividendes" as RemunerationType, label: "Dividendes", icon: <HandCoins className="size-4 text-purple-400" />, desc: profile.businessStatus === "sasu_is" ? "IS 15% + PFU 30% flat" : "IS 15% + cotisations TNS + IR" },
                { key: "mixte" as RemunerationType, label: "Mixte", icon: <Users className="size-4 text-[#5682F2]" />, desc: "Salaire + dividendes" },
              ]).map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => profile.setProfile({ remunerationType: opt.key })}
                  className={cn(
                    "p-3 rounded-xl border text-left transition-all duration-150",
                    (profile.remunerationType ?? "salaire") === opt.key
                      ? "bg-[#5682F2]/15 border-[#5682F2]/30"
                      : "bg-muted/25 border-border hover:border-border"
                  )}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    {opt.icon}
                    <span className={cn(
                      "text-xs font-semibold",
                      (profile.remunerationType ?? "salaire") === opt.key ? "text-[#5682F2]" : "text-foreground"
                    )}>{opt.label}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground/70">{opt.desc}</div>
                </button>
              ))}
            </div>
            <div className="flex items-start gap-1.5 mt-2">
              <Info className="size-3 text-muted-foreground/70 shrink-0 mt-0.5" />
              <p className="text-[10px] text-muted-foreground/70">
                {(profile.remunerationType ?? "salaire") === "salaire"
                  ? "Toute la rémunération passe en salaire. Charges sociales élevées mais déductibles de l'IS."
                  : (profile.remunerationType ?? "salaire") === "dividendes"
                    ? profile.businessStatus === "sasu_is"
                      ? "Tout en dividendes : IS 15% sur le bénéfice, puis PFU 30% (12.8% IR + 17.2% CSG/CRDS)."
                      : "Tout en dividendes : IS 15% sur le bénéfice, puis cotisations TNS (~45%) + IR sur les dividendes > 10% du capital."
                    : "Répartissez votre CA entre salaire et dividendes selon le curseur ci-dessous."
                }
              </p>
            </div>

            {/* Mixte split slider */}
            {(profile.remunerationType ?? "salaire") === "mixte" && (() => {
              const pct = profile.mixtePartSalaire ?? 50;
              const totalCA = profile.clients.reduce((s, c) => s + getClientBaseCA(c), 0);
              const salairePart = totalCA * (pct / 100);
              const divPart = totalCA - salairePart;
              return (
                <div className="mt-4 p-4 bg-muted/15 rounded-xl border border-border">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-medium text-muted-foreground">Répartition</label>
                    <span className="text-xs font-bold text-[#5682F2]">{pct}% salaire &middot; {100 - pct}% dividendes</span>
                  </div>
                  <Slider
                    value={[pct]}
                    onValueChange={([v]) => profile.setProfile({ mixtePartSalaire: v })}
                    min={0}
                    max={100}
                    step={5}
                  />
                  {/* Visual bar */}
                  <div className="flex h-2 rounded-full overflow-hidden mt-3 bg-muted/25">
                    <div
                      className="h-full bg-emerald-400 transition-all duration-200"
                      style={{ width: `${pct}%` }}
                    />
                    <div
                      className="h-full bg-purple-400 transition-all duration-200"
                      style={{ width: `${100 - pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5 text-[10px]">
                    <span className="text-emerald-400 font-medium">
                      <Banknote className="size-3 inline mr-0.5" />
                      Salaire {totalCA > 0 ? `\u2248 ${fmt(salairePart)}\u20AC/an` : ""}
                    </span>
                    <span className="text-purple-400 font-medium">
                      <HandCoins className="size-3 inline mr-0.5" />
                      Dividendes {totalCA > 0 ? `\u2248 ${fmt(divPart)}\u20AC/an` : ""}
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Profile */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h2 className="text-sm font-bold text-foreground mb-5">Profil freelance</h2>
        <div className="space-y-6">
          {/* Métier selector */}
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <Briefcase className="size-4 text-[#F4BE7E]" />
              <label className="text-sm font-medium text-muted-foreground">Mon métier</label>
              {profile.role && (
                <span className="ml-auto text-xs font-medium text-[#F4BE7E]">
                  {METIERS.find((m) => m.id === profile.role)?.label}
                </span>
              )}
            </div>
            <div className="space-y-3">
              {METIER_CATEGORIES.map((cat) => (
                <div key={cat}>
                  <div
                    className="text-[10px] font-semibold uppercase tracking-wider mb-1.5"
                    style={{ color: CATEGORY_COLORS[cat] ?? "#8b8b9e" }}
                  >
                    {cat}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {METIERS.filter((m) => m.category === cat).map((m) => (
                      <button
                        key={m.id}
                        onClick={() => profile.setProfile({ role: m.id })}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all",
                          profile.role === m.id
                            ? "ring-1"
                            : "bg-muted/25 text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                        style={
                          profile.role === m.id
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
            <p className="text-[10px] text-muted-foreground/70 mt-2">Utilisé pour personnaliser le benchmark TJM marché.</p>
          </div>

          <div className="border-t border-border" />

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><CalendarDays className="size-4 text-[#5682F2]" /> Jours de travail / semaine</label>
              <span className="text-sm font-bold text-[#5682F2]">{profile.workDaysPerWeek}j</span>
            </div>
            <Slider value={[profile.workDaysPerWeek]} onValueChange={([v]) => profile.setProfile({ workDaysPerWeek: v })} min={3} max={6} step={1} />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><Target className="size-4 text-teal-400" /> Jours travaillés / an</label>
              <span className="text-sm font-bold text-[#5682F2]">{profile.workedDaysPerYear ?? 218}j</span>
            </div>
            <Slider value={[profile.workedDaysPerYear ?? 218]} onValueChange={([v]) => profile.setProfile({ workedDaysPerYear: v })} min={100} max={260} step={1} />
            <div className="flex items-center justify-between mt-1.5">
              <p className="text-[10px] text-muted-foreground/70">Capacité totale de jours facturables sur l&apos;année.</p>
              <button
                onClick={() => {
                  const base = profile.workDaysPerWeek * 52;
                  const withVacation = base - 25;
                  profile.setProfile({ workedDaysPerYear: withVacation });
                }}
                className={cn(
                  "text-[10px] font-medium px-2 py-0.5 rounded-full border transition-colors",
                  (profile.workedDaysPerYear ?? 218) === profile.workDaysPerWeek * 52 - 25
                    ? "bg-[#5682F2]/15 text-[#5682F2] border-[#5682F2]/30"
                    : "bg-muted/25 text-muted-foreground border-border hover:border-border"
                )}
              >
                5 sem. congés ({profile.workDaysPerWeek * 52 - 25}j)
              </button>
            </div>
          </div>
          {/* Vacation days per month */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><Sun className="size-4 text-[#fbbf24]" /> Congés par mois ({(profile.vacationDaysPerMonth ?? [0,0,0,0,0,0,0,0,0,0,0,0]).reduce((a, b) => a + b, 0)}j/an)</label>
              <span className="text-sm font-bold text-[#fbbf24]">
                {(profile.vacationDaysPerMonth ?? [0,0,0,0,0,0,0,0,0,0,0,0]).reduce((a, b) => a + b, 0)}j
              </span>
            </div>
            <div className="grid grid-cols-4 md:grid-cols-6 gap-1.5">
              {MONTHS_SHORT.map((m, i) => {
                const vacDays = profile.vacationDaysPerMonth ?? [0,0,0,0,0,0,0,0,0,0,0,0];
                const val = vacDays[i] ?? 0;
                return (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <span className="text-[10px] text-muted-foreground/60 font-medium">{m}</span>
                    <input
                      type="number"
                      min={0}
                      max={22}
                      value={val}
                      onChange={(e) => {
                        const newVal = Math.max(0, Math.min(22, parseInt(e.target.value) || 0));
                        const newDays = [...vacDays];
                        newDays[i] = newVal;
                        profile.setProfile({ vacationDaysPerMonth: newDays });
                      }}
                      className={cn(
                        "w-full text-center text-sm font-semibold py-1.5 rounded-lg border bg-muted/15 focus:outline-none focus:ring-1 focus:ring-[#fbbf24]/40 transition-colors",
                        val > 0 ? "border-[#fbbf24]/30 text-[#fbbf24]" : "border-border text-muted-foreground/60"
                      )}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-[10px] text-muted-foreground/70">Répartis tes jours de congés pour refléter l&apos;impact sur ton CA mensuel.</p>
              <div className="flex gap-1.5">
                <button
                  onClick={() => {
                    profile.setProfile({ vacationDaysPerMonth: [0,0,0,0,0,0,5,10,0,0,0,5] });
                  }}
                  className="text-[10px] font-medium px-2 py-0.5 rounded-full border bg-muted/25 text-muted-foreground border-border hover:border-border transition-colors"
                >
                  Classique (20j)
                </button>
                <button
                  onClick={() => {
                    profile.setProfile({ vacationDaysPerMonth: [0,0,0,0,0,0,0,0,0,0,0,0] });
                  }}
                  className="text-[10px] font-medium px-2 py-0.5 rounded-full border bg-muted/25 text-muted-foreground border-border hover:border-border transition-colors"
                >
                  Aucun
                </button>
              </div>
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><ClipboardList className="size-4 text-[#5682F2]" /> Heures admin / semaine</label>
              <span className="text-sm font-bold text-[#5682F2]">{profile.adminHoursPerWeek}h</span>
            </div>
            <Slider value={[profile.adminHoursPerWeek]} onValueChange={([v]) => profile.setProfile({ adminHoursPerWeek: v })} min={0} max={20} step={1} />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><Receipt className="size-4 text-[#5682F2]" /> Charges mensuelles</label>
              <span className="text-sm font-bold text-[#5682F2]">{fmt(profile.monthlyExpenses)}&euro;</span>
            </div>
            <Slider value={[profile.monthlyExpenses]} onValueChange={([v]) => profile.setProfile({ monthlyExpenses: v })} min={500} max={6000} step={100} />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><Landmark className="size-4 text-[#5682F2]" /> Trésorerie de sécurité</label>
              <span className="text-sm font-bold text-[#5682F2]">{fmt(profile.savings)}&euro;</span>
            </div>
            <Slider value={[profile.savings]} onValueChange={([v]) => profile.setProfile({ savings: v })} min={0} max={60000} step={1000} />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><HandCoins className="size-4 text-purple-400" /> Salaire net / mois</label>
              <span className="text-sm font-bold text-[#5682F2]">{(profile.monthlySalary ?? 0) > 0 ? `${fmt(profile.monthlySalary ?? 0)}\u20AC` : "Non défini"}</span>
            </div>
            <Slider value={[profile.monthlySalary ?? 0]} onValueChange={([v]) => profile.setProfile({ monthlySalary: v })} min={0} max={30000} step={100} />
            <p className="text-[10px] text-muted-foreground/70 mt-1">Combien vous vous versez en net chaque mois. 0 = non utilisé dans les calculs.</p>
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><CalendarDays className="size-4 text-[#F4BE7E]" /> &Acirc;ge</label>
              <span className="text-sm font-bold text-[#F4BE7E]">{profile.age ?? 35} ans</span>
            </div>
            <Slider value={[profile.age ?? 35]} onValueChange={([v]) => profile.setProfile({ age: v })} min={18} max={70} step={1} />
            <p className="text-[10px] text-muted-foreground/70 mt-1">Utilisé pour la projection retraite.</p>
          </div>
        </div>
      </div>

      {/* Invoice settings */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h2 className="text-sm font-bold text-foreground mb-1">Informations de facturation</h2>
        <p className="text-[11px] text-muted-foreground/60 mb-5">Apparaissent sur tes devis et factures g&eacute;n&eacute;r&eacute;s en PDF.</p>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InvoiceField label="Nom de l'entreprise" value={profile.companyName ?? ""} onChange={(v) => profile.setProfile({ companyName: v || undefined })} />
            <InvoiceField label="SIRET" value={profile.siret ?? ""} onChange={(v) => profile.setProfile({ siret: v || undefined })} placeholder="123 456 789 00012" />
          </div>
          <InvoiceField label="N° TVA intracommunautaire" value={profile.tvaNumber ?? ""} onChange={(v) => profile.setProfile({ tvaNumber: v || undefined })} placeholder="FR12345678901" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <InvoiceField label="Adresse" value={profile.invoiceAddress ?? ""} onChange={(v) => profile.setProfile({ invoiceAddress: v || undefined })} className="sm:col-span-1" />
            <InvoiceField label="Code postal" value={profile.invoiceZip ?? ""} onChange={(v) => profile.setProfile({ invoiceZip: v || undefined })} />
            <InvoiceField label="Ville" value={profile.invoiceCity ?? ""} onChange={(v) => profile.setProfile({ invoiceCity: v || undefined })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InvoiceField label="IBAN" value={profile.iban ?? ""} onChange={(v) => profile.setProfile({ iban: v || undefined })} placeholder="FR76 ..." />
            <InvoiceField label="BIC" value={profile.bic ?? ""} onChange={(v) => profile.setProfile({ bic: v || undefined })} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground/70 mb-1 block">Mentions l&eacute;gales par d&eacute;faut</label>
            <textarea
              value={profile.invoiceNotes ?? ""}
              onChange={(e) => profile.setProfile({ invoiceNotes: e.target.value || undefined })}
              rows={2}
              placeholder={profile.businessStatus === "micro" ? "TVA non applicable, art. 293 B du CGI" : "Paiement à 30 jours par virement bancaire."}
              className="w-full px-3 py-2 bg-muted/25 border border-border rounded-xl text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-[#5682F2]/40"
            />
          </div>
        </div>
      </div>

      {/* Subscription */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h2 className="text-sm font-bold text-foreground mb-4">Abonnement</h2>
        {profile.subscriptionStatus === "ACTIVE" ? (
          <>
            <div className="flex items-center justify-between p-4 bg-primary/10 rounded-xl border border-primary/20 mb-4">
              <div>
                <span className="text-sm font-semibold text-primary">Plan Pro</span>
                <p className="text-xs text-muted-foreground">Clients illimités, toutes les fonctionnalités</p>
              </div>
              <span className="text-xs font-bold text-white bg-gradient-to-r from-[#5682F2] to-[#7C5BF2] px-3 py-1 rounded-full">Actif</span>
            </div>
            <button
              onClick={async () => {
                try {
                  const res = await fetch("/api/stripe/portal", { method: "POST" });
                  const data = await res.json();
                  if (data.url) window.location.href = data.url;
                  else alert("Impossible d\u2019ouvrir le portail : " + (data.error || "erreur inconnue"));
                } catch (err) {
                  console.error("Portal error:", err);
                  alert("Erreur de connexion au portail de paiement.");
                }
              }}
              className="w-full py-3 bg-muted/25 border border-border rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              Gérer mon abonnement
            </button>
          </>
        ) : profile.subscriptionStatus === "PAST_DUE" ? (
          <>
            <div className="flex items-center justify-between p-4 bg-[#fbbf24]/10 rounded-xl border border-[#fbbf24]/20 mb-4">
              <div>
                <span className="text-sm font-semibold text-[#fbbf24]">Plan Pro</span>
                <p className="text-xs text-muted-foreground">Paiement en attente &mdash; mettez à jour votre moyen de paiement</p>
              </div>
              <span className="text-xs font-bold text-[#fbbf24] bg-[#fbbf24]/15 px-3 py-1 rounded-full">Impayé</span>
            </div>
            <button
              onClick={async () => {
                try {
                  const res = await fetch("/api/stripe/portal", { method: "POST" });
                  const data = await res.json();
                  if (data.url) window.location.href = data.url;
                } catch (err) {
                  console.error("Portal error:", err);
                }
              }}
              className="w-full py-3 bg-[#fbbf24]/10 border border-[#fbbf24]/20 rounded-xl text-sm font-semibold text-[#fbbf24] hover:bg-[#fbbf24]/20 transition-colors"
            >
              Mettre à jour le paiement
            </button>
          </>
        ) : profile.subscriptionStatus === "CANCELED" ? (
          <>
            <div className="flex items-center justify-between p-4 bg-muted/25 rounded-xl border border-border mb-4">
              <div>
                <span className="text-sm font-semibold text-muted-foreground">Plan Pro annulé</span>
                <p className="text-xs text-muted-foreground/70">Votre abonnement a été annulé</p>
              </div>
              <span className="text-xs font-medium text-[#f87171] bg-[#f87171]/10 px-2 py-1 rounded-full">Annulé</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => handleUpgrade("monthly")} className="p-4 border-2 border-[#5682F2]/50 rounded-xl text-center bg-[#5682F2]/10 hover:bg-[#5682F2]/20 transition-colors">
                <div className="text-lg font-bold text-[#5682F2]">9&euro;/mois</div>
                <div className="text-xs text-muted-foreground">Se réabonner</div>
              </button>
              <button onClick={() => handleUpgrade("annual")} className="p-4 border-2 border-[#5682F2]/50 rounded-xl text-center bg-[#5682F2]/10 hover:bg-[#5682F2]/20 transition-colors relative">
                <span className="absolute -top-2 right-2 text-[10px] font-bold bg-gradient-to-r from-[#5682F2] to-[#7C5BF2] text-white px-2 py-0.5 rounded-full">-26%</span>
                <div className="text-lg font-bold text-[#5682F2]">79&euro;/an</div>
                <div className="text-xs text-muted-foreground">Se réabonner</div>
              </button>
            </div>
          </>
        ) : (
          (() => {
            const trialDays = getTrialDaysRemaining(profile.trialEndsAt);
            const isTrial = trialDays > 0;
            return (
              <>
                <div className={cn(
                  "flex items-center justify-between p-4 rounded-xl border mb-4",
                  isTrial ? "bg-primary/10 border-primary/20" : "bg-muted/25 border-border"
                )}>
                  <div>
                    <span className={cn("text-sm font-semibold", isTrial ? "text-primary" : "text-foreground")}>
                      {isTrial ? "Essai Pro" : "Plan Free"}
                    </span>
                    <p className="text-xs text-muted-foreground/70">
                      {isTrial
                        ? `${trialDays} jour${trialDays > 1 ? "s" : ""} restant${trialDays > 1 ? "s" : ""} — toutes les fonctionnalités Pro`
                        : "1 client, 1 scénario sauvegardé"}
                    </p>
                  </div>
                  <span className={cn(
                    "text-xs font-medium px-2 py-1 rounded-full",
                    isTrial
                      ? "text-white bg-gradient-to-r from-[#5682F2] to-[#7C5BF2] font-bold"
                      : "text-muted-foreground bg-muted"
                  )}>
                    {isTrial ? "Essai" : "Gratuit"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => handleUpgrade("monthly")} className="p-4 border-2 border-[#5682F2]/50 rounded-xl text-center bg-[#5682F2]/10 hover:bg-[#5682F2]/20 transition-colors">
                    <div className="text-lg font-bold text-[#5682F2]">9&euro;/mois</div>
                    <div className="text-xs text-muted-foreground">Mensuel</div>
                  </button>
                  <button onClick={() => handleUpgrade("annual")} className="p-4 border-2 border-[#5682F2]/50 rounded-xl text-center bg-[#5682F2]/10 hover:bg-[#5682F2]/20 transition-colors relative">
                    <span className="absolute -top-2 right-2 text-[10px] font-bold bg-gradient-to-r from-[#5682F2] to-[#7C5BF2] text-white px-2 py-0.5 rounded-full">-26%</span>
                    <div className="text-lg font-bold text-[#5682F2]">79&euro;/an</div>
                    <div className="text-xs text-muted-foreground">2 mois offerts</div>
                  </button>
                </div>
              </>
            );
          })()
        )}
      </div>

      {/* Apparence */}
      <AppearanceSection />

      {/* Danger zone */}
      <div className="bg-card rounded-2xl border border-[#f87171]/20 p-6">
        <h2 className="text-sm font-bold text-[#f87171] mb-4">Zone danger</h2>
        {!deleteConfirm ? (
          <button
            onClick={() => setDeleteConfirm(true)}
            className="px-4 py-2 text-sm text-[#f87171] border border-[#f87171]/20 rounded-xl hover:bg-[#f87171]/10 transition-colors"
          >
            Supprimer mon compte
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Cette action est <strong className="text-[#f87171]">irr&eacute;versible</strong>. Toutes tes donn&eacute;es (clients, sc&eacute;narios, paiements) seront d&eacute;finitivement supprim&eacute;es.
            </p>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  setDeleting(true);
                  try {
                    const res = await fetch("/api/profile/delete", { method: "POST" });
                    const data = await res.json();
                    if (data.deleted) {
                      localStorage.removeItem("freelens-profile");
                      localStorage.removeItem("freelens_scenarios");
                      window.location.href = "/login";
                    } else {
                      alert("Erreur : " + (data.error || "suppression impossible"));
                      setDeleting(false);
                    }
                  } catch {
                    alert("Erreur de connexion.");
                    setDeleting(false);
                  }
                }}
                disabled={deleting}
                className="px-4 py-2 text-sm font-semibold text-white bg-[#f87171] rounded-xl hover:bg-[#ef4444] transition-colors disabled:opacity-50"
              >
                {deleting ? "Suppression..." : "Confirmer la suppression"}
              </button>
              <button
                onClick={() => setDeleteConfirm(false)}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InvoiceField({ label, value, onChange, placeholder, className }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; className?: string;
}) {
  return (
    <div className={className}>
      <label className="text-xs text-muted-foreground/70 mb-1 block">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-muted/25 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-[#5682F2]/40"
      />
    </div>
  );
}

function AppearanceSection() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const options = [
    { value: "light", label: "Clair", icon: Sun },
    { value: "dark", label: "Sombre", icon: Moon },
    { value: "system", label: "Système", icon: Monitor },
  ] as const;

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <h2 className="text-sm font-bold text-foreground mb-4">Apparence</h2>
      <div className="grid grid-cols-3 gap-2">
        {options.map((opt) => {
          const Icon = opt.icon;
          const isActive = mounted && theme === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              className={cn(
                "p-3 rounded-xl border text-center transition-all duration-150",
                isActive
                  ? "bg-primary/15 border-primary/30"
                  : "bg-muted/20 border-border hover:border-border"
              )}
            >
              <Icon className={cn("size-5 mx-auto mb-1.5", isActive ? "text-primary" : "text-muted-foreground")} />
              <div className={cn("text-xs font-semibold", isActive ? "text-primary" : "text-foreground")}>{opt.label}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
