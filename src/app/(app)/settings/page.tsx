"use client";

import { useRouter } from "next/navigation";
import { useProfileStore } from "@/stores/useProfileStore";
import { Slider } from "@/components/ui/slider";
import { fmt, cn } from "@/lib/utils";
import { BUSINESS_STATUS_CONFIG } from "@/lib/constants";
import { getClientBaseCA } from "@/lib/simulation-engine";
import type { BusinessStatus, RemunerationType } from "@/types";
import { CalendarDays, ClipboardList, Receipt, Landmark, HandCoins, Target, Banknote, Users, Check, X, Info, Briefcase } from "@/components/ui/icons";
import { METIERS, METIER_CATEGORIES, CATEGORY_COLORS } from "@/lib/benchmark-data";

export default function SettingsPage() {
  const router = useRouter();
  const profile = useProfileStore();
  const currentConfig = BUSINESS_STATUS_CONFIG[profile.businessStatus ?? "micro"];

  const handleUpgrade = async (plan: "monthly" | "annual") => {
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch (err) {
      console.error("Checkout error:", err);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      {/* Business status */}
      <div className="bg-[#12121c] rounded-2xl border border-white/[0.06] p-6">
        <div className="mb-5">
          <h2 className="text-sm font-bold text-white">Statut juridique</h2>
          <p className="text-[11px] text-[#5a5a6e] mt-1">Détermine les taux de cotisations sociales, d&apos;IR et d&apos;IS appliqués à tes revenus.</p>
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
                    ? "bg-[#5682F2]/15 border-[#5682F2]/30"
                    : "bg-white/[0.03] border-white/[0.06] hover:border-white/[0.1]"
                )}
              >
                <div className={cn(
                  "text-xs font-semibold",
                  profile.businessStatus === key ? "text-[#5682F2]" : "text-white"
                )}>
                  {config.label}
                </div>
                <div className="text-[10px] text-[#5a5a6e] mt-0.5 leading-relaxed">{config.desc}</div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[9px] bg-white/[0.06] text-[#8b8b9e] px-1.5 py-0.5 rounded font-medium">
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
        <div className="mt-4 p-4 bg-white/[0.03] rounded-xl border border-white/[0.06]">
          <div className="flex items-center gap-2 mb-3">
            <Landmark className="size-4 text-[#5682F2]" />
            <span className="text-sm font-bold text-white">{currentConfig.label}</span>
            <span className="text-[10px] bg-[#5682F2]/10 text-[#5682F2] px-2 py-0.5 rounded-full font-medium">{currentConfig.regime}</span>
          </div>

          <p className="text-[11px] text-[#8b8b9e] leading-relaxed mb-3">{currentConfig.details}</p>

          {/* Rates summary */}
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="text-center p-2 bg-white/[0.03] rounded-lg">
              <div className="text-lg font-bold text-[#5682F2]">{(currentConfig.urssaf * 100).toFixed(0)}%</div>
              <div className="text-[9px] text-[#5a5a6e] uppercase tracking-wider font-medium">Cotisations</div>
              <div className="text-[9px] text-[#5a5a6e]">
                {currentConfig.is > 0 ? "sur rémunération" : profile.businessStatus === "micro" ? "sur le CA" : "sur bénéfice"}
              </div>
            </div>
            <div className="text-center p-2 bg-white/[0.03] rounded-lg">
              <div className="text-lg font-bold text-[#F4BE7E]">{(currentConfig.ir * 100).toFixed(1)}%</div>
              <div className="text-[9px] text-[#5a5a6e] uppercase tracking-wider font-medium">IR estimé</div>
              <div className="text-[9px] text-[#5a5a6e]">
                {profile.businessStatus === "micro" ? "après abattement 34%" : "barème progressif"}
              </div>
            </div>
            <div className="text-center p-2 bg-white/[0.03] rounded-lg">
              <div className="text-lg font-bold text-[#a78bfa]">{currentConfig.is > 0 ? `${(currentConfig.is * 100).toFixed(0)}%` : "\u2014"}</div>
              <div className="text-[9px] text-[#5a5a6e] uppercase tracking-wider font-medium">IS</div>
              <div className="text-[9px] text-[#5a5a6e]">
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
                  <li key={a} className="flex items-start gap-1.5 text-[10px] text-[#8b8b9e] leading-tight">
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
                  <li key={i} className="flex items-start gap-1.5 text-[10px] text-[#8b8b9e] leading-tight">
                    <X className="size-3 text-[#f87171] shrink-0 mt-0.5" />
                    {i}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Custom IR rate */}
        <div className="mt-4 p-4 bg-white/[0.03] rounded-xl border border-white/[0.06]">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-[#8b8b9e]">Taux IR personnalisé</label>
            <div className="flex items-center gap-2">
              {profile.customIrRate != null && (
                <button
                  onClick={() => profile.setProfile({ customIrRate: undefined })}
                  className="text-[10px] text-[#5a5a6e] hover:text-red-400 transition-colors"
                >
                  Réinitialiser
                </button>
              )}
              <span className="text-sm font-bold text-[#5682F2]">
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
            <Info className="size-3 text-[#5a5a6e] shrink-0 mt-0.5" />
            <p className="text-[10px] text-[#5a5a6e]">
              Défaut : {(currentConfig.ir * 100).toFixed(1)}% pour {currentConfig.label}. Ajustez selon votre tranche marginale réelle (11%, 30%, 41% ou 45%).
            </p>
          </div>
        </div>

        {/* SASU IR: option to disable social charges */}
        {profile.businessStatus === "sasu_ir" && (
          <div className="mt-4 p-4 bg-white/[0.03] rounded-xl border border-white/[0.06]">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={profile.customUrssafRate === 0}
                onChange={() =>
                  profile.setProfile({
                    customUrssafRate: profile.customUrssafRate === 0 ? undefined : 0,
                  })
                }
                className="w-4 h-4 rounded border-white/[0.1] bg-white/[0.04] text-[#5682F2] focus:ring-[#5682F2]/40"
              />
              <div>
                <div className="text-xs font-medium text-white">Pas de rémunération président</div>
                <div className="text-[10px] text-[#5a5a6e]">0% de charges sociales. Le bénéfice est imposé à l&apos;IR au nom de l&apos;associé unique.</div>
              </div>
            </label>
            {profile.customUrssafRate === 0 && (
              <div className="flex items-start gap-1.5 mt-3 pt-3 border-t border-white/[0.06]">
                <Info className="size-3 text-[#F4BE7E] shrink-0 mt-0.5" />
                <p className="text-[10px] text-[#8b8b9e]">
                  Sans salaire, pas de protection sociale (maladie, retraite, prévoyance). Le résultat est directement imposé à l&apos;IR au barème progressif dans votre déclaration personnelle.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Remuneration type — only for IS structures */}
        {(profile.businessStatus === "eurl_is" || profile.businessStatus === "sasu_is") && (
          <div className="mt-4 p-4 bg-white/[0.03] rounded-xl border border-white/[0.06]">
            <label className="text-sm font-medium text-[#8b8b9e] mb-3 block">Mode de rémunération</label>
            <div className="grid grid-cols-3 gap-2">
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
                      : "bg-white/[0.03] border-white/[0.06] hover:border-white/[0.1]"
                  )}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    {opt.icon}
                    <span className={cn(
                      "text-xs font-semibold",
                      (profile.remunerationType ?? "salaire") === opt.key ? "text-[#5682F2]" : "text-white"
                    )}>{opt.label}</span>
                  </div>
                  <div className="text-[10px] text-[#5a5a6e]">{opt.desc}</div>
                </button>
              ))}
            </div>
            <div className="flex items-start gap-1.5 mt-2">
              <Info className="size-3 text-[#5a5a6e] shrink-0 mt-0.5" />
              <p className="text-[10px] text-[#5a5a6e]">
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
                <div className="mt-4 p-4 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-medium text-[#8b8b9e]">Répartition</label>
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
                  <div className="flex h-2 rounded-full overflow-hidden mt-3 bg-white/[0.04]">
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
      <div className="bg-[#12121c] rounded-2xl border border-white/[0.06] p-6">
        <h2 className="text-sm font-bold text-white mb-5">Profil freelance</h2>
        <div className="space-y-6">
          {/* Métier selector */}
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <Briefcase className="size-4 text-[#F4BE7E]" />
              <label className="text-sm font-medium text-[#8b8b9e]">Mon métier</label>
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
                            : "bg-white/[0.04] text-[#8b8b9e] hover:text-white hover:bg-white/[0.06]"
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
            <p className="text-[10px] text-[#5a5a6e] mt-2">Utilisé pour personnaliser le benchmark TJM marché.</p>
          </div>

          <div className="border-t border-white/[0.06]" />

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-[#8b8b9e] flex items-center gap-1.5"><CalendarDays className="size-4 text-[#5682F2]" /> Jours de travail / semaine</label>
              <span className="text-sm font-bold text-[#5682F2]">{profile.workDaysPerWeek}j</span>
            </div>
            <Slider value={[profile.workDaysPerWeek]} onValueChange={([v]) => profile.setProfile({ workDaysPerWeek: v })} min={3} max={6} step={1} />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-[#8b8b9e] flex items-center gap-1.5"><Target className="size-4 text-teal-400" /> Jours travaillés / an</label>
              <span className="text-sm font-bold text-[#5682F2]">{profile.workedDaysPerYear ?? 218}j</span>
            </div>
            <Slider value={[profile.workedDaysPerYear ?? 218]} onValueChange={([v]) => profile.setProfile({ workedDaysPerYear: v })} min={100} max={260} step={1} />
            <div className="flex items-center justify-between mt-1.5">
              <p className="text-[10px] text-[#5a5a6e]">Capacité totale de jours facturables sur l&apos;année.</p>
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
                    : "bg-white/[0.03] text-[#8b8b9e] border-white/[0.06] hover:border-white/[0.1]"
                )}
              >
                5 sem. congés ({profile.workDaysPerWeek * 52 - 25}j)
              </button>
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-[#8b8b9e] flex items-center gap-1.5"><ClipboardList className="size-4 text-[#5682F2]" /> Heures admin / semaine</label>
              <span className="text-sm font-bold text-[#5682F2]">{profile.adminHoursPerWeek}h</span>
            </div>
            <Slider value={[profile.adminHoursPerWeek]} onValueChange={([v]) => profile.setProfile({ adminHoursPerWeek: v })} min={0} max={20} step={1} />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-[#8b8b9e] flex items-center gap-1.5"><Receipt className="size-4 text-[#5682F2]" /> Charges mensuelles</label>
              <span className="text-sm font-bold text-[#5682F2]">{fmt(profile.monthlyExpenses)}&euro;</span>
            </div>
            <Slider value={[profile.monthlyExpenses]} onValueChange={([v]) => profile.setProfile({ monthlyExpenses: v })} min={500} max={6000} step={100} />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-[#8b8b9e] flex items-center gap-1.5"><Landmark className="size-4 text-[#5682F2]" /> Trésorerie de sécurité</label>
              <span className="text-sm font-bold text-[#5682F2]">{fmt(profile.savings)}&euro;</span>
            </div>
            <Slider value={[profile.savings]} onValueChange={([v]) => profile.setProfile({ savings: v })} min={0} max={60000} step={1000} />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-[#8b8b9e] flex items-center gap-1.5"><HandCoins className="size-4 text-purple-400" /> Salaire net / mois</label>
              <span className="text-sm font-bold text-[#5682F2]">{(profile.monthlySalary ?? 0) > 0 ? `${fmt(profile.monthlySalary ?? 0)}\u20AC` : "Non défini"}</span>
            </div>
            <Slider value={[profile.monthlySalary ?? 0]} onValueChange={([v]) => profile.setProfile({ monthlySalary: v })} min={0} max={30000} step={100} />
            <p className="text-[10px] text-[#5a5a6e] mt-1">Combien vous vous versez en net chaque mois. 0 = non utilisé dans les calculs.</p>
          </div>
        </div>
      </div>

      {/* Clients */}
      <div className="bg-[#12121c] rounded-2xl border border-white/[0.06] p-6">
        <h2 className="text-sm font-bold text-white mb-2">Mes clients</h2>
        <p className="text-[11px] text-[#5a5a6e] mb-4">Ajoute, modifie ou supprime tes clients et leurs modes de facturation.</p>
        <button
          onClick={() => router.push("/onboarding?step=1&from=settings")}
          className="w-full py-3 bg-gradient-to-r from-[#5682F2]/10 to-[#7C5BF2]/10 border border-[#5682F2]/20 rounded-xl text-sm font-semibold text-[#5682F2] hover:border-[#5682F2]/40 hover:from-[#5682F2]/15 hover:to-[#7C5BF2]/15 transition-all flex items-center justify-center gap-2"
        >
          <Users className="size-4" />
          Gérer mes clients &rarr;
        </button>
      </div>

      {/* Subscription */}
      <div className="bg-[#12121c] rounded-2xl border border-white/[0.06] p-6">
        <h2 className="text-sm font-bold text-white mb-4">Abonnement</h2>
        <div className="flex items-center justify-between p-4 bg-white/[0.03] rounded-xl border border-white/[0.06] mb-4">
          <div>
            <span className="text-sm font-semibold text-white">Plan Free</span>
            <p className="text-xs text-[#5a5a6e]">3 clients, 1 scénario sauvegardé</p>
          </div>
          <span className="text-xs font-medium text-[#8b8b9e] bg-white/[0.06] px-2 py-1 rounded-full">Gratuit</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => handleUpgrade("monthly")} className="p-4 border-2 border-[#5682F2]/50 rounded-xl text-center bg-[#5682F2]/10 hover:bg-[#5682F2]/20 transition-colors">
            <div className="text-lg font-bold text-[#5682F2]">9&euro;/mois</div>
            <div className="text-xs text-[#8b8b9e]">Mensuel</div>
          </button>
          <button onClick={() => handleUpgrade("annual")} className="p-4 border-2 border-[#5682F2]/50 rounded-xl text-center bg-[#5682F2]/10 hover:bg-[#5682F2]/20 transition-colors relative">
            <span className="absolute -top-2 right-2 text-[10px] font-bold bg-gradient-to-r from-[#5682F2] to-[#7C5BF2] text-white px-2 py-0.5 rounded-full">-26%</span>
            <div className="text-lg font-bold text-[#5682F2]">79&euro;/an</div>
            <div className="text-xs text-[#8b8b9e]">2 mois offerts</div>
          </button>
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-[#12121c] rounded-2xl border border-[#f87171]/20 p-6">
        <h2 className="text-sm font-bold text-[#f87171] mb-4">Zone danger</h2>
        <button className="px-4 py-2 text-sm text-[#f87171] border border-[#f87171]/20 rounded-xl hover:bg-[#f87171]/10 transition-colors">
          Supprimer mon compte
        </button>
      </div>
    </div>
  );
}
