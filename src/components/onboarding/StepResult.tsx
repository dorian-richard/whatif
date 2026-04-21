"use client";

import { useProfileStore } from "@/stores/useProfileStore";
import { computeNetFromCA, getAnnualCA } from "@/lib/simulation-engine";
import { BUSINESS_STATUS_CONFIG } from "@/lib/constants";
import { fmt } from "@/lib/utils";
import { Sparkles, TrendingUp, Receipt, Landmark } from "@/components/ui/icons";

export function StepResult() {
  const profile = useProfileStore();

  const annualCA = getAnnualCA(profile.clients, profile.vacationDaysPerMonth);
  const annualNet = computeNetFromCA(annualCA, profile);
  const monthlyNet = annualNet / 12;
  const monthlyCA = annualCA / 12;
  const afterExpenses = monthlyNet - profile.monthlyExpenses;
  const chargesAnnuelles = annualCA - annualNet;
  const provisionMensuelle = chargesAnnuelles / 12;

  // Compare against the "alternative" statuses to show gain/loss
  const alternatives = (["micro", "eurl_is", "sasu_is"] as const)
    .filter((s) => s !== profile.businessStatus)
    .map((s) => {
      const altNet = computeNetFromCA(annualCA, { ...profile, businessStatus: s });
      return {
        status: s,
        label: BUSINESS_STATUS_CONFIG[s].label,
        diff: altNet - annualNet,
      };
    })
    .sort((a, b) => b.diff - a.diff);

  const bestAlt = alternatives[0];

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="size-5 text-[#F4BE7E]" />
        <span className="text-xs font-bold uppercase tracking-wider text-[#F4BE7E]">
          Ton vrai net
        </span>
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-6">
        Voilà ce qu&apos;il te reste vraiment.
      </h2>

      {/* Hero number */}
      <div className="p-6 bg-gradient-to-br from-[#5682F2]/15 to-[#7C5BF2]/10 border border-[#5682F2]/30 rounded-2xl mb-4 text-center">
        <div className="text-xs text-muted-foreground/80 uppercase tracking-wider mb-1">
          Net mensuel après URSSAF & IR
        </div>
        <div className="text-4xl font-bold text-foreground mb-1">
          {fmt(Math.round(monthlyNet))}&euro;
          <span className="text-base text-muted-foreground font-normal">/mois</span>
        </div>
        <div className="text-xs text-muted-foreground">
          Soit <strong className="text-foreground">{fmt(Math.round(annualNet))}&euro;/an</strong> sur {fmt(Math.round(monthlyCA))}&euro;/mois de CA
        </div>
      </div>

      {/* 3 quick facts */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="p-3 bg-muted/40 border border-border rounded-xl">
          <Receipt className="size-4 text-[#f87171] mb-1" />
          <div className="text-[10px] text-muted-foreground/80 uppercase tracking-wider">À provisionner</div>
          <div className="text-sm font-bold text-foreground">
            {fmt(Math.round(provisionMensuelle))}&euro;/mois
          </div>
        </div>
        <div className="p-3 bg-muted/40 border border-border rounded-xl">
          <Landmark className="size-4 text-[#5682F2] mb-1" />
          <div className="text-[10px] text-muted-foreground/80 uppercase tracking-wider">Dispo après charges</div>
          <div className={`text-sm font-bold ${afterExpenses > 0 ? "text-[#4ade80]" : "text-[#f87171]"}`}>
            {fmt(Math.round(afterExpenses))}&euro;/mois
          </div>
        </div>
        <div className="p-3 bg-muted/40 border border-border rounded-xl">
          <TrendingUp className="size-4 text-[#F4BE7E] mb-1" />
          <div className="text-[10px] text-muted-foreground/80 uppercase tracking-wider">Taux de net</div>
          <div className="text-sm font-bold text-foreground">
            {annualCA > 0 ? Math.round((annualNet / annualCA) * 100) : 0}%
          </div>
        </div>
      </div>

      {/* Best alternative teaser */}
      {bestAlt && bestAlt.diff > 1000 && (
        <div className="p-4 bg-[#F4BE7E]/10 border border-[#F4BE7E]/30 rounded-xl">
          <div className="flex items-start gap-2">
            <Sparkles className="size-4 text-[#F4BE7E] shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-foreground">
                En <strong>{bestAlt.label}</strong>, tu gagnerais +{fmt(Math.round(bestAlt.diff))}&euro;/an
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                On te détaillera la comparaison dans le comparateur.
              </div>
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground/70 mt-4 text-center">
        Chiffres calculés avec les barèmes 2026 (URSSAF, IR progressif, IS, PFU, PUMa).
      </p>
    </div>
  );
}
