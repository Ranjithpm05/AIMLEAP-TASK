import { Routes } from '@angular/router';

export const APP_ROUTES: Routes = [
  {
    path: 'board/:id',
    loadComponent: () =>
      import('./components/board-view/board-view.component').then(
        (m) => m.BoardViewComponent
      ),
  },
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./components/boards-list/boards-list.component').then(
        (m) => m.BoardsListComponent
      ),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
