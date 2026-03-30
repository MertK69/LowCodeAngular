import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApplicationRecord, ApplicationDraft, LogEntry } from '../models/application.model';
import { ApplicationService } from './application.service';
import { firstValueFrom } from 'rxjs';

export interface AuditFilters {
  name: string;
  inquiryId: string;
  status: string;
}

export type UserRole = 'customer' | 'employee' | null;

export interface AuthState {
  isLoggedIn: boolean;
  username: string | null;
  role: UserRole;
}

const DEFAULT_DRAFT: ApplicationDraft = {
  firstName: 'Mia',
  lastName: 'Hansen',
  email: 'mia.hansen@email.de',
  address: 'Beispielweg 12',
  postalCode: '80331',
  city: 'München',
  employer: 'Nordlicht Retail GmbH',
  employerVatId: 'DE123456789',
  monthlyNetIncome: '3200',
  employedSince: '2020-05-01',
  iban: 'DE02120300000000202051',
  loanType: 'Konsumentenkredit',
  loanAmount: '12000',
  termMonths: '48',
  purpose: 'Wohnungseinrichtung',
};

@Injectable({ providedIn: 'root' })
export class StateService {
  private readonly appService: ApplicationService;
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8000';

  // Core state signals
  readonly applications = signal<ApplicationRecord[]>([]);
  readonly selectedId = signal<number | null>(null);
  readonly customerRecordId = signal<number | null>(null);
  readonly customerDraft = signal<ApplicationDraft>({ ...DEFAULT_DRAFT });
  readonly auditFilters = signal<AuditFilters>({ name: '', inquiryId: '', status: 'alle' });
  readonly integrationTab = signal<string>('website');
  readonly isSeeding = signal<boolean>(false);

  // Auth state
  readonly authState = signal<AuthState>({
    isLoggedIn: false,
    username: null,
    role: null
  });

