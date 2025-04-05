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
    {provide: APP_VERSION, useValue: '0.0.5'},
    {provide: RouteReuseStrategy, useClass: IonicRouteStrategy},
    provideIonicAngular(),
    provideAnimationsAsync(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
  ],
});
