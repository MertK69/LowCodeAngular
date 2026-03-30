import { Component, inject } from '@angular/core';
import { StateService, AuditFilters } from '../../core/services/state.service';
import { ApplicationService } from '../../core/services/application.service';
import { CurrencyPipe, DatePipe, NgClass, JsonPipe } from '@angular/common';

@Component({
  selector: 'app-datenbank',
  standalone: true,
  imports: [NgClass, CurrencyPipe, DatePipe],
  templateUrl: './datenbank.html',
  styleUrl: './datenbank.css',
})
export class Datenbank {
  protected readonly state = inject(StateService);
  protected readonly appService = inject(ApplicationService);

  updateFilter(key: keyof AuditFilters, event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.state.updateAuditFilter(key, value);
  }

  select(id: number) {
    this.state.selectRecord(id);
  }
}
