import type { ClientData, FreelanceProfile } from "@/types";
import { getClientMonthlyCA, computeIS } from "./simulation-engine";
import { SEASONALITY, MONTHS_SHORT, BUSINESS_STATUS_CONFIG } from "./constants";

const PFU_RATE = 0.30; // 12.8% IR + 17.2% CSG/CRDS

export interface CashflowMonth {
  month: number;
  label: string;
  income: number;
  urssaf: number;
  ir: number;
  is: number;
  expenses: number;
  totalOut: number;
  netFlow: number;
  balance: number;
  belowThreshold: boolean;
}

/**
 * Compute monthly charges breakdown consistent with computeNetFromCA logic.
 *
 * Micro: taux forfaitaires sur le CA (URSSAF + IR directs)
 * IR structures (EI, EURL IR, SASU IR): URSSAF sur CA, IR sur le reste
 * IS structures (EURL IS, SASU IS): dépend du mode de rémunération
 *   - Salaire: charges sociales + IR, pas d'IS (salaire déductible)
 *   - Dividendes: IS sur bénéfice, puis PFU 30% (SASU) ou TNS+IR (EURL)
 *   - Mixte: partie salaire + dividendes sur le reste
 */
function computeMonthlyCharges(
  income: number,
  profile: FreelanceProfile
): { urssaf: number; ir: number; is: number } {
  const statusConfig = BUSINESS_STATUS_CONFIG[profile.businessStatus ?? "micro"];
  const urssafRate = profile.customUrssafRate ?? statusConfig.urssaf;
  const irRate = profile.customIrRate ?? statusConfig.ir;
  const isRate = statusConfig.is;

  // Micro: taux forfaitaires sur le CA
  if (profile.businessStatus === "micro") {
    return {
      urssaf: income * urssafRate,
      ir: income * irRate,
      is: 0,
    };
  }

  // IR structures (pas d'IS): URSSAF puis IR sur le reste
  if (isRate === 0) {
    const urssaf = income * urssafRate;
    const ir = (income - urssaf) * irRate;
    return { urssaf, ir, is: 0 };
  }

  // --- IS structures (eurl_is, sasu_is) ---
  const remunerationType = profile.remunerationType ?? "salaire";
  const isSASU = profile.businessStatus === "sasu_is";

  // 100% Salaire: tout en rémunération → déductible → pas d'IS
  if (remunerationType === "salaire") {
    const urssaf = income * urssafRate;
    const ir = (income - urssaf) * irRate;
    return { urssaf, ir, is: 0 };
  }

  // 100% Dividendes: IS progressif sur bénéfice, puis taxation dividendes
  if (remunerationType === "dividendes") {
    // Annualize profit for progressive IS brackets, then take monthly portion
    const isAmount = computeIS(income * 12) / 12;
    const afterIS = income - isAmount;
    if (isSASU) {
      // PFU 30% flat (inclut IR + prélèvements sociaux)
      return { urssaf: 0, ir: afterIS * PFU_RATE, is: isAmount };
    }
    // EURL: charges TNS + IR sur dividendes
    const urssaf = afterIS * urssafRate;
    const ir = (afterIS - urssaf) * irRate;
    return { urssaf, ir, is: isAmount };
  }

  // Mixte: partie salaire + dividendes sur le reste
  const mixtePartSalaire = profile.mixtePartSalaire ?? 50;
  const salaryCost = income * (mixtePartSalaire / 100);

  // Partie salaire
  const salaryUrssaf = salaryCost * urssafRate;
  const salaryIR = (salaryCost - salaryUrssaf) * irRate;

  // Partie dividendes: bénéfice restant → IS progressif → taxation
  const remainingCA = Math.max(0, income - salaryCost);
  const isAmount = computeIS(remainingCA * 12) / 12;
  const afterIS = remainingCA - isAmount;

  let divUrssaf: number;
  let divIR: number;
  if (isSASU) {
    divUrssaf = 0;
    divIR = afterIS * PFU_RATE;
  } else {
    divUrssaf = afterIS * urssafRate;
    divIR = (afterIS - divUrssaf) * irRate;
  }

  return {
    urssaf: salaryUrssaf + divUrssaf,
    ir: salaryIR + divIR,
    is: isAmount,
  };
}

export function computeCashflow(
  clients: ClientData[],
  profile: FreelanceProfile,
  startingBalance: number,
  threshold: number,
  months = 12,
  expenseOverrides?: Record<number, number>,
): CashflowMonth[] {
  let balance = startingBalance;
  const result: CashflowMonth[] = [];
  const currentMonth = new Date().getMonth();

  for (let i = 0; i < months; i++) {
    const monthIndex = (currentMonth + i) % 12;
    const season = SEASONALITY[monthIndex];
    const vacDays = profile.vacationDaysPerMonth?.[monthIndex] ?? 0;

    let income = 0;
    for (const c of clients) {
      income += getClientMonthlyCA(c, monthIndex, season, vacDays);
    }

    const { urssaf, ir, is } = computeMonthlyCharges(income, profile);

    const expenses = Math.max(0, profile.monthlyExpenses + (expenseOverrides?.[monthIndex] ?? 0));
    const totalOut = urssaf + ir + is + expenses;
    const netFlow = income - totalOut;
    balance += netFlow;

    result.push({
      month: monthIndex,
      label: MONTHS_SHORT[monthIndex],
      income,
      urssaf,
      ir,
      is,
      expenses,
      totalOut,
      netFlow,
      balance,
      belowThreshold: balance < threshold,
    });
  }

  return result;
}
