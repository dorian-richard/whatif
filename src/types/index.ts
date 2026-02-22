export type BillingType = "tjm" | "forfait" | "mission";

export interface ClientData {
  id: string;
  name: string;
  billing: BillingType;
  dailyRate?: number;
  daysPerMonth?: number;
  daysPerWeek?: number;
  daysPerYear?: number;
  monthlyAmount?: number;
  totalAmount?: number;
  startMonth?: number;
  endMonth?: number;
  color?: string;
  isActive?: boolean;
}

export type BusinessStatus =
  | "micro"
  | "ei"
  | "eurl_ir"
  | "eurl_is"
  | "sasu_ir"
  | "sasu_is"
  | "portage";

export type RemunerationType = "salaire" | "dividendes" | "mixte";

export interface FreelanceProfile {
  monthlyExpenses: number;
  savings: number;
  adminHoursPerWeek: number;
  workDaysPerWeek: number;
  workedDaysPerYear?: number;
  businessStatus: BusinessStatus;
  remunerationType?: RemunerationType;
  customUrssafRate?: number;
  customIrRate?: number;
  customTaxRate?: number;
  monthlySalary?: number;
  mixtePartSalaire?: number;
  role?: string;
  age?: number;
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
