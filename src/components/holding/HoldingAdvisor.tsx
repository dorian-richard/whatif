"use client";

import { useMemo } from "react";
import { Lightbulb, AlertTriangle, Check, Info, Shield, Zap } from "@/components/ui/icons";
import { fmt, cn } from "@/lib/utils";
import type { HoldingTaxResult, HoldingEntity, HoldingFlow, FreelanceProfile } from "@/types";

type Severity = "success" | "tip" | "warning" | "info";

interface Advice {
  id: string;
  severity: Severity;
  title: string;
  body: string;
  metric?: string;
}

const SEVERITY_CONFIG: Record<Severity, { icon: typeof Check; color: string; bg: string }> = {
  success: { icon: Check, color: "#4ade80", bg: "bg-[#4ade80]/8" },
  tip: { icon: Lightbulb, color: "#5682F2", bg: "bg-[#5682F2]/8" },
  warning: { icon: AlertTriangle, color: "#f59e0b", bg: "bg-[#f59e0b]/8" },
  info: { icon: Info, color: "#8b8b9e", bg: "bg-[#8b8b9e]/8" },
};

interface Props {
  result: HoldingTaxResult;
  entities: HoldingEntity[];
  flows: HoldingFlow[];
  profile: FreelanceProfile;
}

export function HoldingAdvisor({ result, entities, flows, profile }: Props) {
  const advices = useMemo(() => generateAdvices(result, entities, flows, profile), [result, entities, flows, profile]);

  if (advices.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="size-7 rounded-lg bg-[#5682F2]/10 flex items-center justify-center">
          <Zap className="size-3.5 text-[#5682F2]" />
        </div>
        <span className="text-xs font-bold text-foreground uppercase tracking-wider">Conseils</span>
      </div>

      <div className="space-y-2">
        {advices.map((advice) => {
          const cfg = SEVERITY_CONFIG[advice.severity];
          const Icon = cfg.icon;
          return (
            <div
              key={advice.id}
              className={cn("rounded-xl border border-border p-3 space-y-1", cfg.bg)}
            >
              <div className="flex items-start gap-2">
                <Icon className="size-3.5 mt-0.5 shrink-0" style={{ color: cfg.color }} />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-foreground">{advice.title}</div>
                  <div className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{advice.body}</div>
                  {advice.metric && (
                    <div className="text-[11px] font-bold mt-1" style={{ color: cfg.color }}>
                      {advice.metric}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legal disclaimer */}
      <div className="flex items-start gap-1.5 px-1">
        <Shield className="size-3 text-muted-foreground/80 mt-0.5 shrink-0" />
        <p className="text-[9px] text-muted-foreground/80 leading-relaxed">
          Ces conseils sont indicatifs et ne constituent pas un avis juridique ou fiscal. Consultez un expert-comptable pour valider votre structure.
        </p>
      </div>
    </div>
  );
}

function generateAdvices(
  result: HoldingTaxResult,
  entities: HoldingEntity[],
  flows: HoldingFlow[],
  profile: FreelanceProfile,
): Advice[] {
  const advices: Advice[] = [];
  const { totalCA, totalNetWithHolding, totalNetWithoutHolding, taxSavings, effectiveTaxRate } = result;

  const operating = entities.filter((e) => e.type === "operating");
  const holding = entities.find((e) => e.type === "holding");
  const person = entities.find((e) => e.type === "person");

  const totalSalaryFlows = flows.filter((f) => f.type === "salary").reduce((s, f) => s + f.annualAmount, 0);
  const totalDividendFlows = flows.filter((f) => f.type === "dividend").reduce((s, f) => s + f.annualAmount, 0);
  const totalMgmtFeeFlows = flows.filter((f) => f.type === "management_fee").reduce((s, f) => s + f.annualAmount, 0);

  // 1. Micro-enterprise warning
  if (profile.businessStatus === "micro") {
    advices.push({
      id: "micro-warning",
      severity: "warning",
      title: "Statut incompatible",
      body: "Le régime micro-entreprise ne permet pas de créer une holding. Passez en SASU IS ou EURL IS pour bénéficier de l'optimisation holding.",
    });
    return advices; // No point continuing
  }

  // 2. IR status warning
  if (profile.businessStatus?.includes("_ir")) {
    advices.push({
      id: "ir-warning",
      severity: "warning",
      title: "Statut IR peu adapté",
      body: "En transparence fiscale (IR), les bénéfices sont imposés directement à votre nom. Le régime mère-fille (exonération 95% des dividendes) nécessite l'IS. Envisagez le passage à l'IS pour optimiser via une holding.",
    });
  }

  // 3. CA threshold analysis
  if (totalCA < 60000) {
    advices.push({
      id: "ca-low",
      severity: "info",
      title: "CA modeste pour une holding",
      body: `Avec ${fmt(Math.round(totalCA))}€ de CA annuel, les frais de création et de gestion d'une holding (comptable, juridique ~2 000-4 000€/an) peuvent réduire l'avantage fiscal. La holding devient généralement rentable au-delà de 80 000€ de CA.`,
    });
  } else if (totalCA >= 80000 && totalCA < 150000) {
    advices.push({
      id: "ca-sweet",
      severity: "success",
      title: "CA adapté à la holding",
      body: `Votre CA de ${fmt(Math.round(totalCA))}€ est dans la zone où la holding commence à être avantageuse. L'économie fiscale peut couvrir les frais de gestion de la structure.`,
      metric: `Économie estimée : ${taxSavings >= 0 ? "+" : ""}${fmt(Math.round(taxSavings))}€/an`,
    });
  } else if (totalCA >= 150000) {
    advices.push({
      id: "ca-high",
      severity: "success",
      title: "Holding fortement recommandée",
      body: `Avec ${fmt(Math.round(totalCA))}€ de CA, la holding est un levier d'optimisation majeur. Le régime mère-fille et l'IS progressif permettent une fiscalité nettement plus avantageuse.`,
      metric: `Économie estimée : ${taxSavings >= 0 ? "+" : ""}${fmt(Math.round(taxSavings))}€/an`,
    });
  }

  // 4. Tax savings verdict
  if (taxSavings < 0 && totalCA >= 60000) {
    advices.push({
      id: "savings-negative",
      severity: "warning",
      title: "Structure actuelle non optimale",
      body: `Votre configuration actuelle génère ${fmt(Math.abs(Math.round(taxSavings)))}€ de surcoût fiscal par rapport à une structure sans holding. Ajustez la répartition salaire/dividendes ou les frais de gestion.`,
    });
  }

  // 5. IS bracket optimization
  for (const op of operating) {
    const opResult = result.entityResults.find((r) => r.entityId === op.id);
    if (!opResult) continue;
    const profit = Math.max(0, opResult.ca - opResult.salaryPaid - opResult.managementFeesPaid);

    if (profit > 42500 && profit < 100000) {
      const excess = profit - 42500;
      const potentialSaving = Math.round(excess * 0.10); // 25% - 15% = 10% savings
      advices.push({
        id: `is-bracket-${op.id}`,
        severity: "tip",
        title: `Optimiser le seuil IS de ${op.name}`,
        body: `Le bénéfice de ${fmt(Math.round(profit))}€ dépasse le seuil IS réduit (42 500€). Les ${fmt(Math.round(excess))}€ excédentaires sont taxés à 25% au lieu de 15%. Extrayez ce surplus via un salaire ou des frais de gestion pour rester dans la tranche à 15%.`,
        metric: `Économie potentielle : ~${fmt(potentialSaving)}€/an`,
      });
    }
  }

  // 6. No salary = no social protection
  if (totalSalaryFlows === 0 && holding) {
    const operatingSalaries = operating.reduce((s, e) => s + (e.annualSalary ?? 0), 0);
    const holdingSalary = holding.annualSalary ?? 0;
    if (operatingSalaries === 0 && holdingSalary === 0) {
      advices.push({
        id: "no-salary",
        severity: "warning",
        title: "Aucun salaire versé",
        body: "L'extraction 100% dividendes ne cotise pas à la retraite ni à la sécurité sociale. Versez-vous un salaire minimum (ex: SMIC ~21 200€/an) pour valider vos trimestres retraite et bénéficier de la protection sociale.",
        metric: "Salaire minimum conseillé : ~21 200€/an",
      });
    }
  }

  // 7. Management fee reasonableness
  if (totalMgmtFeeFlows > 0 && totalCA > 0) {
    const mgmtFeePct = totalMgmtFeeFlows / totalCA;
    if (mgmtFeePct > 0.15) {
      advices.push({
        id: "mgmt-fee-high",
        severity: "warning",
        title: "Frais de gestion élevés",
        body: `Vos frais de gestion représentent ${Math.round(mgmtFeePct * 100)}% du CA. Au-delà de 10-15%, l'administration fiscale peut requalifier ces frais. Documentez précisément les prestations rendues par la holding (direction générale, stratégie, comptabilité, RH).`,
      });
    } else if (mgmtFeePct > 0) {
      advices.push({
        id: "mgmt-fee-ok",
        severity: "info",
        title: "Convention de gestion",
        body: `Frais de gestion à ${Math.round(mgmtFeePct * 100)}% du CA — proportion raisonnable. Veillez à formaliser une convention de gestion écrite entre vos sociétés, détaillant les prestations rendues.`,
      });
    }
  } else if (holding && totalCA > 80000) {
    advices.push({
      id: "mgmt-fee-missing",
      severity: "tip",
      title: "Ajoutez des frais de gestion",
      body: "Les frais de gestion (5-10% du CA) permettent de transférer du résultat de l'opérationnelle vers la holding, réduisant l'IS et optimisant la trésorerie. C'est un levier classique d'optimisation.",
      metric: `Montant suggéré : ${fmt(Math.round(totalCA * 0.08))}€/an (8% du CA)`,
    });
  }

  // 8. Missing flows
  if (holding && operating.length > 0) {
    const hasDividendFlow = flows.some((f) => f.type === "dividend");
    if (!hasDividendFlow) {
      advices.push({
        id: "no-dividend-flow",
        severity: "tip",
        title: "Ajoutez un flux de dividendes",
        body: "Les dividendes sont auto-routés vers la holding par défaut, mais créer un flux explicite vous donne un meilleur contrôle sur les montants distribués.",
      });
    }
  }

  // 9. Missing holding entity
  if (!holding && totalCA > 60000) {
    advices.push({
      id: "no-holding",
      severity: "tip",
      title: "Ajoutez une entité holding",
      body: "Sans holding, les dividendes sont taxés directement au PFU (30%). Avec une holding, le régime mère-fille exonère 95% des dividendes reçus, ne taxant que 5% à l'IS.",
    });
  }

  // 10. Effective tax rate benchmark
  if (effectiveTaxRate > 0) {
    if (effectiveTaxRate > 0.45) {
      advices.push({
        id: "tax-rate-high",
        severity: "warning",
        title: "Taux effectif élevé",
        body: `Votre taux effectif de ${Math.round(effectiveTaxRate * 100)}% est supérieur à la moyenne. Un bon montage holding vise 25-35%. Rééquilibrez la répartition salaire/dividendes et ajustez les frais de gestion.`,
      });
    } else if (effectiveTaxRate <= 0.30 && totalCA > 60000) {
      advices.push({
        id: "tax-rate-optimal",
        severity: "success",
        title: "Fiscalité optimisée",
        body: `Taux effectif de ${Math.round(effectiveTaxRate * 100)}% — votre structure est bien calibrée. Maintenez cette répartition et documentez soigneusement la convention de gestion.`,
      });
    }
  }

  // 11. Multiple operating entities
  if (operating.length >= 2) {
    advices.push({
      id: "multi-operating",
      severity: "info",
      title: "Multi-sociétés",
      body: `Avec ${operating.length} sociétés opérationnelles, chacune bénéficie du taux IS réduit à 15% sur les premiers 42 500€. Veillez à ce que les prix de transfert entre sociétés soient documentés et à valeur de marché.`,
    });
  }

  // 12. Salary optimization tip
  if (totalSalaryFlows > 0 && totalCA > 0) {
    const salaryPct = totalSalaryFlows / totalCA;
    if (salaryPct > 0.60) {
      advices.push({
        id: "salary-high",
        severity: "tip",
        title: "Part salariale importante",
        body: `Le salaire représente ${Math.round(salaryPct * 100)}% du CA. Au-delà de 50-60%, les charges sociales (~45%) pèsent lourd. Envisagez de basculer une partie en dividendes via la holding (PFU 30% vs ~45% charges sociales).`,
      });
    }
  }

  return advices;
}
