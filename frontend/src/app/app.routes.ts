import { Routes } from '@angular/router';
import { Kundenportal } from './features/kundenportal/kundenportal';
import { Sachbearbeiter } from './features/sachbearbeiter/sachbearbeiter';
import { Teamleitung } from './features/teamleitung/teamleitung';
import { It } from './features/it/it';
import { Datenbank } from './features/datenbank/datenbank';
import { Landingpage } from './features/landingpage/landingpage';
import { Login } from './features/login/login';

export const routes: Routes = [
  { path: '', redirectTo: 'landingpage', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'kundenportal', component: Kundenportal },
  { path: 'sachbearbeiter', component: Sachbearbeiter },
  { path: 'teamleitung', component: Teamleitung },
  { path: 'it', component: It },
  { path: 'datenbank', component: Datenbank },
  { path: 'landingpage', component: Landingpage },
];
