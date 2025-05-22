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
      },
      {
        path: 'google-pay',
        loadComponent: () =>
          import('./components/google-pay/google-pay-showcase.component').then(
            x => x.GooglePayShowcaseComponent
          )
      },
      {
        path: 'apple-pay',
        loadComponent: () =>
          import('./components/apple-pay/apple-pay-showcase.component').then(
            x => x.ApplePayShowcaseComponent
          )
      },
      {
        path: 'uac',
        loadComponent: () =>
          import('./components/uac/uac.component').then(
            x => x.UacShowcaseComponent
          )
      }
    ]
  }
];
