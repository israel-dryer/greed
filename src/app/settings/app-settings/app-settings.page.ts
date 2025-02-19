import {Component, inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader, IonIcon,
  IonItem,
  IonLabel,
  IonList, IonNote,
  IonTitle, IonToggle,
  IonToolbar
} from '@ionic/angular/standalone';
import {Player, Settings} from "../../shared/types";
import {SettingsService} from "../settings.service";
import {liveQuery} from "dexie";
import {Router, RouterLink} from "@angular/router";
import {PlayerService} from "../../player/player.service";

@Component({
  selector: 'app-app-settings',
  templateUrl: './app-settings.page.html',
  styleUrls: ['./app-settings.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonList, IonItem, RouterLink, IonLabel, IonToggle, IonIcon, IonButtons, IonBackButton, IonNote]
})
export class AppSettingsPage implements OnInit {

  settings?: Settings;
  userPlayer?: Player;

  readonly router = inject(Router);
  readonly playerService = inject(PlayerService);
  readonly settingsService = inject(SettingsService);

  constructor() {

  }

  ngOnInit() {
    liveQuery(() => this.settingsService.getSettings())
      .subscribe(settings => this.settings = settings);
    liveQuery(() => this.playerService.getUserPlayer())
      .subscribe(player => this.userPlayer = player);
  }

  handleSettingsChange(setting: string, event: any) {
    const value = event.detail.checked ? 1 : 0;
    if (this.settings) {
      const changes = Object.assign({}, this.settings) as Record<string, any>;
      changes[setting] = value;
      this.settingsService.updateSettings(changes);
    }
  }

  async handleMyStatsClicked() {
    this.playerService.setActivePlayer(this.userPlayer!);
    await this.router.navigate(['/player-detail']);
  }


}
