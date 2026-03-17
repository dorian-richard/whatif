export type BillingType = "tjm" | "forfait" | "mission";

// Types de lignes pour devis/factures
export type ItemType = "prestation" | "tjm" | "forfait" | "mission" | "produit" | "abonnement" | "licence" | "formation" | "acompte" | "avoir";

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
  startYear?: number;
  endYear?: number;
  color?: string;
  isActive?: boolean;
  // Contact / facturation
  email?: string;
  phone?: string;
  contactName?: string;
  companyName?: string;
  siret?: string;
  siren?: string;
  tvaNumber?: string;
  nafCode?: string;
  legalForm?: string;
  clientAddress?: string;
  clientCity?: string;
  clientZip?: string;
  clientCountry?: string;
  website?: string;
  paymentTermDays?: number;
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
  vacationDaysPerMonth?: number[];
  businessStatus: BusinessStatus;
  remunerationType?: RemunerationType;
  customUrssafRate?: number;
  customIrRate?: number;
  customTaxRate?: number;
  monthlySalary?: number;
  mixtePartSalaire?: number;
  nbParts?: number;
  chargesPro?: number;
  capitalSocial?: number;
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

// --- Holding ---

export type HoldingEntityType = "holding" | "operating" | "person";
export type HoldingFlowType = "dividend" | "management_fee" | "salary";

export interface HoldingEntity {
  id: string;
  name: string;
  type: HoldingEntityType;
  businessStatus?: string;
  annualCA: number;
  annualSalary: number;
  managementFees: number;
  positionX: number;
  positionY: number;
  color?: string;
}

export interface HoldingFlow {
  id: string;
  fromEntityId: string;
  toEntityId: string;
  type: HoldingFlowType;
  annualAmount: number;
}

export interface HoldingStructureData {
  id?: string;
  name: string;
  entities: HoldingEntity[];
  flows: HoldingFlow[];
}

export interface HoldingTaxResult {
  entityResults: EntityTaxResult[];
  totalCA: number;
  totalNetWithHolding: number;
  totalNetWithoutHolding: number;
  taxSavings: number;
  effectiveTaxRate: number;
}

export interface EntityTaxResult {
  entityId: string;
  entityName: string;
  entityType: HoldingEntityType;
  ca: number;
  managementFeesPaid: number;
  managementFeesReceived: number;
  salaryPaid: number;
  isAmount: number;
  dividendsPaid: number;
  netCash: number;
}

// --- Facturation ---

export type DocumentType = "devis" | "facture";
export type DocumentStatus = "draft" | "sent" | "accepted" | "refused" | "paid" | "late" | "partial" | "canceled";

export interface DocumentItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalHT: number;
  sortOrder: number;
  itemType?: ItemType;
  unit?: string; // "jour", "heure", "mois", "unité", "forfait", "licence"
}

export interface ClientSnapshot {
  name: string;
  companyName?: string;
  siret?: string;
  tvaNumber?: string;
  address?: string;
  city?: string;
  zip?: string;
  country?: string;
  email?: string;
  phone?: string;
}

export interface IssuerSnapshot {
  companyName?: string;
  siret?: string;
  tvaNumber?: string;
  address?: string;
  city?: string;
  zip?: string;
  iban?: string;
  bic?: string;
  logo?: string;
}

export interface InvoiceDocument {
  id: string;
  clientId: string;
  type: DocumentType;
  number: string;
  status: DocumentStatus;
  issueDate: string;
  dueDate?: string;
  validUntil?: string;
  sentAt?: string;
  paidAt?: string;
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  tvaRate: number;
  clientSnapshot?: ClientSnapshot;
  issuerSnapshot?: IssuerSnapshot;
  notes?: string;
  sourceDevisId?: string;
  prospectId?: string;
  pdfUrl?: string;
  items: DocumentItem[];
}

export interface InvoiceSettings {
  companyName?: string;
  siret?: string;
  tvaNumber?: string;
  invoiceAddress?: string;
  invoiceCity?: string;
  invoiceZip?: string;
  iban?: string;
  bic?: string;
  invoiceNotes?: string;
  invoiceLogo?: string;
  invoiceAccentColor?: string;
  invoiceFontSize?: "small" | "normal" | "large";
  invoiceShowIban?: boolean;
  invoiceShowBic?: boolean;
  invoiceFooter?: string;
}

export interface PDFOptions {
  accentColor: string;
  fontSize: "small" | "normal" | "large";
  showIban: boolean;
  showBic: boolean;
  customFooter?: string;
  logo?: string;
}
