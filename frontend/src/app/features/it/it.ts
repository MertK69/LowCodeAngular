import { Component, inject } from '@angular/core';
import { StateService } from '../../core/services/state.service';
import { ApplicationService } from '../../core/services/application.service';
import { NgClass, JsonPipe } from '@angular/common';

@Component({
  selector: 'app-it',
  standalone: true,
  imports: [NgClass, JsonPipe],
  templateUrl: './it.html',
  styleUrl: './it.css',
})
export class It {
  protected readonly state = inject(StateService);
  protected readonly appService = inject(ApplicationService);

  select(id: number) {
    this.state.selectRecord(id);
  }

  async seedData() {
    await this.state.seedData();
  }

  setTab(tab: string) {
    this.state.setIntegrationTab(tab);
  }
}
