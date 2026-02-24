import type { ClientData, FreelanceProfile } from "@/types";
import { getClientMonthlyCA } from "./simulation-engine";
import { SEASONALITY, MONTHS_SHORT, BUSINESS_STATUS_CONFIG } from "./constants";

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

export function computeCashflow(
  clients: ClientData[],
  profile: FreelanceProfile,
  startingBalance: number,
  threshold: number,
  months = 12
): CashflowMonth[] {
  const statusConfig = BUSINESS_STATUS_CONFIG[profile.businessStatus ?? "micro"];
  const urssafRate = profile.customUrssafRate ?? statusConfig.urssaf;
  const irRate = profile.customIrRate ?? statusConfig.ir;
  const isRate = statusConfig.is;
  const isMicro = profile.businessStatus === "micro";

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

    // Charges calculation
    let urssaf: number;
    let ir: number;
    let is: number;

    if (isMicro) {
      // Micro: taux forfaitaires sur le CA
      urssaf = income * urssafRate;
      ir = income * irRate;
      is = 0;
    } else if (isRate > 0) {
      // IS structures: simplified monthly provision
      urssaf = income * urssafRate;
      ir = income * (1 - urssafRate) * irRate;
      is = income * isRate;
    } else {
      // IR structures: URSSAF then IR on remainder
      urssaf = income * urssafRate;
      ir = income * (1 - urssafRate) * irRate;
      is = 0;
    }

    const expenses = profile.monthlyExpenses;
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
