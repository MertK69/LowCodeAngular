import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { StateService } from '../../core/services/state.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  private readonly stateService = inject(StateService);
  private readonly router = inject(Router);

  username = signal('');
  password = signal('');
  errorMessage = signal('');

  async onSubmit(): Promise<void> {
    if (!this.username() || !this.password()) {
      this.errorMessage.set('Bitte alle Felder ausfüllen.');
      return;
    }

    const success = await this.stateService.login(this.username(), this.password());
    
    if (success) {
      const role = this.stateService.authState().role;
      this.router.navigate([role === 'customer' ? '/kundenportal' : '/sachbearbeiter']);
    } else {
      this.errorMessage.set('Anmeldung fehlgeschlagen. Bitte überprüfen Sie Ihre Zugangsdaten.');
    }
  }
}
