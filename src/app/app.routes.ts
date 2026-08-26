import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'tickets',
    pathMatch: 'full'
  },
  {
    path: 'tickets',
    loadComponent: () =>
      import('./components/ticket-list/ticket-list.component').then(
        (m) => m.TicketListComponent,
      ),
  },
];
