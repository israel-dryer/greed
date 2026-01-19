import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {IonApp, IonRouterOutlet} from '@ionic/angular/standalone';
import {addIcons} from "ionicons";
import {
  add, home, settings, people, person, create, refresh, menu, warning, checkmark, close, trash,
  trophy, arrowForward, alertCircle, statsChart, backspace, cloudUpload, exit, logIn, timer,
  calendarClear, ellipse, ellipseOutline, gameController, calendar, alertCircleOutline,
  informationCircle, logoGoogle
} from "ionicons/icons";
import {register} from 'swiper/element/bundle';
import {AuthService} from './shared/auth.service';
import {SyncService} from './shared/sync.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly syncService = inject(SyncService);
  private readonly onVisibilityChange = this.handleVisibilityChange.bind(this);

  constructor() {
    register();
    addIcons({
      add, home, settings, people, person, create, refresh, menu, warning, checkmark, close, trash,
      trophy, 'arrow-forward': arrowForward, 'alert-circle': alertCircle, 'stats-chart': statsChart,
      backspace, 'cloud-upload': cloudUpload, exit, 'log-in': logIn, timer, 'calendar-clear': calendarClear,
      ellipse, 'ellipse-outline': ellipseOutline, 'game-controller': gameController, calendar,
      'alert-circle-outline': alertCircleOutline, 'information-circle': informationCircle,
      'logo-google': logoGoogle
    });
  }

  async ngOnInit() {
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  ngOnDestroy() {
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
  }

  private handleVisibilityChange() {
    if (document.visibilityState === 'hidden' && this.authService.isAuthenticated()) {
      this.syncService.syncToCloud().catch(err => {
        console.error('Failed to sync on app close:', err);
      });
    }
  }

}
