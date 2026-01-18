import {bootstrapApplication} from '@angular/platform-browser';
import {RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules} from '@angular/router';
import {IonicRouteStrategy, provideIonicAngular} from '@ionic/angular/standalone';

import {routes} from './app/app.routes';
import {AppComponent} from './app/app.component';
import {provideAnimationsAsync} from "@angular/platform-browser/animations/async";
import {InjectionToken} from "@angular/core";

export const APP_VERSION = new InjectionToken<string>('APP_VERSION');

bootstrapApplication(AppComponent, {
  providers: [
    {provide: APP_VERSION, useValue: '0.0.7'},
    {provide: RouteReuseStrategy, useClass: IonicRouteStrategy},
    provideIonicAngular(),
    provideAnimationsAsync(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
  ],
}).then(() => {
  // Register service worker for PWA
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/catandice/sw.js')
      .then(registration => {
        console.log('Service worker registered');

        // Check for updates on page load
        registration.update();

        // Listen for new service worker installing
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available, reload to update
                console.log('New version available, reloading...');
                window.location.reload();
              }
            });
          }
        });
      })
      .catch(err => {
        console.error('Service worker registration failed:', err);
      });

    // Handle controller change (when new SW takes over)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  }
});
