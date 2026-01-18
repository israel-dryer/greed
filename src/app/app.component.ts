import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {IonApp, IonRouterOutlet} from '@ionic/angular/standalone';
import {addIcons} from "ionicons";
import {trash} from "ionicons/icons";
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
  }

  async ngOnInit() {
    await this.initializeIcons();
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

  async initializeIcons() {
    addIcons({
      'random': 'assets/svg/sd-random.svg',
      'chart': 'assets/svg/sd-chart.svg',
      'burning-house': 'assets/svg/sd-fire.svg',
      'play': 'assets/svg/sd-play.svg',
      'close': 'assets/svg/sd-close.svg',
      'database': 'assets/svg/sd-database-restore.svg',
      'diamond': 'assets/svg/sd-diamond.svg',
      'logout': 'assets/svg/sd-logout-rounded.svg',
      'edit': 'assets/svg/sd-edit.svg',
      'warning': 'assets/svg/sd-error.svg',
      'visible': 'assets/svg/sd-eye.svg',
      'invisible': 'assets/svg/sd-invisible.svg',
      'facebook-logo': 'assets/svg/sd-facebook.svg',
      'item-filter': 'assets/svg/sd-filter.svg',
      'google-logo': 'assets/svg/sd-google.svg',
      'house': 'assets/svg/sd-village.svg',
      'add': 'assets/svg/sd-plus.svg',
      'minus': 'assets/svg/sd-minus.svg',
      'medal': 'assets/svg/sd-medal.svg',
      'merge': 'assets/svg/sd-merge.svg',
      'robber': 'assets/svg/sd-pawn.svg',
      'save': 'assets/svg/sd-save.svg',
      'settings': 'assets/svg/sd-settings.svg',
      'tune': 'assets/svg/sd-tune.svg',
      'flask': 'assets/svg/sd-test-tube.svg',
      'history': 'assets/svg/sd-history.svg',
      'trash': trash,
      'trophy': 'assets/svg/sd-trophy.svg',
      'undo': 'assets/svg/sd-undo.svg',
      'upload': 'assets/svg/sd-upload.svg',
      'viking-helmet': 'assets/svg/sd-viking-helmet.svg',
      'viking-ship': 'assets/svg/sd-viking-ship.svg',
      'add-user': 'assets/svg/sd-add-user-male.svg',
      'refresh': 'assets/svg/sd-reboot.svg',
      'restore': 'assets/svg/sd-database-restore.svg',
      'friend-list': 'assets/svg/sd-friend-list.svg',
      'checkmark': 'assets/svg/sd-checkmark.svg',
      'notification': 'assets/svg/sd-notification.svg',
      'chat': 'assets/svg/sd-chat.svg',
      'menu': 'assets/svg/sd-menu.svg',
      'group': 'assets/svg/sd-group.svg',
      'shop': 'assets/svg/sd-shop.svg',
      'dice-cubes': 'assets/svg/sd-dice-cubes.svg',
      'crowd': 'assets/svg/sd-crowd.svg',
      'avatar': 'assets/svg/sd-avatar.svg',
      'home': 'assets/svg/sd-home.svg',
      'more': 'assets/svg/sd-more.svg',
      'pause': 'assets/svg/sd-pause.svg',
      'share': 'assets/svg/sd-share.svg',
      'link': 'assets/svg/sd-link.svg',
      'unlink': 'assets/svg/sd-unlink.svg',
      'default-avatar': 'assets/svg/sd-default-avatar.svg',
      'dot': 'assets/svg/sd-dot.svg',
      'news': 'assets/svg/sd-news.svg',
      'megaphone': 'assets/svg/sd-megaphone.svg',
      'tip': 'assets/svg/sd-tip.svg',
      'blue-city': 'assets/images/cities-knights-blue.svg',
      'green-city': 'assets/images/cities-knights-green.svg',
      'gold-city': 'assets/images/cities-knights-gold.svg',
      'barbarian': 'assets/images/cities-knights-barbarian.svg',
      'user': 'assets/svg/sd-user.svg',
      'farm': 'assets/svg/sd-farm.svg',
      'circle-user': 'assets/svg/sd-circle-user.svg',
      'sound': 'assets/svg/sd-sound.svg',
      'voice': 'assets/svg/sd-voice.svg',
      'shake': 'assets/svg/sd-shake.svg',
      'distribution': 'assets/svg/sd-distribution.svg',
      'knight': 'assets/svg/sd-knight.svg',
    });
  }

}
