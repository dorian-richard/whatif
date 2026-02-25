import type { HoldingEntity, HoldingFlow, HoldingTaxResult, EntityTaxResult, FreelanceProfile } from "@/types";
import { computeNetFromCA } from "./simulation-engine";

/** PFU (flat tax) on dividends: 12.8% IR + 17.2% CSG/CRDS */
const PFU_RATE = 0.30;

/**
 * IS progressif France :
 * - 15% sur les premiers 42 500€ de bénéfice
 * - 25% au-delà
 */
export function computeIS(profit: number): number {
  if (profit <= 0) return 0;
  const tranche1 = Math.min(profit, 42500);
  const tranche2 = Math.max(0, profit - 42500);
  return tranche1 * 0.15 + tranche2 * 0.25;
}

/**
 * Calcule la fiscalité complète d'une structure holding.
 *
 * Logique :
 * 1. Chaque entité opérationnelle : CA - salaires versés - frais de gestion payés = bénéfice → IS → dividendes
 * 2. Holding : reçoit frais de gestion + 5% des dividendes reçus (régime mère-fille) → IS → dividendes au fondateur
 * 3. Fondateur : salaires reçus + dividendes après PFU
 *
 * Sources de données :
 * - Salaire / frais de gestion : si des flux existent, on utilise les montants des flux.
 *   Sinon, on utilise les champs de l'entité (annualSalary / managementFees).
 * - CA : toujours depuis l'entité.
 * - Dividendes : toujours calculés (profit - IS).
 */
