import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'tabs/home',
  },
  {
    path: 'tabs',
    loadComponent: () => import('./root-tabs/root-tabs.component').then((m => m.RootTabsComponent)),
    children: [
      {
        path: 'home',
        loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
      },
      {
        path: 'app-settings',
        loadComponent: () => import('./settings/app-settings/app-settings.page').then( m => m.AppSettingsPage)
      },
      {
        path: 'player-list',
        loadComponent: () => import('./player/player-list/player-list.page').then( m => m.PlayerListPage)
      },
      {
        path: 'my-stats',
        loadComponent: () => import('./player/player-detail/player-detail.page').then( m => m.PlayerDetailPage)
      },
    ]
  },
  {
    path: 'playground',
    loadComponent: () => import('./play/playground/playground.page').then( m => m.PlaygroundPage)
  },
  {
    path: 'setup',
    loadComponent: () => import('./play/setup/setup.page').then( m => m.SetupPage)
  },
  {
    path: 'game-list',
    loadComponent: () => import('./game/game-list/game-list.page').then( m => m.GameListPage)
  },
  {
    path: 'game-detail',
    loadComponent: () => import('./game/game-detail/game-detail.page').then( m => m.GameDetailPage)
  },
  {
    path: 'player-detail',
    loadComponent: () => import('./player/player-detail/player-detail.page').then( m => m.PlayerDetailPage)
  },
  {
    path: 'signup',
    loadComponent: () => import('./signup/signup.page').then( m => m.SignupPage)
  },
];
