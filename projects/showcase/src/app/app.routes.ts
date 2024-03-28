import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./components/home/home.component').then(x => x.HomeComponent),
    children: [
      {
        path: 'keks-pay',
        loadComponent: () =>
          import('./components/keks-pay/keks-pay-showcase.component').then(
            x => x.KeksPayShowcaseComponent
          )
      }
    ]
  }
];