  // Global log (derived from all applications)
  readonly logs = computed<LogEntry[]>(() =>
    this.applications()
      .flatMap(r => r.logs)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 30)
  );

  // Derived state
  readonly selectedRecord = computed<ApplicationRecord | null>(() => {
    const id = this.selectedId();
    const apps = this.applications();
    if (id !== null) return apps.find(r => r.id === id) ?? null;
    return null;
  });

  readonly customerRecord = computed<ApplicationRecord | null>(() => {
    const id = this.customerRecordId();
    if (id === null) return null;
    return this.applications().find(r => r.id === id) ?? null;
  });

  readonly teamQueue = computed<ApplicationRecord[]>(() =>
    this.applications().filter(
      r => r.teamleadDecision === 'Ausstehend'
    )
  );

  readonly openWorklist = computed<ApplicationRecord[]>(() =>
    this.applications().filter(
      r => !['Abgeschlossen', 'Abgelehnt'].includes(r.overallStatus) &&
           r.teamleadDecision !== 'Ausstehend'
    )
  );

  readonly filteredApplications = computed<ApplicationRecord[]>(() => {
    const filters = this.auditFilters();
    return this.applications().filter(r => {
      const fullName = `${r.firstName} ${r.lastName}`.toLowerCase();
      const matchName = !filters.name || fullName.includes(filters.name.toLowerCase());
      const matchId = !filters.inquiryId || r.inquiryId.toLowerCase().includes(filters.inquiryId.toLowerCase());
      const matchStatus = filters.status === 'alle' || r.overallStatus === filters.status;
      return matchName && matchId && matchStatus;
    });
  });

  readonly defaultDraft = DEFAULT_DRAFT;

  constructor(appService: ApplicationService) {
    this.appService = appService;
    
    // Auto-refresh applications when logged in
    effect(() => {
      if (this.authState().isLoggedIn) {
        this.loadApplications();
        const interval = setInterval(() => {
          if (!this.isSeeding()) this.loadApplications();
        }, 3000); 
        return () => clearInterval(interval);
      }
      return;
    });
  }

  async loadApplications() {
    try {
      const apps = await firstValueFrom(this.http.get<ApplicationRecord[]>(`${this.apiUrl}/applications/`));
      
      // Auto-seed if empty (prototype behavior: "data should always be there")
      if (apps.length === 0 && !this.isSeeding()) {
        await this.seedData();
        return;
      }

      this.applications.set(apps.map(app => this.appService.normalizeRecord(app)));
    } catch (e) {
      console.error("Failed to load applications", e);
    }
  }

  async seedData() {
    this.isSeeding.set(true);
    const seedRecords = this.appService.buildSeedRecords();
    const payload = seedRecords.map(record => {
      const { id, logs, ...data } = record;
      return { ...data, logs: record.logs };
    });
    
    try {
      await firstValueFrom(this.http.post(`${this.apiUrl}/applications/bulk`, payload));
      await this.loadApplications();
    } catch (e) {
      console.error("Failed to seed records in bulk", e);
    } finally {
      this.isSeeding.set(false);
    }
  }

  // ──────────────────────────────────────────────
  // Selection
  // ──────────────────────────────────────────────

  selectRecord(id: number): void {
    if (this.selectedId() === id) return;
    this.selectedId.set(id);
  }

  // ──────────────────────────────────────────────
  // Actions (mutate record in-place, then trigger signal update)
  // ──────────────────────────────────────────────

  async runAction(recordId: number, action: string) {
    const record = this.applications().find(r => r.id === recordId);
    if (!record) return;

    // Local update
    this.appService.handleAction(record, action);
    
    // Sync to backend
    try {
      const { logs, ...data } = record;
      await firstValueFrom(this.http.patch(`${this.apiUrl}/applications/${recordId}`, {
        ...data,
        logs: record.logs 
      }));
      await this.loadApplications();
    } catch (e) {
      console.error("Failed to update application", e);
    }
  }

  // ──────────────────────────────────────────────
  // Submit new application from customer portal
  // ──────────────────────────────────────────────

  async submitApplication(draft: ApplicationDraft) {
    const id = Math.floor(Math.random() * 1000000); 
    const createdAt = new Date().toISOString();
    const inquiryId = this.appService.buildInquiryId(id, createdAt);
    const record = this.appService.createRecordFromDraft(draft, { id, inquiryId, createdAt });

    try {
      const saved = await firstValueFrom(this.http.post<ApplicationRecord>(`${this.apiUrl}/applications/`, record));
      this.customerRecordId.set(saved.id);
      this.selectedId.set(saved.id);
      await this.loadApplications();
      return saved;
    } catch (e) {
      console.error("Failed to submit application", e);
      throw e;
    }
  }

  // ──────────────────────────────────────────────
  // Audit filters
  // ──────────────────────────────────────────────

  updateAuditFilter(key: keyof AuditFilters, value: string): void {
    this.auditFilters.update(f => ({ ...f, [key]: value }));
  }

  // ──────────────────────────────────────────────
  // Integration tab
  // ──────────────────────────────────────────────

  setIntegrationTab(tab: string): void {
    this.integrationTab.set(tab);
  }

  // ──────────────────────────────────────────────
  // Draft
  // ──────────────────────────────────────────────

  resetDraft(): void {
    this.customerDraft.set({ ...DEFAULT_DRAFT });
  }

  // ──────────────────────────────────────────────
  // Auth actions
  // ──────────────────────────────────────────────

  async login(username: string, password: string): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.http.post<any>(`${this.apiUrl}/login/`, { username, password })
      );
      
      if (response.success) {
        this.authState.set({
          isLoggedIn: true,
          username: response.username,
          role: response.role as UserRole
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed', error);
      return false;
    }
  }

  logout(): void {
    this.authState.set({
      isLoggedIn: false,
      username: null,
      role: null
    });
    this.applications.set([]);
  }
}
