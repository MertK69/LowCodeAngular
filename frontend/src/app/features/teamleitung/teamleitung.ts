import { Component, inject } from '@angular/core';
import { StateService } from '../../core/services/state.service';
import { ApplicationService } from '../../core/services/application.service';
import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';

@Component({
  selector: 'app-teamleitung',
  standalone: true,
  imports: [NgClass, CurrencyPipe, DatePipe],
  templateUrl: './teamleitung.html',
  styleUrl: './teamleitung.css',
})
export class Teamleitung {
  protected readonly state = inject(StateService);
  protected readonly appService = inject(ApplicationService);

  select(id: number) {
    this.state.selectRecord(id);
  }

  runAction(id: number, action: string) {
    this.state.runAction(id, action);
  }
}
