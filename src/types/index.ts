export type BillingType = "tjm" | "forfait" | "mission";

export interface ClientData {
  id: string;
  name: string;
  billing: BillingType;
  dailyRate?: number;
  daysPerMonth?: number;
  monthlyAmount?: number;
  totalAmount?: number;
  startMonth?: number;
  endMonth?: number;
  color?: string;
  isActive?: boolean;
}

export interface FreelanceProfile {
  monthlyExpenses: number;
  savings: number;
  adminHoursPerWeek: number;
  workDaysPerWeek: number;
}

export interface SimulationParams {
  vacationWeeks: number;
  rateChange: number;
  rateChangeAfter: number;
  lostClientIndex: number;
  newClients: number;
  workDaysPerWeek: number;
  expenseChange: number;
}

export interface ProjectionResult {
  before: number[];
  after: number[];
}

export type SubscriptionStatus = "FREE" | "ACTIVE" | "CANCELED" | "PAST_DUE";
