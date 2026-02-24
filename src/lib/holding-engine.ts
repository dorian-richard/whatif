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
 */
export function computeHoldingStructure(
  entities: HoldingEntity[],
  flows: HoldingFlow[],
  profile: FreelanceProfile
): HoldingTaxResult {
  const entityMap = new Map(entities.map((e) => [e.id, e]));
  const results = new Map<string, EntityTaxResult>();

  // Initialize results for all entities
  for (const entity of entities) {
    results.set(entity.id, {
      entityId: entity.id,
      entityName: entity.name,
      entityType: entity.type,
      ca: entity.annualCA,
      managementFeesPaid: 0,
      managementFeesReceived: 0,
      salaryPaid: 0,
      isAmount: 0,
      dividendsPaid: 0,
      netCash: 0,
    });
  }

  // Process flows: aggregate management fees and salaries
  for (const flow of flows) {
    const fromResult = results.get(flow.fromEntityId);
    const toResult = results.get(flow.toEntityId);
    if (!fromResult || !toResult) continue;

    if (flow.type === "management_fee") {
      fromResult.managementFeesPaid += flow.annualAmount;
      toResult.managementFeesReceived += flow.annualAmount;
    } else if (flow.type === "salary") {
      fromResult.salaryPaid += flow.annualAmount;
    }
  }

  // Step 1: Compute operating entities (profit → IS → dividends available)
  const dividendsToHolding = new Map<string, number>();

  for (const entity of entities) {
    if (entity.type !== "operating") continue;
    const r = results.get(entity.id)!;

    const profit = Math.max(0, r.ca - r.salaryPaid - r.managementFeesPaid);
    const is = computeIS(profit);
    r.isAmount = is;
    r.dividendsPaid = Math.max(0, profit - is);
    r.netCash = r.ca - r.salaryPaid - r.managementFeesPaid - is;

    // Find dividend flows from this entity to a holding
    for (const flow of flows) {
      if (flow.fromEntityId === entity.id && flow.type === "dividend") {
        const target = entityMap.get(flow.toEntityId);
        if (target?.type === "holding") {
          const prev = dividendsToHolding.get(target.id) ?? 0;
          dividendsToHolding.set(target.id, prev + r.dividendsPaid);
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

  // Step 3: Compute dividends from holding → person after PFU
  for (const flow of flows) {
    if (flow.type === "salary") {
      const from = entityMap.get(flow.fromEntityId);
      if (from?.type === "operating") {
        totalPersonSalaries += flow.annualAmount;
      }
    }
  }

  // Dividends from holding to person (after PFU)
  for (const entity of entities) {
    if (entity.type !== "holding") continue;
    const r = results.get(entity.id)!;
    totalPersonDividends += r.dividendsPaid;
  }

  // Also handle direct operating → person dividend flows (no holding in between)
  for (const flow of flows) {
    if (flow.type === "dividend") {
      const from = entityMap.get(flow.fromEntityId);
      const to = entityMap.get(flow.toEntityId);
      if (from?.type === "operating" && to?.type === "person") {
        const fromResult = results.get(from.id)!;
        totalPersonDividends += fromResult.dividendsPaid;
      }
    }
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
