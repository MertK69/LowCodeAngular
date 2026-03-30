import { Injectable } from '@angular/core';
import {
  ApplicationRecord,
  ApplicationDraft,
  ApplicationDocument,
  ApplicationIntegration,
  LogEntry,
  RoutingResult,
  TimelineStep,
  ValidationResult,
} from '../models/application.model';

// Fixed reference date matching the reference project
const REFERENCE_DATE = new Date('2026-03-25T12:00:00');

@Injectable({ providedIn: 'root' })
export class ApplicationService {

  // ──────────────────────────────────────────────
  // Formatters
  // ──────────────────────────────────────────────

  formatCurrency(value: number | null, fractionDigits = 0): string {
    if (value === null || value === undefined || isNaN(Number(value))) return '–';
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(Number(value));
  }

  formatDate(value: string | null): string {
    if (!value) return '–';
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    }).format(new Date(value));
  }

  formatDateTime(value: string | null): string {
    if (!value) return '–';
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(value));
  }

  formatContractDate(value: string): string {
    if (!value) return '';
    if (value.includes('.')) return value;
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
  }

  formatContractIban(value: string): string {
    return this.normalizeIban(value).replace(/(.{4})/g, '$1 ').trim();
  }

  normalizeIban(value: string): string {
    return String(value || '').replace(/\s+/g, '');
  }

  splitAddress(value: string): [string, string] {
    const compact = String(value || '').trim().replace(/\s+/g, ' ');
    if (!compact.includes(' ')) return [compact, ''];
    const lastSpace = compact.lastIndexOf(' ');
    return [compact.substring(0, lastSpace), compact.substring(lastSpace + 1)];
  }

  buildInquiryId(sequence: number, createdAt: string): string {
    const date = new Date(createdAt);
    const suffix = String(sequence).padStart(4, '0');
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}-${suffix}`;
  }

  monthsSince(dateString: string): number {
    const start = new Date(dateString);
    const now = REFERENCE_DATE;
    let months = (now.getFullYear() - start.getFullYear()) * 12;
    months += now.getMonth() - start.getMonth();
    return Math.max(0, months);
  }

  toNumber(value: string | number): number {
    const n = Number(value);
    return isFinite(n) ? n : 0;
  }

  // ──────────────────────────────────────────────
  // Status helpers
  // ──────────────────────────────────────────────

  getStatusTone(status: string): string {
    const tones: Record<string, string> = {
      'Eingang': 'neutral', 'Routing': 'info', 'In Prüfung': 'warning',
      'Teamleitung': 'warning', 'Angebot': 'info', 'Signatur': 'info',
      'Abgeschlossen': 'success', 'Fehler': 'danger',
      'Abgelehnt': 'danger', 'Bereit': 'neutral', 'Aktiv': 'success',
      'Empfangen': 'info', 'Vollständig': 'success', 'Nicht erforderlich': 'neutral',
      'Nicht gestartet': 'neutral', 'Ausstehend': 'warning', 'Freigegeben': 'success',
      'Angebot erstellt': 'info', 'Dokument erstellt': 'success',
      'Zur Signatur gesendet': 'info', 'Signiert': 'success', 'Versendet': 'success',
      'Archiviert': 'success', 'Warnung': 'warning', 'Transformiert': 'info',
      'Vorhanden': 'success', 'Spätere Phase': 'info', 'Offen': 'warning',
      'OK': 'success', 'In Bearbeitung': 'warning',
    };
    return tones[status] || 'neutral';
  }

  // ──────────────────────────────────────────────
  // Validation
  // ──────────────────────────────────────────────

  validateDraft(draft: ApplicationDraft): ValidationResult {
    if (!this.hasRequiredDraftFields(draft)) {
      return {
        valid: false,
        tone: 'danger',
        hardBlock: true,
        message: 'Für den JSON-Eingang müssen alle Pflichtfelder vollständig vorliegen.',
      };
    }

    const loanAmount = this.toNumber(draft.loanAmount);
    if (loanAmount < 5000 || loanAmount > 15000) {
      return {
        valid: false,
        tone: 'danger',
        hardBlock: true,
        message: 'Die Kreditsumme muss zwischen 5.000 € und 15.000 € liegen.',
      };
    }

    const scopeMessage = this.getDraftScopeMessage(draft);
    if (scopeMessage) {
      return { valid: true, tone: 'warning', hardBlock: false, message: scopeMessage };
    }

    return {
      valid: true,
      tone: 'info',
      hardBlock: false,
      message: 'Pflichtfelder sind vollständig. Die Website könnte den Antrag direkt als JSON übergeben.',
    };
  }

  private hasRequiredDraftFields(draft: ApplicationDraft): boolean {
    const fields: (keyof ApplicationDraft)[] = [
      'firstName', 'lastName', 'email', 'address', 'postalCode', 'city',
      'employer', 'monthlyNetIncome', 'employedSince', 'iban',
      'loanType', 'loanAmount', 'termMonths', 'purpose',
    ];
    return !fields.some(f => !String(draft[f] || '').trim());
  }

  getDraftScopeMessage(draft: ApplicationDraft): string | null {
    const loanAmount = this.toNumber(draft.loanAmount);
    if (!loanAmount) return null;

    if (draft.loanType === 'Baufinanzierung') {
      return 'Baufinanzierungen werden angenommen, in eine Spezialabteilung geroutet und als spätere Projektphase markiert.';
    }
    if (draft.loanType === 'Großkredit') {
      return 'Großkredite werden angenommen, in eine Spezialabteilung geroutet und als spätere Projektphase markiert.';
    }
    if (draft.loanType === 'Konsumentenkredit' && loanAmount >= 10000) {
      return 'Der Antrag kann verarbeitet werden. Ab 10.000 € ist zusätzlich eine Teamleiterfreigabe erforderlich.';
    }
    return null;
  }

  getCollateralNote(draft: { loanType: string; loanAmount: number | string }): string {
    const amount = this.toNumber(String(draft.loanAmount));
    if (draft.loanType === 'Konsumentenkredit' && amount <= 20000) {
      return 'Keine Sicherheiten erforderlich.';
    }
    if (draft.loanType === 'Baufinanzierung' || amount >= 100000) {
      return 'Sicherheiten-Workflow für spätere Projektphase vorgesehen.';
    }
    return 'Sicherheiten und Sonderprüfungen werden abhängig vom Produktkorridor fachlich markiert.';
  }

  // ──────────────────────────────────────────────
  // Routing / department logic
  // ──────────────────────────────────────────────

  determineDepartment(record: { loanType: string; loanAmount: number }): RoutingResult {
    const { loanType, loanAmount } = record;

    if (loanType === 'Baufinanzierung' && loanAmount > 20000) {
      return {
        department: 'Baufinanzierung',
        routeMessage: 'Baufinanzierungen werden fachlich angenommen, in die Spezialabteilung Baufinanzierung geroutet und als spätere Projektphase markiert.',
        supportedInPhaseOne: false, futurePhase: true, invalidProductRange: false,
      };
    }
    if (loanType === 'Großkredit' || loanAmount >= 100000) {
      return {
        department: 'Großkredite',
        routeMessage: 'Großkredite ab 100.000 € werden fachlich angenommen, in eine Spezialabteilung geroutet und als spätere Projektphase markiert.',
        supportedInPhaseOne: false, futurePhase: true, invalidProductRange: false,
      };
    }
    if (loanType === 'Konsumentenkredit' && loanAmount >= 5000 && loanAmount <= 20000) {
      return {
        department: 'Konsumentenkredite',
        routeMessage: 'Der Antrag liegt im Zielkorridor der ersten Projektphase und wird an die Abteilung Konsumentenkredite geroutet.',
        supportedInPhaseOne: true, futurePhase: false, invalidProductRange: false,
      };
    }
    if (loanType === 'Konsumentenkredit' && loanAmount > 20000 && loanAmount < 100000) {
      return {
        department: 'Produktgrenze',
        routeMessage: 'Konsumentenkredite über 20.000 € und unter 100.000 € gibt es fachlich nicht. Der Antrag wird angenommen, aber als Produktgrenze markiert.',
        supportedInPhaseOne: false, futurePhase: false, invalidProductRange: true,
      };
    }
    if (loanType === 'Konsumentenkredit' && loanAmount < 5000) {
      return {
        department: 'Produktgrenze',
        routeMessage: 'Konsumentenkredite unter 5.000 € liegen außerhalb des definierten Produktkorridors. Der Antrag wird angenommen, aber fachlich markiert.',
        supportedInPhaseOne: false, futurePhase: false, invalidProductRange: true,
      };
    }
    if (loanType === 'Baufinanzierung') {
      return {
        department: 'Baufinanzierung',
        routeMessage: 'Baufinanzierungen beginnen fachlich erst oberhalb von 20.000 €. Der Antrag wird angenommen, aber als Produktgrenze markiert.',
        supportedInPhaseOne: false, futurePhase: false, invalidProductRange: true,
      };
    }
    return {
      department: 'Vorprüfung',
      routeMessage: 'Der Antrag liegt außerhalb des aktuell definierten Zielkorridors und muss fachlich geklärt werden.',
      supportedInPhaseOne: false, futurePhase: false, invalidProductRange: true,
    };
  }

  requiresTeamlead(record: { loanAmount: number }): boolean {
    return record.loanAmount >= 10000;
  }

  getPhaseLabel(record: ApplicationRecord): string {
    if (record.supportedInPhaseOne) return 'Phase 1';
    if (record.futurePhase) return 'Spätere Projektphase';
    if (record.invalidProductRange) return 'Produktgrenze';
    return 'Fachliche Klärung';
  }

  // ──────────────────────────────────────────────
  // Document management
  // ──────────────────────────────────────────────

  createDefaultDocuments(record: { loanType: string; loanAmount: number }): ApplicationDocument[] {
    const collateralStatus =
      record.loanType === 'Konsumentenkredit' && record.loanAmount <= 20000
        ? 'Nicht erforderlich'
        : record.loanType === 'Baufinanzierung' || record.loanAmount >= 100000
          ? 'Spätere Phase'
          : 'Ausstehend';

    return [
      { name: 'Online-Antrag', status: 'Empfangen', detail: 'Website liefert ein vollständiges JSON-Objekt.' },
      { name: 'Identitätsnachweis', status: 'Vorhanden', detail: 'Pflichtdokument für die Vorprüfung.' },
      { name: 'Einkommensnachweis', status: 'Vorhanden', detail: 'Pflichtdokument für die Bonitätsprüfung.' },
      { name: 'Sicherheiten', status: collateralStatus, detail: this.getCollateralNote(record) },
      { name: 'Angebotsdokument', status: 'Nicht gestartet', detail: 'Wird nach erfolgreicher Konditionsberechnung erzeugt.' },
      { name: 'Signaturprotokoll', status: 'Nicht gestartet', detail: 'Wird nach der Signaturstrecke aktualisiert.' },
    ];
  }

  private setDocumentStatus(record: ApplicationRecord, name: string, status: string, detail: string): void {
    const doc = record.documents.find(d => d.name === name);
    if (doc) {
      doc.status = status;
      doc.detail = detail;
    } else {
      record.documents.push({ name, status, detail });
    }
  }

  // ──────────────────────────────────────────────
  // Record normalization
  // ──────────────────────────────────────────────

  computeOverallStatus(record: ApplicationRecord): string {
    if (record.teamleadDecision === 'Abgelehnt') return 'Abgelehnt';
    if (record.integration.errorMessage) return 'Fehler';
    if (record.archiveStatus === 'Archiviert' || record.mailStatus === 'Versendet') return 'Abgeschlossen';
    if (['Zur Signatur gesendet', 'Signiert'].includes(record.signatureStatus)) return 'Signatur';
    if (record.offerStatus === 'Angebot erstellt' || record.documentStatus === 'Dokument erstellt' || record.rateCalculationStatus === 'Abgeschlossen') return 'Angebot';
    if (record.teamleadRequired && record.teamleadDecision === 'Ausstehend') return 'Teamleitung';
    if (['Abgeschlossen', 'In Bearbeitung'].includes(record.scoringStatus)) return 'In Prüfung';
    if (record.department !== 'Vorprüfung') return 'Routing';
    return 'Eingang';
  }

  normalizeRecord(record: ApplicationRecord): ApplicationRecord {
    if (!record.integration) {
      record.integration = {
        technicalStatus: 'Bereit',
        errorMessage: '',
        websiteJson: null,
        scoringRequestXml: '',
        scoringResponseXml: '',
        rateRequestJson: null,
        rateResponseJson: null,
      };
    }

    const routing = this.determineDepartment(record);
    Object.assign(record, routing);

    record.teamleadRequired = this.requiresTeamlead(record);
    if (record.teamleadRequired) {
      if (record.teamleadDecision === 'Nicht erforderlich') record.teamleadDecision = 'Nicht gestartet';
    } else {
      record.teamleadDecision = 'Nicht erforderlich';
    }

    if (!Array.isArray(record.documents) || record.documents.length === 0) {
      record.documents = this.createDefaultDocuments(record);
    }

    this.setDocumentStatus(
      record, 'Sicherheiten',
      record.loanType === 'Konsumentenkredit' && record.loanAmount <= 20000
        ? 'Nicht erforderlich'
        : record.loanType === 'Baufinanzierung' || record.loanAmount >= 100000
          ? 'Spätere Phase' : 'Ausstehend',
      this.getCollateralNote(record)
    );
    this.setDocumentStatus(
      record, 'Angebotsdokument',
      record.documentStatus === 'Dokument erstellt' ? 'Dokument erstellt' : 'Nicht gestartet',
      record.documentStatus === 'Dokument erstellt'
        ? 'Angebotsdokument wurde erzeugt.'
        : 'Wird nach erfolgreicher Konditionsberechnung erzeugt.'
    );
    this.setDocumentStatus(
      record, 'Signaturprotokoll',
      record.signatureStatus === 'Signiert'
        ? 'Signiert'
        : record.signatureStatus === 'Zur Signatur gesendet'
          ? 'Zur Signatur gesendet' : 'Nicht gestartet',
      record.signatureStatus === 'Signiert'
        ? 'Digitale Signatur erfolgreich abgeschlossen.'
        : record.signatureStatus === 'Zur Signatur gesendet'
          ? 'Vorgang liegt beim Signaturdienst.'
          : 'Wird nach der Signaturstrecke aktualisiert.'
    );

    record.completenessStatus = 'Vollständig';
    record.integration.technicalStatus = record.integration.errorMessage
      ? 'Fehler'
      : record.integration.scoringResponseXml || record.integration.rateResponseJson
        ? 'Aktiv' : 'Bereit';

    record.overallStatus = this.computeOverallStatus(record);
    record.currentOwner =
      record.overallStatus === 'Abgeschlossen' ? 'Archiv'
        : record.overallStatus === 'Teamleitung' ? 'Teamleitung'
          : 'Sachbearbeitung';

    return record;
  }

  // ──────────────────────────────────────────────
  // Record creation from draft
  // ──────────────────────────────────────────────

  createRecordFromDraft(
    draft: ApplicationDraft,
    opts: { id: number; inquiryId: string; createdAt: string }
  ): ApplicationRecord {
    const [street, houseNumber] = this.splitAddress(draft.address);
    const websiteJson = {
      origin: 'MFLB-Website LA',
      version: '1.2.0',
      loanapplication: {
        vorname: draft.firstName,
        nachname: draft.lastName,
        strasse: street,
        hausnummer: houseNumber,
        plz: draft.postalCode,
        ort: draft.city,
        arbeitgeber: draft.employer,
        arbeitgeberustid: draft.employerVatId || '–',
        'beschaeftigt-seit': this.formatContractDate(draft.employedSince),
        ibanhausbank: this.formatContractIban(draft.iban),
        kredithoehe: this.toNumber(draft.loanAmount),
        laufzeitmonate: this.toNumber(draft.termMonths),
        kreditzweck: draft.purpose,
      },
    };

    const record: ApplicationRecord = {
      id: opts.id,
      inquiryId: opts.inquiryId,
      createdAt: opts.createdAt,
      firstName: draft.firstName,
      lastName: draft.lastName,
      email: draft.email,
      street,
      houseNumber,
      address: draft.address,
      postalCode: draft.postalCode,
      city: draft.city,
      employer: draft.employer,
      employerVatId: draft.employerVatId || '–',
      employedSince: draft.employedSince,
      monthlyNetIncome: this.toNumber(draft.monthlyNetIncome),
      iban: this.normalizeIban(draft.iban),
      loanType: draft.loanType,
      loanAmount: this.toNumber(draft.loanAmount),
      termMonths: this.toNumber(draft.termMonths),
      purpose: draft.purpose,
      department: 'Vorprüfung',
      routeMessage: '',
      supportedInPhaseOne: false,
      futurePhase: false,
      invalidProductRange: false,
      documents: [],
      completenessStatus: 'Vollständig',
      scoringStatus: 'Nicht gestartet',
      score: null,
      riskClass: '–',
      teamleadRequired: false,
      teamleadDecision: 'Nicht erforderlich',
      rateCalculationStatus: 'Nicht gestartet',
      interestRate: null,
      monthlyRate: null,
      offerStatus: 'Nicht gestartet',
      documentStatus: 'Nicht gestartet',
      signatureStatus: 'Nicht gestartet',
      mailStatus: 'Nicht gestartet',
      archiveStatus: 'Nicht gestartet',
      overallStatus: 'Eingang',
      currentOwner: 'Website',
      logs: [],
      integration: {
        technicalStatus: 'Bereit',
        errorMessage: '',
        websiteJson,
        scoringRequestXml: '',
        scoringResponseXml: '',
        rateRequestJson: null,
        rateResponseJson: null,
      },
    };

    return this.normalizeRecord(record);
  }

  // ──────────────────────────────────────────────
  // Scoring
  // ──────────────────────────────────────────────

  calculateMockScore(record: ApplicationRecord): number {
    const employmentFactor = Math.min(15, this.monthsSince(record.employedSince) / 24);
    const incomeFactor = Math.min(20, record.monthlyNetIncome / 250);
    const amountPenalty = Math.min(15, record.loanAmount / 3000);
    const termPenalty = Math.min(10, record.termMonths / 24);
    const vatBonus = record.employerVatId !== '–' ? 4 : 0;
    const ibanBonus = String(record.iban).startsWith('DE') ? 3 : 0;
    const raw = 55 + employmentFactor + incomeFactor + vatBonus + ibanBonus - amountPenalty - termPenalty;
    return Math.max(1, Math.min(100, Math.round(raw)));
  }

  getRiskClass(score: number): string {
    if (score >= 85) return 'A';
    if (score >= 70) return 'B';
    if (score >= 55) return 'C';
    return 'D';
  }

  mapToScoringXml(record: ApplicationRecord): string {
    const [street, houseNumber] = this.splitAddress(record.address);
    return [
      '<ScoringRequest>',
      `  <AnfrageID>${record.inquiryId}</AnfrageID>`,
      `  <Vorname>${record.firstName}</Vorname>`,
      `  <Nachname>${record.lastName}</Nachname>`,
      `  <Strasse>${record.street || street}</Strasse>`,
      `  <Hausnummer>${record.houseNumber || houseNumber}</Hausnummer>`,
      `  <PLZ>${record.postalCode}</PLZ>`,
      `  <Ort>${record.city}</Ort>`,
      `  <Arbeitgeber>${record.employer}</Arbeitgeber>`,
      `  <ArbeitgeberUstID>${record.employerVatId}</ArbeitgeberUstID>`,
      `  <BeschaeftigtSeit>${this.formatContractDate(record.employedSince)}</BeschaeftigtSeit>`,
      `  <IBANHausbank>${this.formatContractIban(record.iban)}</IBANHausbank>`,
      '</ScoringRequest>',
    ].join('\n');
  }

  // ──────────────────────────────────────────────
  // Rate calculation
  // ──────────────────────────────────────────────

  calculateAnnuity(principal: number, annualRatePercent: number, months: number): number {
    const monthlyRate = annualRatePercent / 100 / 12;
    if (!monthlyRate) return principal / Math.max(1, months);
    return (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -Math.max(1, months)));
  }

  mapToRatePayload(record: ApplicationRecord): Record<string, unknown> {
    const [street, houseNumber] = this.splitAddress(record.address);
    return {
      target: 'MFLB-RateCalculator',
      version: '2.5.0',
      loanapplication: {
        name: record.firstName,
        surname: record.lastName,
        street: record.street || street,
        adress1: record.houseNumber || houseNumber,
        postalcode: record.postalCode,
        adress2: record.city,
        loan_amount: record.loanAmount,
        term_in_months: record.termMonths,
        collaterals: !(record.loanType === 'Konsumentenkredit' && record.loanAmount <= 20000),
        rate: 0,
      },
    };
  }

  // ──────────────────────────────────────────────
  // Actions
  // ──────────────────────────────────────────────

  private appendLog(record: ApplicationRecord, interfaceName: string, message: string, status = 'OK'): void {
    const entry: LogEntry = {
      id: `${record.id}-${interfaceName}-${record.logs.length + 1}`,
      recordId: record.id,
      inquiryId: record.inquiryId,
      interfaceName,
      message,
      status,
      timestamp: new Date().toISOString(),
    };
    record.logs = [entry, ...record.logs].slice(0, 12);
  }

  runScoring(record: ApplicationRecord): void {
    record.scoringStatus = 'In Bearbeitung';
    record.integration.scoringRequestXml = this.mapToScoringXml(record);
    record.integration.errorMessage = '';

    const score = this.calculateMockScore(record);
    const riskClass = this.getRiskClass(score);

    record.integration.scoringResponseXml = [
      '<ScoringResponse>',
      `  <AnfrageID>${record.inquiryId}</AnfrageID>`,
      `  <Vorname>${record.firstName}</Vorname>`,
      `  <Nachname>${record.lastName}</Nachname>`,
      `  <Score>${score}</Score>`,
      '</ScoringResponse>',
    ].join('\n');

    record.score = score;
    record.riskClass = riskClass;
    record.scoringStatus = 'Abgeschlossen';
    this.appendLog(record, 'Scoring REST', 'Scoring-XML wurde transformiert und zurückgeführt.');
    this.normalizeRecord(record);
  }

  runRateCalculation(record: ApplicationRecord): void {
    const payload = this.mapToRatePayload(record);
    const riskMarkup: Record<string, number> = { A: 0.35, B: 0.65, C: 1.1, D: 1.65 };
    const annualInterestRate = parseFloat(
      (4.05 + Math.min(0.7, record.loanAmount / 25000) + Math.min(0.5, record.termMonths / 120) + (riskMarkup[record.riskClass] ?? 1.25)).toFixed(1)
    );
    const monthlyInstallment = parseFloat(
      this.calculateAnnuity(record.loanAmount, annualInterestRate, record.termMonths).toFixed(2)
    );

    record.integration.rateRequestJson = payload;
    record.integration.rateResponseJson = {
      ...payload,
      loanapplication: {
        ...(payload['loanapplication'] as Record<string, unknown>),
        rate: monthlyInstallment,
      },
    };
    record.rateCalculationStatus = 'Abgeschlossen';
    record.interestRate = annualInterestRate;
    record.monthlyRate = monthlyInstallment;
    this.appendLog(record, 'RateCalculator REST', 'Zinsrechner wurde mit JSON-Payload aufgerufen.');
    this.normalizeRecord(record);
  }

  handleAction(record: ApplicationRecord, action: string): void {
    switch (action) {
      case 'run_scoring':
        this.runScoring(record);
        break;
      case 'run_rate':
        this.runRateCalculation(record);
        break;
      case 'send_teamlead':
        record.teamleadDecision = 'Ausstehend';
        this.appendLog(record, 'Workflow', 'Vorgang wurde an die Teamleitung übergeben.');
        this.normalizeRecord(record);
        break;
      case 'team_approve':
        record.teamleadDecision = 'Freigegeben';
        this.appendLog(record, 'Teamleitung', 'Antrag wurde freigegeben.');
        this.normalizeRecord(record);
        break;
      case 'team_reject':
        record.teamleadDecision = 'Abgelehnt';
        this.appendLog(record, 'Teamleitung', 'Antrag wurde abgelehnt.', 'Fehler');
        this.normalizeRecord(record);
        break;
      case 'generate_offer':
        if (record.rateCalculationStatus !== 'Abgeschlossen') this.runRateCalculation(record);
        record.offerStatus = 'Angebot erstellt';
        record.documentStatus = 'Dokument erstellt';
        this.appendLog(record, 'Dokumentenservice', 'Angebotsdokument wurde erzeugt.');
        this.normalizeRecord(record);
        break;
      case 'send_signature':
        record.signatureStatus = 'Zur Signatur gesendet';
        this.appendLog(record, 'Signaturdienst', 'Dokument wurde an den Signaturdienst übergeben.');
        this.normalizeRecord(record);
        break;
      case 'customer_sign':
        if (record.signatureStatus === 'Zur Signatur gesendet') {
          record.signatureStatus = 'Signiert';
          this.appendLog(record, 'Kundenportal', 'Digitale Signatur wurde durch den Kunden abgeschlossen.');
          this.normalizeRecord(record);
        }
        break;
      case 'send_mail':
        if (record.signatureStatus === 'Signiert') {
          record.mailStatus = 'Versendet';
          record.archiveStatus = 'Archiviert';
          this.appendLog(record, 'Mailservice', 'Signiertes Dokument wurde versendet und archiviert.');
          this.normalizeRecord(record);
        }
        break;
    }
  }

  // ──────────────────────────────────────────────
  // Timeline
  // ──────────────────────────────────────────────

  getTimelineSteps(record: ApplicationRecord | null): TimelineStep[] {
    if (!record) return [];

    const teamStepState: TimelineStep['state'] = !record.teamleadRequired
      ? 'complete'
      : record.teamleadDecision === 'Freigegeben' ? 'complete'
        : record.teamleadDecision === 'Ausstehend' ? 'current'
          : record.teamleadDecision === 'Abgelehnt' ? 'danger'
              : 'pending';

    return [
      {
        title: 'Antrag eingegangen',
        description: 'Online-Antrag wurde als JSON aus der Website übernommen.',
        state: 'complete',
      },
      {
        title: 'Vorprüfung / Routing',
        description: record.routeMessage,
        state: 'complete',
      },
      {
        title: 'Bonitätsprüfung',
        description: record.scoringStatus === 'Abgeschlossen'
          ? `Score ${record.score} · Risikoklasse ${record.riskClass}.`
          : record.scoringStatus === 'Fehler'
            ? 'Scoring-REST-Schnittstelle konnte nicht verarbeitet werden.'
            : 'Scoring-Modul nutzt XML als Austauschformat.',
        state: record.scoringStatus === 'Abgeschlossen' ? 'complete'
          : record.scoringStatus === 'Fehler' ? 'danger' : 'pending',
      },
      {
        title: 'Teamleiterfreigabe',
        description: record.teamleadRequired
          ? 'Ab 10.000 € ist eine Freigabe durch die Teamleitung erforderlich.'
          : 'Für diesen Antrag nicht erforderlich.',
        state: teamStepState,
      },
      {
        title: 'Angebotsberechnung',
        description: record.rateCalculationStatus === 'Abgeschlossen'
          ? `Monatsrate ${this.formatCurrency(record.monthlyRate, 2)} bei ${String(record.interestRate).replace('.', ',')} % Sollzins.`
          : 'Zinsrechner nutzt ein separates JSON-Schema.',
        state: record.rateCalculationStatus === 'Abgeschlossen' ? 'complete' : 'pending',
      },
      {
        title: 'Dokument & Signatur',
        description: record.signatureStatus === 'Signiert'
          ? 'Dokument wurde erstellt und signiert.'
          : record.signatureStatus === 'Zur Signatur gesendet'
            ? 'Dokument liegt beim Signaturdienst.'
            : 'Dokument wird nach Angebotsberechnung erzeugt.',
        state: record.signatureStatus === 'Signiert' ? 'complete'
          : record.signatureStatus === 'Zur Signatur gesendet' ? 'current' : 'pending',
      },
      {
        title: 'Mail & Archiv',
        description: record.archiveStatus === 'Archiviert' || record.signatureStatus === 'Signiert'
          ? 'Versendet und archiviert.'
          : 'Versand und Archivierung folgen nach Signatur.',
        state: record.archiveStatus === 'Archiviert' || record.signatureStatus === 'Signiert' ? 'complete' : 'pending',
      },
    ];
  }

  timelineStateLabel(state: TimelineStep['state']): string {
    switch (state) {
      case 'complete': return 'Abgeschlossen';
      case 'current': return 'In Prüfung';
      case 'danger': return 'Fehler';
      case 'skipped': return 'Nicht erforderlich';
      default: return 'Ausstehend';
    }
  }

  // ──────────────────────────────────────────────
  // Seed data
  // ──────────────────────────────────────────────

  buildSeedRecords(): ApplicationRecord[] {
    const definitions: Array<ApplicationDraft & { pipeline: string[] }> = [
      {
        firstName: 'Erika', lastName: 'Sommer', email: 'erika.sommer@mflb-demo.de',
        address: 'Rosenweg 3', postalCode: '80331', city: 'München',
        employer: 'Lumen Handels GmbH', employerVatId: 'DE214567890',
        monthlyNetIncome: '3400', employedSince: '2019-04-01',
        iban: 'DE10500105170648489890', loanType: 'Konsumentenkredit',
        loanAmount: '12000', termMonths: '48', purpose: 'Einrichtung Wohnung',
        pipeline: ['run_scoring', 'send_teamlead'],
      },
      {
        firstName: 'Leon', lastName: 'Meier', email: 'leon.meier@mflb-demo.de',
        address: 'Marktstraße 12', postalCode: '20095', city: 'Hamburg',
        employer: 'Dockline AG', employerVatId: 'DE198765432',
        monthlyNetIncome: '4100', employedSince: '2017-09-01',
        iban: 'DE74500105175407324931', loanType: 'Konsumentenkredit',
        loanAmount: '8500', termMonths: '36', purpose: 'Fahrzeugkauf',
        pipeline: ['run_scoring', 'run_rate', 'generate_offer', 'send_signature'],
      },
      {
        firstName: 'Sarah', lastName: 'Beck', email: 'sarah.beck@mflb-demo.de',
        address: 'Alte Gasse 8', postalCode: '70173', city: 'Stuttgart',
        employer: 'Beck Design Studio', employerVatId: 'DE345672198',
        monthlyNetIncome: '2850', employedSince: '2022-02-01',
        iban: 'DE08500105179858451595', loanType: 'Konsumentenkredit',
        loanAmount: '6500', termMonths: '24', purpose: 'Küchenmodernisierung',
        pipeline: [],
      },
      {
        firstName: 'David', lastName: 'Krüger', email: 'david.krueger@mflb-demo.de',
        address: 'Parkallee 91', postalCode: '28195', city: 'Bremen',
        employer: 'Krüger Eventtechnik', employerVatId: 'DE987654321',
        monthlyNetIncome: '4700', employedSince: '2016-01-01',
        iban: 'DE98500105172429448490', loanType: 'Konsumentenkredit',
        loanAmount: '30000', termMonths: '72', purpose: 'Freie Verwendung',
        pipeline: [],
      },
      {
        firstName: 'Miriam', lastName: 'Yilmaz', email: 'miriam.yilmaz@mflb-demo.de',
        address: 'Schillerplatz 22', postalCode: '50667', city: 'Köln',
        employer: 'Urban Habitat GmbH', employerVatId: 'DE147258369',
        monthlyNetIncome: '5600', employedSince: '2015-03-01',
        iban: 'DE69500105173648295054', loanType: 'Baufinanzierung',
        loanAmount: '180000', termMonths: '240', purpose: 'Eigentumswohnung',
        pipeline: [],
      },
      {
        firstName: 'Robert', lastName: 'Engel', email: 'robert.engel@mflb-demo.de',
        address: 'Industrieweg 44', postalCode: '60311', city: 'Frankfurt am Main',
        employer: 'Engel Maschinenbau SE', employerVatId: 'DE111222333',
        monthlyNetIncome: '7200', employedSince: '2012-11-01',
        iban: 'DE97500105170648489810', loanType: 'Großkredit',
        loanAmount: '250000', termMonths: '84', purpose: 'Expansion Betrieb',
        pipeline: [],
      },
      {
        firstName: 'Lisa', lastName: 'Hoffmann', email: 'lisa.hoffmann@mflb-demo.de',
        address: 'Auenweg 27', postalCode: '01067', city: 'Dresden',
        employer: 'Hoffmann Consulting', employerVatId: 'DE444555666',
        monthlyNetIncome: '3900', employedSince: '2018-06-01',
        iban: 'DE17500105173648295014', loanType: 'Konsumentenkredit',
        loanAmount: '19800', termMonths: '72', purpose: 'Modernisierung Wohnung',
        pipeline: ['run_scoring', 'send_teamlead', 'team_approve', 'run_rate', 'generate_offer'],
      },
      {
        firstName: 'Jonas', lastName: 'Adler', email: 'jonas.adler@mflb-demo.de',
        address: 'Bachstraße 17', postalCode: '90402', city: 'Nürnberg',
        employer: 'Adler Systems GmbH', employerVatId: 'DE333444555',
        monthlyNetIncome: '3600', employedSince: '2020-07-01',
        iban: 'DE51500105170648555370', loanType: 'Konsumentenkredit',
        loanAmount: '7200', termMonths: '48', purpose: 'Umschuldung',
        pipeline: ['run_scoring', 'run_rate', 'generate_offer', 'send_signature', 'customer_sign', 'send_mail'],
      },
      {
        firstName: 'Pia', lastName: 'Weber', email: 'pia.weber@mflb-demo.de',
        address: 'Bahnhofstraße 6', postalCode: '04109', city: 'Leipzig',
        employer: 'Weber Media OHG', employerVatId: 'DE666777888',
        monthlyNetIncome: '3250', employedSince: '2021-10-01',
        iban: 'DE75500105170648489850', loanType: 'Konsumentenkredit',
        loanAmount: '9400', termMonths: '36', purpose: 'Freie Verwendung',
        pipeline: ['run_scoring', 'run_rate'],
      },
      {
        firstName: 'Cem', lastName: 'Arslan', email: 'cem.arslan@mflb-demo.de',
        address: 'Turmring 9', postalCode: '68159', city: 'Mannheim',
        employer: 'LogiChain Europe', employerVatId: 'DE777888999',
        monthlyNetIncome: '3000', employedSince: '2023-01-01',
        iban: 'DE28500105170000202051', loanType: 'Konsumentenkredit',
        loanAmount: '10400', termMonths: '48', purpose: 'Elektronik',
        pipeline: ['run_scoring', 'send_teamlead'],
      },
      {
        firstName: 'Nora', lastName: 'Klein', email: 'nora.klein@mflb-demo.de',
        address: 'Rathausgasse 5', postalCode: '89073', city: 'Ulm',
        employer: 'Klein Concept Store', employerVatId: 'DE812345670',
        monthlyNetIncome: '2800', employedSince: '2022-06-01',
        iban: 'DE91500105170648489910', loanType: 'Konsumentenkredit',
        loanAmount: '5400', termMonths: '24', purpose: 'Möbelkauf',
        pipeline: [],
      },
      {
        firstName: 'Tim', lastName: 'Richter', email: 'tim.richter@mflb-demo.de',
        address: 'Mühlenweg 18', postalCode: '44135', city: 'Dortmund',
        employer: 'Richter Elektrotechnik', employerVatId: 'DE923456781',
        monthlyNetIncome: '3500', employedSince: '2019-08-01',
        iban: 'DE22500105170648489920', loanType: 'Konsumentenkredit',
        loanAmount: '15000', termMonths: '60', purpose: 'Renovierung',
        pipeline: ['run_scoring', 'send_teamlead'],
      },
      {
        firstName: 'Aylin', lastName: 'Demir', email: 'aylin.demir@mflb-demo.de',
        address: 'Gartenstraße 28', postalCode: '30159', city: 'Hannover',
        employer: 'Demir Services GmbH', employerVatId: 'DE834567892',
        monthlyNetIncome: '3300', employedSince: '2021-01-01',
        iban: 'DE33500105170648489930', loanType: 'Konsumentenkredit',
        loanAmount: '9900', termMonths: '48', purpose: 'Umschuldung',
        pipeline: ['run_scoring', 'run_rate'],
      },
      {
        firstName: 'Marcel', lastName: 'Vogt', email: 'marcel.vogt@mflb-demo.de',
        address: 'Bergstraße 44', postalCode: '53111', city: 'Bonn',
        employer: 'Vogt Logistik AG', employerVatId: 'DE845678903',
        monthlyNetIncome: '4300', employedSince: '2016-04-01',
        iban: 'DE44500105170648489940', loanType: 'Konsumentenkredit',
        loanAmount: '18500', termMonths: '72', purpose: 'Sanierung Hausrat',
        pipeline: ['run_scoring', 'send_teamlead', 'team_approve', 'run_rate', 'generate_offer'],
      },
      {
        firstName: 'Helena', lastName: 'Fuchs', email: 'helena.fuchs@mflb-demo.de',
        address: 'Marktplatz 9', postalCode: '39104', city: 'Magdeburg',
        employer: 'Fuchs Interior GmbH', employerVatId: 'DE856789014',
        monthlyNetIncome: '3900', employedSince: '2018-11-01',
        iban: 'DE55500105170648489950', loanType: 'Konsumentenkredit',
        loanAmount: '11200', termMonths: '48', purpose: 'Freie Verwendung',
        pipeline: ['run_scoring', 'send_teamlead', 'team_approve'],
      },
      {
        firstName: 'Paul', lastName: 'Steiner', email: 'paul.steiner@mflb-demo.de',
        address: 'Lindenring 16', postalCode: '54290', city: 'Trier',
        employer: 'Steiner IT Solutions', employerVatId: 'DE867890125',
        monthlyNetIncome: '4100', employedSince: '2017-02-01',
        iban: 'DE66500105170648489960', loanType: 'Konsumentenkredit',
        loanAmount: '7800', termMonths: '36', purpose: 'Elektronik',
        pipeline: ['run_scoring', 'run_rate', 'generate_offer', 'send_signature', 'customer_sign', 'send_mail'],
      },
      {
        firstName: 'Farah', lastName: 'Özdemir', email: 'farah.oezdemir@mflb-demo.de',
        address: 'Kanalweg 2', postalCode: '28199', city: 'Bremen',
        employer: 'Özdemir Immobilien', employerVatId: 'DE878901236',
        monthlyNetIncome: '6800', employedSince: '2014-09-01',
        iban: 'DE77500105170648489970', loanType: 'Baufinanzierung',
        loanAmount: '240000', termMonths: '300', purpose: 'Neubau',
        pipeline: [],
      },
      {
        firstName: 'Martin', lastName: 'Schade', email: 'martin.schade@mflb-demo.de',
        address: 'Gewerbepark 11', postalCode: '97070', city: 'Würzburg',
        employer: 'Schade Produktions GmbH', employerVatId: 'DE889012347',
        monthlyNetIncome: '7600', employedSince: '2013-05-01',
        iban: 'DE88500105170648489980', loanType: 'Großkredit',
        loanAmount: '130000', termMonths: '96', purpose: 'Maschinenpark',
        pipeline: [],
      },
      {
        firstName: 'Clara', lastName: 'Neumann', email: 'clara.neumann@mflb-demo.de',
        address: 'Sonnenweg 31', postalCode: '18055', city: 'Rostock',
        employer: 'Neumann Healthcare', employerVatId: 'DE890123458',
        monthlyNetIncome: '4400', employedSince: '2019-01-01',
        iban: 'DE99500105170648489990', loanType: 'Konsumentenkredit',
        loanAmount: '22000', termMonths: '60', purpose: 'Freie Verwendung',
        pipeline: [],
      },
      {
        firstName: 'Hannes', lastName: 'Berger', email: 'hannes.berger@mflb-demo.de',
        address: 'Schlossberg 19', postalCode: '79098', city: 'Freiburg',
        employer: 'Berger Planungsgesellschaft', employerVatId: 'DE912340006',
        monthlyNetIncome: '4050', employedSince: '2015-10-01',
        iban: 'DE17500105170648489016', loanType: 'Konsumentenkredit',
        loanAmount: '19900', termMonths: '84', purpose: 'Modernisierung',
        pipeline: ['run_scoring', 'send_teamlead'],
      },
      {
        firstName: 'Bianca', lastName: 'Roth', email: 'bianca.roth@mflb-demo.de',
        address: 'Südwall 3', postalCode: '04103', city: 'Leipzig',
        employer: 'Roth Industrieholding', employerVatId: 'DE912340007',
        monthlyNetIncome: '8900', employedSince: '2011-01-01',
        iban: 'DE18500105170648489017', loanType: 'Großkredit',
        loanAmount: '320000', termMonths: '96', purpose: 'Expansion Filiale',
        pipeline: [],
      },
      {
        firstName: 'Ole', lastName: 'Hartmann', email: 'ole.hartmann@mflb-demo.de',
        address: 'Havelpark 8', postalCode: '14467', city: 'Potsdam',
        employer: 'Hartmann Architektur PartG', employerVatId: 'DE912340008',
        monthlyNetIncome: '7600', employedSince: '2014-07-01',
        iban: 'DE19500105170648489018', loanType: 'Baufinanzierung',
        loanAmount: '280000', termMonths: '300', purpose: 'Neubau Einfamilienhaus',
        pipeline: [],
      },
      {
        firstName: 'Greta', lastName: 'König', email: 'greta.koenig@mflb-demo.de',
        address: 'Seeblick 27', postalCode: '18055', city: 'Rostock',
        employer: 'König Eventservice', employerVatId: 'DE912340009',
        monthlyNetIncome: '3700', employedSince: '2019-12-01',
        iban: 'DE20500105170648489019', loanType: 'Konsumentenkredit',
        loanAmount: '22000', termMonths: '84', purpose: 'Freie Verwendung',
        pipeline: [],
      },
      {
        firstName: 'Sami', lastName: 'Rahman', email: 'sami.rahman@mflb-demo.de',
        address: 'Europaallee 15', postalCode: '66111', city: 'Saarbrücken',
        employer: 'Rahman IT Services', employerVatId: 'DE912340010',
        monthlyNetIncome: '3150', employedSince: '2022-04-01',
        iban: 'DE21500105170648489020', loanType: 'Konsumentenkredit',
        loanAmount: '10100', termMonths: '48', purpose: 'Weiterbildung',
        pipeline: ['run_scoring', 'send_teamlead', 'team_approve', 'run_rate'],
      },
      {
        firstName: 'Sophie', lastName: 'Albrecht', email: 'sophie.albrecht@mflb-demo.de',
        address: 'Lechufer 7', postalCode: '86150', city: 'Augsburg',
        employer: 'Albrecht Medien GmbH', employerVatId: 'DE912340003',
        monthlyNetIncome: '3800', employedSince: '2017-11-01',
        iban: 'DE14500105170648489013', loanType: 'Konsumentenkredit',
        loanAmount: '12500', termMonths: '60', purpose: 'Badsanierung',
        pipeline: ['run_scoring', 'send_teamlead'],
      },
    ];

    const baseDate = new Date('2026-03-25T08:00:00');
    const records: ApplicationRecord[] = [];

    definitions.forEach((def, index) => {
      const createdAt = new Date(baseDate.getTime() + index * 23 * 60 * 1000).toISOString();
      const id = index + 1;
      const inquiryId = this.buildInquiryId(id, createdAt);
      const record = this.createRecordFromDraft(def, { id, inquiryId, createdAt });

      for (const action of def.pipeline) {
        this.handleAction(record, action);
      }

      records.push(record);
    });

    return records.reverse();
  }
}
