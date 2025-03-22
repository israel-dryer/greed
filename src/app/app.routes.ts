import {Routes} from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'tabs/home',
  },
  {
    path: 'game-detail',
    loadComponent: () => import('./game/game-detail/game-detail.page').then(m => m.GameDetailPage)
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
        loadComponent: () => import('./settings/app-settings/app-settings.page').then(m => m.AppSettingsPage)
      },
      {
        path: 'players',
        loadComponent: () => import('./player/player-list/player-list.page').then(m => m.PlayerListPage)
      },
      {
        path: 'my-stats',
        loadComponent: () => import('./player/user-detail/user-detail.page').then(m => m.UserDetailPage)
      },
    ]
  },
  {
    path: 'playground',
    children: [
      {
        path: '', loadComponent: () => import('./play/playground/playground.page').then(m => m.PlaygroundPage),
      },
      {
        path: 'setup',
        loadComponent: () => import('./play/setup/setup.page').then(m => m.SetupPage)
      },
      {
        path: 'detail',
        loadComponent: () => import('./play/play-detail/play-detail.page').then(m => m.PlayDetailPage)
      },
    ]
  },
  {
    path: 'player-detail',
    loadComponent: () => import('./player/player-detail/player-detail.page').then(m => m.PlayerDetailPage)
  }
];