export function computeHoldingStructure(
  entities: HoldingEntity[],
  flows: HoldingFlow[],
  profile: FreelanceProfile
): HoldingTaxResult {
  const entityMap = new Map(entities.map((e) => [e.id, e]));
  const results = new Map<string, EntityTaxResult>();

  // Pre-compute flow totals per entity
  const salaryFlowsFrom = new Map<string, number>();
  const mgmtFeeFlowsFrom = new Map<string, number>();
  const mgmtFeeFlowsTo = new Map<string, number>();

  for (const flow of flows) {
    if (flow.type === "salary") {
      salaryFlowsFrom.set(flow.fromEntityId, (salaryFlowsFrom.get(flow.fromEntityId) ?? 0) + flow.annualAmount);
    } else if (flow.type === "management_fee") {
      mgmtFeeFlowsFrom.set(flow.fromEntityId, (mgmtFeeFlowsFrom.get(flow.fromEntityId) ?? 0) + flow.annualAmount);
      mgmtFeeFlowsTo.set(flow.toEntityId, (mgmtFeeFlowsTo.get(flow.toEntityId) ?? 0) + flow.annualAmount);
    }
  }

  // Initialize results for all entities
  // Use flow amounts when flows exist, otherwise fall back to entity fields
  for (const entity of entities) {
    const hasSalaryFlows = salaryFlowsFrom.has(entity.id);
    const hasMgmtFeeFlows = mgmtFeeFlowsFrom.has(entity.id);

    const salaryPaid = hasSalaryFlows
      ? salaryFlowsFrom.get(entity.id)!
      : entity.annualSalary;

    const managementFeesPaid = hasMgmtFeeFlows
      ? mgmtFeeFlowsFrom.get(entity.id)!
      : entity.managementFees;

    // For management fees received: use flows if they exist, else 0
    const managementFeesReceived = mgmtFeeFlowsTo.get(entity.id) ?? 0;

    results.set(entity.id, {
      entityId: entity.id,
      entityName: entity.name,
      entityType: entity.type,
      ca: entity.annualCA,
      managementFeesPaid,
      managementFeesReceived,
      salaryPaid,
      isAmount: 0,
      dividendsPaid: 0,
      netCash: 0,
    });
  }

  // Step 1: Compute operating entities (profit → IS → dividends available)
  const dividendsToHolding = new Map<string, number>();
  const dividendsToPerson = new Map<string, number>();

  for (const entity of entities) {
    if (entity.type !== "operating") continue;
    const r = results.get(entity.id)!;

    const profit = Math.max(0, r.ca - r.salaryPaid - r.managementFeesPaid);
    const is = computeIS(profit);
    r.isAmount = is;
    r.dividendsPaid = Math.max(0, profit - is);
    r.netCash = r.ca - r.salaryPaid - r.managementFeesPaid - is;

    // Track where dividends go based on flows
    let dividendsRouted = false;
    for (const flow of flows) {
      if (flow.fromEntityId === entity.id && flow.type === "dividend") {
        const target = entityMap.get(flow.toEntityId);
        if (target?.type === "holding") {
          const prev = dividendsToHolding.get(target.id) ?? 0;
          dividendsToHolding.set(target.id, prev + r.dividendsPaid);
          dividendsRouted = true;
        } else if (target?.type === "person") {
          const prev = dividendsToPerson.get(target.id) ?? 0;
          dividendsToPerson.set(target.id, prev + r.dividendsPaid);
          dividendsRouted = true;
        }
      }
    }

    // If no dividend flows exist, auto-route: to first holding, or first person
    if (!dividendsRouted && r.dividendsPaid > 0) {
      const holding = entities.find((e) => e.type === "holding");
      if (holding) {
        const prev = dividendsToHolding.get(holding.id) ?? 0;
        dividendsToHolding.set(holding.id, prev + r.dividendsPaid);
      } else {
        const person = entities.find((e) => e.type === "person");
        if (person) {
          const prev = dividendsToPerson.get(person.id) ?? 0;
          dividendsToPerson.set(person.id, prev + r.dividendsPaid);
        }
      }
    }
  }

  // Step 2: Compute holding entities
  // Régime mère-fille: only 5% of received dividends are taxable
  let totalPersonSalaries = 0;
  let totalPersonDividends = 0;

  for (const entity of entities) {
    if (entity.type !== "holding") continue;
    const r = results.get(entity.id)!;

    const receivedDividends = dividendsToHolding.get(entity.id) ?? 0;
    const taxableDividends = receivedDividends * 0.05; // régime mère-fille

    const taxableIncome = r.managementFeesReceived + taxableDividends;
    const deductibleCharges = r.salaryPaid;
    const profit = Math.max(0, taxableIncome - deductibleCharges);
    const is = computeIS(profit);
    r.isAmount = is;

    // Total cash in holding = management fees + dividends received - salary paid - IS
    const holdingCash = r.managementFeesReceived + receivedDividends - r.salaryPaid - is;
    r.dividendsPaid = Math.max(0, holdingCash);
    r.netCash = holdingCash;

    // Salaries paid by holding go to person
    totalPersonSalaries += r.salaryPaid;
  }

  // Salaries from operating entities to person
  for (const entity of entities) {
    if (entity.type !== "operating") continue;
    const r = results.get(entity.id)!;

    // Check if salary flows exist from this entity
    const hasSalaryFlows = flows.some((f) => f.fromEntityId === entity.id && f.type === "salary");
    if (hasSalaryFlows) {
      // Use flow amounts (already aggregated in r.salaryPaid)
      for (const flow of flows) {
        if (flow.fromEntityId === entity.id && flow.type === "salary") {
          const to = entityMap.get(flow.toEntityId);
          if (to?.type === "person") {
            totalPersonSalaries += flow.annualAmount;
          }
        }
      }
    } else if (r.salaryPaid > 0) {
      // No salary flows: assume salary goes to person
      totalPersonSalaries += r.salaryPaid;
    }
  }

  // Dividends from holding to person (after PFU)
  for (const entity of entities) {
    if (entity.type !== "holding") continue;
    const r = results.get(entity.id)!;
    totalPersonDividends += r.dividendsPaid;
  }

  // Direct operating → person dividends
  for (const [personId, amount] of dividendsToPerson) {
    totalPersonDividends += amount;
  }

  // Person node result
  for (const entity of entities) {
    if (entity.type !== "person") continue;
    const r = results.get(entity.id)!;
    // Charges sociales sur salaires (~45% for SASU dirigeant)
    const netSalaries = totalPersonSalaries * 0.55; // ~45% charges sociales
    const netDividends = totalPersonDividends * (1 - PFU_RATE);
    r.netCash = netSalaries + netDividends;
  }

  // Totals
  const totalCA = entities
    .filter((e) => e.type === "operating")
    .reduce((sum, e) => sum + e.annualCA, 0);

  const totalNetWithHolding = Array.from(results.values())
    .filter((r) => r.entityType === "person")
    .reduce((sum, r) => sum + r.netCash, 0);

  const totalNetWithoutHolding = computeWithoutHolding(totalCA, profile);

  const totalTaxes = totalCA - totalNetWithHolding;
  const effectiveTaxRate = totalCA > 0 ? totalTaxes / totalCA : 0;

  return {
    entityResults: Array.from(results.values()),
    totalCA,
    totalNetWithHolding,
    totalNetWithoutHolding,
    taxSavings: totalNetWithHolding - totalNetWithoutHolding,
    effectiveTaxRate,
  };
}

/**
 * Calcule le net sans holding, via computeNetFromCA du moteur de simulation.
 */
export function computeWithoutHolding(totalCA: number, profile: FreelanceProfile): number {
  return computeNetFromCA(totalCA, profile);
}
