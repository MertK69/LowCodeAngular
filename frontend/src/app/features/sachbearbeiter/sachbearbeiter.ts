import { Component, inject } from '@angular/core';
import { StateService } from '../../core/services/state.service';
import { ApplicationService } from '../../core/services/application.service';
import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';

@Component({
  selector: 'app-sachbearbeiter',
  standalone: true,
  imports: [NgClass, CurrencyPipe, DatePipe],
  templateUrl: './sachbearbeiter.html',
  styleUrl: './sachbearbeiter.css',
})
export class Sachbearbeiter {
  protected readonly state = inject(StateService);
  protected readonly appService = inject(ApplicationService);

  select(id: number) {
    this.state.selectRecord(id);
  }

  runAction(id: number, action: string) {
    this.state.runAction(id, action);
  }
}
