export interface ApplicationDocument {
  name: string;
  status: string;
  detail: string;
}

export interface ApplicationIntegration {
  technicalStatus: string;
  errorMessage: string;
  websiteJson: Record<string, unknown> | null;
  scoringRequestXml: string;
  scoringResponseXml: string;
  rateRequestJson: Record<string, unknown> | null;
  rateResponseJson: Record<string, unknown> | null;
}

export interface LogEntry {
  id: string;
  recordId: number;
  inquiryId: string;
  interfaceName: string;
  message: string;
  status: string;
  timestamp: string;
}

export interface ApplicationRecord {
  id: number;
  inquiryId: string;
  createdAt: string;
  firstName: string;
  lastName: string;
  email: string;
  street: string;
  houseNumber: string;
  address: string;
  postalCode: string;
  city: string;
  employer: string;
  employerVatId: string;
  employedSince: string;
  monthlyNetIncome: number;
  iban: string;
  loanType: string;
  loanAmount: number;
  termMonths: number;
  purpose: string;
  department: string;
  routeMessage: string;
  supportedInPhaseOne: boolean;
  futurePhase: boolean;
  invalidProductRange: boolean;
  documents: ApplicationDocument[];
  completenessStatus: string;
  scoringStatus: string;
  score: number | null;
  riskClass: string;
  teamleadRequired: boolean;
  teamleadDecision: string;
  rateCalculationStatus: string;
  interestRate: number | null;
  monthlyRate: number | null;
  offerStatus: string;
  documentStatus: string;
  signatureStatus: string;
  mailStatus: string;
  archiveStatus: string;
  overallStatus: string;
  currentOwner: string;
  logs: LogEntry[];
  integration: ApplicationIntegration;
}

export interface ApplicationDraft {
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  postalCode: string;
  city: string;
  employer: string;
  employerVatId: string;
  monthlyNetIncome: string;
  employedSince: string;
  iban: string;
  loanType: string;
  loanAmount: string;
  termMonths: string;
  purpose: string;
}

export interface ValidationResult {
  valid: boolean;
  tone: 'info' | 'warning' | 'danger' | 'success';
  hardBlock: boolean;
  message: string;
}

export interface RoutingResult {
  department: string;
  routeMessage: string;
  supportedInPhaseOne: boolean;
  futurePhase: boolean;
  invalidProductRange: boolean;
}

export interface TimelineStep {
  title: string;
  description: string;
  state: 'complete' | 'current' | 'danger' | 'skipped' | 'pending';
}

export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
